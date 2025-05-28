/**
 * 趣味单词学习墙 - 应用入口脚本
 * 处理导航和初始化
 */

// 全局变量
let words = []; // 存储所有单词数据
const LOCAL_STORAGE_KEY = 'wordWallData'; // 本地存储键名

// 检查是否在Electron环境中运行
const isElectron = window.appInfo && window.appInfo.isElectron;

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航
    initNavigation();
    
    // 加载单词数据
    loadWords();
    
    // 初始化统计信息
    updateStatistics();

    // 如果在Electron环境中，初始化Electron特定功能
    if (isElectron) {
        initElectronFeatures();
    }
});

/**
 * 初始化Electron特定功能
 */
function initElectronFeatures() {
    // 监听从主进程发送的导入文件事件
    if (window.electronAPI) {
        window.electronAPI.onImportFile((filePath) => {
            console.log('收到导入文件请求:', filePath);
            importFromFile(filePath);
        });

        // 监听从主进程发送的导出文件事件
        window.electronAPI.onExportFile((filePath) => {
            console.log('收到导出文件请求:', filePath);
            exportToFile(filePath);
        });
    }
}

/**
 * 初始化导航
 */
function initNavigation() {
    // 获取菜单按钮和菜单元素
    const menuButton = document.getElementById('menu-button');
    const menuDropdown = document.getElementById('menu-dropdown');
    const menuClose = document.getElementById('menu-close');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    
    // 菜单按钮点击事件
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            menuDropdown.classList.add('active');
            overlay.classList.add('active');
        });
    }
    
    // 关闭按钮点击事件
    if (menuClose) {
        menuClose.addEventListener('click', () => {
            menuDropdown.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    // 遮罩层点击事件
    overlay.addEventListener('click', () => {
        menuDropdown.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // 菜单项点击事件
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.dataset.target;
            
            // 切换页面
            switchPage(target);
            
            // 更新菜单项状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // 关闭菜单
            menuDropdown.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
}

/**
 * 切换页面
 * @param {string} pageId - 页面ID
 */
function switchPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (page.id === pageId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    // 当切换到统计页面时更新统计信息
    if (pageId === 'statistics') {
        updateStatistics();
    }
}

/**
 * 加载单词数据
 */
function loadWords() {
    // 尝试从localStorage加载数据
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
                words = parsedData;
                console.log(`从本地存储加载了 ${words.length} 个单词`);
                
                // 渲染单词墙和单词列表
                if (typeof window.renderWordWall === 'function') {
                    window.renderWordWall();
                } else if (typeof renderWordWall === 'function') {
                    renderWordWall();
                }
                
                if (typeof window.renderWordList === 'function') {
                    window.renderWordList();
                } else if (typeof renderWordList === 'function') {
                    renderWordList();
                }
                
                return;
            }
        } catch (error) {
            console.error('解析保存的数据时出错:', error);
        }
    }
    
    // 如果没有保存的数据或解析出错，加载示例数据
    loadExampleWords();
}

/**
 * 加载示例单词
 */
function loadExampleWords() {
    // 示例单词数据
    const exampleWords = [
        { word: "Hello", translation: "你好", mastered: false },
        { word: "World", translation: "世界", mastered: false },
        { word: "Learning", translation: "学习", mastered: false },
        { word: "Knowledge", translation: "知识", mastered: false },
        { word: "Education", translation: "教育", mastered: false }
    ];
    
    words = exampleWords;
    saveWords();
    
    // 渲染单词墙和单词列表
    if (typeof renderWordWall === 'function') {
        renderWordWall();
    }
    
    if (typeof renderWordList === 'function') {
        renderWordList();
    }
    
    console.log('加载了示例单词数据');
}

/**
 * 保存单词数据到localStorage
 */
function saveWords() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(words));
        console.log(`保存了 ${words.length} 个单词到本地存储`);
    } catch (error) {
        console.error('保存数据时出错:', error);
        window.utils.showAlert('保存数据失败，请检查浏览器存储设置', 'danger');
    }
}

/**
 * 从指定文件导入单词数据
 * @param {string} filePath - 文件路径
 */
async function importFromFile(filePath) {
    if (!isElectron || !window.electronAPI) {
        console.error('不在Electron环境中，无法使用文件API');
        return;
    }
    
    try {
        const response = await window.electronAPI.readFile(filePath);
        if (response.success) {
            processImportedData(response.data);
        } else {
            console.error('读取文件失败:', response.error);
            window.utils.showAlert('读取文件失败: ' + response.error, 'danger');
        }
    } catch (error) {
        console.error('导入文件出错:', error);
        window.utils.showAlert('导入文件出错', 'danger');
    }
}

/**
 * 处理导入的数据
 * @param {string} data - JSON字符串数据
 */
