/**
 * 趣味单词学习墙 - 预加载脚本
 * 在渲染进程加载前执行，用于安全地暴露主进程功能给渲染进程
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作API
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', { filePath, data }),
  
  // 事件监听
  onImportFile: (callback) => {
    ipcRenderer.on('import-file', (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeAllListeners('import-file');
  },
  onExportFile: (callback) => {
    ipcRenderer.on('export-file', (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeAllListeners('export-file');
  },
  
  // 事件发送
  importComplete: (result) => ipcRenderer.send('import-complete', result),
  exportComplete: (result) => ipcRenderer.send('export-complete', result)
});

// 注入一些额外的自定义信息到window对象
contextBridge.exposeInMainWorld('appInfo', {
  isElectron: true,
  appName: '趣味单词学习墙',
  appVersion: '1.0.0'
}); 