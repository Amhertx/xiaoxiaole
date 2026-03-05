<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { computed } from 'vue'

const gameStore = useGameStore()

const scoreDisplay = computed(() => gameStore.score.toLocaleString())
const highScoreDisplay = computed(() => gameStore.highScore.toLocaleString())

const handleStartGame = () => {
  gameStore.initBoard()
}

const handleResetGame = () => {
  gameStore.resetGame()
}
</script>

<template>
  <div class="game-header">
    <div class="title-section">
      <h1 class="game-title">消消乐</h1>
    </div>
    
    <div class="score-section">
      <div class="score-item">
        <span class="score-label">分数</span>
        <span class="score-value">{{ scoreDisplay }}</span>
      </div>
      <div class="score-item">
        <span class="score-label">最高分</span>
        <span class="score-value high-score">{{ highScoreDisplay }}</span>
      </div>
      <div v-if="gameStore.combo > 1" class="combo-display">
        {{ gameStore.combo }}x 连击!
      </div>
    </div>
    
    <div class="control-section">
      <button 
        v-if="!gameStore.isPlaying" 
        class="btn btn-primary"
        @click="handleStartGame"
      >
        开始游戏
      </button>
      <button 
        v-else 
        class="btn btn-secondary"
        @click="handleResetGame"
      >
        重新开始
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.title-section {
  flex: 1;
}

.game-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.score-section {
  display: flex;
  align-items: center;
  gap: 30px;
  flex: 2;
  justify-content: center;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.high-score {
  color: #FF6B6B;
}

.combo-display {
  font-size: 18px;
  font-weight: bold;
  color: #FF6B6B;
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.control-section {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
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

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}
</style>
