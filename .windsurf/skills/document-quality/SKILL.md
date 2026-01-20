---
name: document-quality
description: Optimize JSON documentation structure while maintaining content fidelity, following best practices for clarity and consistency
---

# JSON Documentation Optimization Skill

## Purpose

This skill helps optimize JSON documentation files to improve clarity, consistency, and maintainability while preserving all original content and meaning.

## Reference Structure

Based on the rock5t.json interface documentation model, follow this structure:

### Core Object Structure

```json
{
  "interfaces": {
    "id": {
      "name": "简短中文名称",
      "description": "一句话描述",
      "details": "详细说明\n\n- 使用项目符号列出特性\n- 包含技术规格\n- 提供使用场景说明",
      "type": "接口类型（可选）",
      "specification": "技术规格（可选）",
      "voltage": "电压规格（可选）",
      "compatibility": "兼容性信息（可选）",
      "function": "功能说明（可选）",
      "standard": "遵循标准（可选）",
      "max_resolution": "最大分辨率（可选）"
    }
  }
}
```

## Optimization Guidelines

### 1. Content Organization

- **name**: 简洁明确的中文名称，包含关键信息
- **description**: 一句话概括，突出核心功能
- **details**: 详细说明，使用结构化格式
  - 首行概述功能
  - 空行分隔
  - 使用项目符号列出特性
  - 提供实际应用场景

### 2. Text Formatting

- 使用中文全角标点符号
- 技术术语保持英文原名（如 GPIO、I2C、SPI）
- 数字和单位之间加空格（如 3.3V、4K@60Hz）
- 使用标准缩写（如 LED、USB、PoE）

### 3. Technical Details

- 电压信息统一格式：X.XV 逻辑电平
- 兼容性说明：XXX 兼容
- 标准引用：完整标准名称（如 IEEE 802.3af/at）
- 引脚说明：明确数量和可用性

### 4. Consistency Rules

- 相同功能接口使用统一描述格式
- 技术参数使用标准单位
- 保持中英文混排的一致性
- 可选字段根据实际需要添加

## Implementation Steps

1. **分析原始内容**
   - 识别所有接口和功能
   - 提取关键技术参数
   - 理解文档结构逻辑

2. **重组内容结构**
   - 按照参考模板组织
   - 补充缺失的标准字段
   - 保持所有原始信息

3. **优化文本表达**
   - 统一术语使用
   - 改善可读性
   - 增强结构化程度
   - 去掉位置，大小这些字段

4. **验证完整性**
   - 检查所有原始信息是否保留
   - 确认技术参数准确性
   - 验证格式一致性

## Example Transformation

### Before

```json
{
  "gpio": "40-pin header with various functions"
}
```

### After

```json
{
  "name": "GPIO 40-pin",
  "description": "40 针 GPIO 接口，兼容树莓派",
  "details": "ROCK 5T 提供了一个 40 针的 GPIO 接口，与树莓派兼容。包括 GPIO、I2C、SPI、UART、PWM 和 ADC 功能。\n\n引脚说明：\n- 3.3V、5V 电源引脚\n- GPIO 引脚（最多可用 28 个 GPIO）\n- I2C 接口（I2C0、I2C1、I2C2）\n- SPI 接口（SPI0、SPI1）\n- UART 接口（UART0、UART1、UART2、UART3）\n- PWM 输出\n- ADC 输入（SARADC）\n\n详细的引脚映射请参考文档中的 GPIO 引脚图。",
  "voltage": "3.3V 逻辑电平",
  "compatibility": "树莓派兼容"
}
```

## Quality Checklist

- [ ] 所有原始内容已保留
- [ ] 结构符合标准模板
- [ ] 中文表达准确流畅
- [ ] 技术术语使用正确
- [ ] 格式统一规范
- [ ] 无信息丢失或误解
