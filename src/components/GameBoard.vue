<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Position } from '../types/game'
import GameElement from './GameElement.vue'

const gameStore = useGameStore()
const HINT_DELAY = 10000
const SWIPE_THRESHOLD = 30
const LONG_PRESS_DELAY = 500

const CELL_SIZE = computed(() => gameStore.boardSize === 6 ? 68 : 54)

const hintTimer = ref<number | null>(null)
const longPressTimer = ref<number | null>(null)
const interactionStart = ref<{ row: number; col: number; x: number; y: number } | null>(null)
const hasMoved = ref(false)

const startHintTimer = () => {
  if (hintTimer.value) {
    clearInterval(hintTimer.value)
  }
  
  hintTimer.value = window.setInterval(() => {
    if (!gameStore.canInteract) return
    if (gameStore.isShowingHint) return
    
    const now = Date.now()
    const elapsed = now - gameStore.lastInteractionTime
    
    if (elapsed >= HINT_DELAY) {
      gameStore.showHint()
    }
  }, 1000)
}

const stopHintTimer = () => {
  if (hintTimer.value) {
    clearInterval(hintTimer.value)
    hintTimer.value = null
  }
}

const clearLongPressTimer = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

onMounted(() => {
  startHintTimer()
})

onUnmounted(() => {
  stopHintTimer()
  clearLongPressTimer()
})

const handleCellClick = (row: number, col: number) => {
  if (gameStore.isDragging) return
  const position: Position = { row, col }
  gameStore.selectElement(position)
}

const handleInteractionStart = (row: number, col: number, x: number, y: number) => {
  if (!gameStore.canInteract) return
  
  interactionStart.value = { row, col, x, y }
  hasMoved.value = false
  
  // 立即开始预拖动，让元素跟随手指移动
  gameStore.startDrag({ row, col })
  
  clearLongPressTimer()
  longPressTimer.value = window.setTimeout(() => {
    if (!hasMoved.value && interactionStart.value) {
      // 长按不做额外操作，已经处于拖动状态
    }
  }, LONG_PRESS_DELAY)
}

const handleInteractionMove = (currentX: number, currentY: number) => {
  if (!interactionStart.value) return
  
  const { row, col, x, y } = interactionStart.value
  const dx = currentX - x
  const dy = currentY - y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  const cellWidth = CELL_SIZE.value - 4
  const gap = 4
  const cellStep = cellWidth + gap
  
  // 限制拖动距离，最多移动一个格子的距离
  const maxOffset = cellStep
  const clampedDx = Math.max(-maxOffset, Math.min(maxOffset, dx))
  const clampedDy = Math.max(-maxOffset, Math.min(maxOffset, dy))
  
  if (distance > SWIPE_THRESHOLD) {
    hasMoved.value = true
    clearLongPressTimer()
  }
  
  if (gameStore.isDragging) {
    gameStore.updateDrag({ x: clampedDx, y: clampedDy })
    updateDragTarget(row, col, clampedDx, clampedDy)
  }
}

const updateDragTarget = (startRow: number, startCol: number, dx: number, dy: number) => {
  const cellWidth = CELL_SIZE.value - 4
  const gap = 4
  const cellStep = cellWidth + gap
  const colOffset = Math.round(dx / cellStep)
  const rowOffset = Math.round(dy / cellStep)
  
  if (Math.abs(colOffset) > 1 || Math.abs(rowOffset) > 1) {
    gameStore.setDragTarget(null)
    return
  }
  
  if (colOffset !== 0 && rowOffset !== 0) {
    gameStore.setDragTarget(null)
    return
  }
  
  if (colOffset === 0 && rowOffset === 0) {
    gameStore.setDragTarget(null)
    return
  }
  
  const targetRow = startRow + rowOffset
  const targetCol = startCol + colOffset
  
  if (targetRow >= 0 && targetRow < gameStore.boardSize && 
      targetCol >= 0 && targetCol < gameStore.boardSize) {
    gameStore.setDragTarget({ row: targetRow, col: targetCol })
  } else {
    gameStore.setDragTarget(null)
  }
}

const handleInteractionEnd = (endX: number, endY: number) => {
  clearLongPressTimer()
  
  if (!interactionStart.value) return
  
  const { row, col, x, y } = interactionStart.value
  const dx = endX - x
  const dy = endY - y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  
  // 如果正在拖动
  if (gameStore.isDragging) {
    // 如果有明确的拖动目标，执行交换
    if (gameStore.dragTarget) {
      gameStore.endDrag()
    } else if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
      // 移动距离太小，视为点击
      gameStore.resetDragState()
      gameStore.selectElement({ row, col })
    } else {
      // 根据滑动方向确定目标
      let targetRow = row
      let targetCol = col
      
      if (absDx > absDy) {
        targetCol = dx > 0 ? col + 1 : col - 1
      } else {
        targetRow = dy > 0 ? row + 1 : row - 1
      }
      
      if (targetRow >= 0 && targetRow < gameStore.boardSize && 
          targetCol >= 0 && targetCol < gameStore.boardSize) {
        gameStore.setDragTarget({ row: targetRow, col: targetCol })
        gameStore.endDrag()
      } else {
        gameStore.resetDragState()
      }
    }
  }
  
  interactionStart.value = null
}

