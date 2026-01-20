# SBC Interface Viewer

一个用于查看单板计算机接口信息的交互式 Web 应用。

## 功能特性

- 🎯 **交互式接口查看** - 点击接口编号查看详细信息
- 🔄 **双面视图** - 支持查看板卡正反面
- 🌐 **多语言支持** - 支持中文和英文
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔗 **URL 参数支持** - 可通过 URL 直接访问特定板卡
- ✨ **视觉反馈** - 点击时有闪烁动画效果

## 支持的板卡

- ROCK 5T
- ROCK 5B+
- Raspberry Pi 4B

## 快速开始

### 在线体验

无需安装，直接访问在线版本：
- ** GitHub Pages 部署版：https://xzl01.github.io/board-out/

### 本地运行

#### 环境要求

- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 本地 HTTP 服务器（用于加载 SVG 文件）

#### 安装运行

1. 克隆仓库
```bash
git clone https://github.com/xzl01/board-out.git
cd board-out
```

2. 启动本地服务器
```bash
# 使用Python
python -m http.server 8081

# 或使用Node.js
npx http-server -p 8081

# 或使用PHP
php -S localhost:8081
```

3. 打开浏览器访问
```
http://localhost:8081
```

## URL 参数

可以通过 URL 参数直接访问特定页面：

- `sbc` - 板卡型号（rock5t, rock5b, rpi4b）
- `lang` - 语言（zh, en）
- `side` - 正反面（front, back）

示例：
```
http://localhost:8081/?sbc=rock5t&lang=en&side=back
```

## 项目结构

```
board-out/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 主应用逻辑
├── data/               # 接口数据
│   ├── zh/             # 中文数据
│   └── en/             # 英文数据
├── boards/             # SVG文件
│   ├── rock5t/
│   ├── rock5b/
│   └── rpi4b/
└── svg-annotation-tool/ # SVG标注工具
```

## 开发指南

### 添加新板卡

1. 在 `boards/` 目录下创建板卡文件夹
2. 添加正面和反面 SVG 文件
3. 在 `data/zh/` 和 `data/en/` 中添加接口数据
4. 在 `js/app.js` 的 `sbcData` 中添加配置

### SVG 文件要求

- 必须包含 `click-layer` 图层
- 接口区域需要添加 `data-id` 属性
- 建议使用标准的命名规范

### 数据格式

接口数据使用 JSON 格式，包含以下字段：
- `name` - 接口名称
- `description` - 简短描述
- `details` - 详细信息
- `voltage` - 电压信息
- `compatibility` - 兼容性信息

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- 感谢所有贡献者
- SVG 图标来源于 [Font Awesome](https://fontawesome.com/)
- 使用了现代 Web 技术构建

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/xzl01/board-out/issues)
- 发送邮件至：your.email@example.com

## 部署

### GitHub Pages 自动部署

本项目使用 GitHub Actions 自动部署到 GitHub Pages：

1. **触发条件**：
   - 推送到 `main` 分支
   - 创建针对 `main` 分支的 Pull Request

2. **部署流程**：
   - 自动构建项目
   - 复制文件到部署目录
   - 发布到 GitHub Pages

3. **访问地址**：
   - 生产环境：https://xzl01.github.io/board-out/
   - PR 预览：每次 PR 都会生成预览链接

### 手动部署

如需手动部署到其他平台：

1. 构建：
```bash
mkdir dist
cp -r sbc-interface-viewer/* dist/
cp README.md dist/
```

2. 部署到任何静态文件服务器即可
