<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { isMobileDevice, BOARD_SIZES, type BoardSize } from '../types/game'
import { computed, ref } from 'vue'

const gameStore = useGameStore()
const isMobile = ref(isMobileDevice())

const showSelector = computed(() => !isMobile.value && !gameStore.isPlaying)

const selectSize = (size: BoardSize) => {
  gameStore.setBoardSize(size)
  gameStore.saveBoardSize()
}
</script>

<template>
  <div v-if="showSelector" class="board-size-selector">
    <span class="label">棋盘尺寸:</span>
    <button 
      v-for="size in BOARD_SIZES" 
      :key="size"
      :class="['size-btn', { active: gameStore.boardSize === size }]"
      @click="selectSize(size)"
    >
      {{ size }}x{{ size }}
    </button>
  </div>
</template>

<style scoped>
.board-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.label {
  font-size: 14px;
  color: #666;
}

.size-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.size-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.size-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
