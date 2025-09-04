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

const activeMonitors = new Map(); // taskId -> { stop: fn }
const globalSeenFiles = new Map(); // Global map that tracks filename -> last modified time

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

function resolveShortcut(lnkPath) {
	return new Promise((resolve) => {
		const ps = spawn('powershell.exe', ['-Command', `
			$shell = New-Object -ComObject WScript.Shell
			try {
				$shortcut = $shell.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
				Write-Host $shortcut.TargetPath
			} catch {
				Write-Host "ERROR"
			}
		`]);
		
		let output = '';
		ps.stdout.on('data', (data) => {
			output += data.toString();
		});
		
		ps.on('close', () => {
			const targetPath = output.trim();
			if (targetPath && targetPath !== 'ERROR') {
				resolve(targetPath);
			} else {
				resolve(null);
			}
		});
		
		setTimeout(() => {
			ps.kill();
			resolve(null);
		}, 2000);
	});
}

async function detectOpenFilesAdvanced(taskId, token, trackedFiles, currentlyOpenFiles, win) {
	console.log(`🔍 VS Code file detection scan...`);
	
	// Only check VS Code window titles for file paths
	await detectVSCodeFiles(taskId, token, trackedFiles, currentlyOpenFiles, win);
}

async function detectVSCodeFiles(taskId, token, trackedFiles, currentlyOpenFiles, win) {
	const ps = spawn('powershell.exe', ['-Command', `
		# Only get VS Code windows
		$processes = Get-Process -Name "Code" -ErrorAction SilentlyContinue
		foreach ($proc in $processes) {
			try {
				if ($proc.MainWindowTitle -and $proc.MainWindowTitle -ne "") {
					Write-Host "Code|$($proc.MainWindowTitle)"
				}
			} catch {}
		}
	`]);
	
	return new Promise((resolve) => {
		ps.stdout.on('data', (data) => {
			const lines = data.toString().split('\n');
			lines.forEach(line => {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('Code|')) return;
				
				const title = trimmed.replace('Code|', '');
				
				// Extract file paths from VS Code window titles only
				const filePaths = extractVSCodeFilePaths(title);
				filePaths.forEach(async (filePath) => {
					if (!trackedFiles.has(filePath)) {
						trackedFiles.add(filePath);
						currentlyOpenFiles.set(filePath, { lastSeen: new Date(), source: 'vscode' });
						console.log(`📝 VS Code detected NEW file: ${filePath}`);
						win.webContents.send('task:fileTracked', { taskId, path: filePath });
						await postTrack(taskId, token, filePath);
					} else {
						currentlyOpenFiles.set(filePath, { lastSeen: new Date(), source: 'vscode' });
					}
				});
			});
		});
		
		ps.on('close', () => resolve());
		setTimeout(() => { ps.kill(); resolve(); }, 3000);
	});
}

