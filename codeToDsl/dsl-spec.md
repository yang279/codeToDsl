字段信息
# 设计 DSL

基于设计稿解析出来的通用表达结构，包含设计稿图层树、图层样式、组件数据、布局识别等信息，用标准 JSON 格式承载，包含以下主要内容：

| 字段 | 类型 | 必选 | 说明 | 详情 |
| :--- | :--- | :--- | :--- | :--- |
| mate | string | 是 | 文件来源信息 | [点击查看](#meta)
| content | array | 是 | 主要数据来源 | [点击查看](#content)
| name | string | 否 | 引用外部资源 | [点击查看](#assets) 

---

## Style 字段

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| width | number | 宽度，单位 px |
| height | number | 高度，单位 px |
| x | number | 相对父节点横坐标 |
| y | number | 相对父节点纵坐标 |
| color | string | 文字颜色，hex 格式 |
| backgroundColor | string | 背景颜色，hex 格式 |
| fontSize | number | 字号，单位 px |
| fontWeight | string | 字重，如 `400` / `700` |
| borderRadius | number | 圆角，单位 px |
| opacity | number | 透明度，0 ~ 1 |
| padding | number[] | 内边距，顺序 [上, 右, 下, 左] |

---

## Layout 字段

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| direction | string | 排列方向：`row` / `column` |
| alignItems | string | 交叉轴对齐：`flex-start` / `center` / `flex-end` |
| justifyContent | string | 主轴对齐：`flex-start` / `center` / `space-between` |
| gap | number | 子节点间距，单位 px |
| wrap | boolean | 是否换行 |

---

## 示例 JSON

```json
{
  "id": "node-001",
  "type": "view",
  "name": "卡片容器",
  "style": {
    "width": 375,
    "height": 120,
    "x": 0,
    "y": 0,
    "backgroundColor": "#FFFFFF",
    "borderRadius": 8,
    "padding": [16, 16, 16, 16]
  },
  "layout": {
    "direction": "row",
    "alignItems": "center",
    "justifyContent": "space-between",
    "gap": 12,
    "wrap": false
  },
  "children": [
    {
      "id": "node-002",
      "type": "image",
      "name": "头像",
      "style": { "width": 48, "height": 48, "borderRadius": 24 },
      "props": { "src": "https://example.com/avatar.png" },
      "children": []
    },
    {
      "id": "node-003",
      "type": "text",
      "name": "标题",
      "style": { "fontSize": 16, "fontWeight": "700", "color": "#1A1A1A" },
      "props": { "content": "用户名" },
      "children": []
    }
  ],
  "meta": {
    "sourceFile": "design.fig",
    "layerId": "1:23",
    "parserVersion": "1.0.0"
  }
}
```
