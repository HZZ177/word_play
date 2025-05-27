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
            colorRange = [1, 6, 7, 8, 2]; // 混合颜色
        } else {
            // 长单词，使用柔和颜色
            colorRange = [1, 2, 3, 4, 5]; // 白色到灰色
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
            // 如果是右键点击，不执行左键操作
            if (event.button === 2) return;
            
            const index = parseInt(event.currentTarget.dataset.index);
            const words = window.app.getWords();
            
            // 如果单词正在动画中，不执行操作
            if (event.currentTarget.classList.contains('mastering') || 
                event.currentTarget.classList.contains('unmastering')) {
                return;
            }
            
            // Ctrl+左键点击恢复为未掌握
            if (event.ctrlKey) {
                if (words[index].mastered) {
                    // 添加取消掌握动画类
                    event.currentTarget.classList.add('unmastering');
                    
                    // 动画结束后更新状态
                    event.currentTarget.addEventListener('animationend', function handler() {
                        // 移除动画类和掌握类
                        event.currentTarget.classList.remove('unmastering');
                        event.currentTarget.classList.remove('mastered');
                        
                        // 更新数据
                        words[index].mastered = false;
                        
                        // 保存状态并更新统计
                        window.app.saveWords();
                        window.app.updateStatistics();
                        
                        // 移除这个一次性的事件监听器
                        event.currentTarget.removeEventListener('animationend', handler);
                    }, { once: true });
                }
            } 
            // 普通左键点击标记为已掌握
            else {
                if (!words[index].mastered) {
                    // 添加掌握动画类
                    event.currentTarget.classList.add('mastering');
                    
                    // 动画结束后更新状态
                    event.currentTarget.addEventListener('animationend', function handler() {
                        // 移除动画类，添加掌握类
                        event.currentTarget.classList.remove('mastering');
                        event.currentTarget.classList.add('mastered');
                        
                        // 更新数据
                        words[index].mastered = true;
                        
                        // 保存状态并更新统计
                        window.app.saveWords();
                        window.app.updateStatistics();
                        
                        // 移除这个一次性的事件监听器
                        event.currentTarget.removeEventListener('animationend', handler);
                    }, { once: true });
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
                
                // 应用调整
                element.style.left = `${currentLeft + adjustX}px`;
                element.style.top = `${currentTop + adjustY}px`;
            }
        });
    }, 500); // 等待动画完成后检查
}

/**
 * 计算自适应的字体大小范围
 * 根据窗口大小和单词数量动态调整字体大小
 * @returns {Object} 包含最小/最大尺寸类别和权重因子的对象
 */
