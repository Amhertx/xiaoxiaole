# 修复特殊道具被消除时激活的问题

## 问题分析

当前代码存在严重的逻辑错误：

### 问题所在
在 `processMatches` 方法中：
1. **第168-175行**：收集被消除的特殊道具位置
2. **第194-196行**：调用 `removeMatches` 移除匹配元素（特殊道具被设置为 null）
3. **第203-206行**：调用 `triggerSpecialsInMatch` 触发特殊道具效果

**关键问题**：当执行到第3步时，`this.board[pos.row][pos.col]` 已经是 `null`，导致 `triggerSpecialEffect` 函数在第269-270行检查时返回空数组，特殊道具无法被激活！

```typescript
// gameLogic.ts 第269-270行
const element = board[position.row]?.[position.col]
if (!element?.special) return []  // element 已经是 null，直接返回空数组
```

## 修复方案

### 方案一：在移除前收集特殊道具信息（推荐）

**优点**：
- 逻辑清晰，符合直觉
- 不需要修改 `triggerSpecialEffect` 函数
- 保持代码结构简单

**实施步骤**：
1. 在 `processMatches` 中，收集被消除的特殊道具时，同时保存其类型信息
2. 修改 `triggerSpecialsInMatch` 方法签名，接收特殊道具的类型信息
3. 在 `triggerSpecialsInMatch` 中，直接使用保存的类型信息，不依赖 board 状态

### 方案二：调整执行顺序

**优点**：
- 代码改动最小
- 保持现有函数签名

**缺点**：
- 可能影响动画流畅度
- 需要处理复杂的时序问题

## 实施计划（采用方案一）

### 步骤1：修改数据结构
在 `gameStore.ts` 中定义接口：
```typescript
interface SpecialItemInfo {
  position: Position
  specialType: SpecialType
}
```

### 步骤2：修改 processMatches 方法
- 在收集特殊道具位置时，同时保存类型信息
- 传递完整信息给 `triggerSpecialsInMatch`

### 步骤3：修改 triggerSpecialsInMatch 方法
- 接收 `SpecialItemInfo[]` 参数
- 不再依赖 `this.board` 获取特殊道具类型
- 直接使用传入的类型信息计算影响范围

### 步骤4：修改 triggerSpecialEffect 函数
- 添加重载版本，接收特殊类型参数
- 保持向后兼容

### 步骤5：测试验证
- 测试单个特殊道具被消除
- 测试多个特殊道具同时被消除
- 测试连锁触发场景

## 预期效果

修复后：
- ✅ 特殊道具被匹配消除时，正确触发效果
- ✅ 支持多个特殊道具同时触发
- ✅ 支持连锁反应（一个道具触发影响其他道具）
- ✅ 动画流畅，无闪烁
