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
    
    // 添加重置掌握状态的事件监听（配置页面按钮）
    document.getElementById('reset-mastered-btn')?.addEventListener('click', resetMasteredStatus);
    
    // 添加清空所有单词的事件监听
    document.getElementById('clear-all-btn')?.addEventListener('click', clearAllWords);
    
    // 添加重置掌握进度按钮的事件监听（单词墙页面按钮）
    document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
        resetMasteredStatus();
    });
    
    // 添加重排按钮的事件监听
    document.getElementById('rearrange-btn')?.addEventListener('click', () => {
        // 添加动画类
        const wordContainer = document.getElementById('word-container');
        if (wordContainer) {
            // 添加重排动画类
            wordContainer.classList.add('rearranging');
            
            // 延迟一会再渲染，等待淡出动画完成
            setTimeout(() => {
                // 重新渲染词云
                renderWordWall();
                
                // 延迟移除动画类，等待新单词的淡入动画开始
                setTimeout(() => {
                    wordContainer.classList.remove('rearranging');
                }, 100);
            }, 300); // 等待淡出动画完成
        }
    });
    
    // 添加窗口大小变化的事件监听
    let resizeTimer;
    window.addEventListener('resize', function() {
        // 使用防抖动技术，避免频繁渲染
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // 检查当前活动页面是否是单词墙
            const wordWallPage = document.getElementById('word-wall');
            if (wordWallPage && wordWallPage.classList.contains('active')) {
                renderWordWall();
            }
        }, 300); // 300毫秒的延迟
    });
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
    if (window.app.getWords().length === 0) {
        wordContainer.innerHTML = `
            <div class="alert alert-info w-100 text-center">
                还没有添加单词，请点击左上角菜单按钮，前往"单词配置"页面添加单词。
            </div>
        `;
        return;
    }
    
    // 获取容器尺寸
    const containerWidth = wordContainer.clientWidth;
    const containerHeight = wordContainer.clientHeight;
    
    // 获取所有单词
    const words = window.app.getWords();
    
    // 使用distributeWords函数计算单词位置
    const positions = distributeWords(words, containerWidth, containerHeight);
    
    // 创建一个临时文档片段，提高性能
    const fragment = document.createDocumentFragment();
    
    // 创建并添加单词元素
    words.forEach((wordObj, index) => {
        const wordElement = document.createElement('div');
        
        // 获取位置信息
        const position = positions[index];
        const sizeClass = position.sizeClass;
        
        // 根据单词长度和重要性随机选择颜色类
        // 短单词（重要单词）使用更明亮的颜色
        let colorRange;
        if (wordObj.word.length <= 3) {
            // 短单词，更重要，使用明亮颜色
            colorRange = [6, 7, 8, 9, 1]; // 包含亮色和白色
        } else if (wordObj.word.length <= 6) {
            // 中等长度，使用中等亮度
            colorRange = [1, 6, 7, 8, 9]; // 全部使用亮色
        } else {
            // 长单词，使用柔和颜色
            colorRange = [1, 3, 4, 5, 2]; // 使用较亮的柔和颜色
        }
        
        // 从颜色范围中随机选择
        const colorIndex = colorRange[Math.floor(Math.random() * colorRange.length)];
        const colorClass = `word-color-${colorIndex}`;
        
        // 设置基本样式类
        wordElement.className = `word-card word-size-${sizeClass} ${colorClass} ${wordObj.mastered ? 'mastered' : ''}`;
        wordElement.textContent = wordObj.word;
        wordElement.dataset.index = index;
        
        // 应用位置和旋转
        // 确保单词位置不超出容器边界
        wordElement.style.left = `${position.x}px`;
        wordElement.style.top = `${position.y}px`;
        wordElement.style.transform = `translate(-50%, -50%) rotate(${position.rotation}deg)`;
        
        // 添加一个随机的动画延迟，使单词出现更自然
        wordElement.style.animationDelay = `${index * 0.02}s`;
        
        // 添加点击事件（左键标记为已掌握，Ctrl+左键恢复为未掌握）
        wordElement.addEventListener('click', (event) => {
            if (event.button === 2) return;

            const index = parseInt(event.currentTarget.dataset.index);
            const words = window.app.getWords();
            const currentTarget = event.currentTarget;

            if (!words[index]) {
                console.error('Word data not found for index:', index);
                return;
            }

            // 如果正在动画中，则忽略本次点击
            if (currentTarget.classList.contains('is-animating')) {
                console.log('单词正在动画中，忽略点击');
                return;
            }

            console.log('点击单词:', words[index].word, 'Ctrl键按下:', event.ctrlKey, '原始掌握状态:', words[index].mastered);

            // 定义动画结束处理函数
            const handleAnimationEnd = () => {
                currentTarget.classList.remove('is-animating');
                
                if (currentTarget.classList.contains('mastering')) {
                    currentTarget.classList.remove('mastering');
                    currentTarget.classList.add('mastered');
                } else if (currentTarget.classList.contains('unmastering')) {
                    currentTarget.classList.remove('unmastering');
                }
                
                // 移除动画结束事件监听器
                currentTarget.removeEventListener('animationend', handleAnimationEnd);
            };

            // Ctrl+左键点击: 切换到未掌握
            if (event.ctrlKey) {
                if (words[index].mastered) {
                    console.log('Ctrl+左键: 切换到未掌握');
                    words[index].mastered = false;
                    window.app.saveWords();
                    window.app.updateStatistics();

                    // 添加动画类
                    currentTarget.classList.add('is-animating', 'unmastering');
                    currentTarget.addEventListener('animationend', handleAnimationEnd);
                    
                    // 移除已掌握类，让动画从已掌握状态开始
                    currentTarget.classList.remove('mastered');
                } else {
                    console.log('Ctrl+左键: 已经是未掌握状态，无操作');
                }
            } 
            // 普通左键点击: 切换到已掌握
            else {
                if (!words[index].mastered) {
                    console.log('左键: 切换到已掌握');
                    words[index].mastered = true;
                    window.app.saveWords();
                    window.app.updateStatistics();

                    // 添加动画类
                    currentTarget.classList.add('is-animating', 'mastering');
                    currentTarget.addEventListener('animationend', handleAnimationEnd);
                    
                    // 添加星星粒子效果
                    createStarParticles(currentTarget);
                } else {
                    console.log('左键: 已经是已掌握状态，无操作');
                }
            }
        });
        
        // 添加右键菜单事件
        wordElement.addEventListener('contextmenu', handleRightClick);
        
        // 添加到片段
        fragment.appendChild(wordElement);
    });
    
    // 一次性将所有元素添加到容器
    wordContainer.appendChild(fragment);
    
    // 检查并修正可能超出边界的单词
    setTimeout(() => {
        const wordElements = document.querySelectorAll('.word-card');
        const containerRect = wordContainer.getBoundingClientRect();
        
        wordElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // 检查是否有部分超出容器
            if (rect.left < containerRect.left || 
                rect.right > containerRect.right || 
                rect.top < containerRect.top || 
                rect.bottom > containerRect.bottom) {
                
                // 获取当前位置和变换
                const currentLeft = parseFloat(element.style.left);
                const currentTop = parseFloat(element.style.top);
                
                // 计算需要调整的距离
                let adjustX = 0;
                let adjustY = 0;
                
                if (rect.left < containerRect.left) {
                    adjustX = containerRect.left - rect.left + 5; // 额外5px边距
                } else if (rect.right > containerRect.right) {
                    adjustX = containerRect.right - rect.right - 5;
                }
                
                if (rect.top < containerRect.top) {
                    adjustY = containerRect.top - rect.top + 5;
                } else if (rect.bottom > containerRect.bottom) {
                    adjustY = containerRect.bottom - rect.bottom - 5;
                }
                
                // 调整位置
                element.style.left = `${currentLeft + adjustX}px`;
                element.style.top = `${currentTop + adjustY}px`;
                
                console.warn('修正了一个超出边界的单词位置:', element.textContent);
            }
        });
    }, 500); // 延迟执行，确保所有动画和初始渲染完成
}

