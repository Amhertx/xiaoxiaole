<script setup lang="ts">
import { computed } from 'vue'
import type { GameElement } from '../types/game'
import { ELEMENT_COLORS } from '../types/game'

// 定义动画相关的 props
const props = defineProps<{
  element: GameElement
  isMatching?: boolean    // 是否正在消除
  isFalling?: boolean     // 是否正在下落
  isSwapping?: boolean    // 是否正在交换
  isNew?: boolean         // 是否是新元素
  fallDistance?: number   // 下落距离（像素）
}>()

// 定义动画完成事件
const emit = defineEmits<{
  animationComplete: []
}>()

const elementColor = computed(() => ELEMENT_COLORS[props.element.type])

const isSpecial = computed(() => props.element.special !== null)

const specialClass = computed(() => {
  if (props.element.special === 'bomb') return 'special-bomb'
  if (props.element.special === 'superBomb') return 'special-super-bomb'
  return ''
})

// 计算动画样式，使用 transform 优化性能
const animationStyle = computed(() => {
  const style: Record<string, string> = {
    backgroundColor: elementColor.value
  }
  
  // 下落动画初始位置
  if (props.isFalling && props.fallDistance) {
    style.setProperty('--fall-distance', `${props.fallDistance}px`)
  }
  
  return style
})

// 动画完成事件处理
const onAnimationEnd = (event: AnimationEvent) => {
  // 只处理元素自身的动画，避免子元素动画冒泡
  if (event.target === event.currentTarget) {
    emit('animationComplete')
  }
}
</script>

<template>
  <div 
    class="game-element"
    :class="[
      element.type,
      specialClass,
      {
        'animate-matching': isMatching,
        'animate-falling': isFalling,
        'animate-swapping': isSwapping,
        'animate-new': isNew
      }
    ]"
    :style="animationStyle"
    @animationend="onAnimationEnd"
  >
    <!-- 圆形 -->
    <div v-if="element.type === 'circle'" class="shape circle-shape"></div>
    
    <!-- 方形 -->
    <div v-else-if="element.type === 'square'" class="shape square-shape"></div>
    
    <!-- 三角形 -->
    <div v-else-if="element.type === 'triangle'" class="shape triangle-shape"></div>
    
    <!-- 菱形 -->
    <div v-else-if="element.type === 'diamond'" class="shape diamond-shape"></div>
    
    <!-- 五边形 -->
    <div v-else-if="element.type === 'pentagon'" class="shape pentagon-shape"></div>
    
    <!-- 六边形 -->
    <div v-else-if="element.type === 'hexagon'" class="shape hexagon-shape"></div>
    
    <!-- 特殊道具标记 -->
    <div v-if="isSpecial" class="special-indicator">
      <span v-if="element.special === 'bomb'">💣</span>
      <span v-else-if="element.special === 'superBomb'">💥</span>
    </div>
  </div>
</template>

<style scoped>
.game-element {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.shape {
  width: 24px;
  height: 24px;
}

/* 圆形 */
.circle-shape {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
}

/* 方形 */
.square-shape {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 2px;
}

/* 三角形 */
.triangle-shape {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid white;
  background: transparent;
}

/* 菱形 */
.diamond-shape {
  width: 18px;
  height: 18px;
  background: white;
  transform: rotate(45deg);
}

/* 五边形 */
.pentagon-shape {
  width: 24px;
  height: 24px;
  background: white;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

/* 六边形 */
.hexagon-shape {
  width: 24px;
  height: 24px;
  background: white;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

/* 特殊道具样式 */
.special-bomb {
  animation: glow 1.5s ease-in-out infinite;
}

.special-super-bomb {
  animation: glow 1s ease-in-out infinite, rainbow 2s linear infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}

@keyframes rainbow {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.special-indicator {
  position: absolute;
  font-size: 16px;
  animation: bounce 0.6s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* ========== 动画效果样式 ========== */

/* 消除动画：放大后缩小消失 */
.animate-matching {
  animation: matching 0.3s ease-out forwards;
}

@keyframes matching {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 下落动画：从上方下落到位 */
.animate-falling {
  animation: falling 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes falling {
  0% {
    transform: translateY(calc(var(--fall-distance, 0) * -1));
  }
  100% {
    transform: translateY(0);
  }
}

/* 交换动画：平滑过渡 */
.animate-swapping {
  transition: transform 0.25s ease-in-out;
}

/* 新元素动画：从小到大出现 */
.animate-new {
  animation: newElement 0.3s ease-out forwards;
}

@keyframes newElement {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
