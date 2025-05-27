/**
 * 趣味单词学习墙 - 单词配置功能
 * 实现单词的添加、编辑和删除功能
 */

// 页面加载完成后初始化单词配置功能
document.addEventListener('DOMContentLoaded', () => {
    // 初始化表单提交事件
    initWordForm();
    
    // 清空按钮事件
    document.getElementById('clear-btn')?.addEventListener('click', clearForm);
});

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
        
        // 检查单词是否已存在（新增时）
        if (editIndex === -1 && window.app.words.some(item => item.word.toLowerCase() === word.toLowerCase())) {
            window.app.showAlert(`单词 "${word}" 已存在`, 'warning');
            return;
        }
        
        // 编辑现有单词
        if (editIndex >= 0 && editIndex < window.app.words.length) {
            // 检查修改后的单词是否与其他单词重复
            const isDuplicate = window.app.words.some((item, index) => 
                index !== editIndex && item.word.toLowerCase() === word.toLowerCase()
            );
            
            if (isDuplicate) {
                window.app.showAlert(`单词 "${word}" 已存在`, 'warning');
                return;
            }
            
            // 更新单词
            const mastered = window.app.words[editIndex].mastered;
            window.app.words[editIndex] = { word, translation, mastered };
            window.app.showAlert(`已更新单词 "${word}"`, 'success');
        } 
        // 添加新单词
        else {
            window.app.words.push({
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
    if (index < 0 || index >= window.app.words.length) return;
    
    const wordObj = window.app.words[index];
    
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
    if (index < 0 || index >= window.app.words.length) return;
    
    const wordObj = window.app.words[index];
    
    // 显示确认对话框
    if (confirm(`确定要删除单词 "${wordObj.word}" 吗？`)) {
        // 删除单词
        window.app.words.splice(index, 1);
        
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
    
    // 更新单词计数
    document.getElementById('word-count').textContent = `${window.app.words.length} 个单词`;
    
    // 没有单词时显示提示
    if (window.app.words.length === 0) {
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
    
    // 添加单词行
    window.app.words.forEach((wordObj, index) => {
        const row = document.createElement('tr');
        row.className = wordObj.mastered ? 'table-light' : '';
        
        row.innerHTML = `
            <td>${wordObj.word}</td>
            <td>${wordObj.translation}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // 添加编辑按钮事件
        row.querySelector('.edit-btn').addEventListener('click', (event) => {
            const index = parseInt(event.currentTarget.dataset.index);
            editWord(index);
        });
        
        // 添加删除按钮事件
        row.querySelector('.delete-btn').addEventListener('click', (event) => {
            const index = parseInt(event.currentTarget.dataset.index);
            deleteWord(index);
        });
        
        wordList.appendChild(row);
    });
}

// 将renderWordList函数添加到window对象，供其他脚本调用
window.renderWordList = renderWordList; 