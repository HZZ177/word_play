/**
 * 趣味单词学习墙 - Electron主进程
 * 负责创建应用窗口、设置菜单、处理应用生命周期等
 */

const { app, BrowserWindow, Menu, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// 在开发环境中启用热重载
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      // 监视这些文件类型的变化
      ignored: /node_modules|[\/\\]\.|dist/,
      // 监视这些目录中的文件
      paths: ['app/**/*.{html,js,css}', '*.js']
    });
    console.log('开发模式：已启用热重载功能');
  } catch (err) {
    console.error('加载electron-reload失败:', err);
  }
}

// 保存主窗口的引用，防止JavaScript垃圾回收时窗口被关闭
let mainWindow;

/**
 * 创建主应用窗口
 */
function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '学习工具箱',
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  // 在开发环境中打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    if (process.env.OPEN_DEV_TOOLS === 'true') {
      // 强制打开开发者工具
      mainWindow.webContents.openDevTools();
      console.log('已强制打开开发者工具');
    } else {
      // 在开发模式下可以用F12打开
      console.log('开发模式：可使用F12键或菜单打开开发者工具');
    }
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    // 取消引用窗口对象，如果应用支持多窗口，则应将窗口存储在数组中
    mainWindow = null;
  });

  // 设置应用菜单
  createMenu();
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入单词数据',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              title: '导入单词数据',
              filters: [{ name: 'JSON文件', extensions: ['json'] }],
              properties: ['openFile']
            }).then(result => {
              if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                // 发送文件路径到渲染进程
                mainWindow.webContents.send('import-file', filePath);
              }
            }).catch(err => {
              console.error('导入文件对话框出错:', err);
            });
          }
        },
        {
          label: '导出单词数据',
          click: () => {
            dialog.showSaveDialog(mainWindow, {
              title: '导出单词数据',
              defaultPath: `词汇表_${new Date().toISOString().slice(0, 10)}.json`,
              filters: [{ name: 'JSON文件', extensions: ['json'] }]
            }).then(result => {
              if (!result.canceled) {
                // 发送保存路径到渲染进程
                mainWindow.webContents.send('export-file', result.filePath);
              }
            }).catch(err => {
              console.error('导出文件对话框出错:', err);
            });
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          role: 'quit'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'delete', label: '删除' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: '关于学习工具箱',
              message: '学习工具箱',
              detail: '版本: 1.0.0\n一个多功能的学习工具集合，包含趣味单词墙等多个学习辅助工具。',
              buttons: ['确定'],
              icon: path.join(__dirname, 'build/icon.ico')
            });
          }
        },
        {
          label: '使用说明',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/word-play');
          }
        }
      ]
    }
  ];

  // 在开发环境中添加开发者工具菜单项
  if (process.env.NODE_ENV === 'development') {
    // 找到视图菜单
    const viewMenu = template.find(item => item.label === '视图');
    if (viewMenu && viewMenu.submenu) {
      // 添加分隔符和开发者工具选项
      viewMenu.submenu.push(
        { type: 'separator' },
        { 
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      );
    }
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  // 在开发环境中设置F12快捷键
  if (process.env.NODE_ENV === 'development') {
    setupDevTools();
  }

  // 在macOS上，通常在应用程序被激活后重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 在所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用程序及其菜单栏通常会保持活动状态，
  // 直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') app.quit();
});

// 处理IPC消息
require('./ipc-handlers'); 

/**
 * 设置开发者工具相关功能
 */
function setupDevTools() {
  // 使用globalShortcut注册F12快捷键
  const ret = globalShortcut.register('F12', () => {
    // 获取当前焦点窗口
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      // 切换开发者工具
      focusedWindow.webContents.toggleDevTools();
      console.log('F12按下：正在切换开发者工具');
    }
  });

  if (!ret) {
    console.error('F12快捷键注册失败');
  } else {
    console.log('F12快捷键注册成功');
  }

  // 注册其他常用的开发快捷键
  globalShortcut.register('CommandOrControl+R', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) focusedWindow.reload();
  });

  // 应用退出时，注销所有快捷键
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  // 仍然保留窗口级别的事件监听作为备用方案
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  });

  // 如果主窗口已经创建，也为其添加F12快捷键监听
  if (mainWindow) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }
}