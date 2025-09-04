const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taskAPI', {
	start: (taskId, token) => ipcRenderer.invoke('task:start', { taskId, token }),
	end: (taskId) => ipcRenderer.invoke('task:end', taskId),
	resumeOpen: (taskId, files) => ipcRenderer.invoke('task:resumeOpen', taskId, files),
	pickAndTrack: (taskId, token) => ipcRenderer.invoke('task:pickAndTrack', { taskId, token }),
	onFileTracked: (callback) => ipcRenderer.on('task:fileTracked', callback),
});

contextBridge.exposeInMainWorld('electronAPI', {
	openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
