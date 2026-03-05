# 消消乐游戏提示功能实现计划

## 需求描述
超过10秒没有消除方块时，抖动可消除的方块进行提示，帮助用户找到可消除的组合。

## 实现步骤

### 1. 扩展类型定义 (src/types/game.ts)
- 在 `GameState` 接口中添加：
  - `lastInteractionTime: number` - 最后一次交互时间戳
  - `hintPositions: Position[]` - 需要提示的方块位置数组
  - `isShowingHint: boolean` - 是否正在显示提示

### 2. 添加游戏逻辑函数 (src/utils/gameLogic.ts)
- 新增 `findValidMoves(board)` 函数：
  - 遍历棋盘所有位置
  - 测试每个位置与右边和下边相邻位置的交换
  - 如果交换后能形成匹配，记录这两个位置
  - 返回所有可消除的方块位置数组

### 3. 更新游戏状态管理 (src/stores/gameStore.ts)
- 初始化新状态字段
- 在 `selectElement` action 中：
  - 重置 `lastInteractionTime` 为当前时间
  - 清除 `hintPositions` 和 `isShowingHint`
- 在 `trySwap` action 开始时：
  - 重置提示相关状态
- 新增 `startHintTimer` action：
  - 启动定时器检测
- 新增 `showHint` action：
  - 调用 `findValidMoves` 获取可消除位置
  - 设置 `hintPositions` 和 `isShowingHint`
- 新增 `clearHint` action：
  - 清除提示状态

### 4. 更新游戏棋盘组件 (src/components/GameBoard.vue)
- 添加定时器逻辑：
  - 使用 `setInterval` 每秒检查时间差
  - 超过10秒且没有动画进行时触发提示
- 添加计算属性判断方块是否需要提示
- 添加 CSS 抖动动画类 `.hint-shake`
- 在用户点击时清除提示

### 5. 抖动动画设计
- 使用 CSS `@keyframes` 实现抖动效果
- 动画参数：
  - 持续时间：0.5秒
  - 抖动幅度：左右各3px
  - 循环：infinite
  - 缓动函数：ease-in-out

## 文件修改清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/types/game.ts` | 扩展 GameState 接口 |
| `src/utils/gameLogic.ts` | 新增 findValidMoves 函数 |
| `src/stores/gameStore.ts` | 添加提示相关状态和 actions |
| `src/components/GameBoard.vue` | 添加定时器和抖动动画 |

## 技术要点

1. **定时器管理**：使用 `onMounted` 和 `onUnmounted` 生命周期钩子管理定时器，避免内存泄漏

2. **性能优化**：只在用户可交互时检查提示，避免动画进行中触发

3. **用户体验**：
   - 提示动画要明显但不刺眼
   - 用户操作后立即清除提示
   - 提示只显示可消除的方块，不显示具体交换方式

4. **边界情况处理**：
   - 游戏结束时不显示提示
   - 动画进行中不显示提示
   - 已经显示提示时不重复触发
