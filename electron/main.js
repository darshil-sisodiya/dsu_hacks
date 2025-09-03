const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

function getBackendBase() {
	return process.env.BACKEND_URL || 'http://localhost:3001';
}

function resolveFrontendEntry() {
	// 1) Env override for dev server
	const envUrl = process.env.FRONTEND_URL;
	if (envUrl && /^https?:\/\//.test(envUrl)) {
		return { type: 'url', value: envUrl };
	}

	// 2) Common dev default
	const devUrl = 'http://localhost:3000';
	return { type: 'url', value: devUrl };
}

function resolveFrontendBuild() {
	// Try Vite default
	const viteIndex = path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html');
	if (fs.existsSync(viteIndex)) {
		return viteIndex;
	}
	// Try CRA default
	const craIndex = path.resolve(__dirname, '..', 'frontend', 'build', 'index.html');
	if (fs.existsSync(craIndex)) {
		return craIndex;
	}
	return null;
}

function setupApiRedirects(win) {
	const backendBase = getBackendBase();
	const filter = { urls: ['*://*/*', 'file://*/*'] };
	win.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
		try {
			const originalUrl = details.url;
			// Handle both http(s) and file scheme
			let pathname = '';
			if (originalUrl.startsWith('file://')) {
				// file scheme: extract path after file:// and look for /api/
				const idx = originalUrl.indexOf('/api/');
				if (idx !== -1) {
					pathname = originalUrl.substring(idx);
				}
			} else {
				const u = new URL(originalUrl);
				pathname = u.pathname + (u.search || '');
			}

			if (pathname.startsWith('/api/')) {
				const redirectURL = backendBase.replace(/\/$/, '') + pathname;
				return callback({ redirectURL });
			}
		} catch (_) {}
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

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			contextIsolation: true
		}
	});

	setupApiRedirects(win);

	loadFrontend(win).catch((err) => {
		console.error('Failed to load frontend:', err);
		// Fallback to a simple local page so the window still opens
		win.loadURL('data:text/html,<h1 style="font-family:system-ui;">Failed to load frontend</h1><p>Start your dev server or build the frontend.</p>');
	});
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
