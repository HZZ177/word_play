/**
 * 学习工具箱 - 通用工具函数
 * 提供跨应用共享的功能
 */

/**
 * 检查是否在Electron环境中运行
 * @returns {boolean} 是否在Electron环境中
 */
function isElectronEnvironment() {
    return window.appInfo && window.appInfo.isElectron;
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
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {string} title - 对话框标题
 * @param {Function} onConfirm - 确认回调函数
 * @param {Function} onCancel - 取消回调函数
 */
function showConfirm(message, title = '确认操作', onConfirm, onCancel) {
    // 获取确认对话框元素
    let confirmModal = document.getElementById('confirmModal');
    
    // 如果对话框不存在，创建一个
    if (!confirmModal) {
        const modalHTML = `
            <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="confirmModalLabel">确认操作</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                        </div>
                        <div class="modal-body" id="confirmModalBody">
                            确定要执行此操作吗？
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="confirmModalConfirmBtn">确定</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        confirmModal = document.getElementById('confirmModal');
    }
    
    // 设置标题和消息
    document.getElementById('confirmModalLabel').textContent = title;
    document.getElementById('confirmModalBody').textContent = message;
    
    // 获取Bootstrap的Modal对象
    const modal = new bootstrap.Modal(confirmModal);
    
    // 设置确认按钮点击事件
    const confirmBtn = document.getElementById('confirmModalConfirmBtn');
    
    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的事件监听器
    newConfirmBtn.addEventListener('click', () => {
        modal.hide();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // 设置取消事件
    confirmModal.addEventListener('hidden.bs.modal', function handler() {
        if (typeof onCancel === 'function' && !confirmModal.confirmClicked) {
            onCancel();
        }
        confirmModal.removeEventListener('hidden.bs.modal', handler);
        confirmModal.confirmClicked = false;
    });
    
    // 显示对话框
    modal.show();
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 导出工具函数
window.utils = {
    isElectronEnvironment,
    showAlert,
    showConfirm,
    formatDateTime,
    generateUniqueId
}; 