const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function getBackendBase() {
	return process.env.BACKEND_URL || 'http://localhost:3001';
}

function getBackendOriginParts() {
	try {
		const u = new URL(getBackendBase());
		return { protocol: u.protocol, host: u.host };
	} catch {
		return { protocol: 'http:', host: 'localhost:3001' };
	}
}

function resolveFrontendEntry() {
	const envUrl = process.env.FRONTEND_URL;
	if (envUrl && /^https?:\/\//.test(envUrl)) {
		return { type: 'url', value: envUrl };
	}
	const devUrl = 'http://localhost:3000';
	return { type: 'url', value: devUrl };
}

function resolveFrontendBuild() {
	const viteIndex = path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html');
	if (fs.existsSync(viteIndex)) {
		return viteIndex;
	}
	const craIndex = path.resolve(__dirname, '..', 'frontend', 'build', 'index.html');
	if (fs.existsSync(craIndex)) {
		return craIndex;
	}
	return null;
}

function setupApiRedirects(win) {
	const backendBase = getBackendBase().replace(/\/$/, '');
	const backendParts = getBackendOriginParts();
	const filter = { urls: ['*://*/*', 'file://*/*'] };
	win.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
		try {
			const originalUrl = details.url;
			let pathname = '';
			let targetProtocol = '';
			let targetHost = '';

			if (originalUrl.startsWith('file://')) {
				const idx = originalUrl.indexOf('/api/');
				if (idx !== -1) {
					pathname = originalUrl.substring(idx);
				}
			} else {
				const u = new URL(originalUrl);
				targetProtocol = u.protocol;
				targetHost = u.host;
				pathname = u.pathname + (u.search || '');
			}

			if (pathname.startsWith('/api/')) {
				const alreadyBackend = targetProtocol === backendParts.protocol && targetHost === backendParts.host;
				if (!alreadyBackend || originalUrl.startsWith('file://')) {
					const redirectURL = backendBase + pathname;
					return callback({ redirectURL });
				}
			}
		} catch (err) {
			console.warn('webRequest interception error:', err);
		}
		callback({});
	});
}

async function loadFrontend(win) {
	const buildIndex = resolveFrontendBuild();
	if (buildIndex) {
		await win.loadFile(buildIndex);
		return;
	}
	const entry = resolveFrontendEntry();
	await win.loadURL(entry.value);
}

const activeMonitors = new Map(); // taskId -> { stop: fn, trackedFiles: Set }

async function postTrack(taskId, token, fullPath) {
	try {
		console.log(`🔄 Tracking file: ${fullPath} for task: ${taskId}`);
		const response = await fetch(`${getBackendBase().replace(/\/$/, '')}/api/todos/${taskId}/files/track`, {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json', 
				Authorization: token ? `Bearer ${token}` : undefined 
			},
			body: JSON.stringify({ path: fullPath })
		});
		
		if (response.ok) {
			console.log(`✅ Successfully tracked file: ${fullPath}`);
			return true;
		} else {
			console.error(`❌ Failed to track file (${response.status}): ${fullPath}`);
			return false;
		}
	} catch (error) {
		console.error(`❌ Error tracking file: ${fullPath}`, error);
		return false;
	}
}

// Method 1: PowerShell Process Monitor
function startPowerShellMonitor(win, taskId, token, trackedFiles) {
	console.log(`🚀 Starting PowerShell file monitor for task: ${taskId}`);
	
	const psScript = `
		$Events = @()
		Register-WmiEvent -Query "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2" -Action {
			$Event = $Event.SourceEventArgs.NewEvent
			Write-Host "FILE_OPENED:$($Event.DriveName)"
		}
		
		while ($true) {
			$processes = Get-Process | Where-Object { $_.MainWindowTitle -ne "" }
			foreach ($proc in $processes) {
				try {
					if ($proc.MainModule.FileName -match "\\.(txt|doc|docx|pdf|xlsx|ppt|pptx|js|ts|py|java|cpp|c|h|html|css|json|xml|md|log)$") {
						Write-Host "FILE_OPENED:$($proc.MainModule.FileName)"
					}
				} catch {}
			}
			Start-Sleep -Seconds 2
		}
	`;

	const ps = spawn('powershell.exe', ['-Command', psScript]);
	let isActive = true;

	ps.stdout.on('data', (data) => {
		if (!isActive) return;
		const output = data.toString();
		const lines = output.split('\n');
		
		lines.forEach(line => {
			if (line.startsWith('FILE_OPENED:')) {
				const filePath = line.replace('FILE_OPENED:', '').trim();
				if (filePath && !trackedFiles.has(filePath)) {
					trackedFiles.add(filePath);
					console.log(`📁 PowerShell detected file: ${filePath}`);
					win.webContents.send('task:fileTracked', { taskId, path: filePath });
					postTrack(taskId, token, filePath);
				}
			}
		});
	});

	ps.stderr.on('data', (data) => {
		console.error('PowerShell monitor error:', data.toString());
	});

	return {
		stop: () => {
			isActive = false;
			ps.kill();
			console.log(`🛑 Stopped PowerShell monitor for task: ${taskId}`);
		}
	};
}