/**
 * 创建星星粒子效果
 * @param {HTMLElement} element - 触发星星效果的元素
 */
function createStarParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 创建5-8个星星
    const starCount = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        
        // 随机位置在元素周围
        const startX = Math.random() * 20 - 10;
        const startY = Math.random() * 20 - 10;
        
        // 随机终点位置（向外扩散）
        const endX = (Math.random() * 100 - 50);
        const endY = (Math.random() * 100 - 50);
        
        // 设置初始位置
        star.style.left = `${centerX + startX}px`;
        star.style.top = `${centerY + startY}px`;
        
        // 设置自定义属性用于动画
        star.style.setProperty('--star-x', `${endX}px`);
        star.style.setProperty('--star-y', `${endY}px`);
        
        // 添加到body
        document.body.appendChild(star);
        
        // 动画结束后移除
        star.addEventListener('animationend', () => {
            document.body.removeChild(star);
        });
    }
}

/**
 * 计算单词的自适应大小
 * @param {number} containerWidth - 容器宽度
 * @param {number} containerHeight - 容器高度
 * @returns {object} - 包含各种大小类的字体大小的对象
 */
function calculateAdaptiveSizes(containerWidth, containerHeight) {
    // 基础字体大小，可以根据需要调整
    const baseSize = Math.min(containerWidth, containerHeight) / 30;

    return {
        size1: Math.max(12, baseSize * 0.8), // 最小12px
        size2: Math.max(14, baseSize * 1),   // 最小14px
        size3: Math.max(16, baseSize * 1.25),
        size4: Math.max(18, baseSize * 1.5),
        size5: Math.max(22, baseSize * 1.8),
        size6: Math.max(26, baseSize * 2.2),
        size7: Math.max(30, baseSize * 2.6),
        size8: Math.max(36, baseSize * 3.0),
        size9: Math.max(42, baseSize * 3.5)
    };
}