function extractVSCodeFilePaths(title) {
	const filePaths = [];
	
	// VS Code title patterns:
	// "● filename.js - project - Visual Studio Code"
	// "filename.js - project - Visual Studio Code"  
	// "project - Visual Studio Code" (no specific file)
	
	// Only extract if there's a specific file mentioned
	const patterns = [
		// Pattern 1: "● filename.js - project - Visual Studio Code"
		/^●?\s*(.+?)\s*-\s*.+?\s*-\s*Visual Studio Code$/,
		// Pattern 2: "filename.js - Visual Studio Code" (direct file)
		/^●?\s*(.+?)\s*-\s*Visual Studio Code$/
	];
	
	for (const pattern of patterns) {
		const match = title.match(pattern);
		if (match && match[1]) {
			let fileName = match[1].trim();
			
			// Remove VS Code unsaved indicator
			fileName = fileName.replace(/^●\s*/, '');
			
			// Only process if it looks like a filename (has extension)
			if (fileName.includes('.') && !fileName.includes(' - ')) {
				// If it's a full path, use it directly
				if (fileName.includes('\\') || fileName.includes('/')) {
					filePaths.push(fileName);
				}
				// If it's just a filename, we'll skip it for now
				// (Could enhance later to search in workspace folders)
				else {
					console.log(`📝 VS Code file without full path: ${fileName}`);
				}
			}
			break; // Only use the first matching pattern
		}
	}
	
	// Also check for any full file paths directly in the title (including .exe files)
	const pathMatches = title.match(/[A-Z]:\\[^|<>:*?"]*\.[a-zA-Z0-9]{1,5}/g);
	if (pathMatches) {
		filePaths.push(...pathMatches);
	}
	
	return filePaths;
}

async function detectNewProcesses(taskId, token, trackedFiles, currentlyOpenFiles, win, processBaseline) {
	console.log(`🔍 Checking for new processes/executables...`);
	
	const ps = spawn('powershell.exe', ['-Command', `
		Get-Process | Where-Object { $_.Path -and $_.Path -ne "" } | Select-Object ProcessName, Path | ForEach-Object {
			Write-Host "$($_.ProcessName)|$($_.Path)"
		}
	`]);
	
	return new Promise((resolve) => {
		ps.stdout.on('data', (data) => {
			const lines = data.toString().split('\n');
			lines.forEach(async line => {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.includes('|')) return;
				
				const parts = trimmed.split('|');
				if (parts.length >= 2) {
					const processName = parts[0];
					const executablePath = parts[1];
					
					// Only track if it's a NEW executable (not in baseline) and not already tracked
					if (executablePath && 
						executablePath.toLowerCase().endsWith('.exe') && 
						!processBaseline.has(executablePath) && 
						!trackedFiles.has(executablePath)) {
						
						// Skip system processes and common Windows processes
						const skipProcesses = ['svchost', 'dwm', 'winlogon', 'csrss', 'lsass', 'services', 'system', 'registry', 'taskhostw', 'explorer', 'RuntimeBroker'];
						if (!skipProcesses.some(skip => processName.toLowerCase().includes(skip))) {
							trackedFiles.add(executablePath);
							currentlyOpenFiles.set(executablePath, { lastSeen: new Date(), source: 'process' });
							console.log(`🚀 NEW executable launched AFTER task start: ${executablePath} (${processName})`);
							console.log(`   ✅ Not in baseline - this is a user-launched application!`);
							win.webContents.send('task:fileTracked', { taskId, path: executablePath });
							await postTrack(taskId, token, executablePath);
						} else {
							console.log(`⚠️ Skipped system process: ${processName} (${executablePath})`);
						}
					} else if (processBaseline.has(executablePath)) {
						// This was already running when task started - don't track
						// console.log(`⏸️ Ignoring pre-existing process: ${processName}`);
					}
				}
			});
		});
		
		ps.on('close', () => resolve());
		setTimeout(() => { ps.kill(); resolve(); }, 5000);
	});
}

async function captureProcessBaseline() {
	console.log(`📸 Capturing baseline of currently running processes...`);
	
	const ps = spawn('powershell.exe', ['-Command', `
		Get-Process | Where-Object { $_.Path -and $_.Path -ne "" } | Select-Object ProcessName, Path | ForEach-Object {
			Write-Host "$($_.ProcessName)|$($_.Path)"
		}
	`]);
	
	const runningProcesses = new Set();
	
	return new Promise((resolve) => {
		ps.stdout.on('data', (data) => {
			const lines = data.toString().split('\n');
			lines.forEach(line => {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.includes('|')) return;
				
				const parts = trimmed.split('|');
				if (parts.length >= 2) {
					const executablePath = parts[1];
					if (executablePath && executablePath.toLowerCase().endsWith('.exe')) {
						runningProcesses.add(executablePath);
					}
				}
			});
		});
		
		ps.on('close', () => {
			console.log(`📸 Baseline captured: ${runningProcesses.size} running executables`);
			resolve(runningProcesses);
		});
		
		setTimeout(() => { ps.kill(); resolve(runningProcesses); }, 5000);
	});
}

