import { defineStore } from 'pinia'
import type { GameState, GameElement, Position, Match } from '../types/game'
import { STORAGE_KEYS } from '../types/game'
import {
  initializeBoard,
  findAllMatches,
  areAdjacent,
  swapElements,
  removeMatches,
  dropElements,
  fillBoard,
  calculateScore,
  hasValidMoves,
  triggerSpecialEffect,
} from '../utils/gameLogic'

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    board: [],
    score: 0,
    combo: 0,
    highScore: 0,
    isGameOver: false,
    isPlaying: false,
    selectedElement: null,
    isAnimating: false,
    animatingElements: {} as Record<string, 'matching' | 'falling' | 'swapping' | 'appearing' | null>,
  }),

  getters: {
    getElement: (state) => (row: number, col: number): GameElement | null => {
      return state.board[row]?.[col] || null
    },

    canInteract: (state): boolean => {
      return state.isPlaying && !state.isGameOver && !state.isAnimating
    },

    isPositionAnimating: (state) => (position: Position): boolean => {
      const key = `${position.row}-${position.col}`
      return !!state.animatingElements[key]
    },

    getAnimationState: (state) => (position: Position): 'matching' | 'falling' | 'swapping' | 'appearing' | null | undefined => {
      const key = `${position.row}-${position.col}`
      return state.animatingElements[key]
    },
  },

  actions: {
    setAnimationState(position: Position, state: 'matching' | 'falling' | 'swapping' | 'appearing' | null) {
      const key = `${position.row}-${position.col}`
      if (state) {
        this.animatingElements = { ...this.animatingElements, [key]: state }
      } else {
        const { [key]: _, ...rest } = this.animatingElements
        this.animatingElements = rest
      }
    },

    clearAnimationStates() {
      this.animatingElements = {}
    },

    setBatchAnimationStates(positions: Position[], state: 'matching' | 'falling' | 'swapping' | 'appearing') {
      const updates: Record<string, 'matching' | 'falling' | 'swapping' | 'appearing'> = {}
      positions.forEach(pos => {
        updates[`${pos.row}-${pos.col}`] = state
      })
      this.animatingElements = { ...this.animatingElements, ...updates }
    },

    initBoard() {
      this.board = initializeBoard()
      this.score = 0
      this.combo = 0
      this.isGameOver = false
      this.isPlaying = true
      this.selectedElement = null
      this.isAnimating = false
      this.animatingElements = {}
    },

    /**
     * 尝试交换元素
     */
    async trySwap(from: Position, to: Position): Promise<boolean> {
      if (!this.canInteract) return false
      if (!areAdjacent(from, to)) return false

      this.isAnimating = true

      // 标记交换动画
      this.setAnimationState(from, 'swapping')
      this.setAnimationState(to, 'swapping')

      // 执行交换
      this.board = swapElements(this.board, from, to)

      // 等待交换动画完成 (250ms)
      await this.delay(250)

      // 清除交换动画状态
      this.setAnimationState(from, null)
      this.setAnimationState(to, null)

      // 检查是否有匹配
      const matches = findAllMatches(this.board)

      if (matches.length === 0) {
        // 没有匹配，交换回来
        this.setAnimationState(from, 'swapping')
        this.setAnimationState(to, 'swapping')
        this.board = swapElements(this.board, from, to)
        await this.delay(250)
        this.setAnimationState(from, null)
        this.setAnimationState(to, null)
        this.isAnimating = false
        return false
      }

      // 有匹配，开始消除流程
      await this.processMatches()
      
      // 检查游戏是否结束
      this.checkGameOver()
      
      this.isAnimating = false
      return true
    },

    /**
     * 处理匹配消除流程
     */
    async processMatches() {
      let matches = findAllMatches(this.board)
      let combo = 0
      
      while (matches.length > 0) {
        combo++
        this.combo = combo
        
        // 收集所有匹配位置
        const matchPositions: Position[] = []
        matches.forEach(match => {
          matchPositions.push(...match.positions)
        })

        // 标记匹配元素，开始消除动画
        this.setBatchAnimationStates(matchPositions, 'matching')

        // 计算分数
        const totalMatched = matches.reduce((sum, m) => sum + m.positions.length, 0)
        const hasSpecial = matches.some(m => m.positions.length >= 4)
        this.score += calculateScore(totalMatched, combo, hasSpecial)
        
        // 更新最高分
        if (this.score > this.highScore) {
          this.highScore = this.score
          this.saveHighScore()
        }

        // 等待消除动画 (300ms)
        await this.delay(300)

        // 移除匹配的元素
        const { newBoard } = removeMatches(this.board, matches)
        this.board = newBoard

        // 清除匹配动画状态
        matchPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 元素下落动画
        this.board = dropElements(this.board)
        
        // 标记下落动画元素（检测哪些位置有元素变化）
        const fallPositions: Position[] = []
        for (let row = 0; row < this.board.length; row++) {
          for (let col = 0; col < this.board[row].length; col++) {
            if (this.board[row][col]) {
              fallPositions.push({ row, col })
            }
          }
        }
        this.setBatchAnimationStates(fallPositions, 'falling')
        
        // 等待下落动画 (400ms)
        await this.delay(400)

        // 清除下落动画状态
        fallPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 填充新元素
        this.board = fillBoard(this.board)
        
        // 标记新元素动画
        const newPositions: Position[] = []
        for (let row = 0; row < this.board.length; row++) {
          for (let col = 0; col < this.board[row].length; col++) {
            if (this.board[row][col]) {
              const key = `${row}-${col}`
              // 检查是否是新元素（不在之前的位置集合中）
              const isNew = !matchPositions.some(p => `${p.row}-${p.col}` === key) &&
                           !fallPositions.some(p => `${p.row}-${p.col}` === key)
              if (isNew) {
                newPositions.push({ row, col })
              }
            }
          }
        }
        this.setBatchAnimationStates(newPositions, 'appearing')

        // 等待新元素出现动画 (300ms)
        await this.delay(300)

        // 清除新元素动画状态
        newPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 检查新的匹配
        matches = findAllMatches(this.board)
      }

      // 重置连击
      this.combo = 0
    },

    /**
     * 触发特殊道具
     */
    async activateSpecial(position: Position) {
      if (!this.canInteract) return

      const element = this.board[position.row]?.[position.col]
      if (!element?.special) return

      this.isAnimating = true

      // 获取特殊道具影响的位置
      const affectedPositions = triggerSpecialEffect(this.board, position)
      
      if (affectedPositions.length > 0) {
        // 标记动画元素
        this.setBatchAnimationStates(affectedPositions, 'matching')

        // 计算分数
        this.score += calculateScore(affectedPositions.length, this.combo, true)
        
        // 更新最高分
        if (this.score > this.highScore) {
          this.highScore = this.score
          this.saveHighScore()
        }

        // 等待消除动画 (300ms)
        await this.delay(300)

        // 清除动画状态
        affectedPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 移除受影响的元素
        for (const pos of affectedPositions) {
          this.board[pos.row][pos.col] = null as any
        }

        // 元素下落动画
        this.board = dropElements(this.board)
        
        // 标记下落动画
        const fallPositions: Position[] = []
        for (let row = 0; row < this.board.length; row++) {
          for (let col = 0; col < this.board[row].length; col++) {
            if (this.board[row][col]) {
              fallPositions.push({ row, col })
            }
          }
        }
        this.setBatchAnimationStates(fallPositions, 'falling')

        // 等待下落动画 (400ms)
        await this.delay(400)

        // 清除下落动画状态
        fallPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 填充新元素
        this.board = fillBoard(this.board)

        // 标记新元素动画
        const newPositions: Position[] = []
        for (let row = 0; row < this.board.length; row++) {
          for (let col = 0; col < this.board[row].length; col++) {
            if (this.board[row][col]) {
              const key = `${row}-${col}`
              const isNew = !affectedPositions.some(p => `${p.row}-${p.col}` === key) &&
                           !fallPositions.some(p => `${p.row}-${p.col}` === key)
              if (isNew) {
                newPositions.push({ row, col })
              }
            }
          }
        }
        this.setBatchAnimationStates(newPositions, 'appearing')

        // 等待新元素出现动画 (300ms)
        await this.delay(300)

        // 清除新元素动画状态
        newPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 处理可能的连锁匹配
        await this.processMatches()
      }

      this.isAnimating = false
    },

    /**
     * 选择元素
     */
    selectElement(position: Position) {
      if (!this.canInteract) return

      if (!this.selectedElement) {
        // 第一次选择
        this.selectedElement = position
      } else {
        // 第二次选择，尝试交换
        if (areAdjacent(this.selectedElement, position)) {
          this.trySwap(this.selectedElement, position)
        } else {
          // 不相邻，更新选择
          this.selectedElement = position
        }
      }
    },

    /**
     * 取消选择
     */
    clearSelection() {
      this.selectedElement = null
    },

    /**
     * 检查游戏是否结束
     */
    checkGameOver() {
      if (!hasValidMoves(this.board)) {
        this.isGameOver = true
        this.isPlaying = false
      }
    },

    /**
     * 重置游戏
     */
    resetGame() {
      this.initBoard()
    },

    /**
     * 加载最高分
     */
    loadHighScore() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)
        if (saved) {
          this.highScore = parseInt(saved, 10) || 0
        }
      } catch (error) {
        console.error('加载最高分失败:', error)
      }
    },

    /**
     * 保存最高分
     */
    saveHighScore() {
      try {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, this.highScore.toString())
      } catch (error) {
        console.error('保存最高分失败:', error)
      }
    },

    /**
     * 延迟函数
     */
    delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
  },
})
