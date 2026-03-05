<template>
  <div class="game-controls">
    <button
      v-if="!isPlaying"
      class="control-button start-button"
      @click="handleStart"
    >
      开始游戏
    </button>

    <button
      v-if="isPlaying"
      class="control-button restart-button"
      @click="handleRestart"
    >
      重新开始
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

// 使用游戏状态管理
const gameStore = useGameStore()

// 计算属性
const isPlaying = computed(() => gameStore.isPlaying)

// 开始游戏
const handleStart = () => {
  gameStore.startGame()
}

// 重新开始游戏
const handleRestart = () => {
  gameStore.restartGame()
}
</script>

<style scoped>
.game-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px;
}

.control-button {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.start-button:active {
  transform: translateY(0);
}

.restart-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.restart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(245, 87, 108, 0.4);
}

.restart-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-controls {
    padding: 15px;
    gap: 10px;
  }

  .control-button {
    padding: 12px 30px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .game-controls {
    padding: 10px;
    gap: 8px;
  }

  .control-button {
    padding: 10px 25px;
    font-size: 14px;
  }
}
</style>
