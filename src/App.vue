<script setup lang="ts">
import GameBoard from './components/GameBoard.vue'
import GameHeader from './components/GameHeader.vue'
import { useGameStore } from './stores/gameStore'
import { onMounted } from 'vue'

const gameStore = useGameStore()

onMounted(() => {
  gameStore.loadHighScore()
})
</script>

<template>
  <div class="game-container">
    <GameHeader />
    <GameBoard />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
</style>
