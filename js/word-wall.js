/**
 * 趣味单词学习墙 - 单词墙功能
 * 实现单词展示和交互功能
 */

// 页面加载完成后初始化单词墙
document.addEventListener('DOMContentLoaded', () => {
    // 初始化右键菜单
    initContextMenu();
    
    // 添加导入文件的事件监听
    document.getElementById('import-btn')?.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.addEventListener('change', window.app.importData);
        fileInput.click();
    });
    
    // 添加导出文件的事件监听
    document.getElementById('export-btn')?.addEventListener('click', window.app.exportData);
    
    // 添加重置掌握状态的事件监听
    document.getElementById('reset-mastered-btn')?.addEventListener('click', resetMasteredStatus);
    
    // 添加清空所有单词的事件监听
    document.getElementById('clear-all-btn')?.addEventListener('click', clearAllWords);
});

/**
 * 渲染单词墙
 */
function renderWordWall() {
    const wordContainer = document.getElementById('word-container');
    if (!wordContainer) return;
    
    // 清空容器
    wordContainer.innerHTML = '';
    
    // 没有单词时显示提示
    if (window.app.words.length === 0) {
        wordContainer.innerHTML = `
            <div class="alert alert-info w-100 text-center">
                还没有添加单词，请前往"单词配置"页面添加单词。
            </div>
        `;
        return;
    }
    
    // 创建并添加单词卡片
    window.app.words.forEach((wordObj, index) => {
        const wordCard = document.createElement('div');
        wordCard.className = `word-card fade-in ${wordObj.mastered ? 'mastered' : ''}`;
        wordCard.textContent = wordObj.word;
        wordCard.dataset.index = index;
        
        // 添加点击事件（左键标记为已掌握，Ctrl+左键恢复为未掌握）
        wordCard.addEventListener('click', (event) => {
            // 如果是右键点击，不执行左键操作
            if (event.button === 2) return;
            
            const index = parseInt(event.currentTarget.dataset.index);
            
            // Ctrl+左键点击恢复为未掌握
            if (event.ctrlKey) {
                if (window.app.words[index].mastered) {
                    window.app.words[index].mastered = false;
                    event.currentTarget.classList.remove('mastered');
                    window.app.showAlert(`已将 "${window.app.words[index].word}" 标记为未掌握`, 'info');
                }
            } 
            // 普通左键点击标记为已掌握
            else {
                if (!window.app.words[index].mastered) {
                    window.app.words[index].mastered = true;
                    event.currentTarget.classList.add('mastered');
                    window.app.showAlert(`已将 "${window.app.words[index].word}" 标记为已掌握`, 'success');
                }
            }
            
            // 保存状态并更新统计
            window.app.saveWords();
            window.app.updateStatistics();
        });
        
        // 添加右键菜单事件
        wordCard.addEventListener('contextmenu', handleRightClick);
        
        // 添加到容器
        wordContainer.appendChild(wordCard);
    });
}

/**
 * 处理右键点击事件，显示单词翻译
 * @param {Event} event - 鼠标事件
 */
function handleRightClick(event) {
    event.preventDefault();
    
    const index = parseInt(event.currentTarget.dataset.index);
    const wordObj = window.app.words[index];
    
    if (!wordObj) return;
    
    // 获取提示框元素
    const tooltip = document.getElementById('word-tooltip');
    const tooltipContent = tooltip.querySelector('.word-tooltip-content');
    
    // 设置提示内容
    tooltipContent.innerHTML = `
        <div class="mb-1"><strong>${wordObj.word}</strong></div>
        <div>${wordObj.translation}</div>
    `;
    
    // 计算提示框位置
    const rect = event.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width/2}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    
    // 显示提示框
    tooltip.classList.add('visible');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        tooltip.classList.remove('visible');
    }, 3000);
}

/**
 * 初始化右键菜单
 */
function initContextMenu() {
    // 阻止整个文档的默认右键菜单
    document.addEventListener('contextmenu', (event) => {
        // 如果点击的是单词卡片，已经有专门的处理函数
        if (event.target.closest('.word-card')) return;
        
        // 其他区域阻止默认右键菜单
        event.preventDefault();
    });
    
    // 点击页面任意位置关闭提示框
    document.addEventListener('click', () => {
        document.getElementById('word-tooltip').classList.remove('visible');
    });
}

/**
 * 重置所有单词的掌握状态
 */
function resetMasteredStatus() {
    if (window.app.words.length === 0) {
        window.app.showAlert('没有单词可重置', 'warning');
        return;
    }
    
    // 显示确认对话框
    if (confirm('确定要重置所有单词的掌握状态吗？')) {
        // 重置所有单词的掌握状态
        window.app.words.forEach(word => {
            word.mastered = false;
        });
        
        // 保存并更新界面
        window.app.saveWords();
        renderWordWall();
        window.app.updateStatistics();
        
        window.app.showAlert('已重置所有单词的掌握状态', 'success');
    }
}

/**
 * 清空所有单词
 */
function clearAllWords() {
    if (window.app.words.length === 0) {
        window.app.showAlert('没有单词可清空', 'warning');
        return;
    }
    
    // 显示确认对话框
    if (confirm('确定要清空所有单词吗？此操作不可恢复！')) {
        // 清空单词数组
        window.app.words = [];
        
        // 保存并更新界面
        window.app.saveWords();
        renderWordWall();
        renderWordList();
        window.app.updateStatistics();
        
        window.app.showAlert('已清空所有单词', 'success');
    }
}

// 将renderWordWall函数添加到window对象，供其他脚本调用
window.renderWordWall = renderWordWall; 