function startAdvancedFileTracking(win, taskId, token) {
	console.log(`🚀 Starting ADVANCED file tracking for task: ${taskId}`);
	
	const recentDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Recent');
	const trackedFiles = new Set();
	const currentlyOpenFiles = new Map(); // filePath -> { lastSeen: Date, source: 'recent'|'window'|'handle' }
	let isActive = true;
	
	// CLEAR the global seen files map for this new task session
	globalSeenFiles.clear();
	console.log(`🧹 Cleared previous file tracking history for fresh start`);

	// Capture baseline of currently running processes
	let processBaseline = new Set();
	captureProcessBaseline().then(baseline => {
		processBaseline = baseline;
		console.log(`✅ Process baseline established with ${baseline.size} executables`);
	});
	
	// Get baseline of existing .lnk files with their modification times
	try {
		if (fs.existsSync(recentDir)) {
			fs.readdirSync(recentDir).forEach(file => {
				if (file.toLowerCase().endsWith('.lnk')) {
					const filePath = path.join(recentDir, file);
					const stats = fs.statSync(filePath);
					globalSeenFiles.set(file, stats.mtime.getTime());
				}
			});
		}
		console.log(`📋 Baseline: ${globalSeenFiles.size} existing .lnk files with timestamps (will track NEW and MODIFIED ones)`);
	} catch (error) {
		console.warn('Warning reading Recent directory:', error.message);
	}
	
	// Poll for new .lnk files every 2 seconds
	const interval = setInterval(async () => {
		if (!isActive) return;
		
		try {
			if (!fs.existsSync(recentDir)) {
				console.log(`❌ Recent directory does not exist: ${recentDir}`);
				return;
			}
			
			const currentFiles = fs.readdirSync(recentDir);
			const allLnkFiles = currentFiles.filter(file => file.toLowerCase().endsWith('.lnk'));
			const newOrModifiedFiles = [];
			
			// Check each .lnk file for new or modified status
			for (const file of allLnkFiles) {
				const filePath = path.join(recentDir, file);
				try {
					const stats = fs.statSync(filePath);
					const currentMtime = stats.mtime.getTime();
					const previousMtime = globalSeenFiles.get(file);
					
					if (!previousMtime) {
						// Completely new file
						newOrModifiedFiles.push({ file, type: 'NEW', filePath });
						globalSeenFiles.set(file, currentMtime);
					} else if (currentMtime > previousMtime) {
						// File was modified (opened again)
						newOrModifiedFiles.push({ file, type: 'MODIFIED', filePath });
						globalSeenFiles.set(file, currentMtime);
					}
				} catch (error) {
					console.warn(`Error checking file ${file}:`, error.message);
				}
			}
			
			console.log(`🔍 Scanning: ${allLnkFiles.length} total .lnk files, ${newOrModifiedFiles.length} new/modified files`);
			
			if (newOrModifiedFiles.length > 0) {
				console.log(`🆕 New/Modified files found:`);
				newOrModifiedFiles.forEach(item => {
					console.log(`  ${item.type}: ${item.file}`);
				});
			}
			
			for (const item of newOrModifiedFiles) {
				console.log(`🔗 Processing ${item.type.toLowerCase()} .lnk file: ${item.file}`);
				
				// Resolve the shortcut to get the actual file path
				const targetPath = await resolveShortcut(item.filePath);
				console.log(`🔍 Resolved path: ${targetPath} (from ${item.file})`);
				
				if (targetPath && !trackedFiles.has(targetPath)) {
					trackedFiles.add(targetPath);
					currentlyOpenFiles.set(targetPath, { lastSeen: new Date(), source: 'recent' });
					
					// Show file extension for debugging
					const extension = targetPath.split('.').pop()?.toLowerCase() || 'no-extension';
					console.log(`✅ ${item.type} file tracked: ${targetPath} (${extension} file)`);
					
					win.webContents.send('task:fileTracked', { taskId, path: targetPath });
					await postTrack(taskId, token, targetPath);
				} else if (targetPath) {
					currentlyOpenFiles.set(targetPath, { lastSeen: new Date(), source: 'recent' });
					console.log(`⚠️ File already tracked this session: ${targetPath}`);
				} else {
					console.log(`❌ Could not resolve shortcut: ${item.filePath}`);
				}
			}
		} catch (error) {
			console.error('❌ Error during file monitoring:', error);
		}
	}, 2000);
	
	// Advanced file detection - Check window titles and file handles
	const advancedInterval = setInterval(async () => {
		if (!isActive) return;
		
		try {
			await detectOpenFilesAdvanced(taskId, token, trackedFiles, currentlyOpenFiles, win);
		} catch (error) {
			console.error('❌ Error during advanced file detection:', error);
		}
	}, 3000);

	// Process monitoring for .exe files
	const processInterval = setInterval(async () => {
		if (!isActive) return;
		
		try {
			await detectNewProcesses(taskId, token, trackedFiles, currentlyOpenFiles, win, processBaseline);
		} catch (error) {
			console.error('❌ Error during process monitoring:', error);
		}
	}, 4000);
	
	return {
		stop: async () => {
			isActive = false;
			clearInterval(interval);
			clearInterval(advancedInterval);
			clearInterval(processInterval);
			console.log(`🛑 Stopped advanced file tracking for task: ${taskId}`);
		}
	};
}

function registerIpcHandlers(win) {
	// Shell operations
	ipcMain.handle('shell:openExternal', async (_e, url) => {
		try {
			console.log(`🌐 Opening external URL: ${url}`);
			await shell.openExternal(url);
			return { ok: true };
		} catch (error) {
			console.error(`❌ Error opening external URL: ${url}`, error);
			return { ok: false, error: String(error) };
		}
	});

	ipcMain.handle('task:start', async (_e, { taskId, token }) => {
		try {
			console.log(`🎬 STARTING file tracking for task: ${taskId}`);
			
			// Stop existing monitor if any
			if (activeMonitors.has(taskId)) {
				console.log(`🔄 Stopping existing monitor for task: ${taskId}`);
				await activeMonitors.get(taskId).stop();
			}
			
			const monitor = startAdvancedFileTracking(win, taskId, token);
			activeMonitors.set(taskId, monitor);
			
			console.log(`✅ Successfully started tracking for task: ${taskId}`);
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

	// Manual file picker for testing
	ipcMain.handle('task:pickAndTrack', async (_e, { taskId, token }) => {
		const { dialog } = require('electron');
		try {
			const result = await dialog.showOpenDialog(win, {
				properties: ['openFile', 'multiSelections'],
				title: 'Select files to track for this task'
			});
			
			if (!result.canceled && result.filePaths) {
				console.log(`📁 Manual file selection: ${result.filePaths.length} files`);
				for (const filePath of result.filePaths) {
					console.log(`✅ Manually tracking: ${filePath}`);
					win.webContents.send('task:fileTracked', { taskId, path: filePath });
					await postTrack(taskId, token, filePath);
				}
				return { ok: true, count: result.filePaths.length };
			}
			return { ok: true, count: 0 };
		} catch (error) {
			console.error('Error in manual file picker:', error);
			return { ok: false, error: String(error) };
		}
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