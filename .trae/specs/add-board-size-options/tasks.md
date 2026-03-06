# Tasks

## 类型定义和配置
- [x] Task 1: 更新游戏类型定义，支持动态棋盘尺寸
  - [x] SubTask 1.1: 在 `src/types/game.ts` 中定义棋盘尺寸类型 `BoardSize = 6 | 8`
  - [x] SubTask 1.2: 将 `BOARD_SIZE` 常量改为 `BOARD_SIZES` 配置对象
  - [x] SubTask 1.3: 更新 `GameState` 接口，添加 `boardSize: BoardSize` 字段
  - [x] SubTask 1.4: 添加设备类型检测工具函数

## 游戏状态管理
- [x] Task 2: 更新 Pinia Store，支持动态棋盘尺寸
  - [x] SubTask 2.1: 在 `gameStore.ts` 中添加 `boardSize` 状态
  - [x] SubTask 2.2: 添加 `setBoardSize` action
  - [x] SubTask 2.3: 修改 `initBoard` action，使用动态尺寸
  - [x] SubTask 2.4: 添加棋盘尺寸的 localStorage 持久化
  - [x] SubTask 2.5: 分别保存6x6和8x8的最高分

## 游戏逻辑适配
- [x] Task 3: 更新游戏逻辑函数，支持动态尺寸参数
  - [x] SubTask 3.1: 修改 `initializeBoard` 函数，接受尺寸参数
  - [x] SubTask 3.2: 修改 `findAllMatches` 及相关函数，接受尺寸参数
  - [x] SubTask 3.3: 修改 `triggerSpecialEffect` 函数，接受尺寸参数
  - [x] SubTask 3.4: 修改 `dropElements` 和 `fillBoard` 函数，接受尺寸参数
  - [x] SubTask 3.5: 修改 `hasValidMoves` 和 `findValidMoves` 函数，接受尺寸参数

## UI组件更新
- [x] Task 4: 更新 GameBoard 组件，支持动态渲染
  - [x] SubTask 4.1: 移除硬编码的8x8循环，改为动态渲染
  - [x] SubTask 4.2: 根据棋盘尺寸动态计算单元格大小
  - [x] SubTask 4.3: 调整动画相关计算，使用动态尺寸

- [x] Task 5: 创建棋盘尺寸选择组件
  - [x] SubTask 5.1: 创建 `BoardSizeSelector.vue` 组件
  - [x] SubTask 5.2: 实现6x6和8x8选项的UI
  - [x] SubTask 5.3: 添加设备检测，移动端隐藏选择器

- [x] Task 6: 更新 GameHeader 组件
  - [x] SubTask 6.1: 集成棋盘尺寸选择组件
  - [x] SubTask 6.2: 根据当前棋盘尺寸显示对应的最高分
  - [x] SubTask 6.3: 添加游戏开始前的尺寸选择流程

## 响应式布局
- [x] Task 7: 优化响应式布局
  - [x] SubTask 7.1: 调整6x6棋盘的单元格尺寸，使其视觉上更大
  - [x] SubTask 7.2: 确保两种尺寸下棋盘都能在屏幕中居中
  - [x] SubTask 7.3: 测试移动端6x6棋盘的显示效果

## 测试和验证
- [x] Task 8: 测试和验证
  - [x] SubTask 8.1: 测试PC端棋盘尺寸切换功能
  - [x] SubTask 8.2: 测试移动端自动使用6x6功能
  - [x] SubTask 8.3: 测试两种尺寸下的游戏逻辑正确性
  - [x] SubTask 8.4: 测试最高分分别记录功能
  - [x] SubTask 8.5: 运行类型检查和代码诊断

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2, Task 3]
- [Task 5] depends on [Task 1]
- [Task 6] depends on [Task 5, Task 2]
- [Task 7] depends on [Task 4, Task 6]
- [Task 8] depends on [Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7]
