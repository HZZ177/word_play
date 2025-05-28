/**
 * 趣味单词学习墙 - Electron主进程
 * 负责创建应用窗口、设置菜单、处理应用生命周期等
 */

const { app, BrowserWindow, Menu, dialog, shell, globalShortcut, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const log = require('electron-log'); // Optional: for better logging
const packageInfo = require('./package.json');
const appVersion = packageInfo.version;
const semver = require('semver'); // 添加semver库引用

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
autoUpdater.autoDownload = false; // 修改为false，要求用户确认后才下载更新

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

// 记录版本信息
log.info('应用版本:', appVersion);

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
              detail: `版本: ${appVersion}\n一个多功能的学习工具集合，包含趣味单词墙等多个学习辅助工具。`,
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
  let height = 250; // 增加基础高度，确保按钮有足够空间
  if (dialogOptions.detail) height += 60; // 增加详情文本的高度补偿
  if (dialogOptions.showProgress) height += 40; // 增加进度条的高度补偿
  if (dialogOptions.buttons.length > 2) height += 30; // 增加多按钮情况的高度补偿
  if (dialogOptions.message && dialogOptions.message.length > 50) height += 30; // 长消息文本补偿
  
  // 创建窗口
  const dialogWindow = new BrowserWindow({
    parent: mainWindow,
    modal: false, // 使用非模态窗口，防止主窗口闪烁
    width: 450, // 增加宽度
    height: height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    frame: false,
    show: false,
    alwaysOnTop: true, // 确保对话框总是在顶部
    transparent: true, // 启用透明支持，使圆角效果更好
    backgroundColor: '#00FFFFFF', // 透明背景
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: process.env.NODE_ENV === 'development' // 只在开发环境启用开发者工具
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
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: transparent;
          color: #333;
          user-select: none;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          border-radius: 12px;
        }
        
        .dialog-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: dialogAppear 0.3s ease-out forwards;
        }
        
        @keyframes dialogAppear {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .dialog-header {
          display: flex;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          user-select: none; /* 防止文本选择 */
        }
        
        .dialog-icon {
          margin-right: 14px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          padding: 5px;
        }
        
        .dialog-icon.info {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .dialog-icon.warning {
          color: #fd7e14;
          background-color: rgba(253, 126, 20, 0.1);
        }
        
        .dialog-icon.error {
          color: #dc3545;
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .dialog-icon.loading {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .dialog-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          flex: 1;
        }
        
        .dialog-body {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .dialog-message {
          margin-bottom: 16px;
          font-size: 16px;
          line-height: 1.5;
          color: #333;
        }
        
        .dialog-detail {
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.5;
          color: #666;
          background-color: rgba(0, 0, 0, 0.02);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #0d6efd;
        }
        
        .spinner {
          border: 3px solid rgba(13, 110, 253, 0.1);
          border-top: 3px solid #0d6efd;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .progress-container {
          margin: 10px 0 20px 0;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d6efd, #0099ff);
          width: ${dialogOptions.progress}%;
          transition: width 0.3s ease;
          border-radius: 10px;
        }
        
        .progress-text {
          font-size: 12px;
          color: #666;
          text-align: right;
        }
        
        .button-container {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 20px;
        }
        
        button {
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 100px;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        button.default {
          background: linear-gradient(135deg, #0d6efd 0%, #0099ff 100%);
          color: white;
        }
        
        button.default:hover {
          background: linear-gradient(135deg, #0b5ed7 0%, #0077cc 100%);
        }
        
        button.secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }
        
        button.secondary:hover {
          background: #e9ecef;
        }
        
        button.cancel {
          background: #f8f9fa;
          color: #666;
          border: 1px solid #dee2e6;
        }
        
        button.cancel:hover {
          background: #e9ecef;
          color: #333;
        }
        
        button.danger {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
        }
        
        button.danger:hover {
          background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
        }
        
        .button-icon {
          margin-right: 8px;
          font-size: 16px;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .dialog-header {
            padding: 16px 20px;
          }
          
          .dialog-body {
            padding: 20px;
          }
          
          button {
            padding: 8px 16px;
            min-width: 80px;
          }
        }
      </style>
    </head>
    <body>
      <div class="dialog-container">
        <div class="dialog-header">
          <div class="dialog-icon ${dialogOptions.type}">
            ${dialogOptions.type === 'info' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' : ''}
            ${dialogOptions.type === 'warning' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' : ''}
            ${dialogOptions.type === 'error' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' : ''}
            ${dialogOptions.type === 'loading' ? '<div class="spinner"></div>' : ''}
          </div>
          <div class="dialog-title">${dialogOptions.title}</div>
        </div>
        <div class="dialog-body">
          <div class="dialog-message">${dialogOptions.message}</div>
          ${dialogOptions.detail ? `<div class="dialog-detail">${dialogOptions.detail}</div>` : ''}
          ${dialogOptions.showProgress ? `
            <div class="progress-container">
              <div class="progress-bar"><div class="progress-bar-fill" id="progress-fill"></div></div>
              <div class="progress-text" id="progress-text">${dialogOptions.progress}%</div>
            </div>
          ` : ''}
          <div class="button-container">
            ${dialogOptions.buttons.map((button, index) => {
              // 根据按钮文本和位置确定按钮类型
              let buttonClass = index === dialogOptions.defaultId ? 'default' : 'secondary';
              if (button.toLowerCase().includes('取消') || button.toLowerCase().includes('稍后') || button.toLowerCase().includes('后台')) {
                buttonClass = 'cancel';
              }
              if (button.toLowerCase().includes('删除') || button.toLowerCase().includes('卸载')) {
                buttonClass = 'danger';
              }
              
              // 添加按钮图标
              let buttonIcon = '';
              if (button.toLowerCase().includes('下载')) {
                buttonIcon = '<span class="button-icon">⬇️</span>';
              } else if (button.toLowerCase().includes('安装') || button.toLowerCase().includes('重启')) {
                buttonIcon = '<span class="button-icon">🔄</span>';
              } else if (button.toLowerCase().includes('确定')) {
                buttonIcon = '<span class="button-icon">✓</span>';
              } else if (button.toLowerCase().includes('取消')) {
                buttonIcon = '<span class="button-icon">✕</span>';
              }
              
              return `<button class="${buttonClass}" data-id="${index}">${buttonIcon}${button}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
      <script>
        // 监听来自主进程的消息
        const { ipcRenderer } = require('electron');
        
        // 设置按钮点击事件
        document.querySelectorAll('button').forEach(button => {
          button.addEventListener('click', () => {
            // 添加点击动画
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
              const buttonId = parseInt(button.getAttribute('data-id'));
              ipcRenderer.send('${dialogId}-response', buttonId);
            }, 150);
          });
        });
        
        // 监听进度更新
        ipcRenderer.on('${dialogId}-progress', (event, progress) => {
          const progressFill = document.getElementById('progress-fill');
          const progressText = document.getElementById('progress-text');
          if (progressFill) {
            progressFill.style.width = progress + '%';
          }
          if (progressText) {
            progressText.textContent = Math.round(progress) + '%';
          }
        });
        
        // 监听关闭命令
        ipcRenderer.on('${dialogId}-close', () => {
          // 添加关闭动画
          document.querySelector('.dialog-container').style.animation = 'dialogAppear 0.2s ease-in reverse';
          setTimeout(() => window.close(), 200);
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
    // 短暂延迟显示，确保平滑过渡
    setTimeout(() => {
      if (!dialogWindow.isDestroyed()) {
        dialogWindow.show();
      }
    }, 50);
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
  const closeDialog = (delay = 0) => {
    if (!dialogWindow.isDestroyed()) {
      // 发送关闭命令，触发动画
      dialogWindow.webContents.send(`${dialogId}-close`);
      
      // 延迟关闭窗口，等待动画完成
      setTimeout(() => {
        try {
          if (!dialogWindow.isDestroyed()) {
            dialogWindow.close();
          }
        } catch (err) {
          log.warn('关闭对话框时出错:', err);
        }
      }, 200 + delay); // 200ms是动画时间，加上可选的额外延迟
    }
  };
  
  // 返回对话框控制对象，包含Promise和控制方法
  return {
    updateProgress,
    closeDialog,
    response: responsePromise
  };
}

/**
 * 尝试清除更新缓存
 */
function clearUpdateCache() {
  log.info('尝试清除更新缓存...');
  
  try {
    // 尝试删除缓存文件夹中的更新文件
    const userDataPath = app.getPath('userData');
    const updatePendingPath = path.join(userDataPath, 'pending-update');
    
    if (fs.existsSync(updatePendingPath)) {
      log.info('发现待处理的更新文件，尝试删除:', updatePendingPath);
      try {
        fs.rmdirSync(updatePendingPath, { recursive: true });
        log.info('成功删除待处理的更新文件');
      } catch (err) {
        log.warn('无法删除待处理的更新文件:', err);
      }
    } else {
      log.info('未找到待处理的更新文件');
    }
    
    // 重置autoUpdater的一些状态
    if (autoUpdater.downloadedUpdateHelper) {
      log.info('重置downloadedUpdateHelper');
      autoUpdater.downloadedUpdateHelper = null;
    }
    
    return true;
  } catch (err) {
    log.error('清除更新缓存时出错:', err);
    return false;
  }
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
  
  // 清除更新缓存
  clearUpdateCache();
  
  // 尝试清除可能存在的缓存更新包
  try {
    if (typeof autoUpdater.removeUpdatesListener === 'function') {
      log.info('尝试移除更新监听器...');
      autoUpdater.removeUpdatesListener();
    }
    
    // 记录当前缓存状态
    log.info('检查更新前的状态:', {
      downloadedUpdateHelper: autoUpdater.downloadedUpdateHelper ? '存在' : '不存在',
      isUpdaterActive: autoUpdater.isUpdaterActive ? '活跃' : '不活跃',
    });
  } catch (err) {
    log.warn('清除更新缓存时出错:', err);
  }

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
  log.info('package.json中的版本:', appVersion);
  log.info('更新提供者:', autoUpdater.getFeedURL() || '未设置 (将使用 package.json 中的配置)');
  log.info('环境变量 GH_TOKEN 是否存在:', !!process.env.GH_TOKEN ? '是' : '否');
  log.info('是否在开发环境:', process.env.NODE_ENV === 'development' ? '是' : '否');
  log.info('forceDevUpdateConfig:', autoUpdater.forceDevUpdateConfig ? '已启用' : '未启用');
  log.info('autoUpdater.currentVersion:', JSON.stringify(autoUpdater.currentVersion || {}));
  log.info('autoUpdater.autoDownload:', autoUpdater.autoDownload ? '已启用' : '未启用');

  // 移除所有现有的监听器
  autoUpdater.removeAllListeners();

  // 添加更详细的事件监听
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...');
  });

  autoUpdater.on('update-not-available', async (info) => {
    log.info('没有可用的更新:', info);
    log.info('当前应用版本:', appVersion);
    log.info('检测到的最新版本:', info.version);
    log.info('版本比较结果 (semver):', semver.compare(appVersion, info.version));
    log.info('是否需要更新 (semver):', semver.lt(appVersion, info.version) ? '是' : '否');
    
    // 先创建新对话框但不立即显示
    const notAvailableDialog = showCustomDialog({
      type: 'info',
      title: '检查更新',
      message: '您当前使用的是最新版本。',
      detail: `当前版本: ${appVersion}`,
      buttons: ['确定'],
      defaultId: 0
    });
    
    // 关闭加载对话框，添加延迟以确保平滑过渡
    loadingDialog.closeDialog(100);
    
    // 重置检查状态
    autoUpdater.checking = false;
    
    // 等待用户响应
    await notAvailableDialog.response;
  });

  autoUpdater.on('update-available', async (info) => {
    log.info('发现可用更新:', info);
    log.info('当前应用版本:', appVersion);
    log.info('检测到的最新版本:', info.version);
    log.info('版本比较结果 (semver):', semver.compare(appVersion, info.version));
    log.info('是否需要更新 (semver):', semver.lt(appVersion, info.version) ? '是' : '否');
    
    // 使用semver进行版本比较，确保只有当新版本真的更高时才更新
    if (semver.lt(appVersion, info.version)) {
      log.info('确认新版本更高，继续更新流程');
      
      // 先创建新对话框但不立即显示
      const availableDialog = showCustomDialog({
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 ${info.version}`,
        detail: `当前版本: ${appVersion}\n发布日期: ${new Date(info.releaseDate).toLocaleString()}\n\n是否下载此更新？`,
        buttons: ['下载更新', '暂不更新'],
        defaultId: 0,
        cancelId: 1
      });
      
      // 关闭加载对话框，添加延迟以确保平滑过渡
      loadingDialog.closeDialog(100);
      
      // 等待用户响应
      const result = await availableDialog.response;
      
      if (result.response === 0) {
        log.info('用户选择下载更新');
        
        // 先创建下载进度对话框但不立即显示
        const progressDialog = showCustomDialog({
          type: 'info',
          title: '下载更新',
          message: '正在下载更新，请稍候...',
          showProgress: true,
          progress: 0,
          buttons: ['后台下载']
        });
        
        // 关闭前一个对话框，添加延迟以确保平滑过渡
        availableDialog.closeDialog(100);
        
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
        
        // 手动开始下载
        try {
          log.info('开始下载更新...');
          await autoUpdater.downloadUpdate();
        } catch (err) {
          log.error('下载更新失败:', err);
          progressDialog.closeDialog();
          
          // 显示错误对话框
          const errorDialog = showCustomDialog({
            type: 'error',
            title: '下载失败',
            message: '下载更新时发生错误',
            detail: err.message || String(err),
            buttons: ['确定'],
            defaultId: 0
          });
          
          await errorDialog.response;
          autoUpdater.checking = false;
        }
      } else {
        log.info('用户选择暂不更新');
        autoUpdater.checking = false;
      }
    } else {
      log.info('虽然检测到更新，但semver比较显示当前版本更高或相同，不进行更新');
      loadingDialog.closeDialog();
      autoUpdater.checking = false;
      
      const notAvailableDialog = showCustomDialog({
        type: 'info',
        title: '检查更新',
        message: '您当前使用的是最新版本。',
        detail: `当前版本: ${appVersion}，服务器版本: ${info.version}`,
        buttons: ['确定'],
        defaultId: 0
      });
      
      await notAvailableDialog.response;
    }
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log.info('更新已下载:', info);
    log.info('当前应用版本:', appVersion);
    log.info('已下载的新版本:', info.version);
    log.info('版本比较结果 (semver):', semver.compare(appVersion, info.version));
    
    // 确认下载的是更高版本
    if (semver.gt(info.version, appVersion)) {
      log.info('确认下载的是更高版本，继续安装流程');
      
      // 重置检查状态
      autoUpdater.checking = false;
      
      // 先创建"更新准备就绪"对话框但不立即显示
      const readyDialog = showCustomDialog({
        type: 'info',
        title: '更新准备就绪',
        message: `新版本 ${info.version} 已下载完成。`,
        detail: `当前版本: ${appVersion}\n是否立即重启应用并安装更新？`,
        buttons: ['立即重启', '稍后提醒'],
        defaultId: 0,
        cancelId: 1
      });
      
      // 关闭进度对话框（如果存在）
      const progressDialogs = BrowserWindow.getAllWindows().filter(win => 
        win.getTitle() && win.getTitle().includes('下载更新'));
      progressDialogs.forEach(win => {
        if (!win.isDestroyed()) {
          win.close();
        }
      });
      
      // 重置进度条
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1);
      }
      
      // 等待用户响应
      const result = await readyDialog.response;
      
      if (result.response === 0) {
        log.info('用户选择立即安装更新');
        try {
          autoUpdater.quitAndInstall(true, true);
        } catch (err) {
          log.error('安装更新失败:', err);
          const errorDialog = showCustomDialog({
            type: 'error',
            title: '安装失败',
            message: '安装更新时发生错误',
            detail: err.message || String(err),
            buttons: ['确定'],
            defaultId: 0
          });
          
          await errorDialog.response;
        }
      } else {
        log.info('用户选择稍后安装更新');
      }
    } else {
      log.warn('下载的版本不高于当前版本，取消安装流程');
      autoUpdater.checking = false;
      
      // 关闭加载对话框（如果存在）
      if (loadingDialog) {
        loadingDialog.closeDialog();
      }
      
      // 显示警告对话框
      const warningDialog = showCustomDialog({
        type: 'warning',
        title: '版本异常',
        message: '下载的更新版本不高于当前版本',
        detail: `当前版本: ${appVersion}，下载的版本: ${info.version}`,
        buttons: ['确定'],
        defaultId: 0
      });
      
      await warningDialog.response;
    }
  });

  autoUpdater.on('error', async (err) => {
    log.error('更新过程中发生错误:', err);
    
    // 先创建错误对话框但不立即显示
    const errorDialog = showCustomDialog({
      type: 'error',
      title: '更新错误',
      message: '检查或下载更新时发生错误',
      detail: err.message || String(err),
      buttons: ['确定'],
      defaultId: 0
    });
    
    // 关闭加载对话框，添加延迟以确保平滑过渡
    loadingDialog.closeDialog(100);
    
    // 重置进度条
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    
    // 重置检查状态
    autoUpdater.checking = false;
    
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