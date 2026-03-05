<template>
  <transition name="modal">
    <div v-if="isGameOver" class="game-over-overlay" @click="handleOverlayClick">
      <div class="game-over-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ isWin ? '恭喜过关！' : '游戏结束' }}</h2>
          <div class="modal-icon">{{ isWin ? '🎉' : '😢' }}</div>
        </div>

        <div class="modal-body">
          <div class="final-score">
            <div class="score-label">最终得分</div>
            <div class="score-number">{{ score }}</div>
          </div>

          <div v-if="score >= highScore && score > 0" class="new-record">
            新纪录！
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">目标分数</div>
              <div class="stat-value">{{ targetScore }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最高分</div>
              <div class="stat-value">{{ highScore }}</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-button restart" @click="handleRestart">
            再玩一次
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

// 使用游戏状态管理
const gameStore = useGameStore()

// 计算属性
const isGameOver = computed(() => gameStore.isGameOver)
const isWin = computed(() => gameStore.isWin)
const score = computed(() => gameStore.score)
const highScore = computed(() => gameStore.highScore)
const targetScore = computed(() => gameStore.targetScore)

// 重新开始游戏
const handleRestart = () => {
  gameStore.restartGame()
}

// 点击遮罩层（可选：关闭弹窗）
const handleOverlayClick = () => {
  // 可以选择点击遮罩层重新开始游戏
  // handleRestart()
}
</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.game-over-modal {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-bounce 0.3s ease-out;
}

.modal-header {
  text-align: center;
  margin-bottom: 25px;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0 0 15px 0;
}

.modal-icon {
  font-size: 60px;
  animation: bounce 1s ease-in-out infinite;
}

.modal-body {
  margin-bottom: 25px;
}

.final-score {
  text-align: center;
  margin-bottom: 20px;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.new-record {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #FF6B6B;
  margin-bottom: 20px;
  animation: pulse 1s ease-in-out infinite;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.modal-footer {
  display: flex;
  justify-content: center;
}

.action-button {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.action-button.restart {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-button.restart:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.action-button.restart:active {
  transform: translateY(0);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .game-over-modal,
.modal-leave-active .game-over-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .game-over-modal,
.modal-leave-to .game-over-modal {
  transform: scale(0.9);
}

@keyframes modal-bounce {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-over-modal {
    padding: 25px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-icon {
    font-size: 50px;
  }

  .score-number {
    font-size: 40px;
  }

  .action-button {
    padding: 12px 35px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .game-over-modal {
    padding: 20px;
  }

  .modal-title {
    font-size: 22px;
  }

  .modal-icon {
    font-size: 40px;
  }

  .score-number {
    font-size: 36px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-item {
    padding: 12px;
  }

  .action-button {
    padding: 10px 30px;
    font-size: 15px;
  }
}
</style>
