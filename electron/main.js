const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

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
				// Only redirect if the current request is NOT already pointing at the backend origin
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
		win.loadURL('data:text/html,<h1 style="font-family:system-ui;">Failed to load frontend</h1><p>Start your dev server or build the frontend.</p>');
	});

	// Optional: open devtools for debugging timeouts
	// win.webContents.openDevTools({ mode: 'detach' });
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