/**
 * 生成介于min和max之间的随机整数（包含min和max）
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * 处理单词卡片的右键点击事件
 * @param {MouseEvent} event - 右键点击事件对象
 */
function handleRightClick(event) {
    event.preventDefault(); // 阻止默认的浏览器右键菜单

    const index = parseInt(event.currentTarget.dataset.index);
    const words = window.app.getWords();
    const wordObj = words[index];

    if (wordObj) {
        const tooltip = document.getElementById('word-tooltip');
        const tooltipContent = tooltip.querySelector('.word-tooltip-content');

        if (!tooltip || !tooltipContent) {
            console.error('Tooltip element or content not found!');
            return;
        }

        tooltipContent.textContent = wordObj.translation;

        // 根据鼠标位置定位提示框
        // 考虑视口边界，避免提示框超出屏幕
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // 获取 tooltip 尺寸前，先让它以某种方式可见（但不透明），以便浏览器计算其尺寸
        // 否则 offsetWidth/offsetHeight 可能为0
        tooltip.classList.add('visible'); // 临时添加以便获取尺寸，但它会因 opacity 0 保持不可见
        tooltip.style.opacity = '0'; // 确保计算尺寸时不可见
        
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        tooltip.style.opacity = ''; // 移除临时 opacity
        // 如果之前没有 .visible 类，则移除，让后续的 add 生效并触发过渡
        // 但由于我们就是要添加它，所以这一步可以省略，或者确保它在计算尺寸后确实被移除了，再重新添加以触发动画
        // tooltip.classList.remove('visible');

        let x = event.clientX + 10; // 默认在鼠标右侧
        let y = event.clientY + 10; // 默认在鼠标下方

        // 调整X位置，如果超出右边界
        if (x + tooltipWidth > viewportWidth) {
            x = event.clientX - tooltipWidth - 10; // 移到鼠标左侧
        }
        // 调整Y位置，如果超出下边界
        if (y + tooltipHeight > viewportHeight) {
            y = event.clientY - tooltipHeight - 10; // 移到鼠标上方
        }
        
        // 确保不超出左边界或上边界
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        // tooltip.style.display = 'block'; // 由 .visible 类处理
        tooltip.classList.add('visible'); // 确保 .visible 类被添加以触发CSS中的显示和动画

        // 添加点击外部隐藏提示框的事件监听
        document.addEventListener('click', hideTooltip, { once: true });
        // 添加Esc键隐藏提示框的事件监听
        document.addEventListener('keydown', hideTooltipOnEsc, { once: true });

    } else {
        console.error('未找到单词对象，索引：', index);
    }
}

/**
 * 隐藏单词提示框
 */
function hideTooltip() {
    const tooltip = document.getElementById('word-tooltip');
    if (tooltip) {
        // tooltip.style.display = 'none'; // 由 .visible 类控制
        tooltip.classList.remove('visible');
        // 移除ESC键监听，因为click外部也会触发隐藏
        document.removeEventListener('keydown', hideTooltipOnEsc);
    }
}

/**
 * 按ESC键隐藏提示框
 * @param {KeyboardEvent} event - 键盘事件对象
 */
function hideTooltipOnEsc(event) {
    if (event.key === 'Escape') {
        hideTooltip();
    }
}

/**
 * 初始化自定义右键菜单功能（此处指单词提示框）
 */
function initContextMenu() {
    // 创建单词提示框元素（如果不存在）
    if (!document.getElementById('word-tooltip')) {
        const tooltipElement = document.createElement('div');
        tooltipElement.id = 'word-tooltip';
        tooltipElement.className = 'word-tooltip'; // 应用CSS中定义的样式
        
        const contentElement = document.createElement('div');
        contentElement.className = 'word-tooltip-content';
        tooltipElement.appendChild(contentElement);
        
        document.body.appendChild(tooltipElement);
    }
}

