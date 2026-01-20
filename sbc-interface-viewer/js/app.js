// SBC Interface Viewer Application
class SBCInterfaceViewer {
    constructor() {
        this.currentSBC = 'rock5t';
        this.currentLang = 'zh';
        this.interfaces = null;
        this.currentFlashInterval = null; // 跟踪当前的闪烁动画
        this.currentFlashOverlay = null; // 跟踪当前的遮罩元素
        this.isFront = true; // 当前显示的是正面还是反面
        
        this.sbcData = {
            'rock5b': {
                svgFront: 'boards/rock5b/rock5b-plus.svg',
                svgBack: 'boards/rock5b/rock5b-plus-back.svg',
                name: 'ROCK 5B+'
            },
            'rock5t': {
                svgFront: 'boards/rock5t/rock5t-v.svg',
                svgBack: 'boards/rock5t/rock5t-v-back.svg',
                name: 'ROCK 5T',
            },
            'rpi4b': {
                svgFront: 'boards/rpi4b/rpi4b.svg',
                svgBack: 'boards/rpi4b/rpi4b-back.svg',
                name: 'Raspberry Pi 4B'
            },
            'a7s': {
                svgFront: 'boards/a7s/a7s-v.svg',
                svgBack: 'boards/a7s/a7s-back-v.svg',
                name: 'A7S'
            },
            'a7a': {
                svgFront: 'boards/a7a/a7a-iv.svg',
                svgBack: 'boards/a7a/a7a-v.svg',
                name: 'A7A'
            }
        };
        
        // 从 URL 参数获取初始设置
        this.parseURLParams();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        // 更新 UI 以反映当前设置
        document.getElementById('sbc-select').value = this.currentSBC;
        this.loadBoard(); // 加载初始板卡
        this.loadInterfaces();
        this.updateLegend();
    }
    
    bindEvents() {
        // SBC 选择器
        document.getElementById('sbc-select').addEventListener('change', (e) => {
            this.currentSBC = e.target.value;
            this.isFront = true; // 切换板卡时重置为正面
            this.loadBoard();
            this.updateURL();
        });
        
        // 语言切换
        document.getElementById('lang-zh').addEventListener('click', () => {
            this.switchLanguage('zh');
            this.updateURL();
        });
        
        document.getElementById('lang-en').addEventListener('click', () => {
            this.switchLanguage('en');
            this.updateURL();
        });
        
        // 翻转按钮事件
        document.getElementById('flip-board').addEventListener('click', () => {
            this.flipBoard();
        });
    }
    
    loadBoard() {
        const svgObject = document.getElementById('board-svg');
        const sbcInfo = this.sbcData[this.currentSBC];
        
        // 根据当前面选择 SVG 文件
        const svgFile = this.isFront ? sbcInfo.svgFront : sbcInfo.svgBack;
        
        // 更新 SVG 路径
        svgObject.setAttribute('data', svgFile);
        
        // 更新图例
        this.updateLegend();
        
        // 更新翻转按钮文本
        const flipBtn = document.getElementById('flip-board');
        const flipText = flipBtn.querySelector('.flip-text');
        flipText.textContent = this.isFront ? '查看背面' : '查看正面';
        flipBtn.classList.toggle('flipped', !this.isFront);
        
        // 清除当前闪烁
        this.clearCurrentFlash();
        
        // 加载接口数据
        this.loadInterfaces();
    }
    