// Method 2: Active Window Title Monitor
function startActiveWindowMonitor(win, taskId, token, trackedFiles) {
	console.log(`🚀 Starting active window monitor for task: ${taskId}`);
	let isActive = true;
	
	const interval = setInterval(() => {
		if (!isActive) return;
		
		// Use PowerShell to get active window title
		const ps = spawn('powershell.exe', ['-Command', `
			Add-Type @"
				using System;
				using System.Runtime.InteropServices;
				using System.Text;
				public class Win32 {
					[DllImport("user32.dll")]
					public static extern IntPtr GetForegroundWindow();
					[DllImport("user32.dll")]
					public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
					[DllImport("user32.dll", SetLastError=true)]
					public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
				}
"@
			$hwnd = [Win32]::GetForegroundWindow()
			$title = New-Object System.Text.StringBuilder 256
			[Win32]::GetWindowText($hwnd, $title, 256)
			$processId = 0
			[Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
			try {
				$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
				if ($process -and $process.MainModule) {
					Write-Host "$($process.MainModule.FileName)|$($title.ToString())"
				}
			} catch {}
		`]);

		ps.stdout.on('data', (data) => {
			const output = data.toString().trim();
			if (output && output.includes('|')) {
				const [filePath, title] = output.split('|');
				
				// Check if it looks like a file path and has a file extension
				if (filePath && filePath.includes('\\') && /\.[a-zA-Z0-9]{1,5}$/.test(filePath)) {
					if (!trackedFiles.has(filePath)) {
						trackedFiles.add(filePath);
						console.log(`🖼️ Active window detected file: ${filePath} (${title})`);
						win.webContents.send('task:fileTracked', { taskId, path: filePath });
						postTrack(taskId, token, filePath);
					}
				}
				
				// Also check window title for file paths
				if (title && title.includes('\\') && /\.[a-zA-Z0-9]{1,5}/.test(title)) {
					const matches = title.match(/[A-Z]:\\[^|<>:*?"]*\.[a-zA-Z0-9]{1,5}/g);
					if (matches) {
						matches.forEach(match => {
							if (!trackedFiles.has(match)) {
								trackedFiles.add(match);
								console.log(`📝 Window title detected file: ${match}`);
								win.webContents.send('task:fileTracked', { taskId, path: match });
								postTrack(taskId, token, match);
							}
						});
					}
				}
			}
		});
	}, 1000);

	return {
		stop: () => {
			isActive = false;
			clearInterval(interval);
			console.log(`🛑 Stopped active window monitor for task: ${taskId}`);
		}
	};
}

// Method 3: Recent Files Monitor (Enhanced)
function startEnhancedRecentMonitor(win, taskId, token, trackedFiles) {
	console.log(`🚀 Starting enhanced recent files monitor for task: ${taskId}`);
	
	const recentPaths = [
		path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Recent'),
		path.join(process.env.APPDATA || '', 'Microsoft', 'Office', 'Recent'),
		path.join(process.env.USERPROFILE || '', 'Recent'),
	];
	
	let isActive = true;
	const seenFiles = new Set();
	
	// Seed with existing files
	recentPaths.forEach(recentDir => {
		try {
			if (fs.existsSync(recentDir)) {
				fs.readdirSync(recentDir).forEach(file => {
					if (file.toLowerCase().endsWith('.lnk')) {
						seenFiles.add(path.join(recentDir, file));
					}
				});
			}
		} catch (error) {
			console.warn(`Warning reading ${recentDir}:`, error.message);
		}
	});

	const interval = setInterval(() => {
		if (!isActive) return;
		
		recentPaths.forEach(recentDir => {
			try {
				if (!fs.existsSync(recentDir)) return;
				
				fs.readdirSync(recentDir).forEach(file => {
					if (!file.toLowerCase().endsWith('.lnk')) return;
					
					const fullLnkPath = path.join(recentDir, file);
					if (seenFiles.has(fullLnkPath)) return;
					
					seenFiles.add(fullLnkPath);
					
					// Use PowerShell to resolve shortcut
					const ps = spawn('powershell.exe', ['-Command', `
						$shell = New-Object -ComObject WScript.Shell
						try {
							$shortcut = $shell.CreateShortcut('${fullLnkPath.replace(/'/g, "''")}')
							Write-Host $shortcut.TargetPath
						} catch {
							Write-Host "ERROR"
						}
					`]);
					
					ps.stdout.on('data', (data) => {
						const targetPath = data.toString().trim();
						if (targetPath && targetPath !== 'ERROR' && !trackedFiles.has(targetPath)) {
							trackedFiles.add(targetPath);
							console.log(`🔗 Recent files detected: ${targetPath}`);
							win.webContents.send('task:fileTracked', { taskId, path: targetPath });
							postTrack(taskId, token, targetPath);
						}
					});
				});
			} catch (error) {
				console.warn(`Warning scanning ${recentDir}:`, error.message);
			}
		});
	}, 2000);

	return {
		stop: () => {
			isActive = false;
			clearInterval(interval);
			console.log(`🛑 Stopped enhanced recent monitor for task: ${taskId}`);
		}
	};
}

function startComprehensiveFileTracking(win, taskId, token) {
	console.log(`🎯 Starting COMPREHENSIVE file tracking for task: ${taskId}`);
	
	const trackedFiles = new Set();
	const monitors = [];
	
	// Start all monitoring methods
	monitors.push(startPowerShellMonitor(win, taskId, token, trackedFiles));
	monitors.push(startActiveWindowMonitor(win, taskId, token, trackedFiles));
	monitors.push(startEnhancedRecentMonitor(win, taskId, token, trackedFiles));
	
	return {
		stop: async () => {
			console.log(`🛑 Stopping ALL monitors for task: ${taskId}`);
			monitors.forEach(monitor => monitor.stop());
			console.log(`✅ All monitors stopped for task: ${taskId}`);
		}
	};
}

function registerIpcHandlers(win) {
	ipcMain.handle('task:start', async (_e, { taskId, token }) => {
		try {
			console.log(`🎬 STARTING comprehensive file tracking for task: ${taskId}`);
			
			// Stop existing monitor if any
			if (activeMonitors.has(taskId)) {
				console.log(`🔄 Stopping existing monitor for task: ${taskId}`);
				await activeMonitors.get(taskId).stop();
			}
			
			const monitor = startComprehensiveFileTracking(win, taskId, token);
			activeMonitors.set(taskId, monitor);
			
			console.log(`✅ Successfully started comprehensive tracking for task: ${taskId}`);
			return { ok: true };
		} catch (e) {
			console.error(`❌ Error starting task monitoring:`, e);
			return { ok: false, error: String(e) };
		}
	});

	ipcMain.handle('task:end', async (_e, taskId) => {
		try {
			console.log(`🛑 ENDING file tracking for task: ${taskId}`);
			const monitor = activeMonitors.get(taskId);
			if (monitor) {
				await monitor.stop();
				activeMonitors.delete(taskId);
				console.log(`✅ Successfully stopped tracking for task: ${taskId}`);
			}
			return { ok: true };
		} catch (e) { 
			console.error(`❌ Error ending task monitoring:`, e);
			return { ok: false, error: String(e) }; 
		}
	});

	ipcMain.handle('task:resumeOpen', async (_e, _taskId, files) => {
		for (const f of files) { 
			await shell.openPath(f.path || f); 
			await new Promise(r => setTimeout(r, 250)); 
		}
		return { ok: true };
	});
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	setupApiRedirects(win);
	registerIpcHandlers(win);

	loadFrontend(win).catch((err) => {
		console.error('Failed to load frontend:', err);
		win.loadURL('data:text/html,<h1 style="font-family:system-ui;">Failed to load frontend</h1><p>Start your dev server or build the frontend.</p>');
	});

	// Open devtools for debugging
	win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});