/**
 * 显示自定义确认弹窗
 * @param {string} message - 弹窗消息内容
 * @param {string} title - 弹窗标题
 * @param {Function} onConfirm - 确认按钮回调函数
 * @param {string} type - 弹窗类型（'warning' 或 'danger'）
 */
function showCustomConfirm(message, title, onConfirm, type = 'warning') {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('customModalTitle');
    const modalContent = document.getElementById('customModalContent');
    const confirmBtn = document.getElementById('customModalConfirmBtn');
    const cancelBtn = document.getElementById('customModalCancelBtn');
    const modalDialog = modal.querySelector('.custom-modal');

    // 设置标题和内容
    modalTitle.textContent = title;
    modalContent.textContent = message;

    // 根据类型设置样式
    modalDialog.className = 'custom-modal ' + type;
    if (type === 'danger') {
        confirmBtn.className = 'custom-modal-btn custom-modal-btn-danger';
    } else {
        confirmBtn.className = 'custom-modal-btn custom-modal-btn-confirm';
    }

    // 显示弹窗
    modal.classList.add('show');

    // 绑定按钮事件
    const handleConfirm = () => {
        modal.classList.remove('show');
        onConfirm();
        cleanup();
    };

    const handleCancel = () => {
        modal.classList.remove('show');
        cleanup();
    };

    const handleOverlayClick = (event) => {
        if (event.target === modal) {
            handleCancel();
        }
    };

    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            handleCancel();
        }
    };

    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleOverlayClick);
        document.removeEventListener('keydown', handleEscape);
    };

    // 添加事件监听
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleEscape);
}

/**
 * 重置所有单词的掌握状态为未掌握
 */
function resetMasteredStatus() {
    const words = window.app.getWords();
    if (words.length === 0) {
        window.app.showAlert('没有单词可重置', 'info');
        return;
    }

    // 显示确认对话框
    showCustomConfirm(
        '确定要将所有单词恢复为未掌握状态吗？',
        '重置掌握状态',
        () => {
            let changed = false;
            words.forEach(word => {
                if (word.mastered) {
                    word.mastered = false;
                    changed = true;
                }
            });

            if (changed) {
                window.app.saveWords();
                renderWordWall(); // 重新渲染单词墙以反映变化
                window.app.updateStatistics(); // 更新统计数据
            }
        },
        'warning'
    );
}

/**
 * 清空所有单词
 */
function clearAllWords() {
    const words = window.app.getWords();

    if (words.length === 0) {
        window.app.showAlert('单词列表已经为空', 'info');
        return;
    }

    // 显示确认对话框
    showCustomConfirm(
        '确定要清空所有单词吗？此操作不可恢复。',
        '清空所有单词',
        () => {
            words.length = 0; // 清空数组
            window.app.saveWords();
            renderWordWall();
            renderWordList(); // 同时清空配置页面的列表
            window.app.updateStatistics();
            window.app.showAlert('所有单词已清空', 'success');
        },
        'danger'
    );
}


/**
 * 分配单词位置，避免重叠，并适应容器大小
 * @param {Array<Object>} wordsArray - 单词对象数组
 * @param {number} containerWidth - 容器宽度
 * @param {number} containerHeight - 容器高度
 * @returns {Array<Object>} - 包含每个单词位置、大小和旋转角度的对象数组
 */
