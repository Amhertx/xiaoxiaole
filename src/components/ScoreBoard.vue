<template>
  <div class="score-board">
    <div class="score-item">
      <div class="score-label">当前分数</div>
      <div class="score-value current-score">{{ score }}</div>
    </div>

    <div class="score-item">
      <div class="score-label">目标分数</div>
      <div class="score-value target-score">{{ targetScore }}</div>
    </div>

    <div class="score-item">
      <div class="score-label">最高分</div>
      <div class="score-value high-score">{{ highScore }}</div>
    </div>

    <div class="score-item">
      <div class="score-label">剩余步数</div>
      <div class="score-value moves" :class="{ 'low-moves': moves <= 5 }">
        {{ moves }}
      </div>
    </div>

    <div v-if="combo > 1" class="combo-display">
      <div class="combo-label">连击</div>
      <div class="combo-value">x{{ combo }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

// 使用游戏状态管理
const gameStore = useGameStore()

// 计算属性
const score = computed(() => gameStore.score)
const targetScore = computed(() => gameStore.targetScore)
const highScore = computed(() => gameStore.highScore)
const moves = computed(() => gameStore.moves)
const combo = computed(() => gameStore.combo)
</script>

<style scoped>
.score-board {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.score-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.current-score {
  color: #4CAF50;
}

.target-score {
  color: #2196F3;
}

.high-score {
  color: #FF9800;
}

.moves {
  color: #9C27B0;
}

.moves.low-moves {
  color: #F44336;
  animation: pulse-warning 1s ease-in-out infinite;
}

.combo-display {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
  border-radius: 8px;
  animation: combo-glow 0.5s ease-in-out infinite alternate;
}

.combo-label {
  font-size: 16px;
  color: white;
  font-weight: 600;
}

.combo-value {
  font-size: 24px;
  color: white;
  font-weight: bold;
}

@keyframes pulse-warning {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes combo-glow {
  0% {
    box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .score-board {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 15px;
  }

  .score-value {
    font-size: 20px;
  }

  .score-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .score-board {
    gap: 8px;
    padding: 10px;
  }

  .score-value {
    font-size: 18px;
  }

  .score-label {
    font-size: 10px;
  }

  .combo-value {
    font-size: 20px;
  }
}
</style>
