# Checklist

## 类型定义和配置
- [x] `BoardSize` 类型已定义，值为 `6 | 8`
- [x] `BOARD_SIZES` 配置对象已创建
- [x] `GameState` 接口包含 `boardSize` 字段
- [x] 设备类型检测工具函数已实现

## 游戏状态管理
- [x] `gameStore` 包含 `boardSize` 状态
- [x] `setBoardSize` action 已实现
- [x] `initBoard` 使用动态尺寸初始化棋盘
- [x] 棋盘尺寸选择已持久化到 localStorage
- [x] 6x6和8x8的最高分分别保存

## 游戏逻辑
- [x] `initializeBoard` 函数接受尺寸参数
- [x] 所有匹配检测函数正确使用动态尺寸
- [x] 特殊道具效果范围计算正确
- [x] 下落和填充逻辑支持动态尺寸
- [x] 有效移动检测支持动态尺寸

## UI组件
- [x] GameBoard 组件动态渲染棋盘
- [x] 单元格大小根据棋盘尺寸动态计算
- [x] BoardSizeSelector 组件已创建
- [x] 移动端自动隐藏尺寸选择器
- [x] GameHeader 正确集成尺寸选择器
- [x] 最高分显示与当前棋盘尺寸匹配

## 响应式布局
- [x] 6x6棋盘单元格视觉上更大
- [x] 两种尺寸下棋盘都居中显示
- [x] 移动端6x6棋盘显示正常

## 功能验证
- [x] PC端可以切换6x6和8x8棋盘
- [x] 移动端自动使用6x6棋盘
- [x] 两种尺寸下游戏逻辑运行正确
- [x] 最高分分别记录和显示
- [x] 无类型错误和代码诊断问题
