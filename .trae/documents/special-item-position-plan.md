# 修改特殊道具生成位置计划

## 需求描述
合成的特殊道具应该在被交换并且消除的方块位置上生成，而不是匹配的中间位置。

## 当前逻辑分析

### 现有代码位置
- `src/utils/gameLogic.ts` - `removeMatches` 函数（第224-260行）
- `src/stores/gameStore.ts` - `trySwap` 和 `processMatches` 方法

### 当前行为
1. 检测匹配后，在 `removeMatches` 中生成特殊道具
2. 特殊道具生成在匹配的中间位置：`middleIndex = Math.floor(match.positions.length / 2)`

### 期望行为
1. 当玩家主动交换方块形成匹配时，特殊道具应生成在被交换的方块位置
2. 如果交换的方块参与了匹配，优先在该位置生成特殊道具
3. 如果交换的方块未参与匹配，则回退到中间位置逻辑

## 实现步骤

### 步骤1：修改 `removeMatches` 函数签名
**文件**: `src/utils/gameLogic.ts`

修改 `removeMatches` 函数，增加可选参数 `swapPositions`：
```typescript
export function removeMatches(
  board: GameElement[][],
  matches: Match[],
  swapPositions?: { from: Position; to: Position }
): { newBoard: GameElement[][]; specials: Array<{ position: Position; special: SpecialType }> }
```

### 步骤2：修改特殊道具位置选择逻辑
**文件**: `src/utils/gameLogic.ts`

在 `removeMatches` 函数中：
1. 检查是否提供了 `swapPositions`
2. 如果提供了，检查交换位置是否在匹配范围内
3. 优先使用交换位置作为特殊道具生成位置
4. 如果交换位置不在匹配范围内，使用原来的中间位置逻辑

### 步骤3：修改 `gameStore.ts` 中的调用
**文件**: `src/stores/gameStore.ts`

需要区分两种情况：

#### 情况A：主动交换触发的匹配
在 `trySwap` 方法中：
- 记录交换位置 `{ from, to }`
- 将交换位置传递给 `processMatches`

#### 情况B：连锁反应触发的匹配
在 `processMatches` 方法中：
- 第一次处理匹配时使用交换位置
- 后续连锁匹配不传递交换位置（使用默认中间位置）

### 步骤4：修改 `processMatches` 方法
**文件**: `src/stores/gameStore.ts`

1. 添加可选参数 `swapPositions`
2. 在第一次调用 `removeMatches` 时传递交换位置
3. 连锁匹配时不传递交换位置

## 详细代码修改

### 修改1：gameLogic.ts - removeMatches 函数

```typescript
export function removeMatches(
  board: GameElement[][],
  matches: Match[],
  swapPositions?: { from: Position; to: Position }
): { newBoard: GameElement[][]; specials: Array<{ position: Position; special: SpecialType }> } {
  const newBoard = board.map(row => [...row])
  const specials: Array<{ position: Position; special: SpecialType }> = []
  
  for (const match of matches) {
    const specialType = determineSpecialType(match.positions.length)
    
    if (specialType) {
      let specialPos: Position
      
      // 如果提供了交换位置，优先使用交换位置
      if (swapPositions) {
        const { from, to } = swapPositions
        const fromInMatch = match.positions.some(p => p.row === from.row && p.col === from.col)
        const toInMatch = match.positions.some(p => p.row === to.row && p.col === to.col)
        
        if (fromInMatch) {
          specialPos = from
        } else if (toInMatch) {
          specialPos = to
        } else {
          // 交换位置都不在匹配中，使用中间位置
          const middleIndex = Math.floor(match.positions.length / 2)
          specialPos = match.positions[middleIndex]
        }
      } else {
        // 没有交换位置，使用中间位置
        const middleIndex = Math.floor(match.positions.length / 2)
        specialPos = match.positions[middleIndex]
      }
      
      specials.push({ position: specialPos, special: specialType })
    }
    
    // ... 其余逻辑保持不变
  }
  
  return { newBoard, specials }
}
```

### 修改2：gameStore.ts - processMatches 方法

```typescript
async processMatches(swapPositions?: { from: Position; to: Position }) {
  let matches = findAllMatches(this.board)
  let combo = 0
  let isFirstMatch = true
  
  while (matches.length > 0) {
    // ... 
    
    // 移除匹配的元素
    const { newBoard } = removeMatches(
      this.board, 
      matches, 
      isFirstMatch ? swapPositions : undefined
    )
    this.board = newBoard
    isFirstMatch = false
    
    // ...
  }
}
```

### 修改3：gameStore.ts - trySwap 方法

```typescript
async trySwap(from: Position, to: Position): Promise<boolean> {
  // ...
  
  // 有匹配，开始消除流程，传递交换位置
  await this.processMatches({ from, to })
  
  // ...
}
```

## 测试场景

1. **主动交换形成4连**：特殊道具应生成在被交换的方块位置
2. **主动交换形成5连**：超级炸弹应生成在被交换的方块位置
3. **连锁反应形成4/5连**：特殊道具应生成在匹配的中间位置（保持原逻辑）
4. **交换位置不在匹配中**：回退到中间位置逻辑

## 影响范围
- `src/utils/gameLogic.ts` - `removeMatches` 函数
- `src/stores/gameStore.ts` - `trySwap` 和 `processMatches` 方法
