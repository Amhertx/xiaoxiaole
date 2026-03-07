# 特殊道具特效实现计划

## 目标
为特殊道具（炸弹💣、超级炸弹💥）触发时添加视觉特效，增强游戏体验。

## 当前状态分析

### 特殊道具类型
- **bomb（炸弹）**：消除周围 3x3 范围内的方块
- **superBomb（超级炸弹）**：消除整行和整列的方块

### 现有动画系统
- `matching`：消除动画（缩放消失）
- `falling`：下落动画
- `swapping`：交换动画
- `appearing`：出现动画

## 实现方案

### 1. 扩展动画状态类型
**文件**: `src/types/game.ts`

在 `animatingElements` 中新增动画状态：
- `'bomb-explode'`：炸弹爆炸特效
- `'superBomb-cross'`：超级炸弹十字特效

### 2. 添加特效状态管理
**文件**: `src/stores/gameStore.ts`

新增状态：
```typescript
specialEffect: {
  type: 'bomb' | 'superBomb' | null,
  position: Position | null,
  affectedPositions: Position[]
} | null
```

新增 actions：
- `triggerSpecialEffectAnimation(position, type, affectedPositions)`：触发特效动画
- `clearSpecialEffect()`：清除特效状态

### 3. 实现视觉特效
**文件**: `src/components/GameBoard.vue`

#### 炸弹特效 (bomb)
- 从触发位置向外扩散的爆炸波纹
- 3x3 范围内的方块依次闪烁后消除
- 效果：中心亮白色闪光 → 橙色波纹扩散 → 方块消除

#### 超级炸弹特效 (superBomb)
- 十字光芒从中心向四个方向射出
- 整行和整列的方块依次点亮后消除
- 效果：中心强烈闪光 → 十字光芒扩散 → 方块消除

### 4. CSS 动画实现

```css
/* 炸弹爆炸特效 */
.special-bomb-effect {
  animation: bombExplode 0.4s ease-out forwards;
}

@keyframes bombExplode {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  30% {
    transform: scale(1.3);
    filter: brightness(2);
    box-shadow: 0 0 30px #FF6B00;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 超级炸弹十字特效 */
.special-superbomb-effect {
  animation: superBombCross 0.5s ease-out forwards;
}

@keyframes superBombCross {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  20% {
    filter: brightness(3);
    box-shadow: 0 0 40px #FFD700;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
```

### 5. 波纹扩散效果
在棋盘容器上添加绝对定位的特效层：
- 炸弹：圆形波纹从中心扩散
- 超级炸弹：十字光芒从中心扩散

## 实现步骤

### Step 1: 扩展类型定义
- [ ] 在 `game.ts` 中添加特效相关类型

### Step 2: 更新 Store
- [ ] 在 `gameStore.ts` 中添加特效状态
- [ ] 修改 `triggerSpecialsInMatch` 方法，触发特效动画
- [ ] 添加特效动画的延迟处理

### Step 3: 实现组件特效
- [ ] 在 `GameBoard.vue` 中添加特效渲染逻辑
- [ ] 添加 CSS 动画样式
- [ ] 实现波纹/光芒扩散效果

### Step 4: 测试验证
- [ ] 测试炸弹特效
- [ ] 测试超级炸弹特效
- [ ] 验证动画流畅性

## 特效时序

```
炸弹触发 → 中心闪光(0.1s) → 波纹扩散(0.2s) → 方块消除动画(0.3s) → 下落填充
超级炸弹触发 → 中心闪光(0.1s) → 十字光芒(0.2s) → 方块消除动画(0.3s) → 下落填充
```

总时长约 0.5-0.6 秒，保持游戏节奏流畅。