const handleTouchStart = (row: number, col: number, event: TouchEvent) => {
  const touch = event.touches[0]
  handleInteractionStart(row, col, touch.clientX, touch.clientY)
}

const handleTouchMove = (event: TouchEvent) => {
  if (!interactionStart.value) return
  event.preventDefault()
  const touch = event.touches[0]
  handleInteractionMove(touch.clientX, touch.clientY)
}

const handleTouchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  handleInteractionEnd(touch.clientX, touch.clientY)
}

const handleMouseDown = (row: number, col: number, event: MouseEvent) => {
  handleInteractionStart(row, col, event.clientX, event.clientY)
}

const handleMouseMove = (event: MouseEvent) => {
  handleInteractionMove(event.clientX, event.clientY)
}

const handleMouseUp = (event: MouseEvent) => {
  handleInteractionEnd(event.clientX, event.clientY)
}

const handleMouseLeave = () => {
  if (gameStore.isDragging) {
    gameStore.resetDragState()
  }
  clearLongPressTimer()
  interactionStart.value = null
}

const isSelected = (row: number, col: number): boolean => {
  return gameStore.selectedElement?.row === row && gameStore.selectedElement?.col === col
}

const isHintPosition = (row: number, col: number): boolean => {
  return gameStore.hintPositions.some(
    pos => pos.row === row && pos.col === col
  )
}

const isDragging = (row: number, col: number): boolean => {
  return gameStore.isDragging && 
         gameStore.draggingElement?.row === row && 
         gameStore.draggingElement?.col === col
}

const isDragTarget = (row: number, col: number): boolean => {
  return gameStore.dragTarget?.row === row && gameStore.dragTarget?.col === col
}

const isGameOver = computed(() => gameStore.isGameOver)

const specialEffectStyle = computed(() => {
  const effect = gameStore.specialEffect
  if (!effect) return null
  
  const cellWidth = CELL_SIZE.value - 4
  const gap = 4
  const padding = 10
  
  const x = effect.position.col * (cellWidth + gap) + padding + cellWidth / 2
  const y = effect.position.row * (cellWidth + gap) + padding + cellWidth / 2
  
  return {
    type: effect.type,
    x,
    y,
    affectedPositions: effect.affectedPositions
  }
})

const animationMatrix = computed(() => {
  const matrix: (string | null)[][] = []
  for (let row = 0; row < gameStore.boardSize; row++) {
    const rowArr: (string | null)[] = []
    for (let col = 0; col < gameStore.boardSize; col++) {
      const key = `${row}-${col}`
      rowArr.push(gameStore.animatingElements[key] || null)
    }
    matrix.push(rowArr)
  }
  return matrix
})

const getAnimationClass = (row: number, col: number): Record<string, boolean> => {
  const state = animationMatrix.value[row]?.[col]
  return {
    'matching': state === 'matching',
    'falling': state === 'falling',
    'swapping': state === 'swapping',
    'appearing': state === 'appearing',
    'bomb-explode': state === 'bomb-explode',
    'superBomb-cross': state === 'superBomb-cross',
  }
}

const getSwapAnimationStyle = (row: number, col: number): Record<string, string> => {
  const swap = gameStore.swapAnimation
  if (!swap) return {}
  
  const pos = { row, col }
  const isFrom = swap.from.row === row && swap.from.col === col
  const isTo = swap.to.row === row && swap.to.col === col
  
  if (!isFrom && !isTo) return {}
  
  const cellWidth = CELL_SIZE.value - 4
  const gap = 4
  const cellStep = cellWidth + gap
  
  let dx = 0, dy = 0
  if (isFrom) {
    dx = (swap.to.col - swap.from.col) * cellStep
    dy = (swap.to.row - swap.from.row) * cellStep
  } else if (isTo) {
    dx = (swap.from.col - swap.to.col) * cellStep
    dy = (swap.from.row - swap.to.row) * cellStep
  }
  
  return {
    '--swap-x': `${dx}px`,
    '--swap-y': `${dy}px`,
  }
}

const getFallingAnimationStyle = (row: number, col: number): Record<string, string> => {
  const fallAnim = gameStore.fallingAnimations.find(
    a => a.to.row === row && a.to.col === col
  )
  if (!fallAnim) return {}
  
  const cellWidth = CELL_SIZE.value - 4
  const gap = 4
  const dropDistance = (fallAnim.to.row - fallAnim.from.row) * (cellWidth + gap)
  return {
    '--fall-distance': `${dropDistance}px`,
  }
}