    loadInterfaces() {
        const filename = `data/${this.currentLang}/${this.currentSBC}.json`;
        console.log('Loading interfaces from:', filename);
        
        fetch(filename)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Loaded data:', data);
                this.interfaces = data.interfaces;
                console.log('Interfaces set:', this.interfaces);
                this.bindSVGEvents();
            })
            .catch(error => {
                console.error('Error loading interfaces:', error);
                // 如果当前语言文件不存在，尝试加载英文
                if (this.currentLang !== 'en') {
                    this.loadEnglishFallback();
                }
            });
    }
    
    loadEnglishFallback() {
        const filename = `data/en/${this.currentSBC}.json`;
        
        fetch(filename)
            .then(response => response.json())
            .then(data => {
                this.interfaces = data.interfaces;
                this.bindSVGEvents();
            })
            .catch(error => {
                console.error('Error loading English interfaces:', error);
            });
    }
    
    bindSVGEvents() {
        const svgObject = document.getElementById('board-svg');
        
        // 移除旧的事件监听器
        svgObject.removeEventListener('load', this.handleSVGLoad);
        
        // 创建新的处理函数
        this.handleSVGLoad = () => {
            // 等待一小段时间确保 SVG 内容完全加载
            setTimeout(() => {
                const svgDoc = svgObject.contentDocument;
                if (!svgDoc) {
                    console.error('Cannot access SVG document');
                    return;
                }
                
                const clickLayer = svgDoc.getElementById('click-layer');
                
                if (clickLayer) {
                    const elements = clickLayer.querySelectorAll('*');
                    console.log('Found clickable elements:', elements.length);
                    
                    elements.forEach((element, index) => {
                        console.log(`Binding click to element ${index}:`, element);
                        element.addEventListener('click', (e) => {
                            console.log('Click event triggered on element:', element);
                            e.stopPropagation();
                            const id = element.getAttribute('data-id');
                            console.log('Element data-id:', id);
                            
                            // 添加高亮闪烁效果 - 创建遮罩层
                            console.log('Adding flash effect to element:', element);
                            
                            // 清除之前的动画和遮罩
                            if (this.currentFlashInterval) {
                                clearInterval(this.currentFlashInterval);
                                this.currentFlashInterval = null;
                            }
                            if (this.currentFlashOverlay) {
                                this.currentFlashOverlay.remove();
                                this.currentFlashOverlay = null;
                            }
                            
                            // 获取元素的位置和大小
                            const x = parseFloat(element.getAttribute('x'));
                            const y = parseFloat(element.getAttribute('y'));
                            const width = parseFloat(element.getAttribute('width'));
                            const height = parseFloat(element.getAttribute('height'));
                            
                            console.log(`Element position: x=${x}, y=${y}, width=${width}, height=${height}`);
                            
                            // 获取 SVG 的 viewBox 信息
                            const svgDoc = element.ownerDocument;
                            const svgRoot = svgDoc.documentElement;
                            const viewBox = svgRoot.getAttribute('viewBox');
                            console.log('SVG viewBox:', viewBox);
                            
                            // 创建遮罩层
                            const flashOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            flashOverlay.setAttribute('x', x);
                            flashOverlay.setAttribute('y', y);
                            flashOverlay.setAttribute('width', width);
                            flashOverlay.setAttribute('height', height);
                            flashOverlay.setAttribute('fill', '#40A778'); // 主题绿色
                            flashOverlay.setAttribute('opacity', '0'); // 初始透明
                            flashOverlay.style.pointerEvents = 'none';
                            flashOverlay.style.transition = 'opacity 0.3s ease'; // 添加过渡效果
                            flashOverlay.classList.add('flash-overlay');
                            
                            // 获取 SVG 根元素并添加遮罩到最上层
                            svgRoot.appendChild(flashOverlay);
                            
                            console.log('Created overlay:', flashOverlay);
                            console.log('Overlay attributes:', {
                                x: flashOverlay.getAttribute('x'),
                                y: flashOverlay.getAttribute('y'),
                                width: flashOverlay.getAttribute('width'),
                                height: flashOverlay.getAttribute('height'),
                                fill: flashOverlay.getAttribute('fill'),
                                opacity: flashOverlay.getAttribute('opacity')
                            });
                            console.log('Overlay parent:', flashOverlay.parentNode);
                            
                            // 闪烁动画 - 持续进行，不自动停止
                            let fadeIn = true;
                            
                            // 先显示遮罩
                            setTimeout(() => {
                                flashOverlay.setAttribute('opacity', '0.7');
                            }, 50);
                            
                            this.currentFlashInterval = setInterval(() => {
                                // 持续闪烁，不停止
                                if (fadeIn) {
                                    flashOverlay.setAttribute('opacity', '0.3');
                                } else {
                                    flashOverlay.setAttribute('opacity', '0.7');
                                }
                                fadeIn = !fadeIn;
                            }, 350); // 每 350 毫秒切换一次
                            
                            // 保存当前遮罩引用
                            this.currentFlashOverlay = flashOverlay;
                            
                            this.showInterfaceInfo(id);
                        });
                        
                        // 添加 hover 效果
                        element.addEventListener('mouseenter', () => {
                            element.style.opacity = '0.2';
                            element.style.fill = '#40A778';
                        });
                        
                        element.addEventListener('mouseleave', () => {
                            element.style.opacity = '0';
                            element.style.fill = 'white';
                        });
                    });
                } else {
                    console.error('Click layer not found in SVG');
                }
            }, 100);
        };
        
        svgObject.addEventListener('load', this.handleSVGLoad);
        
        // 如果 SVG 已经加载，手动触发
        if (svgObject.contentDocument) {
            this.handleSVGLoad();
        }
    }
    
    showInterfaceInfo(id) {
        console.log('showInterfaceInfo called with id:', id);
        console.log('this.interfaces:', this.interfaces);
        console.log('this.interfaces[id]:', this.interfaces ? this.interfaces[id] : 'interfaces is null');
        
        if (!this.interfaces || !this.interfaces[id]) {
            console.error('Interface not found or interfaces not loaded');
            return;
        }
        
        const interfaceData = this.interfaces[id];
        const infoPanel = document.getElementById('info-panel');
        
        console.log('Updating info panel...');
        infoPanel.innerHTML = `
            <div class="interface-info">
                <h2>${interfaceData.name}</h2>
                <h3>${interfaceData.description}</h3>
                <div class="interface-details">${interfaceData.details}</div>
                <div class="spec-list">
                    ${interfaceData.voltage ? `<div class="spec-item">
                        <span class="spec-label">电压</span>
                        <span class="spec-value">${interfaceData.voltage}</span>
                    </div>` : ''}
                    ${interfaceData.type ? `<div class="spec-item">
                        <span class="spec-label">类型</span>
                        <span class="spec-value">${interfaceData.type}</span>
                    </div>` : ''}
                    ${interfaceData.speed ? `<div class="spec-item">
                        <span class="spec-label">速度</span>
                        <span class="spec-value">${interfaceData.speed}</span>
                    </div>` : ''}
                    ${interfaceData.capacity ? `<div class="spec-item">
                        <span class="spec-label">容量</span>
                        <span class="spec-value">${interfaceData.capacity}</span>
                    </div>` : ''}
                    ${interfaceData.max_resolution ? `<div class="spec-item">
                        <span class="spec-label">最大分辨率</span>
                        <span class="spec-value">${interfaceData.max_resolution}</span>
                    </div>` : ''}
                    ${interfaceData.compatibility ? `<div class="spec-item">
                        <span class="spec-label">兼容性</span>
                        <span class="spec-value">${interfaceData.compatibility}</span>
                    </div>` : ''}
                    ${interfaceData.interface ? `<div class="spec-item">
                        <span class="spec-label">接口</span>
                        <span class="spec-value">${interfaceData.interface}</span>
                    </div>` : ''}
                    ${interfaceData.power ? `<div class="spec-item">
                        <span class="spec-label">电源</span>
                        <span class="spec-value">${interfaceData.power}</span>
                    </div>` : ''}
                    ${interfaceData.function ? `<div class="spec-item">
                        <span class="spec-label">功能</span>
                        <span class="spec-value">${interfaceData.function}</span>
                    </div>` : ''}
                    ${interfaceData.frequency ? `<div class="spec-item">
                        <span class="spec-label">频率</span>
                        <span class="spec-value">${interfaceData.frequency}</span>
                    </div>` : ''}
                    ${interfaceData.count ? `<div class="spec-item">
                        <span class="spec-label">数量</span>
                        <span class="spec-value">${interfaceData.count}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }
    
    showWelcome() {
        const infoPanel = document.getElementById('info-panel');
        const welcomeText = this.currentLang === 'zh' ? 
            '<h2>欢迎使用 SBC 接口查看器</h2><p>请选择单板计算机，然后点击电路板上的红色数字编号，查看对应接口的详细信息</p>' :
            '<h2>Welcome to SBC Interface Viewer</h2><p>Please select a single board computer, then click the red numbered markers on the board to view detailed interface information</p>';
        
        infoPanel.innerHTML = `<div class="welcome-message">${welcomeText}</div>`;
    }
    
    updateLegend() {
        const legendContainer = document.getElementById('legend-items');
        
        if (this.interfaces) {
            // 直接使用 this.interfaces
            const interfaces = this.interfaces;
            
            // 根据当前面过滤接口
            const filteredInterfaces = {};
            Object.keys(interfaces).forEach(id => {
                const numId = parseInt(id);
                // 正面显示 1-100，背面显示 101-199
                if ((this.isFront && numId >= 1 && numId <= 100) || 
                    (!this.isFront && numId >= 101 && numId <= 199)) {
                    filteredInterfaces[id] = interfaces[id];
                }
            });
            
            const legendItems = Object.keys(filteredInterfaces).map(id => ({
                number: parseInt(id),
                name: filteredInterfaces[id].name || `接口 ${id}`
            })).sort((a, b) => a.number - b.number);
            
            legendContainer.innerHTML = legendItems.map(item => `
                <div class="legend-item">
                    <div class="legend-number">${item.number}</div>
                    <div class="legend-name">${item.name}</div>
                </div>
            `).join('');
        } else {
            // 加载中状态
            legendContainer.innerHTML = '<div style="text-align: center; color: #999;">加载中...</div>';
        }
    }
    
    switchLanguage(lang) {
        if (this.currentLang === lang) return;
        
        this.currentLang = lang;
        
        // 更新按钮状态
        document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
        document.getElementById('lang-en').classList.toggle('active', lang === 'en');
        
        // 更新页面语言
        const headerTitle = lang === 'zh' ? 'SBC 接口查看器' : 'SBC Interface Viewer';
        const headerDesc = lang === 'zh' ? '选择单板计算机，点击接口编号查看详细信息' : 'Select a single board computer, click interface numbers to view details';
        
        document.querySelector('.header h1').textContent = headerTitle;
        document.querySelector('.header p').textContent = headerDesc;
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        
        // 重新加载接口数据
        this.loadInterfaces();
        this.showWelcome();
    }
    
    // 翻转板卡
    flipBoard() {
        this.isFront = !this.isFront;
        this.loadBoard();
        this.updateURL();
    }
    
    // 清除当前闪烁
    clearCurrentFlash() {
        if (this.currentFlashInterval) {
            clearInterval(this.currentFlashInterval);
            this.currentFlashInterval = null;
        }
        if (this.currentFlashOverlay) {
            this.currentFlashOverlay.remove();
            this.currentFlashOverlay = null;
        }
    }
    
    // 解析 URL 参数
    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 获取 sbc 参数
        const sbc = urlParams.get('sbc');
        if (sbc && this.sbcData[sbc]) {
            this.currentSBC = sbc;
        }
        
        // 获取 lang 参数
        const lang = urlParams.get('lang');
        if (lang && (lang === 'zh' || lang === 'en')) {
            this.currentLang = lang;
        }
        
        // 获取 side 参数（front/back）
        const side = urlParams.get('side');
        if (side === 'back') {
            this.isFront = false;
        }
    }
    
    // 更新 URL
    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('sbc', this.currentSBC);
        url.searchParams.set('lang', this.currentLang);
        url.searchParams.set('side', this.isFront ? 'front' : 'back');
        window.history.replaceState({}, '', url);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new SBCInterfaceViewer();
});
