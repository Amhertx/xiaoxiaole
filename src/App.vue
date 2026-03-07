<script setup lang="ts">
import GameBoard from './components/GameBoard.vue'
import GameHeader from './components/GameHeader.vue'
import { useGameStore } from './stores/gameStore'
import { onMounted } from 'vue'

const gameStore = useGameStore()

onMounted(() => {
  gameStore.loadBoardSize()
  gameStore.loadHighScore()
})
</script>

<template>
  <div class="app-wrapper">
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
  align-items: flex-start;
  padding-top: 20px;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

@media (max-width: 768px) {
  body {
    padding: 10px;
  }
}
</style>