function distributeWords(wordsArray, containerWidth, containerHeight) {
    const positions = [];
    const occupiedAreas = []; // 存储已放置单词的矩形区域
    const maxAttempts = 150; // 每个单词尝试放置的最大次数
    const padding = 10; // 单词之间的最小间距

    // 获取自适应大小
    const adaptiveSizes = calculateAdaptiveSizes(containerWidth, containerHeight);
    const sizeKeys = Object.keys(adaptiveSizes).sort((a, b) => adaptiveSizes[b] - adaptiveSizes[a]); // 按字体大小降序

    // 情感分析（简化版：根据长度和是否掌握分配权重）
    const weightedWords = wordsArray.map(word => {
        let weight = 5; // 基础权重
        if (word.word.length < 5) weight += 3; // 短单词权重更高
        if (word.word.length > 10) weight -= 2; // 长单词权重稍低
        if (!word.mastered) weight += 2; // 未掌握的单词更重要
        return { ...word, weight };
    }).sort((a, b) => b.weight - a.weight); // 按权重降序排序，重要的先放

    // 创建一个临时的div用于测量文本宽度和高度
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'nowrap'; //确保准确测量单行文本宽度
    document.body.appendChild(tempElement);

    weightedWords.forEach((wordObj, i) => {
        let placed = false;
        let attempts = 0;

        // 根据权重选择字体大小 (更重要的单词尝试更大的字体)
        // 将权重映射到字体大小等级 (0-8 对应 sizeKeys)
        // 权重范围可能从 1 (长单词已掌握) 到 10 (短单词未掌握)
        // 简化映射：前20%用最大号，接下来20%用次大号，以此类推，至少用最小号
        const numSizeClasses = sizeKeys.length;
        let sizeIndex = Math.floor((i / weightedWords.length) * numSizeClasses);
        sizeIndex = Math.min(sizeIndex, numSizeClasses - 1); // 确保不越界
        
        const sizeClassKey = sizeKeys[sizeIndex];
        const fontSize = adaptiveSizes[sizeClassKey];
        tempElement.style.fontSize = `${fontSize}px`;
        tempElement.className = `word-card word-size-${sizeClassKey.replace('size', '')}`;
        tempElement.textContent = wordObj.word;

        const textMetrics = tempElement.getBoundingClientRect();
        const elementWidth = textMetrics.width + padding * 1.5; // 增加一些内边距的考虑
        const elementHeight = textMetrics.height + padding;

        const rotation = getRandomInt(-25, 25); // 随机旋转角度
        // 考虑旋转后的包围盒近似值 (简化)
        const rad = Math.abs(rotation) * (Math.PI / 180);
        const rotatedWidth = elementWidth * Math.cos(rad) + elementHeight * Math.sin(rad);
        const rotatedHeight = elementWidth * Math.sin(rad) + elementHeight * Math.cos(rad);

        while (!placed && attempts < maxAttempts) {
            attempts++;
            // 尝试在容器内的随机位置放置单词
            // 确保中心点在容器内，同时考虑元素尺寸，使其不轻易超出边界
            const x = getRandomInt(rotatedWidth / 2 + 5, containerWidth - rotatedWidth / 2 - 5);
            const y = getRandomInt(rotatedHeight / 2 + 5, containerHeight - rotatedHeight / 2 - 5);

            // 定义当前单词的矩形区域 (以中心点和宽高定义)
            const currentRect = {
                left: x - rotatedWidth / 2,
                top: y - rotatedHeight / 2,
                right: x + rotatedWidth / 2,
                bottom: y + rotatedHeight / 2
            };

            // 检查是否与已放置的单词重叠
            let overlaps = false;
            for (const occupied of occupiedAreas) {
                // 简单的AABB碰撞检测
                if (currentRect.left < occupied.right &&
                    currentRect.right > occupied.left &&
                    currentRect.top < occupied.bottom &&
                    currentRect.bottom > occupied.top) {
                    overlaps = true;
                    break;
                }
            }

            // 如果不重叠，则放置单词
            if (!overlaps) {
                // 确保即使旋转后，主体部分仍在容器内 (再次检查，更精确)
                // 这一步比较复杂，因为旋转后的精确边界计算和检查成本较高
                // 暂时依赖于初始随机位置的边界限制
                
                positions.push({
                    originalIndex: wordsArray.findIndex(w => w.word === wordObj.word && w.translation === wordObj.translation),
                    x,
                    y,
                    sizeClass: sizeClassKey.replace('size', ''), // e.g., '1', '2'
                    rotation
                });
                occupiedAreas.push(currentRect);
                placed = true;
            }
        }

        if (!placed) {
            // 如果多次尝试后仍无法放置，则使用一个默认的较小尺寸和随机位置
            // (或者可以考虑将其放在一个"未放置列表"中后续处理)
            console.warn(`无法为单词 "${wordObj.word}" 找到合适位置，将使用随机位置。`);
            positions.push({
                originalIndex: wordsArray.findIndex(w => w.word === wordObj.word && w.translation === wordObj.translation),
                x: getRandomInt(elementWidth / 2, containerWidth - elementWidth / 2),
                y: getRandomInt(elementHeight / 2, containerHeight - elementHeight / 2),
                sizeClass: '1', // 最小号字体
                rotation: 0
            });
        }
    });

    document.body.removeChild(tempElement); // 清理临时元素
    
    // 将结果按原始顺序排序，如果需要的话
    return positions.sort((a, b) => a.originalIndex - b.originalIndex);
}


// 确保 renderWordWall 可在全局访问，如果它是在此文件定义的
// 如果它在其他文件 (如 index.js) 中被调用，则需要暴露
// window.renderWordWall = renderWordWall; 
// (已在 index.js 中处理了 window.app.getWords 等的调用，
// renderWordWall 本身由 DOMContentLoaded 和其他事件在此文件内触发，或由 index.js 中的 loadWords 调用) 