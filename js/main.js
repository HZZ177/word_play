/**
 * 趣味单词学习墙 - 主要脚本
 * 包含页面初始化、数据管理和全局事件处理
 */

// 全局变量
let words = []; // 存储所有单词数据

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航栏
    initNavigation();
    
    // 加载单词数据
    loadWords();
    
    // 初始化统计信息
    updateStatistics();
});

/**
 * 初始化导航栏事件
 */
function initNavigation() {
    // 使用Bootstrap内置的Tab功能，监听tab切换事件
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            // 当切换到统计选项卡时更新统计信息
            if (event.target.id === 'statistics-tab') {
                updateStatistics();
            }
        });
    });
}

/**
 * 从localStorage加载单词数据
 * 如果没有数据则加载示例数据
 */
function loadWords() {
    try {
        // 尝试从localStorage加载数据
        const savedWords = localStorage.getItem('wordPlayWords');
        if (savedWords) {
            words = JSON.parse(savedWords);
            
            // 更新界面
            renderWordWall();
            renderWordList();
            updateStatistics();
        } else {
            // 如果没有保存的数据，尝试从words.json加载
            loadWordsFromJson();
        }
    } catch (error) {
        console.error('加载单词数据时出错:', error);
        showAlert('加载单词数据时出错', 'danger');
        
        // 出错时加载示例数据
        words = getExampleWords();
        renderWordWall();
        renderWordList();
        updateStatistics();
    }
}

/**
 * 从words.json文件加载示例单词数据
 */
function loadWordsFromJson() {
    fetch('data/words.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                words = data;
                saveWords();
                renderWordWall();
                renderWordList();
                updateStatistics();
                showAlert('已加载示例单词数据', 'success');
            } else {
                throw new Error('无效的单词数据格式');
            }
        })
        .catch(error => {
            console.error('加载JSON文件时出错:', error);
            words = getExampleWords();
            saveWords();
            renderWordWall();
            renderWordList();
            updateStatistics();
        });
}

/**
 * 保存单词数据到localStorage
 */
function saveWords() {
    try {
        localStorage.setItem('wordPlayWords', JSON.stringify(words));
    } catch (error) {
        console.error('保存单词数据时出错:', error);
        showAlert('保存单词数据时出错', 'danger');
    }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '90%';
    alertDiv.style.width = '400px';
    
    // 设置消息内容
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="关闭"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertDiv);
    
    // 3秒后自动关闭
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

/**
 * 更新统计信息
 */
function updateStatistics() {
    // 计算已掌握和未掌握的单词数量
    const masteredCount = words.filter(word => word.mastered).length;
    const totalCount = words.length;
    const remainingCount = totalCount - masteredCount;
    
    // 更新单词墙页面的计数
    document.getElementById('mastered-count').textContent = masteredCount;
    document.getElementById('total-count').textContent = totalCount;
    
    // 更新统计页面的数字
    document.getElementById('stat-mastered').textContent = masteredCount;
    document.getElementById('stat-remaining').textContent = remainingCount;
    
    // 更新进度条
    const progressPercent = totalCount > 0 ? (masteredCount / totalCount * 100) : 0;
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${progressPercent}%`;
    progressBar.textContent = `${Math.round(progressPercent)}%`;
    
    // 设置进度条颜色
    if (progressPercent < 30) {
        progressBar.className = 'progress-bar bg-danger';
    } else if (progressPercent < 70) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-success';
    }
}

/**
 * 生成示例单词数据
 * @returns {Array} 示例单词数组
 */
function getExampleWords() {
    return [
        { word: "apple", translation: "苹果，常见的水果", mastered: false },
        { word: "banana", translation: "香蕉，黄色的水果", mastered: false },
        { word: "computer", translation: "电脑，计算设备", mastered: false },
        { word: "school", translation: "学校，教育机构", mastered: false },
        { word: "teacher", translation: "教师，从事教育工作的人", mastered: false },
        { word: "student", translation: "学生，在校学习的人", mastered: false },
        { word: "book", translation: "书本，阅读材料", mastered: false },
        { word: "pencil", translation: "铅笔，书写工具", mastered: false },
        { word: "window", translation: "窗户，建筑物上用于采光和通风的开口", mastered: false },
        { word: "door", translation: "门，进出口", mastered: false },
        { word: "friend", translation: "朋友，友谊的对象", mastered: false },
        { word: "family", translation: "家庭，家人", mastered: false }
    ];
}

/**
 * 导出数据为JSON文件
 */
function exportData() {
    const dataStr = JSON.stringify(words, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `word_play_data_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showAlert('数据导出成功！', 'success');
}

/**
 * 导入JSON数据
 * @param {Event} event - 文件输入事件
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
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
                    renderWordWall();
                    renderWordList();
                    updateStatistics();
                    showAlert(`成功导入 ${validData.length} 个单词！`, 'success');
                } else {
                    showAlert('导入的数据格式不正确', 'danger');
                }
            } else {
                showAlert('导入的数据不是有效的单词列表', 'danger');
            }
        } catch (error) {
            console.error('导入数据时出错:', error);
            showAlert('导入数据时出错，请检查文件格式', 'danger');
        }
    };
    reader.readAsText(file);
}

// 导出函数供其他脚本使用
window.app = {
    words,
    saveWords,
    updateStatistics,
    showAlert,
    exportData,
    importData
}; 