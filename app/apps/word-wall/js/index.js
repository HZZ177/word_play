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
    // 获取新的导航按钮
    const navActionButtons = document.querySelectorAll('.floating-nav-btn.nav-action-button');
    
    // 新导航按钮点击事件
    navActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            
            // 切换页面
            switchPage(target);
            
            // 更新按钮激活状态
            navActionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
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
                } else if (typeof renderWordWall === 'function') { // 支持全局或局部函数
                    renderWordWall();
                }
                
                if (typeof window.renderWordList === 'function') {
                    window.renderWordList();
                } else if (typeof renderWordList === 'function') { // 支持全局或局部函数
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
                mastered: Boolean(item.mastered) // 确保mastered是布尔值
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
 * 将当前单词数据导出到指定文件
 * @param {string} filePath - 文件路径
 */
async function exportToFile(filePath) {
    if (!isElectron || !window.electronAPI) {
        console.error('不在Electron环境中，无法使用文件API');
        return;
    }

    try {
        const dataToExport = JSON.stringify(words, null, 2); // 格式化JSON输出
        const response = await window.electronAPI.writeFile(filePath, dataToExport);
        
        if (response.success) {
            window.utils.showAlert('数据导出成功！', 'success');
            // 通知主进程导出完成
            if (window.electronAPI.exportComplete) { // 检查函数是否存在
                 window.electronAPI.exportComplete({ success: true, path: filePath });
            }
        } else {
            console.error('写入文件失败:', response.error);
            window.utils.showAlert('导出数据失败: ' + response.error, 'danger');
            if (window.electronAPI.exportComplete) { // 检查函数是否存在
                window.electronAPI.exportComplete({ success: false, error: response.error });
            }
        }
    } catch (error) {
        console.error('导出数据时出错:', error);
        window.utils.showAlert('导出数据时出错', 'danger');
        if (window.electronAPI.exportComplete) { // 检查函数是否存在
             window.electronAPI.exportComplete({ success: false, error: error.message });
        }
    }
}


/**
 * 更新统计信息
 */
function updateStatistics() {
    const masteredCount = words.filter(word => word.mastered).length;
    const totalCount = words.length;
    const remainingCount = totalCount - masteredCount;
    const progress = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;

    document.getElementById('stat-mastered').textContent = masteredCount;
    document.getElementById('stat-remaining').textContent = remainingCount;
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`; // 显示百分比文字
    }
    
    console.log(`统计信息已更新: ${masteredCount} 已掌握, ${remainingCount} 未掌握, ${totalCount} 总计`);
}


// --- 全局可访问的函数 ---
window.app = {
    getWords: () => words,
    saveWords,
    updateStatistics,
    showAlert: (message, type = 'info') => { // 默认类型为 info
        if (window.utils && typeof window.utils.showAlert === 'function') {
            window.utils.showAlert(message, type);
        } else {
            alert(message); // Fallback
        }
    },
    // 暴露 Electron 相关的导入导出功能，供按钮调用
    importData: (event) => { // 改为接收event参数
        if (isElectron && window.electronAPI && window.electronAPI.triggerImport) {
            window.electronAPI.triggerImport();
        } else if (event && event.target && event.target.files && event.target.files[0]) { // 处理浏览器环境的文件输入
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                processImportedData(e.target.result);
            };
            reader.onerror = (e) => {
                console.error("文件读取错误:", e);
                window.app.showAlert('读取文件时出错', 'danger');
            };
            reader.readAsText(file);
        } else {
            console.warn('导入功能在此环境不可用或未选择文件');
           // window.app.showAlert('导入功能不可用', 'warning');
        }
    },
    exportData: () => {
        if (isElectron && window.electronAPI && window.electronAPI.triggerExport) {
            window.electronAPI.triggerExport(JSON.stringify(words, null, 2));
        } else { // 浏览器环境下载
            const filename = 'words_export.json';
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", filename);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            window.app.showAlert('数据已导出为 ' + filename, 'success');
        }
    },
    loadWords: () => { // 将 loadWords 移至 window.app
        const storedWords = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedWords) {
            window.app.words = JSON.parse(storedWords);
            console.log("从 localStorage 加载单词数据:", window.app.words);
        } else {
            // 如果本地存储中没有数据，则加载默认的示例单词
            window.app.loadExampleWords();
        }
        // 确保在加载单词后渲染相关组件
        if (typeof renderWordList === 'function') renderWordList(); // 配置页面列表
        if (typeof renderWordWall === 'function') renderWordWall(); // 单词墙
        if (typeof window.app.updateStatistics === 'function') window.app.updateStatistics(); // 统计数据
    },
    loadExampleWords: () => { // 将 loadExampleWords 移至 window.app
        fetch('data/words.json') // <--- 修改后的路径
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                words = data;
                saveWords();
                if (typeof renderWordWall === 'function') {
                    renderWordWall();
                }
                if (typeof renderWordList === 'function') {
                    renderWordList();
                }
                console.log('加载了示例单词数据');
            })
            .catch(error => {
                console.error('加载示例单词失败:', error);
                window.app.showAlert('加载示例单词数据失败: ' + error.message, 'danger');
            });
    }
};

// 确保 renderWordWall 和 renderWordList 可在全局访问，如果它们是在其他文件中定义的
// 如果它们在此文件定义，则无需额外操作
if (typeof renderWordWall !== 'undefined') {
    window.renderWordWall = renderWordWall;
}
if (typeof renderWordList !== 'undefined') {
    window.renderWordList = renderWordList;
} 