const getDragStyle = (row: number, col: number): Record<string, string> => {
  if (!isDragging(row, col)) return {}
  
  return {
    '--drag-x': `${gameStore.dragOffset.x}px`,
    '--drag-y': `${gameStore.dragOffset.y}px`,
  }
}

const getAnimationStyle = (row: number, col: number): Record<string, string> => {
  const state = animationMatrix.value[row]?.[col]
  if (state === 'swapping') {
    return getSwapAnimationStyle(row, col)
  }
  if (state === 'falling') {
    return getFallingAnimationStyle(row, col)
  }
  if (isDragging(row, col)) {
    return getDragStyle(row, col)
  }
  return {}
}

const handleAnimationEnd = (row: number, col: number) => {
  // 只有在非动画状态时才清除，避免与 store 的动画管理冲突
  const state = animationMatrix.value[row]?.[col]
  if (state === 'falling' || state === 'appearing') {
    // 下落和出现动画由 store 管理，不在这里清除
    return
  }
  gameStore.setAnimationState({ row, col }, null)
}
</script>

<template>
  <div 
    class="game-board-container" 
    @mouseup="handleMouseUp" 
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @touchmove="handleTouchMove"
  >
    <div class="game-board">
      <div 
        v-for="(row, rowIndex) in gameStore.board" 
        :key="rowIndex"
        class="board-row"
      >
        <div class="board-row-inner">
          <div
            v-for="(element, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            class="board-cell"
            :class="[ 
              { 
                'selected': isSelected(rowIndex, colIndex),
                'disabled': !gameStore.canInteract,
                'hint-shake': isHintPosition(rowIndex, colIndex),
                'dragging': isDragging(rowIndex, colIndex),
                'drag-target': isDragTarget(rowIndex, colIndex)
              },
              getAnimationClass(rowIndex, colIndex)
            ]"
            :style="{ ...getAnimationStyle(rowIndex, colIndex), '--cell-size': `${CELL_SIZE - 4}px` }"
            @click="handleCellClick(rowIndex, colIndex)"
            @touchstart.prevent="handleTouchStart(rowIndex, colIndex, $event)"
            @touchend="handleTouchEnd($event)"
            @mousedown="handleMouseDown(rowIndex, colIndex, $event)"
            @animationend="handleAnimationEnd(rowIndex, colIndex)"
          >
            <GameElement 
              v-if="element"
              :key="element.id"
              :element="element"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isGameOver" class="game-over-overlay">
      <div class="game-over-content">
        <h2>游戏结束!</h2>
        <p class="final-score">最终分数: {{ gameStore.score }}</p>
        <button class="btn btn-primary" @click="gameStore.resetGame">
          再玩一次
        </button>
      </div>
    </div>
    
    <Transition name="combo">
      <div v-if="gameStore.combo > 1" class="combo-display">
        <span class="combo-number">{{ gameStore.combo }}</span>
        <span class="combo-text">连击!</span>
      </div>
    </Transition>
    
    <!-- 特殊道具特效层 -->
    <Transition name="effect">
      <div v-if="specialEffectStyle" class="special-effect-layer">
        <!-- 炸弹爆炸特效 -->
        <div 
          v-if="specialEffectStyle.type === 'bomb'" 
          class="bomb-effect"
          :style="{ left: `${specialEffectStyle.x}px`, top: `${specialEffectStyle.y}px` }"
        >
          <div class="bomb-flash"></div>
          <div class="bomb-wave"></div>
        </div>
        
        <!-- 超级炸弹十字特效 -->
        <div 
          v-if="specialEffectStyle.type === 'superBomb'" 
          class="superbomb-effect"
          :style="{ left: `${specialEffectStyle.x}px`, top: `${specialEffectStyle.y}px` }"
        >
          <div class="cross-flash"></div>
          <div class="cross-h"></div>
          <div class="cross-v"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.game-board-container {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 20px 30px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.game-board {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.board-row {
  display: flex;
  gap: 4px;
}

.board-row-inner {
  display: flex;
  gap: 4px;
}

.board-cell {
  width: var(--cell-size, 50px);
  height: var(--cell-size, 50px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.board-cell:hover:not(.disabled):not(.selected):not(.dragging) {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.board-cell.selected {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.board-cell.disabled {
  cursor: not-allowed;
}

.board-cell.dragging {
  transform: scale(1.15) translate(var(--drag-x, 0), var(--drag-y, 0));
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  z-index: 100;
  cursor: grabbing;
  pointer-events: none;
}

.board-cell.drag-target {
  box-shadow: 0 0 0 3px #4ECDC4, 0 0 15px rgba(78, 205, 196, 0.5);
  background: rgba(78, 205, 196, 0.1);
}

.board-cell.hint-shake {
  animation: hintShake 5s ease-in-out infinite;
}

@keyframes hintShake {
  0%, 9%, 100% {
    transform: translateX(0);
  }
  1% {
    transform: translateX(-3px);
  }
  2% {
    transform: translateX(3px);
  }
  3% {
    transform: translateX(-3px);
  }
  4% {
    transform: translateX(3px);
  }
  5% {
    transform: translateX(0);
  }
}

.board-cell.matching {
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

.board-cell.falling {
  animation: falling 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes falling {
  0% {
    transform: translateY(calc(var(--fall-distance, -60px) * -1));
  }
  100% {
    transform: translateY(0);
  }
}

.board-cell.swapping {
  animation: swapping 0.3s ease-in-out forwards;
}

@keyframes swapping {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(var(--swap-x, 0), var(--swap-y, 0));
  }
}

.board-cell.appearing {
  animation: appearing 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes appearing {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-over-content {
  text-align: center;
  color: white;
}

.game-over-content h2 {
  font-size: 32px;
  margin-bottom: 20px;
}

.final-score {
  font-size: 24px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.combo-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.combo-number {
  font-size: 72px;
  font-weight: 900;
  background: linear-gradient(135deg, #FFD700 0%, #FF6B6B 50%, #FF4757 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(255, 107, 107, 0.5);
  animation: comboPulse 0.4s ease-in-out infinite, comboBounce 0.6s ease-out;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

.combo-text {
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 10px rgba(255, 107, 107, 0.8), 0 0 20px rgba(255, 215, 0, 0.6);
  animation: comboTextPop 0.6s ease-out;
  letter-spacing: 4px;
}

@keyframes comboPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes comboBounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes comboTextPop {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.combo-enter-active {
  animation: comboEnter 0.5s ease-out;
}

.combo-leave-active {
  animation: comboLeave 0.3s ease-in;
}

@keyframes comboEnter {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes comboLeave {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

/* ========== 特殊道具特效 ========== */

.board-cell.bomb-explode {
  animation: bombExplode 0.4s ease-out forwards;
}

@keyframes bombExplode {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  20% {
    transform: scale(1.2);
    filter: brightness(2);
  }
  40% {
    transform: scale(1.4);
    filter: brightness(3);
    box-shadow: 0 0 30px #FF6B00;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

.board-cell.superBomb-cross {
  animation: superBombCross 0.5s ease-out forwards;
}

@keyframes superBombCross {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  15% {
    filter: brightness(3);
    box-shadow: 0 0 20px #FFD700;
  }
  30% {
    filter: brightness(4);
    box-shadow: 0 0 40px #FFD700;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 特效层容器 */
.special-effect-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 12px;
}

/* 炸弹爆炸特效 */
.bomb-effect {
  position: absolute;
}

.bomb-flash {
  position: absolute;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, #fff 0%, #FF6B00 50%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: bombFlash 0.3s ease-out forwards;
}

@keyframes bombFlash {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.bomb-wave {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 4px solid #FF6B00;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: bombWave 0.4s ease-out forwards;
}

@keyframes bombWave {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* 超级炸弹十字特效 */
.superbomb-effect {
  position: absolute;
}

.cross-flash {
  position: absolute;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #fff 0%, #FFD700 40%, transparent 60%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: crossFlash 0.3s ease-out forwards;
}

@keyframes crossFlash {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.cross-h,
.cross-v {
  position: absolute;
  background: linear-gradient(90deg, transparent 0%, #FFD700 30%, #fff 50%, #FFD700 70%, transparent 100%);
  transform: translate(-50%, -50%);
  animation: crossExpand 0.4s ease-out forwards;
}

.cross-h {
  width: 0;
  height: 20px;
}

.cross-v {
  width: 20px;
  height: 0;
  background: linear-gradient(180deg, transparent 0%, #FFD700 30%, #fff 50%, #FFD700 70%, transparent 100%);
}

@keyframes crossExpand {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.cross-h {
  animation: crossExpandH 0.4s ease-out forwards;
}

.cross-v {
  animation: crossExpandV 0.4s ease-out forwards;
}

@keyframes crossExpandH {
  0% {
    width: 0;
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    width: 600px;
    opacity: 0;
  }
}

@keyframes crossExpandV {
  0% {
    height: 0;
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    height: 600px;
    opacity: 0;
  }
}

/* 特效过渡动画 */
.effect-enter-active {
  animation: effectFadeIn 0.1s ease-out;
}

.effect-leave-active {
  animation: effectFadeOut 0.1s ease-in;
}

@keyframes effectFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes effectFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 768px) {
  .game-board-container {
    padding: 15px;
    border-radius: 12px;
  }
}
</style>
