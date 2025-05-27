/**
 * 趣味单词学习墙 - IPC通信处理
 * 处理主进程和渲染进程之间的通信
 */

const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// 处理读取文件请求
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    console.error('读取文件出错:', error);
    return { success: false, error: error.message };
  }
});

// 处理写入文件请求
ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    await fs.promises.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('写入文件出错:', error);
    return { success: false, error: error.message };
  }
});

// 监听导入文件完成事件
ipcMain.on('import-complete', (event, result) => {
  // 这里可以添加导入完成后的处理逻辑
  console.log('导入完成:', result);
});

// 监听导出文件完成事件
ipcMain.on('export-complete', (event, result) => {
  // 这里可以添加导出完成后的处理逻辑
  console.log('导出完成:', result);
}); 