function calculateAdaptiveSizes() {
    const words = window.app.getWords();
    const wordCount = words.length;
    
    // 获取容器尺寸
    const container = document.getElementById('word-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const containerArea = containerWidth * containerHeight;
    
    // 根据单词数量动态调整松散因子
    // 单词越少，松散因子越小，单词越大；单词越多，松散因子越大，单词越小
    let spacingFactor;
    if (wordCount < 10) {
        spacingFactor = 1.1; // 很少单词，使用较大的字体
    } else if (wordCount < 20) {
        spacingFactor = 1.2;
    } else if (wordCount < 40) {
        spacingFactor = 1.3;
    } else if (wordCount < 60) {
        spacingFactor = 1.4;
    } else {
        spacingFactor = 1.5; // 很多单词，使用较小的字体
    }
    
    // 估算每个单词占用的平均面积
    const areaPerWord = containerArea / (wordCount * spacingFactor);
    
    // 根据面积计算理想的字体大小范围
    // 增大系数，使字体更大，更好地填充视窗
    const idealSize = Math.sqrt(areaPerWord) * 0.25;
    
    // 根据理想尺寸计算最小和最大尺寸类别
    let minSizeClass = 1;
    let maxSizeClass = 10;
    
    // 调整尺寸范围，确保不会太小或太大
    // 根据单词数量动态调整范围，但整体提高基础字号
    if (wordCount < 10) {
        // 单词很少时，使用较大的字体，范围更广
        minSizeClass = 6;
        maxSizeClass = 10;
    } else if (wordCount < 30) {
        // 单词适中时，使用中等字体
        minSizeClass = 4;
        maxSizeClass = 9;
    } else if (wordCount < 100) {
        // 单词较多时，使用较小字体，但不要太小
        minSizeClass = 3;
        maxSizeClass = 8;
    } else {
        // 单词非常多时，使用较小字体，但保持可读性
        minSizeClass = 2;
        maxSizeClass = 7;
    }
    
    // 根据窗口大小进一步调整
    // 在词云布局中，考虑容器的实际尺寸和比例
    const containerRatio = containerWidth / containerHeight;
    let screenSizeFactor;
    
    // 根据容器比例调整尺寸因子
    if (containerRatio > 1.5) {
        // 宽屏，增大尺寸因子
        screenSizeFactor = Math.sqrt(containerArea) / 900;
    } else if (containerRatio < 0.7) {
        // 竖屏，减小尺寸因子
        screenSizeFactor = Math.sqrt(containerArea) / 1100;
    } else {
        // 正常比例
        screenSizeFactor = Math.sqrt(containerArea) / 1000;
    }
    
    minSizeClass = Math.max(1, Math.round(minSizeClass * screenSizeFactor));
    maxSizeClass = Math.min(10, Math.round(maxSizeClass * screenSizeFactor));
    
    // 确保最大值不小于最小值
    if (maxSizeClass < minSizeClass) {
        maxSizeClass = minSizeClass + 1;
    }
    
    // 使字体大小范围更广，增强视觉效果
    // 根据单词数量调整范围
    const minRange = wordCount < 20 ? 2 : 3;
    const range = maxSizeClass - minSizeClass;
    if (range < minRange && maxSizeClass < 10) {
        maxSizeClass = Math.min(10, minSizeClass + minRange);
    }
    
    return {
        minSize: minSizeClass,
        maxSize: maxSizeClass,
        // 返回权重因子和松散因子，用于单词布局
        weightFactor: Math.min(1, Math.sqrt(areaPerWord) / 45),
        spacingFactor: spacingFactor
    };
}

/**
 * 获取指定范围内的随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 处理右键点击事件，显示单词翻译
 * @param {Event} event - 鼠标事件
 */
function handleRightClick(event) {
    event.preventDefault();
    
    const index = parseInt(event.currentTarget.dataset.index);
    const wordObj = window.app.getWords()[index];
    
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
    if (window.app.getWords().length === 0) {
        window.app.showAlert('没有单词可重置', 'warning');
        return;
    }
    
    // 显示自定义确认对话框
    window.app.showConfirm(
        '确定要重置所有单词的掌握状态吗？', 
        '重置掌握状态', 
        () => {
            // 确认后执行的操作
            // 获取当前活动页面
            const isWordWallActive = document.getElementById('word-wall').classList.contains('active');
            
            // 重置所有单词的掌握状态
            const words = window.app.getWords();
            words.forEach(word => {
                word.mastered = false;
            });
            
            // 保存并更新界面
            window.app.saveWords();
            
            // 如果是在单词墙页面，添加动画效果
            if (isWordWallActive) {
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
            } else {
                // 在配置页面，直接重新渲染
                renderWordWall();
            }
            
            // 更新统计
            window.app.updateStatistics();
        }
    );
}

/**
 * 清空所有单词
 */
function clearAllWords() {
    if (window.app.getWords().length === 0) {
        window.app.showAlert('没有单词可清空', 'warning');
        return;
    }
    
    // 显示自定义确认对话框
    window.app.showConfirm(
        '确定要清空所有单词吗？此操作不可恢复！',
        '清空所有单词',
        () => {
            // 清空单词数组
            window.app.setWords([]);
            
            // 保存并更新界面
            window.app.saveWords();
            renderWordWall();
            renderWordList();
            window.app.updateStatistics();
            
            window.app.showAlert('已清空所有单词', 'success');
        }
    );
}

/**
 * 分布单词，使其均匀分布在容器中，并尽量避免重叠
 * @param {Array} words - 单词数组
 * @param {number} containerWidth - 容器宽度
 * @param {number} containerHeight - 容器高度
 * @returns {Array} 单词位置数组，包含x、y坐标和旋转角度
 */
function distributeWords(words, containerWidth, containerHeight) {
    // 保存已放置单词的区域，用于碰撞检测
    const placedWords = [];
    // 存储每个单词的位置信息
    const positions = [];
    
    // 增加安全边距，确保单词不会超出屏幕
    // 对于长单词，需要更大的边距
    const maxWordLength = Math.max(...words.map(wordObj => wordObj.word.length));
    // 基础安全边距 + 根据最长单词动态调整的额外边距
    const safeMargin = Math.min(containerWidth, containerHeight) * 0.08 + (maxWordLength > 8 ? 20 : 0);
    const effectiveWidth = containerWidth - safeMargin * 2;
    const effectiveHeight = containerHeight - safeMargin * 2;
    
    // 增加尝试次数，提高布局质量
    const maxAttempts = 300;
    
    // 确定单词的尺寸和重要性
    // 计算单词的平均长度和最大长度
    let totalLength = 0;
    let maxLength = 0;
    words.forEach(wordObj => {
        const len = wordObj.word.length;
        totalLength += len;
        maxLength = Math.max(maxLength, len);
    });
    const avgLength = totalLength / words.length;
    
    // 首先计算所有单词的大小类别
    const sizeConfig = calculateAdaptiveSizes();
    const { minSize, maxSize, spacingFactor } = sizeConfig;
    const sizeRange = maxSize - minSize;
    
    // 按重要性排序单词（这里假设短单词更重要）
    // 让更重要的单词先放置，获得更好的位置
    const sortedWordIndices = words.map((wordObj, index) => {
        const lengthFactor = 1 - ((wordObj.word.length - avgLength) / maxLength) * 0.5;
        return { index, importance: lengthFactor };
    }).sort((a, b) => b.importance - a.importance);
    
    // 将容器划分为多个区域，确保单词分布更均匀
    // 根据单词数量动态调整区域数量
    const gridSize = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(words.length / 2))));
    const gridCellWidth = effectiveWidth / gridSize;
    const gridCellHeight = effectiveHeight / gridSize;
    
    // 创建网格区域，用于记录每个区域已放置的单词数量
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // 为每个单词计算位置，重要的单词先计算
    for (const { index, importance } of sortedWordIndices) {
        const wordObj = words[index];
        
        // 根据重要性，确定单词的大小类别(1-10)
        const sizeClass = Math.max(minSize, Math.min(maxSize, 
            Math.round(minSize + sizeRange * importance)));
        
        // 更精确地估算单词的宽度和高度
        // 使用字体大小和单词长度的比例关系，考虑不同字符的宽度
        const fontSize = (sizeClass * 0.25 + 0.75); // 字体大小（rem），调整以适应新的字号范围
        
        // 更精确地估算单词宽度，考虑不同字符的平均宽度
        let estimatedWidth = 0;
        for (let i = 0; i < wordObj.word.length; i++) {
            const char = wordObj.word[i];
            // 宽字符（如 m, w）占用更多空间，窄字符（如 i, l）占用更少空间
            if ('mwWM'.includes(char)) {
                estimatedWidth += fontSize * 16; // 宽字符
            } else if ('il1I|'.includes(char)) {
                estimatedWidth += fontSize * 6; // 窄字符
            } else {
                estimatedWidth += fontSize * 12; // 普通字符
            }
        }
        
        // 添加一些额外空间作为安全边界
        const wordWidth = estimatedWidth + fontSize * 8;
        const wordHeight = fontSize * 30; // 考虑字体高度和行高
        
        // 尝试找到一个不重叠的位置
        let x, y, rotation;
        let attempts = 0;
        let foundPosition = false;
        
        // 查找最空的网格区域
        let minGridCount = Infinity;
        let targetGridX = 0;
        let targetGridY = 0;
        
        // 对于不同的重要性，使用不同的策略
        const isImportant = importance > 0.7;
        
        // 重要单词优先放置在中心区域，其他单词更分散
        if (isImportant) {
            // 中心区域的网格坐标
            const centerGridX = Math.floor(gridSize / 2);
            const centerGridY = Math.floor(gridSize / 2);
            
            // 从中心开始查找最空的区域
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    // 计算与中心的距离
                    const distToCenter = Math.sqrt(
                        Math.pow(i - centerGridX, 2) + 
                        Math.pow(j - centerGridY, 2)
                    );
                    
                    // 优先选择靠近中心且单词少的区域
                    const weightedCount = grid[i][j] + distToCenter * 0.5;
                    
                    if (weightedCount < minGridCount) {
                        minGridCount = weightedCount;
                        targetGridX = i;
                        targetGridY = j;
                    }
                }
            }
        } else {
            // 非重要单词，查找最空的区域
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    if (grid[i][j] < minGridCount) {
                        minGridCount = grid[i][j];
                        targetGridX = i;
                        targetGridY = j;
                    }
                }
            }
        }
        
        // 在目标网格区域内尝试放置
        while (attempts < maxAttempts && !foundPosition) {
            // 在目标网格区域内随机生成位置
            const gridX = safeMargin + targetGridX * gridCellWidth + Math.random() * gridCellWidth;
            const gridY = safeMargin + targetGridY * gridCellHeight + Math.random() * gridCellHeight;
            
            // 添加一些随机偏移，使分布更自然
            // 随着尝试次数增加，允许在更大范围内搜索
            const searchRadius = Math.min(Math.max(attempts / 50, 1), gridSize - 1) * gridCellWidth * 0.5;
            
            // 计算旋转角度 - 重要单词旋转角度更小，方便阅读
            const maxRotation = isImportant ? 5 : 15;
            rotation = (Math.random() * 2 - 1) * maxRotation;
            
            // 计算旋转对尺寸的影响
            // 当单词旋转时，其占用的空间会增加
            const rotationRadians = Math.abs(rotation) * Math.PI / 180;
            const rotatedWidth = Math.abs(wordWidth * Math.cos(rotationRadians)) + Math.abs(wordHeight * Math.sin(rotationRadians));
            const rotatedHeight = Math.abs(wordWidth * Math.sin(rotationRadians)) + Math.abs(wordHeight * Math.cos(rotationRadians));
            
            // 确保单词在考虑旋转后仍然在容器内
            // 计算考虑旋转和变换后的有效边界
            const effectiveBoundaryX = containerWidth - safeMargin - rotatedWidth / 2;
            const effectiveBoundaryY = containerHeight - safeMargin - rotatedHeight / 2;
            
            // 限制x和y的范围，确保单词完全在容器内
            x = Math.max(safeMargin + rotatedWidth / 2, Math.min(effectiveBoundaryX, 
                gridX + (Math.random() * 2 - 1) * searchRadius));
            y = Math.max(safeMargin + rotatedHeight / 2, Math.min(effectiveBoundaryY, 
                gridY + (Math.random() * 2 - 1) * searchRadius));
            
            // 检查是否与已放置的单词重叠
            let overlaps = false;
            
            // 增加碰撞系数，确保单词之间有足够间距
            // 并根据单词数量动态调整
            const collisionFactor = words.length < 20 ? 0.9 : 0.8;
            
            for (const placedWord of placedWords) {
                // 计算两个单词中心点之间的距离
                const dx = Math.abs(x - placedWord.x);
                const dy = Math.abs(y - placedWord.y);
                
                // 估算碰撞边界，考虑两个单词的旋转情况
                // 对于旋转较大的单词，增加碰撞检测的安全区域
                const rotationFactor = 1 + Math.abs(rotation) / 45 * 0.2;
                
                // 计算考虑旋转后的碰撞检测距离
                const minDistanceX = (rotatedWidth + placedWord.rotatedWidth) / 2 * collisionFactor * rotationFactor;
                const minDistanceY = (rotatedHeight + placedWord.rotatedHeight) / 2 * collisionFactor;
                
                // 基于矩形碰撞检测
                if (dx < minDistanceX && dy < minDistanceY) {
                    overlaps = true;
                    break;
                }
            }
            
            // 如果找到不重叠的位置，或者尝试次数已达上限
            if (!overlaps || attempts >= maxAttempts - 1) {
                foundPosition = true;
                
                // 如果尝试次数达到上限但仍然重叠，接受最后一次尝试的位置
                // 但调整位置，尽量减少重叠并确保在容器内
                if (overlaps && attempts >= maxAttempts - 1) {
                    // 尝试稍微调整位置
                    for (let i = 0; i < 10; i++) {
                        const adjustX = x + (Math.random() * 2 - 1) * wordWidth * 0.3;
                        const adjustY = y + (Math.random() * 2 - 1) * wordHeight * 0.3;
                        
                        // 确保调整后的位置仍在有效边界内
                        if (adjustX >= safeMargin + rotatedWidth / 2 && 
                            adjustX <= effectiveBoundaryX &&
                            adjustY >= safeMargin + rotatedHeight / 2 && 
                            adjustY <= effectiveBoundaryY) {
                            x = adjustX;
                            y = adjustY;
                            break;
                        }
                    }
                }
                
                // 记录已放置的单词
                placedWords.push({
                    x, y, 
                    width: wordWidth,
                    height: wordHeight,
                    rotatedWidth: rotatedWidth,
                    rotatedHeight: rotatedHeight,
                    rotation
                });
                
                // 更新网格区域的单词数量
                grid[targetGridX][targetGridY]++;
            }
            
            attempts++;
            
            // 如果当前网格区域尝试多次仍未成功，尝试其他网格区域
            if (attempts % 30 === 0 && !foundPosition) {
                // 查找下一个最空的网格区域
                minGridCount = Infinity;
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const distance = Math.abs(i - targetGridX) + Math.abs(j - targetGridY);
                        // 避免选择同一个区域或距离过远的区域
                        if (distance > 0 && distance <= 2 && grid[i][j] < minGridCount) {
                            minGridCount = grid[i][j];
                            targetGridX = i;
                            targetGridY = j;
                        }
                    }
                }
            }
        }
        
        // 保存位置信息
        positions[index] = {
            x,
            y,
            rotation,
            sizeClass
        };
    }
    
    return positions;
}

// 将renderWordWall函数添加到window对象，供其他脚本调用
window.renderWordWall = renderWordWall; 