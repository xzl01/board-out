/**
 * SVG 标注工具核心功能
 */
class SVGAnnotator {
    constructor() {
        this.svgContent = null;
        this.originalFileName = null;
        this.annotations = [];
        this.currentMode = 'add';
        this.selectedAnnotation = null;
        this.isDragging = false;
        this.dragStart = null;
        this.currentRect = null;
        
        // 缩放相关
        this.currentScale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;
        this.scaleStep = 0.2;
        
        // 标号相关
        this.nextNumber = 1;
        this.autoIncrement = true;
        
        this.initializeEventListeners();
        this.updateModeHint();
    }
    
    initializeEventListeners() {
        // 文件输入
        document.getElementById('file-input').addEventListener('change', this.handleFileSelect.bind(this));
        
        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 如果正在编辑，先完成编辑
                this.finishEditing();
                
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                
                // 清理编辑高亮
                document.querySelectorAll('.edit-highlight').forEach(el => el.remove());
                
                // 更新提示信息
                this.updateModeHint();
                
                this.updateCursor();
            });
        });
        
        // SVG 画布事件
        const svg = document.getElementById('svg-canvas');
        svg.addEventListener('click', this.handleSVGClick.bind(this));
        svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        svg.addEventListener('wheel', this.handleWheel.bind(this));
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 保存原始文件名（去除扩展名）
        this.originalFileName = file.name.replace(/\.[^/.]+$/, '');
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.loadSVG(event.target.result);
        };
        reader.readAsText(file);
    }
    
    loadSVG(svgText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = doc.documentElement;
        
        if (svg.tagName !== 'svg') {
            alert('无效的 SVG 文件');
            return;
        }
        
        // 保存原始 SVG 内容
        this.svgContent = svgText;
        
        // 清空并重新加载 SVG
        const canvas = document.getElementById('svg-canvas');
        canvas.innerHTML = svg.innerHTML;
        canvas.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 800 600');
        canvas.setAttribute('width', svg.getAttribute('width') || '800');
        canvas.setAttribute('height', svg.getAttribute('height') || '600');
        
        // 重置标注
        this.annotations = [];
        this.selectedAnnotation = null;
        this.updateAnnotationsList();
        
        // 重置标号
        this.nextNumber = 1;
        document.getElementById('start-number').value = 1;
    }
    
    handleSVGClick(e) {
        if (this.isDragging) return;
        
        const svg = document.getElementById('svg-canvas');
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        // 检查是否点击了现有标注
        const clickedAnnotation = this.getAnnotationAtPoint(svgP.x, svgP.y);
        if (clickedAnnotation) {
            if (this.currentMode === 'add') {
                this.selectAnnotation(clickedAnnotation);
            } else if (this.currentMode === 'view') {
                // 在预览模式下，显示标注信息
                this.showAnnotationInfo(clickedAnnotation);
            }
            return;
        }
        
        // 只在添加模式下创建新标注
        if (this.currentMode === 'add') {
            this.createAnnotation(svgP.x, svgP.y);
        }
    }
    
    handleMouseDown(e) {
        if (this.currentMode !== 'edit') return;
        
        // 检查是否有选中的标注
        if (!this.selectedAnnotation) {
            alert('请先从右侧列表中选择一个标注，然后编辑其点击区域');
            return;
        }
        
        const svg = document.getElementById('svg-canvas');
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        this.isDragging = true;
        this.dragStart = svgP;
        
        // 创建临时矩形
        this.currentRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.currentRect.setAttribute('x', svgP.x);
        this.currentRect.setAttribute('y', svgP.y);
        this.currentRect.setAttribute('width', 0);
        this.currentRect.setAttribute('height', 0);
        this.currentRect.setAttribute('fill', 'rgba(102, 126, 234, 0.3)');
        this.currentRect.setAttribute('stroke', '#667eea');
        this.currentRect.setAttribute('stroke-width', '2');
        this.currentRect.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(this.currentRect);
    }
    
    handleMouseMove(e) {
        const svg = document.getElementById('svg-canvas');
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        // 更新坐标显示
        document.getElementById('coordinates').textContent = `X: ${Math.round(svgP.x)}, Y: ${Math.round(svgP.y)}`;
        
        if (!this.isDragging || !this.currentRect) return;
        
        // 更新矩形大小
        const width = svgP.x - this.dragStart.x;
        const height = svgP.y - this.dragStart.y;
        
        this.currentRect.setAttribute('x', width < 0 ? svgP.x : this.dragStart.x);
        this.currentRect.setAttribute('y', height < 0 ? svgP.y : this.dragStart.y);
        this.currentRect.setAttribute('width', Math.abs(width));
        this.currentRect.setAttribute('height', Math.abs(height));
    }
    
    handleMouseUp(e) {
        if (!this.isDragging || !this.currentRect) return;
        
        this.isDragging = false;
        
        // 获取矩形区域
        const x = parseFloat(this.currentRect.getAttribute('x'));
        const y = parseFloat(this.currentRect.getAttribute('y'));
        const width = parseFloat(this.currentRect.getAttribute('width'));
        const height = parseFloat(this.currentRect.getAttribute('height'));
        
        // 移除临时矩形
        this.currentRect.remove();
        this.currentRect = null;
        
        // 如果矩形太小，忽略
        if (width < 10 || height < 10) return;
        
        // 如果有选中的标注，更新其区域
        if (this.selectedAnnotation) {
            this.selectedAnnotation.clickArea = { x, y, width, height };
            this.updateClickArea(this.selectedAnnotation);
        }
    }
    
    handleWheel(e) {
        // 阻止默认滚动行为
        e.preventDefault();
        
        // 根据滚轮方向决定缩放
        if (e.deltaY < 0) {
            // 向上滚动，放大
            this.zoomIn();
        } else {
            // 向下滚动，缩小
            this.zoomOut();
        }
    }
    
    finishEditing() {
        // 如果正在拖拽，先完成当前的编辑
        if (this.isDragging && this.currentRect && this.selectedAnnotation) {
            // 获取当前矩形区域
            const x = parseFloat(this.currentRect.getAttribute('x'));
            const y = parseFloat(this.currentRect.getAttribute('y'));
            const width = parseFloat(this.currentRect.getAttribute('width'));
            const height = parseFloat(this.currentRect.getAttribute('height'));
            
            // 移除临时矩形
            this.currentRect.remove();
            this.currentRect = null;
            this.isDragging = false;
            
            // 如果矩形足够大，保存它
            if (width >= 10 && height >= 10) {
                this.selectedAnnotation.clickArea = { x, y, width, height };
                this.updateClickArea(this.selectedAnnotation);
            }
        }
    }
    
    createAnnotation(x, y) {
        // 获取下一个标号
        let newNumber;
        if (this.autoIncrement) {
            // 自动递增模式：使用 nextNumber，然后递增
            newNumber = this.nextNumber;
            this.nextNumber++;
            // 更新 UI 中的显示
            document.getElementById('start-number').value = this.nextNumber;
        } else {
            // 手动模式：使用当前输入的值，不递增
            newNumber = parseInt(document.getElementById('start-number').value) || 1;
        }
        
        const annotation = {
            id: Date.now(),
            number: newNumber,
            x: x,
            y: y,
            name: `标注 ${newNumber}`,
            description: '',
            clickArea: null
        };
        
        this.annotations.push(annotation);
        this.renderAnnotation(annotation);
        this.updateAnnotationsList();
        this.selectAnnotation(annotation);
    }
    
    renderAnnotation(annotation) {
        const svg = document.getElementById('svg-canvas');
        
        // 创建标注组
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `annotation-${annotation.id}`);
        group.setAttribute('class', 'annotation-group');
        
        // 创建点击区域（如果有）
        if (annotation.clickArea) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', annotation.clickArea.x);
            rect.setAttribute('y', annotation.clickArea.y);
            rect.setAttribute('width', annotation.clickArea.width);
            rect.setAttribute('height', annotation.clickArea.height);
            rect.setAttribute('fill', 'rgba(102, 126, 234, 0.1)');
            rect.setAttribute('stroke', '#667eea');
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('class', 'click-area');
            group.appendChild(rect);
        }
        
        // 创建数字圆圈
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', annotation.x);
        circle.setAttribute('cy', annotation.y);
        circle.setAttribute('r', '15');
        circle.setAttribute('fill', '#ff4444');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'annotation-circle');
        group.appendChild(circle);
        
        // 创建数字文本
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', annotation.x);
        text.setAttribute('y', annotation.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('pointer-events', 'none');
        text.textContent = annotation.number;
        group.appendChild(text);
        
        svg.appendChild(group);
    }
    
    updateClickArea(annotation) {
        const group = document.getElementById(`annotation-${annotation.id}`);
        if (!group) return;
        
        // 移除旧的点击区域
        const oldRect = group.querySelector('.click-area');
        if (oldRect) oldRect.remove();
        
        // 添加新的点击区域
        if (annotation.clickArea) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', annotation.clickArea.x);
            rect.setAttribute('y', annotation.clickArea.y);
            rect.setAttribute('width', annotation.clickArea.width);
            rect.setAttribute('height', annotation.clickArea.height);
            rect.setAttribute('fill', 'rgba(102, 126, 234, 0.1)');
            rect.setAttribute('stroke', '#667eea');
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('class', 'click-area');
            group.insertBefore(rect, group.firstChild);
        }
    }
    
    getAnnotationAtPoint(x, y) {
        for (let annotation of this.annotations) {
            // 首先检查是否点击了标注点（20像素内）
            const dx = x - annotation.x;
            const dy = y - annotation.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                return annotation;
            }
            
            // 然后检查是否点击了点击区域
            if (annotation.clickArea) {
                const area = annotation.clickArea;
                if (x >= area.x && x <= area.x + area.width &&
                    y >= area.y && y <= area.y + area.height) {
                    return annotation;
                }
            }
        }
        return null;
    }
    
    selectAnnotation(annotation) {
        // 如果正在编辑另一个标注，先完成编辑
        this.finishEditing();
        
        this.selectedAnnotation = annotation;
        
        // 更新列表中的活动状态
        document.querySelectorAll('.annotation-item').forEach(item => {
            item.classList.remove('active');
        });
        const listItem = document.getElementById(`annotation-item-${annotation.id}`);
        if (listItem) {
            listItem.classList.add('active');
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // 清除之前的高亮
        document.querySelectorAll('.edit-highlight').forEach(h => h.remove());
        
        // 如果有点击区域，添加高亮
        if (annotation.clickArea) {
            const svg = document.getElementById('svg-canvas');
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            highlight.setAttribute('x', annotation.clickArea.x);
            highlight.setAttribute('y', annotation.clickArea.y);
            highlight.setAttribute('width', annotation.clickArea.width);
            highlight.setAttribute('height', annotation.clickArea.height);
            highlight.setAttribute('fill', 'rgba(255, 193, 7, 0.3)');
            highlight.setAttribute('stroke', '#ffc107');
            highlight.setAttribute('stroke-width', '2');
            highlight.setAttribute('stroke-dasharray', '10,5');
            highlight.setAttribute('class', 'edit-highlight');
            svg.appendChild(highlight);
        }
    }
    
    selectAnnotationById(id) {
        const annotation = this.annotations.find(a => a.id === id);
        if (annotation) {
            this.selectAnnotation(annotation);
        }
    }
    
    updateAnnotationsList() {
        const list = document.getElementById('annotations-list');
        
        if (this.annotations.length === 0) {
            list.innerHTML = `
                <div class="welcome-message">
                    <p>暂无标注</p>
                    <p style="font-size: 14px; margin-top: 10px;">点击左侧 SVG 开始添加标注</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.annotations.map(annotation => `
            <div class="annotation-item" id="annotation-item-${annotation.id}" onclick="svgAnnotator.selectAnnotationById(${annotation.id})">
                <div class="annotation-header">
                    <span class="annotation-number">#${annotation.number}</span>
                    <div class="annotation-actions">
                        <button class="icon-btn" onclick="event.stopPropagation(); svgAnnotator.editAnnotation(${annotation.id})" title="编辑">
                            ✏️
                        </button>
                        <button class="icon-btn" onclick="event.stopPropagation(); svgAnnotator.deleteAnnotation(${annotation.id})" title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="input-group">
                    <input type="text" value="${annotation.name}" 
                           onchange="svgAnnotator.updateAnnotationName(${annotation.id}, this.value)"
                           placeholder="标注名称">
                </div>
                <div class="input-group">
                    <textarea onchange="svgAnnotator.updateAnnotationDescription(${annotation.id}, this.value)"
                              placeholder="描述信息">${annotation.description}</textarea>
                </div>
                <div style="font-size: 12px; color: #666;">
位置：(${Math.round(annotation.x)}, ${Math.round(annotation.y)})
                        ${annotation.clickArea ? 
                            `<br>点击区域：${Math.round(annotation.clickArea.width)}×${Math.round(annotation.clickArea.height)}` : 
                            '<br>点击区域：未定义'}
                </div>
            </div>
        `).join('');
    }
    
    showAnnotationInfo(annotation) {
        // 在预览模式下显示标注信息的弹窗
        const info = document.createElement('div');
        info.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 400px;
        `;
        
        info.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #40A778;">标注 #${annotation.number}</h3>
            <p style="margin: 5px 0;"><strong>名称: </strong> ${annotation.name || '未命名'}</p>
            <p style="margin: 5px 0;"><strong>描述: </strong> ${annotation.description || '无描述'}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
                <strong>位置: </strong> (${Math.round(annotation.x)}, ${Math.round(annotation.y)})
                ${annotation.clickArea ? 
                    `<br><strong>点击区域:</strong> ${Math.round(annotation.clickArea.width)}×${Math.round(annotation.clickArea.height)}` : 
                    '<br><strong>点击区域:</strong> 未定义'}
            </p>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                ${annotation.clickArea ? 
                    `<button onclick="svgAnnotator.deleteClickArea(${annotation.id}); this.parentElement.parentElement.remove();" 
                            style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        删除点击区域
                    </button>` : 
                    ''}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="padding: 8px 16px; background: #40A778; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    关闭
                </button>
            </div>
        `;
        
        document.body.appendChild(info);
    }
    
    deleteClickArea(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) return;
        
        // 删除点击区域数据
        annotation.clickArea = null;
        
        // 更新SVG显示
        this.updateClickArea(annotation);
        
        // 更新列表显示
        this.updateAnnotationsList();
        
        // 显示提示
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        hint.textContent = `标注 #${annotation.number} 的点击区域已删除`;
        document.body.appendChild(hint);
        
        // 3秒后自动移除提示
        setTimeout(() => {
            hint.remove();
        }, 3000);
    }
    
    updateAnnotationName(id, name) {
        const annotation = this.annotations.find(a => a.id === id);
        if (annotation) {
            annotation.name = name;
        }
    }
    
    updateAnnotationDescription(id, description) {
        const annotation = this.annotations.find(a => a.id === id);
        if (annotation) {
            annotation.description = description;
        }
    }
    
    editAnnotation(id) {
        this.selectAnnotation(this.annotations.find(a => a.id === id));
        // 切换到编辑模式
        document.querySelector('[data-mode="edit"]').click();
    }
    
    deleteAnnotation(id) {
        const index = this.annotations.findIndex(a => a.id === id);
        if (index !== -1) {
            this.annotations.splice(index, 1);
            
            // 从 SVG 中移除
            const group = document.getElementById(`annotation-${id}`);
            if (group) group.remove();
            
            this.updateAnnotationsList();
        }
    }
    
    clearAll() {
        if (!confirm('确定要清除所有标注吗？')) return;
        
        this.annotations = [];
        this.selectedAnnotation = null;
        
        // 清除 SVG 中的所有标注
        document.querySelectorAll('.annotation-group').forEach(g => g.remove());
        
        // 重置标号
        this.nextNumber = 1;
        document.getElementById('start-number').value = 1;
        
        this.updateAnnotationsList();
    }
    
    updateCursor() {
        const svg = document.getElementById('svg-canvas');
        switch (this.currentMode) {
            case 'add':
                svg.style.cursor = 'crosshair';
                break;
            case 'edit':
                svg.style.cursor = this.selectedAnnotation ? 'crosshair' : 'default';
                break;
            case 'view':
                svg.style.cursor = 'pointer';
                break;
        }
    }
    
    zoomIn() {
        if (this.currentScale < this.maxScale) {
            this.currentScale = Math.min(this.currentScale + this.scaleStep, this.maxScale);
            this.applyZoom();
        }
    }
    
    zoomOut() {
        if (this.currentScale > this.minScale) {
            this.currentScale = Math.max(this.currentScale - this.scaleStep, this.minScale);
            this.applyZoom();
        }
    }
    
    resetZoom() {
        this.currentScale = 1;
        this.applyZoom();
    }
    
    applyZoom() {
        const svg = document.getElementById('svg-canvas');
        svg.style.transform = `scale(${this.currentScale})`;
        
        // 更新缩放级别显示
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentScale * 100)}%`;
        }
    }
    
    updateModeHint() {
        const hint = document.getElementById('mode-hint') || this.createModeHint();
        
        switch (this.currentMode) {
            case 'add':
                hint.textContent = '点击 SVG 任意位置添加新标注';
                break;
            case 'edit':
                if (this.selectedAnnotation) {
                    hint.textContent = `正在编辑标注 #${this.selectedAnnotation.number} - 拖拽鼠标设置点击区域`;
                } else {
                    hint.textContent = '请先从右侧列表选择要编辑的标注';
                }
                break;
            case 'view':
                hint.textContent = '预览模式 - 点击标注查看信息';
                break;
        }
    }
    
    createModeHint() {
        const hint = document.createElement('div');
        hint.id = 'mode-hint';
        hint.style.cssText = 'position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 1000;';
        document.querySelector('.svg-container').appendChild(hint);
        return hint;
    }
    
    exportSVG() {
        if (!this.svgContent) {
            alert('请先加载 SVG 文件');
            return;
        }
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.svgContent, 'image/svg+xml');
        const svg = doc.documentElement;
        
        // 创建标注层
        if (document.getElementById('include-numbers').checked) {
            const numbersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            numbersGroup.setAttribute('id', 'number-labels');
            numbersGroup.setAttribute('font-family', 'Arial, sans-serif');
            numbersGroup.setAttribute('font-size', '14');
            numbersGroup.setAttribute('font-weight', 'bold');
            
            this.annotations.forEach(annotation => {
                // 圆圈
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', annotation.x);
                circle.setAttribute('cy', annotation.y);
                circle.setAttribute('r', '15');
                circle.setAttribute('fill', '#ff4444');
                circle.setAttribute('stroke', 'white');
                circle.setAttribute('stroke-width', '2');
                numbersGroup.appendChild(circle);
                
                // 数字
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', annotation.x);
                text.setAttribute('y', annotation.y + 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', 'white');
                text.textContent = annotation.number;
                numbersGroup.appendChild(text);
            });
            
            svg.appendChild(numbersGroup);
        }
        
        // 创建点击层
        if (document.getElementById('include-click-layer').checked) {
            const clickGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            clickGroup.setAttribute('id', 'click-layer');
            clickGroup.setAttribute('opacity', '0');
            clickGroup.setAttribute('style', 'cursor: pointer;');
            
            this.annotations.forEach(annotation => {
                if (annotation.clickArea) {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', annotation.clickArea.x);
                    rect.setAttribute('y', annotation.clickArea.y);
                    rect.setAttribute('width', annotation.clickArea.width);
                    rect.setAttribute('height', annotation.clickArea.height);
                    rect.setAttribute('fill', 'white');
                    rect.setAttribute('data-id', annotation.number);
                    rect.setAttribute('title', annotation.name);
                    clickGroup.appendChild(rect);
                }
            });
            
            svg.appendChild(clickGroup);
        }
        
        // 导出 SVG
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.originalFileName ? `${this.originalFileName}-v.svg` : 'annotated-v.svg';
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    exportJSON() {
        const data = {
            annotations: this.annotations.map(a => ({
                id: a.id,
                number: a.number,
                name: a.name,
                description: a.description,
                position: { x: a.x, y: a.y },
                clickArea: a.clickArea
            }))
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.originalFileName ? `${this.originalFileName}-annotations.json` : 'annotations.json';
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    exportSBCJSON() {
        if (this.annotations.length === 0) {
            alert('没有标注可以导出');
            return;
        }
        
        // 按编号排序标注
        const sortedAnnotations = [...this.annotations].sort((a, b) => a.number - b.number);
        
        // 创建SBC接口格式的JSON
        const interfaces = {};
        sortedAnnotations.forEach(annotation => {
            interfaces[annotation.number] = {
                name: annotation.name || `接口 ${annotation.number}`,
                description: annotation.description || `接口 ${annotation.number} 的描述`,
                details: (annotation.description || `接口 ${annotation.number} 的详细信息`) + 
                         (annotation.clickArea ? 
                            `\n\n点击区域配置：\n- 位置: (${Math.round(annotation.clickArea.x)}, ${Math.round(annotation.clickArea.y)})\n- 大小: ${Math.round(annotation.clickArea.width)}×${Math.round(annotation.clickArea.height)}` : 
                            '\n\n点击区域：未定义')
            };
            
            // 添加其他可能的属性
            if (annotation.voltage) {
                interfaces[annotation.number].voltage = annotation.voltage;
            }
            if (annotation.type) {
                interfaces[annotation.number].type = annotation.type;
            }
            if (annotation.compatibility) {
                interfaces[annotation.number].compatibility = annotation.compatibility;
            }
        });
        
        const sbcData = {
            interfaces: interfaces
        };
        
        const json = JSON.stringify(sbcData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.originalFileName ? `${this.originalFileName}-sbc-interfaces.json` : 'sbc-interfaces.json';
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('SBC接口JSON已导出！\n\n格式说明：\n- JSON文件可直接用于sbc-interface-viewer\n- 序号已按顺序排列\n- 包含名称、描述和详细信息');
    }
    
    exportInvisibleSVG() {
        if (!this.svgContent) {
            alert('请先加载 SVG 文件');
            return;
        }
        
        if (this.annotations.length === 0) {
            alert('请先添加标注');
            return;
        }
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.svgContent, 'image/svg+xml');
        const svg = doc.documentElement;
        
        // 创建透明的点击层
        const clickGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        clickGroup.setAttribute('id', 'click-layer');
        clickGroup.setAttribute('opacity', '0');
        clickGroup.setAttribute('style', 'cursor: pointer;');
        
        // 为每个标注添加透明点击区域
        this.annotations.forEach(annotation => {
            if (annotation.clickArea) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', annotation.clickArea.x);
                rect.setAttribute('y', annotation.clickArea.y);
                rect.setAttribute('width', annotation.clickArea.width);
                rect.setAttribute('height', annotation.clickArea.height);
                rect.setAttribute('fill', 'white');
                rect.setAttribute('data-id', annotation.number);
                rect.setAttribute('title', annotation.name);
                clickGroup.appendChild(rect);
            } else {
                // 如果没有定义点击区域，使用标注位置创建一个小的点击区域
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', annotation.x - 15);
                rect.setAttribute('y', annotation.y - 15);
                rect.setAttribute('width', '30');
                rect.setAttribute('height', '30');
                rect.setAttribute('fill', 'white');
                rect.setAttribute('data-id', annotation.number);
                rect.setAttribute('title', annotation.name);
                clickGroup.appendChild(rect);
            }
        });
        
        svg.appendChild(clickGroup);
        
        // 导出 SVG
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.originalFileName ? `${this.originalFileName}-iv.svg` : 'invisible-iv.svg';
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('透明标号 SVG 已导出！\n\n特点：\n- 标号对用户不可见\n- 点击区域仍然可以交互\n- 适合用于交互式展示');
    }
    
    setStartNumber(number) {
        this.nextNumber = number;
        document.getElementById('start-number').value = number;
        
        // 显示提示信息
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        hint.textContent = `起始标号已设置为：${number}`;
        document.body.appendChild(hint);
        
        // 3 秒后自动移除提示
        setTimeout(() => {
            hint.remove();
        }, 3000);
    }
    
    setAutoIncrement(enabled) {
        this.autoIncrement = enabled;
        if (enabled) {
            // 如果启用自动递增，计算下一个可用的编号
            const usedNumbers = this.annotations.map(a => a.number);
            let nextNum = this.nextNumber;
            while (usedNumbers.includes(nextNum)) {
                nextNum++;
            }
            this.nextNumber = nextNum;
            document.getElementById('start-number').value = nextNum;
        }
    }
}

// 全局函数，供 HTML 调用
function clearAll() {
    svgAnnotator.clearAll();
}

function exportSVG() {
    svgAnnotator.exportSVG();
}

function exportJSON() {
    svgAnnotator.exportJSON();
}

function exportSBCJSON() {
    svgAnnotator.exportSBCJSON();
}

function exportInvisibleSVG() {
    svgAnnotator.exportInvisibleSVG();
}

function setStartNumber() {
    const input = document.getElementById('start-number');
    const value = parseInt(input.value);
    
    if (!isNaN(value) && value >= 1 && value <= 999) {
        svgAnnotator.setStartNumber(value);
    } else {
        alert('请输入有效的标号（1-999）');
        input.value = svgAnnotator.nextNumber;
    }
}

// 初始化
let svgAnnotator;
document.addEventListener('DOMContentLoaded', function() {
    svgAnnotator = new SVGAnnotator();
    
    // 初始化标号设置
    document.getElementById('start-number').value = svgAnnotator.nextNumber;
    document.getElementById('auto-increment').checked = svgAnnotator.autoIncrement;
    
    // 监听自动递增复选框
    document.getElementById('auto-increment').addEventListener('change', function(e) {
        svgAnnotator.setAutoIncrement(e.target.checked);
    });
    
    // 监听起始标号输入框
    document.getElementById('start-number').addEventListener('change', function(e) {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1 && value <= 999) {
            if (!svgAnnotator.autoIncrement) {
                svgAnnotator.nextNumber = value;
            }
        }
    });
});
