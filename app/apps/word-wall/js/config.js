/**
 * 趣味单词学习墙 - 单词配置功能
 * 实现单词的添加、编辑和删除功能
 */

// 保存搜索关键词的变量
let searchKeyword = '';

// 页面加载完成后初始化单词配置功能
document.addEventListener('DOMContentLoaded', () => {
    // 初始化表单提交事件
    initWordForm();
    
    // 清空按钮事件
    document.getElementById('clear-btn')?.addEventListener('click', clearForm);
    
    // 初始化搜索功能
    initSearchFunction();
});

/**
 * 初始化搜索功能
 */
function initSearchFunction() {
    const searchInput = document.getElementById('word-search');
    const clearButton = document.getElementById('search-clear');
    
    if (!searchInput || !clearButton) return;
    
    // 添加搜索输入事件
    searchInput.addEventListener('input', (event) => {
        searchKeyword = event.target.value.trim().toLowerCase();
        renderWordList();
    });
    
    // 添加清除按钮事件
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchKeyword = '';
        renderWordList();
        searchInput.focus();
    });
    
    // 添加按键事件，按ESC键清除搜索
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            searchInput.value = '';
            searchKeyword = '';
            renderWordList();
        }
    });
}

/**
 * 初始化单词表单
 */
function initWordForm() {
    const form = document.getElementById('word-form');
    if (!form) return;
    
    // 监听表单提交事件
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // 获取表单数据
        const wordInput = document.getElementById('word-input');
        const translationInput = document.getElementById('translation-input');
        const editIndexInput = document.getElementById('edit-index');
        
        const word = wordInput.value.trim();
        const translation = translationInput.value.trim();
        const editIndex = parseInt(editIndexInput.value);
        
        // 验证输入
        if (!word || !translation) {
            window.app.showAlert('请填写单词和翻译', 'warning');
            return;
        }
        
        const words = window.app.getWords();
        
        // 检查单词是否已存在（新增时）
        if (editIndex === -1 && words.some(item => item.word.toLowerCase() === word.toLowerCase())) {
            window.app.showAlert(`单词 "${word}" 已存在`, 'warning');
            return;
        }
        
        // 编辑现有单词
        if (editIndex >= 0 && editIndex < words.length) {
            // 检查修改后的单词是否与其他单词重复
            const isDuplicate = words.some((item, index) => 
                index !== editIndex && item.word.toLowerCase() === word.toLowerCase()
            );
            
            if (isDuplicate) {
                window.app.showAlert(`单词 "${word}" 已存在`, 'warning');
                return;
            }
            
            // 更新单词
            const mastered = words[editIndex].mastered;
            words[editIndex] = { word, translation, mastered };
            window.app.showAlert(`已更新单词 "${word}"`, 'success');
        } 
        // 添加新单词
        else {
            words.push({
                word,
                translation,
                mastered: false
            });
            window.app.showAlert(`已添加单词 "${word}"`, 'success');
        }
        
        // 保存数据
        window.app.saveWords();
        
        // 更新界面
        renderWordList();
        window.renderWordWall();
        window.app.updateStatistics();
        
        // 重置表单
        clearForm();
    });
}

/**
 * 清空表单
 */
function clearForm() {
    const form = document.getElementById('word-form');
    if (!form) return;
    
    document.getElementById('word-input').value = '';
    document.getElementById('translation-input').value = '';
    document.getElementById('edit-index').value = '-1';
    
    // 更改提交按钮文本
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>保存';
    
    // 将焦点设置到单词输入框
    document.getElementById('word-input').focus();
}

/**
 * 编辑单词
 * @param {number} index - 要编辑的单词索引
 */
function editWord(index) {
    const words = window.app.getWords();
    if (index < 0 || index >= words.length) return;
    
    const wordObj = words[index];
    
    // 填充表单
    document.getElementById('word-input').value = wordObj.word;
    document.getElementById('translation-input').value = wordObj.translation;
    document.getElementById('edit-index').value = index;
    
    // 更改提交按钮文本
    const submitBtn = document.querySelector('#word-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-edit me-1"></i>更新';
    
    // 滚动到表单位置
    document.getElementById('word-form').scrollIntoView({ behavior: 'smooth' });
    
    // 将焦点设置到单词输入框
    document.getElementById('word-input').focus();
}

/**
 * 删除单词
 * @param {number} index - 要删除的单词索引
 */
function deleteWord(index) {
    const words = window.app.getWords();
    if (index < 0 || index >= words.length) return;
    
    const wordObj = words[index];
    
    // 显示确认对话框
    if (confirm(`确定要删除单词 "${wordObj.word}" 吗？`)) {
        // 删除单词
        words.splice(index, 1);
        
        // 保存数据
        window.app.saveWords();
        
        // 更新界面
        renderWordList();
        window.renderWordWall();
        window.app.updateStatistics();
        
        window.app.showAlert(`已删除单词 "${wordObj.word}"`, 'success');
        
        // 如果正在编辑该单词，重置表单
        const editIndex = parseInt(document.getElementById('edit-index').value);
        if (editIndex === index) {
            clearForm();
        }
    }
}

/**
 * 渲染单词列表
 */
function renderWordList() {
    const wordList = document.getElementById('word-list');
    if (!wordList) return;
    
    // 清空列表
    wordList.innerHTML = '';
    
    const words = window.app.getWords();
    
    // 更新单词计数
    document.getElementById('word-count').textContent = `${words.length} 个单词`;
    
    // 没有单词时显示提示
    if (words.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="3" class="text-center py-3">
                <div class="alert alert-info mb-0">
                    还没有添加单词，请使用上方表单添加单词。
                </div>
            </td>
        `;
        wordList.appendChild(emptyRow);
        return;
    }
    
    // 过滤单词
    let filteredWords = words;
    if (searchKeyword) {
        filteredWords = words.filter(word => 
            word.word.toLowerCase().includes(searchKeyword) || 
            word.translation.toLowerCase().includes(searchKeyword)
        );
    }
    
    // 没有匹配的单词时显示提示
    if (filteredWords.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="3" class="text-center py-3">
                <div class="alert alert-warning mb-0">
                    没有匹配的单词，请尝试其他搜索关键词。
                </div>
            </td>
        `;
        wordList.appendChild(emptyRow);
        return;
    }
    
    // 创建并添加单词行
    filteredWords.forEach((word, originalIndex) => { // 使用原始索引进行编辑/删除
        const indexInFilteredArray = words.indexOf(word); // 获取在原始数组中的真实索引

        const row = document.createElement('tr');
        // 根据掌握状态添加不同样式
        if (word.mastered) {
            row.classList.add('table-light', 'text-muted');
        }
        
        row.innerHTML = `
            <td>${word.word}</td>
            <td>${word.translation}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editWord(${indexInFilteredArray})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteWord(${indexInFilteredArray})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        wordList.appendChild(row);
    });
}

// 确保这些函数在全局可用，因为它们被内联 onclick 事件调用
window.editWord = editWord;
window.deleteWord = deleteWord;

// 如果 renderWordList 需要被其他JS文件（如 index.js）调用，也需要挂载到window
// window.renderWordList = renderWordList; 
// (已在 index.js 中处理了 window.app.getWords 等的调用，
// renderWordList 本身由 DOMContentLoaded 和其他事件在此文件内触发，或由 index.js 中的 loadWords 调用) 