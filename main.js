/**
 * 趣味单词学习墙 - Electron主进程
 * 负责创建应用窗口、设置菜单、处理应用生命周期等
 */

const { app, BrowserWindow, Menu, dialog, shell, globalShortcut, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const log = require('electron-log'); // Optional: for better logging

// 配置日志
log.transports.file.level = 'info';
log.transports.console.level = 'info';
// 解决中文乱码问题
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// 强制允许在开发环境中测试更新
// 警告：仅用于测试，生产环境应移除此配置
autoUpdater.forceDevUpdateConfig = true;
autoUpdater.allowDowngrade = true; // 允许降级，方便测试
autoUpdater.autoDownload = true; // 自动下载更新

log.info('应用启动中...');

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
            await shell.openExternal('https://github.com/HZZ177/word_play');
          }
        },
        { type: 'separator' },
        {
          label: '检查更新',
          click: () => {
            handleManualUpdateCheck(); // Call the new handler function
          }
        },
        { type: 'separator' }, // Separator before DevTools
        {
          label: '切换开发者工具',
          accelerator: 'Ctrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
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

  // Simpler approach for startup: Auto check on startup (non-dev) after window loads
  if (process.env.NODE_ENV !== 'development') {
    if (mainWindow) {
        mainWindow.webContents.on('did-finish-load', () => {
            log.info('Window finished loading. Checking for updates and notifying (startup).');
            autoUpdater.checkForUpdatesAndNotify();
        });
    } else {
        log.error('mainWindow not available when attempting to set up did-finish-load for autoUpdater on startup.');
    }
  }
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

/**
 * 显示自定义对话框
 * @param {Object} options - 对话框选项
 * @param {string} options.type - 对话框类型: 'info', 'warning', 'error', 'loading'
 * @param {string} options.title - 对话框标题
 * @param {string} options.message - 对话框消息
 * @param {string} [options.detail] - 详细信息
 * @param {Array} [options.buttons] - 按钮数组，默认为 ['确定']
 * @param {number} [options.defaultId] - 默认按钮索引
 * @param {number} [options.cancelId] - 取消按钮索引
 * @param {boolean} [options.showProgress] - 是否显示进度条
 * @param {number} [options.progress] - 进度值 (0-100)
 * @returns {Object} - 包含控制对话框的方法和Promise
 */
function showCustomDialog(options) {
  // 默认选项
  const defaultOptions = {
    type: 'info',
    buttons: ['确定'],
    defaultId: 0,
    cancelId: 0,
    showProgress: false,
    progress: 0
  };
  
  // 合并选项
  const dialogOptions = { ...defaultOptions, ...options };
  
  // 计算适当的高度
  let height = 200; // 基础高度
  if (dialogOptions.detail) height += 40;
  if (dialogOptions.showProgress) height += 30;
  if (dialogOptions.buttons.length > 2) height += 20;
  
  // 创建窗口
  const dialogWindow = new BrowserWindow({
    parent: mainWindow,
    modal: false, // 改为非模态，防止主窗口闪烁
    width: 420, // 稍微增加宽度
    height: height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    frame: false,
    show: false,
    alwaysOnTop: true, // 确保对话框总是在顶部
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // 生成唯一ID
  const dialogId = `dialog_${Date.now()}`;
  
  // 创建HTML内容
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${dialogOptions.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          color: #333;
          user-select: none;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 40px); /* 减去padding */
          overflow: hidden;
        }
        .dialog-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .dialog-icon {
          margin-right: 10px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog-icon.info {
          color: #0078d4;
        }
        .dialog-icon.warning {
          color: #f0ad4e;
        }
        .dialog-icon.error {
          color: #d9534f;
        }
        .dialog-title {
          font-size: 16px;
          font-weight: bold;
        }
        .dialog-message {
          margin-bottom: 10px;
        }
        .dialog-detail {
          margin-bottom: 15px;
          font-size: 0.9em;
          color: #666;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e0e0e0;
          border-radius: 4px;
          margin: 10px 0 15px 0;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background-color: #0078d4;
          width: ${dialogOptions.progress}%;
          transition: width 0.3s ease;
        }
        .button-container {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 20px; /* 确保按钮与上方内容有足够间距 */
        }
        button {
          padding: 8px 16px; /* 增加按钮大小 */
          background: #e1e1e1;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          min-width: 80px;
        }
        button.default {
          background: #0078d4;
          color: white;
        }
        button:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="dialog-header">
        <div class="dialog-icon ${dialogOptions.type}">
          ${dialogOptions.type === 'info' ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' : ''}
          ${dialogOptions.type === 'warning' ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' : ''}
          ${dialogOptions.type === 'error' ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' : ''}
          ${dialogOptions.type === 'loading' ? '<div class="spinner"></div>' : ''}
        </div>
        <div class="dialog-title">${dialogOptions.title}</div>
      </div>
      <div class="dialog-message">${dialogOptions.message}</div>
      ${dialogOptions.detail ? `<div class="dialog-detail">${dialogOptions.detail}</div>` : ''}
      ${dialogOptions.showProgress ? `<div class="progress-bar"><div class="progress-bar-fill" id="progress-fill"></div></div>` : ''}
      <div class="button-container">
        ${dialogOptions.buttons.map((button, index) => `
          <button class="${index === dialogOptions.defaultId ? 'default' : ''}" data-id="${index}">${button}</button>
        `).join('')}
      </div>
      <script>
        // 监听来自主进程的消息
        const { ipcRenderer } = require('electron');
        
        // 设置按钮点击事件
        document.querySelectorAll('button').forEach(button => {
          button.addEventListener('click', () => {
            const buttonId = parseInt(button.getAttribute('data-id'));
            ipcRenderer.send('${dialogId}-response', buttonId);
          });
        });
        
        // 监听进度更新
        ipcRenderer.on('${dialogId}-progress', (event, progress) => {
          const progressFill = document.getElementById('progress-fill');
          if (progressFill) {
            progressFill.style.width = progress + '%';
          }
        });
        
        // 监听关闭命令
        ipcRenderer.on('${dialogId}-close', () => {
          window.close();
        });
      </script>
    </body>
    </html>
  `;
  
  // 将HTML内容写入临时文件
  const tempPath = path.join(app.getPath('temp'), `${dialogId}.html`);
  fs.writeFileSync(tempPath, htmlContent);
  
  // 加载临时HTML文件
  dialogWindow.loadFile(tempPath);
  
  // 计算并设置对话框位置（居中于主窗口）
  const centerDialog = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !dialogWindow.isDestroyed()) {
      const mainBounds = mainWindow.getBounds();
      const dialogBounds = dialogWindow.getBounds();
      
      const x = Math.round(mainBounds.x + (mainBounds.width - dialogBounds.width) / 2);
      const y = Math.round(mainBounds.y + (mainBounds.height - dialogBounds.height) / 2);
      
      dialogWindow.setPosition(x, y);
    }
  };
  
  // 显示窗口
  dialogWindow.once('ready-to-show', () => {
    centerDialog();
    dialogWindow.show();
  });
  
  // 监听主窗口移动，保持对话框居中
  const mainMoveHandler = () => {
    centerDialog();
  };
  
  mainWindow.on('move', mainMoveHandler);
  mainWindow.on('resize', mainMoveHandler);
  
  // 创建Promise来处理用户响应
  const responsePromise = new Promise((resolve) => {
    // 设置IPC监听器
    ipcMain.once(`${dialogId}-response`, (event, response) => {
      // 删除临时文件
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        log.warn('无法删除临时文件:', err);
      }
      
      // 移除主窗口事件监听
      mainWindow.removeListener('move', mainMoveHandler);
      mainWindow.removeListener('resize', mainMoveHandler);
      
      // 确保主窗口在关闭对话框后仍然可见
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
      
      // 关闭窗口
      if (!dialogWindow.isDestroyed()) {
        dialogWindow.close();
      }
      
      // 返回用户响应
      resolve({ response });
    });
    
    // 监听窗口关闭事件
    dialogWindow.on('closed', () => {
      // 移除IPC监听器
      ipcMain.removeAllListeners(`${dialogId}-response`);
      
      // 移除主窗口事件监听
      mainWindow.removeListener('move', mainMoveHandler);
      mainWindow.removeListener('resize', mainMoveHandler);
      
      // 确保主窗口在关闭对话框后仍然可见
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
      
      // 尝试删除临时文件
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        // 可能已经被删除，忽略错误
      }
      
      // 如果窗口被用户关闭，返回取消操作
      if (!dialogOptions.buttons[dialogOptions.cancelId]) {
        resolve({ response: dialogOptions.cancelId });
      }
    });
  });
  
  // 提供更新进度的方法
  const updateProgress = (progress) => {
    if (!dialogWindow.isDestroyed()) {
      dialogWindow.webContents.send(`${dialogId}-progress`, progress);
    }
  };
  
  // 提供关闭窗口的方法
  const closeDialog = () => {
    if (!dialogWindow.isDestroyed()) {
      dialogWindow.webContents.send(`${dialogId}-close`);
      dialogWindow.close();
    }
  };
  
  // 返回对话框控制对象，包含Promise和控制方法
  return {
    updateProgress,
    closeDialog,
    response: responsePromise
  };
}

// Function to handle manual update check logic
function handleManualUpdateCheck() {
  // 如果已经在检查更新，则不要重复检查
  if (autoUpdater.checking) {
    log.info('已经在检查更新，忽略重复请求');
    return;
  }

  // 标记正在检查更新
  autoUpdater.checking = true;

  // 显示"正在检查更新"对话框
  const loadingDialog = showCustomDialog({
    type: 'loading',
    title: '检查更新',
    message: '正在检查更新，请稍候...',
    buttons: ['取消']
  });

  // 记录更详细的日志
  log.info('开始检查更新...');
  log.info('当前版本:', app.getVersion());
  log.info('更新提供者:', autoUpdater.getFeedURL() || '未设置 (将使用 package.json 中的配置)');
  log.info('环境变量 GH_TOKEN 是否存在:', !!process.env.GH_TOKEN ? '是' : '否');
  log.info('是否在开发环境:', process.env.NODE_ENV === 'development' ? '是' : '否');
  log.info('forceDevUpdateConfig:', autoUpdater.forceDevUpdateConfig ? '已启用' : '未启用');

  // 移除所有现有的监听器
  autoUpdater.removeAllListeners();

  // 添加更详细的事件监听
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...');
  });

  autoUpdater.on('update-not-available', async (info) => {
    log.info('没有可用的更新:', info);
    
    // 关闭加载对话框
    loadingDialog.closeDialog();
    
    // 重置检查状态
    autoUpdater.checking = false;
    
    // 显示"当前是最新版本"对话框
    const notAvailableDialog = showCustomDialog({
      type: 'info',
      title: '检查更新',
      message: '您当前使用的是最新版本。',
      buttons: ['确定'],
      defaultId: 0
    });
    
    // 等待用户响应
    await notAvailableDialog.response;
  });

  autoUpdater.on('update-available', async (info) => {
    log.info('发现可用更新:', info);
    
    // 关闭加载对话框
    loadingDialog.closeDialog();
    
    // 显示"发现新版本"对话框
    const availableDialog = showCustomDialog({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}。将开始自动下载。`,
      detail: `发布日期: ${new Date(info.releaseDate).toLocaleString()}`,
      buttons: ['好的'],
      defaultId: 0
    });
    
    // 等待用户响应
    await availableDialog.response;
    
    // 显示下载进度对话框
    const progressDialog = showCustomDialog({
      type: 'info',
      title: '下载更新',
      message: '正在下载更新，请稍候...',
      showProgress: true,
      progress: 0,
      buttons: ['后台下载']
    });
    
    // 更新进度对话框
    autoUpdater.on('download-progress', (progressObj) => {
      const percent = progressObj.percent;
      let log_message = `下载进度: ${percent.toFixed(2)}% (${progressObj.transferred}/${progressObj.total} bytes), 速度: ${progressObj.bytesPerSecond} bytes/s`;
      log.info(log_message);
      
      // 更新进度条
      progressDialog.updateProgress(percent);
      
      // 在任务栏显示进度
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(percent / 100);
      }
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log.info('更新已下载:', info);
    
    // 关闭加载对话框
    loadingDialog.closeDialog();
    
    // 重置进度条
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    
    // 重置检查状态
    autoUpdater.checking = false;
    
    // 显示"更新准备就绪"对话框
    const readyDialog = showCustomDialog({
      type: 'info',
      title: '更新准备就绪',
      message: `新版本 ${info.version} 已下载完成。`,
      detail: '是否立即重启应用并安装更新？',
      buttons: ['立即重启', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    });
    
    // 等待用户响应
    const result = await readyDialog.response;
    
    if (result.response === 0) {
      log.info('用户选择立即安装更新');
      autoUpdater.quitAndInstall();
    } else {
      log.info('用户选择稍后安装更新');
    }
  });

  autoUpdater.on('error', async (err) => {
    log.error('更新过程中发生错误:', err);
    
    // 关闭加载对话框
    loadingDialog.closeDialog();
    
    // 重置进度条
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    
    // 重置检查状态
    autoUpdater.checking = false;
    
    // 显示错误对话框
    const errorDialog = showCustomDialog({
      type: 'error',
      title: '更新错误',
      message: '检查或下载更新时发生错误',
      detail: err.message || String(err),
      buttons: ['确定'],
      defaultId: 0
    });
    
    // 等待用户响应
    await errorDialog.response;
  });
  
  log.info('开始检查更新...');
  autoUpdater.checkForUpdates().catch(async (err) => {
    log.error('checkForUpdates 调用失败:', err);
    
    // 关闭加载对话框
    loadingDialog.closeDialog();
    
    // 重置检查状态
    autoUpdater.checking = false;
    
    // 显示错误对话框
    const errorDialog = showCustomDialog({
      type: 'error',
      title: '更新错误',
      message: '启动更新检查失败',
      detail: err.message || String(err),
      buttons: ['确定'],
      defaultId: 0
    });
    
    // 等待用户响应
    await errorDialog.response;
  });
}