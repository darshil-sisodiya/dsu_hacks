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

function startSimpleFileTracking(win, taskId, token) {
	console.log(`🚀 Starting SIMPLE file tracking for task: ${taskId}`);
	
	const recentDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Recent');
	const trackedFiles = new Set();
	let isActive = true;
	
	// CLEAR the global seen files map for this new task session
	globalSeenFiles.clear();
	console.log(`🧹 Cleared previous file tracking history for fresh start`);
	
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
				
				if (targetPath && !trackedFiles.has(targetPath)) {
					trackedFiles.add(targetPath);
					console.log(`✅ ${item.type} file tracked: ${targetPath}`);
					win.webContents.send('task:fileTracked', { taskId, path: targetPath });
					await postTrack(taskId, token, targetPath);
				} else if (targetPath) {
					console.log(`⚠️ File already tracked this session: ${targetPath}`);
				} else {
					console.log(`❌ Could not resolve shortcut: ${item.filePath}`);
				}
			}
		} catch (error) {
			console.error('❌ Error during file monitoring:', error);
		}
	}, 2000);
	
	return {
		stop: async () => {
			isActive = false;
			clearInterval(interval);
			console.log(`🛑 Stopped file tracking for task: ${taskId}`);
		}
	};
}

function registerIpcHandlers(win) {
	ipcMain.handle('task:start', async (_e, { taskId, token }) => {
		try {
			console.log(`🎬 STARTING file tracking for task: ${taskId}`);
			
			// Stop existing monitor if any
			if (activeMonitors.has(taskId)) {
				console.log(`🔄 Stopping existing monitor for task: ${taskId}`);
				await activeMonitors.get(taskId).stop();
			}
			
			const monitor = startSimpleFileTracking(win, taskId, token);
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