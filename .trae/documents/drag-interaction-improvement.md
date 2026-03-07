# 拖动交互优化计划

## 需求分析

### 当前问题
- 现有拖动只是简单的滑动检测，滑动结束后才执行交换
- 拖动过程中没有视觉反馈，用户无法感知方块被"拖动"

### 目标效果
1. **长按触发**：长按 0.5s 后方块被"提起来"
2. **实时拖动**：拖动过程中方块跟随手指/鼠标移动
3. **视觉反馈**：被拖动的方块放大、添加阴影，显示"浮起"效果
4. **目标预览**：当拖动到相邻格子时，显示目标位置的预览效果
5. **交换确认**：释放时如果目标有效则执行交换，否则回到原位

---

## 实施步骤

### 步骤 1：扩展状态管理 (gameStore.ts)

**新增状态**：
```typescript
// 拖动状态
isDragging: boolean                    // 是否正在拖动
draggingElement: Position | null       // 被拖动的方块位置
dragOffset: { x: number; y: number }   // 拖动偏移量（实时）
dragTarget: Position | null            // 拖动目标位置（相邻有效格子）
```

**新增方法**：
- `startDrag(position)` - 开始拖动
- `updateDrag(offset)` - 更新拖动位置
- `setDragTarget(position)` - 设置拖动目标
- `endDrag()` - 结束拖动（执行交换或回位）

### 步骤 2：实现拖动交互逻辑 (GameBoard.vue)

**长按检测**：
- `touchstart`/`mousedown` 时启动 500ms 定时器
- 定时器触发后进入拖动模式
- 如果在 500ms 内移动超过阈值，取消定时器（保持原有滑动逻辑）

**拖动跟踪**：
- `touchmove`/`mousemove` 时：
  - 如果在拖动模式，更新 `dragOffset` 和 `dragTarget`
  - 否则检测是否为快速滑动

**拖动结束**：
- `touchend`/`mouseup` 时：
  - 如果在拖动模式，根据 `dragTarget` 决定是否交换
  - 重置所有拖动状态

### 步骤 3：添加拖动视觉效果 (GameBoard.vue)

**被拖动方块的样式**：
- 放大到 1.2 倍
- 添加阴影（浮起效果）
- z-index 提升到最上层
- 使用 `transform` 实现跟随移动

**目标位置预览**：
- 相邻目标格子显示高亮边框
- 可选：显示交换预览动画

### 步骤 4：处理边界情况

- 拖动到非相邻格子：回到原位
- 拖动到棋盘外：回到原位
- 动画进行中禁止拖动
- 游戏结束时取消拖动

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/types/game.ts` | 新增拖动相关类型定义 |
| `src/stores/gameStore.ts` | 新增拖动状态和方法 |
| `src/components/GameBoard.vue` | 实现拖动交互逻辑和视觉效果 |

---

## 技术要点

### 长按与滑动的区分
```
按下 → 启动 500ms 定时器
  ├─ 500ms 内移动 > 阈值 → 取消定时器，进入滑动模式
  └─ 500ms 定时器触发 → 进入拖动模式
```

### 拖动位置计算
```typescript
// 计算拖动偏移
dragOffset = {
  x: currentX - startX,
  y: currentY - startY
}

// 计算目标格子
const targetCol = startCol + Math.round(dragOffset.x / CELL_SIZE)
const targetRow = startRow + Math.round(dragOffset.y / CELL_SIZE)
```

### 视觉效果实现
```css
.board-cell.dragging {
  transform: scale(1.2) translate(var(--drag-x), var(--drag-y));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 100;
  transition: none; /* 拖动时禁用过渡 */
}

.board-cell.drag-target {
  box-shadow: 0 0 0 3px #4ECDC4;
}
```

---

## 预期效果

1. 用户长按方块 0.5s，方块"浮起"
2. 拖动方块时，方块跟随手指/鼠标移动
3. 当拖动到相邻格子时，目标格子高亮显示
4. 释放时，如果目标有效则执行交换动画
5. 如果目标无效或拖动到棋盘外，方块弹回原位
