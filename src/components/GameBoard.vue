<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { computed } from 'vue'
import type { Position } from '../types/game'
import GameElement from './GameElement.vue'

const gameStore = useGameStore()

const handleCellClick = (row: number, col: number) => {
  const position: Position = { row, col }
  gameStore.selectElement(position)
}

const isSelected = (row: number, col: number): boolean => {
  return gameStore.selectedElement?.row === row && gameStore.selectedElement?.col === col
}

const isGameOver = computed(() => gameStore.isGameOver)

const animationMatrix = computed(() => {
  const matrix: Record<string, 'matching' | 'falling' | 'swapping' | 'appearing' | null | undefined>[][] = []
  for (let row = 0; row < 8; row++) {
    const rowArr: Record<string, 'matching' | 'falling' | 'swapping' | 'appearing' | null | undefined>[] = []
    for (let col = 0; col < 8; col++) {
      const key = `${row}-${col}`
      rowArr.push(gameStore.animatingElements[key])
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
  }
}

const handleAnimationEnd = (row: number, col: number) => {
  gameStore.setAnimationState({ row, col }, null)
}
</script>

<template>
  <div class="game-board-container">
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
                'disabled': !gameStore.canInteract
              },
              getAnimationClass(rowIndex, colIndex)
            ]"
            @click="handleCellClick(rowIndex, colIndex)"
            @animationend="handleAnimationEnd(rowIndex, colIndex)"
          >
            <GameElement 
              v-if="element"
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
  </div>
</template>

<style scoped>
.game-board-container {
  position: relative;
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
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.board-cell:hover:not(.disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.board-cell.selected {
  transform: scale(1.1);
  box-shadow: 0 0 0 3px #667eea, 0 4px 8px rgba(0, 0, 0, 0.2);
}

.board-cell.disabled {
  cursor: not-allowed;
  opacity: 0.7;
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
    transform: translateY(-60px);
    opacity: 0.5;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.board-cell.swapping {
  animation: swapping 0.25s ease-in-out;
}

@keyframes swapping {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(5px, 0);
  }
  75% {
    transform: translate(-5px, 0);
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
</style>
