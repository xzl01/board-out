# SBC Interface Viewer

一个支持多款单板计算机（SBC）的交互式接口查看器。

## 项目结构

```text
sbc-interface-viewer/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   └── app.js             # 应用程序逻辑
├── boards/                # SVG电路板文件
│   ├── rock5b/
│   │   └── rock5b-plus.svg
│   ├── rpi4b/
│   │   └── rpi4b.svg
│   └── rock5b-plus/
│       └── rock5b-plus.svg
│
└── data/                  # 接口数据
    ├── zh/                # 中文数据
    │   ├── rock5b.json
    │   ├── rpi4b.json
    │   └── rock5b-plus.json
    └── en/                # 英文数据
        ├── rock5b.json
        ├── rpi4b.json
        └── rock5b-plus.json
```

## 功能特点

- 支持多款SBC：ROCK 5B+、Raspberry Pi 4B
- 中英文双语界面
- 交互式SVG电路板图
- 点击接口编号查看详细信息
- 响应式设计，支持移动设备

## 添加新的SBC

要添加新的SBC支持，需要：

1. **添加SVG文件**

   ```text
   boards/newsbc/newsbc.svg
   ```

2. **添加接口数据**

   - 中文：`data/zh/newsbc.json`
   - 英文：`data/en/newsbc.json`

3. **更新JavaScript配置**

   在 `js/app.js` 中的 `sbcData` 对象添加新SBC的配置：

   ```javascript
   'newsbc': {
       svg: 'boards/newsbc/newsbc.svg',
       name: 'New SBC Name',
       legend: [
           { number: 1, name: 'Interface 1' },
           // 更多接口
       ]
   }
   ```

4. **更新HTML选择器**

   在 `index.html` 的选择器中添加新选项：

   ```html
   <option value="newsbc">New SBC Name</option>
   ```

## 接口数据格式

每个SBC的JSON文件格式：

```json
{
  "interfaces": {
    "1": {
      "name": "接口名称",
      "description": "简短描述",
      "details": "详细信息\n\n支持多行文本",
      "voltage": "电压信息",
      "type": "接口类型",
      "speed": "速度信息",
      "capacity": "容量信息",
      "max_resolution": "最大分辨率",
      "compatibility": "兼容性",
      "interface": "接口规格",
      "power": "电源信息",
      "function": "功能说明",
      "frequency": "频率信息",
      "count": "数量"
    }
  }
}
```

## 运行项目

1. 启动HTTP服务器：

   ```bash
   cd sbc-interface-viewer
   python3 -m http.server 8081
   ```

2. 在浏览器中访问：

   ```text
   http://localhost:8081
   ```

## 开发说明

- 使用原生JavaScript，无需框架依赖
- 响应式CSS设计
- SVG文件需要包含 `click-layer` 层，包含可点击的元素
- 每个可点击元素需要 `data-id` 属性来标识接口编号

## 许可证

MIT License
