/**
 * 学习工具箱 - 主页面脚本
 * 处理应用卡片点击和数据加载
 */

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用卡片
    initAppCards();
    
    // 加载应用统计数据
    loadAppStats();
    
    // 检查是否在Electron环境中运行
    const isElectron = window.appInfo && window.appInfo.isElectron;
    if (isElectron) {
        console.log('在Electron环境中运行');
        
        // 显示应用版本信息
        if (window.appInfo.appVersion) {
            console.log('应用版本:', window.appInfo.appVersion);
            
            // 如果页脚存在，添加版本信息
            const footer = document.querySelector('.dashboard-footer');
            if (footer) {
                footer.innerHTML = `<small>版本: ${window.appInfo.appVersion}</small>`;
                footer.style.opacity = '0.6';
            }
        } else if (window.appInfo.getVersion) {
            // 如果有getVersion方法，使用它获取版本
            window.appInfo.getVersion().then(version => {
                console.log('应用版本:', version);
                
                // 如果页脚存在，添加版本信息
                const footer = document.querySelector('.dashboard-footer');
                if (footer) {
                    footer.innerHTML = `<small>版本: ${version}</small>`;
                    footer.style.opacity = '0.6';
                }
            }).catch(err => {
                console.error('获取版本信息失败:', err);
            });
        }
    }
});

/**
 * 初始化应用卡片
 */
function initAppCards() {
    // 单词墙应用卡片点击事件
    const wordWallApp = document.getElementById('word-wall-app');
    if (wordWallApp) {
        wordWallApp.addEventListener('click', (event) => {
            // 如果点击的是按钮，让按钮自己处理事件
            if (event.target.tagName === 'BUTTON') return;
            
            // 否则整个卡片点击也触发打开应用
            openApp('word-wall');
        });
    }
}

/**
 * 打开指定应用
 * @param {string} appId - 应用ID
 */
function openApp(appId) {
    console.log(`打开应用: ${appId}`);
    
    switch (appId) {
        case 'word-wall':
            // 在Electron环境中直接导航到应用页面
            window.location.href = `apps/word-wall/index.html`;
            break;
        default:
            console.error(`未知应用ID: ${appId}`);
            break;
    }
}

/**
 * 加载应用统计数据
 */
function loadAppStats() {
    // 加载单词墙统计数据
    loadWordWallStats();
}

/**
 * 加载单词墙统计数据
 */
function loadWordWallStats() {
    const statsElement = document.getElementById('word-wall-stats');
    if (!statsElement) return;
    
    // 尝试从localStorage加载单词数据
    try {
        const wordsData = localStorage.getItem('wordWallData');
        if (wordsData) {
            const words = JSON.parse(wordsData);
            if (Array.isArray(words)) {
                statsElement.textContent = `${words.length} 个单词`;
                return;
            }
        }
        
        // 如果没有数据，显示默认文本
        statsElement.textContent = '0 个单词';
    } catch (error) {
        console.error('加载单词墙统计数据出错:', error);
        statsElement.textContent = '加载失败';
    }
} 