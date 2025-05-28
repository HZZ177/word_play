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
  
  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
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

// 初始化时获取版本信息并设置到window对象
(async () => {
  try {
    const version = await ipcRenderer.invoke('get-app-version');
    // 注入应用信息到window对象
    contextBridge.exposeInMainWorld('appInfo', {
      isElectron: true,
      appName: '趣味单词学习墙',
      appVersion: version
    });
  } catch (error) {
    console.error('获取应用版本信息失败:', error);
    // 设置一个默认版本，防止应用崩溃
    contextBridge.exposeInMainWorld('appInfo', {
      isElectron: true,
      appName: '趣味单词学习墙',
      appVersion: '1.0.0'
    });
  }
})(); 