function processImportedData(data) {
    try {
        const importedData = JSON.parse(data);
        
        // 简单验证导入的数据
        if (Array.isArray(importedData) && importedData.length > 0) {
            const validData = importedData.filter(item => 
                typeof item === 'object' && 
                typeof item.word === 'string' && 
                typeof item.translation === 'string'
            ).map(item => ({
                word: item.word,
                translation: item.translation,
                mastered: Boolean(item.mastered)
            }));
            
            if (validData.length > 0) {
                words = validData;
                saveWords();
                
                if (typeof renderWordWall === 'function') {
                    renderWordWall();
                }
                
                if (typeof renderWordList === 'function') {
                    renderWordList();
                }
                
                updateStatistics();
                window.utils.showAlert(`成功导入 ${validData.length} 个单词！`, 'success');
                
                // 通知主进程导入完成
                if (isElectron && window.electronAPI) {
                    window.electronAPI.importComplete({ success: true, count: validData.length });
                }
            } else {
                window.utils.showAlert('导入的数据格式不正确', 'danger');
                if (isElectron && window.electronAPI) {
                    window.electronAPI.importComplete({ success: false, error: '导入的数据格式不正确' });
                }
            }
        } else {
            window.utils.showAlert('导入的数据不是有效的单词列表', 'danger');
            if (isElectron && window.electronAPI) {
                window.electronAPI.importComplete({ success: false, error: '导入的数据不是有效的单词列表' });
            }
        }
    } catch (error) {
        console.error('处理导入数据时出错:', error);
        window.utils.showAlert('处理导入数据时出错，请检查文件格式', 'danger');
        if (isElectron && window.electronAPI) {
            window.electronAPI.importComplete({ success: false, error: error.message });
        }
    }
}

/**
 * 导出数据到指定文件
 * @param {string} filePath - 文件路径
 */
async function exportToFile(filePath) {
    if (!isElectron || !window.electronAPI) {
        console.error('不在Electron环境中，无法使用文件API');
        return;
    }
    
    try {
        const dataStr = JSON.stringify(words, null, 2);
        const response = await window.electronAPI.writeFile(filePath, dataStr);
        
        if (response.success) {
            window.utils.showAlert('数据导出成功！', 'success');
            // 通知主进程导出完成
            if (window.electronAPI) {
                window.electronAPI.exportComplete({ success: true });
            }
        } else {
            console.error('写入文件失败:', response.error);
            window.utils.showAlert('导出失败: ' + response.error, 'danger');
            if (window.electronAPI) {
                window.electronAPI.exportComplete({ success: false, error: response.error });
            }
        }
    } catch (error) {
        console.error('导出文件出错:', error);
        window.utils.showAlert('导出文件出错', 'danger');
        if (window.electronAPI) {
            window.electronAPI.exportComplete({ success: false, error: error.message });
        }
    }
}

/**
 * 更新统计信息
 */
function updateStatistics() {
    const totalWords = words.length;
    const masteredWords = words.filter(word => word.mastered).length;
    const remainingWords = totalWords - masteredWords;
    const progressPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
    
    // 更新统计页面
    const statMastered = document.getElementById('stat-mastered');
    const statRemaining = document.getElementById('stat-remaining');
    const progressBar = document.getElementById('progress-bar');
    
    if (statMastered) statMastered.textContent = masteredWords;
    if (statRemaining) statRemaining.textContent = remainingWords;
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.textContent = `${progressPercentage}%`;
    }
    
    // 更新单词列表的计数
    const wordCount = document.getElementById('word-count');
    if (wordCount) {
        wordCount.textContent = `${totalWords} 个单词`;
    }
}

/**
 * 导出数据（浏览器环境）
 */
function exportData() {
    if (isElectron && window.electronAPI) {
        // 在Electron环境中，使用主进程的导出功能
        window.electronAPI.showExportDialog();
        return;
    }
    
    // 浏览器环境下的导出功能
    const dataStr = JSON.stringify(words, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `词汇表_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.style.display = 'none';
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    window.utils.showAlert('数据导出成功！', 'success');
}

/**
 * 导入数据（浏览器环境）
 * @param {Event} event - 文件输入事件
 */
function importData(event) {
    if (isElectron && window.electronAPI) {
        // 在Electron环境中，使用主进程的导入功能
        window.electronAPI.showImportDialog();
        return;
    }
    
    // 浏览器环境下的导入功能
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            processImportedData(e.target.result);
        } catch (error) {
            console.error('导入数据时出错:', error);
            window.utils.showAlert('导入数据时出错，请检查文件格式', 'danger');
        }
    };
    reader.readAsText(file);
}

// 导出函数供其他脚本使用
window.app = {
    getWords: function() {
        return words;
    },
    setWords: function(newWords) {
        words = newWords;
    },
    saveWords,
    updateStatistics,
    showAlert: window.utils ? window.utils.showAlert : function(){},
    showConfirm: window.utils ? window.utils.showConfirm : function(){},
    exportData,
    importData
}; 