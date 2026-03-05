import { defineStore } from 'pinia'
import type { GameState, GameElement, Position, SpecialType } from '../types/game'
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
  findValidMoves,
} from '../utils/gameLogic'

interface SpecialItemInfo {
  position: Position
  specialType: SpecialType
}

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
    swapAnimation: null as { from: Position; to: Position } | null,
    fallingAnimations: [] as Array<{ from: Position; to: Position }>,
    lastInteractionTime: Date.now(),
    hintPositions: [],
    isShowingHint: false,
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
      this.lastInteractionTime = Date.now()
      this.hintPositions = []
      this.isShowingHint = false
    },

    /**
     * 尝试交换元素
     */
    async trySwap(from: Position, to: Position): Promise<boolean> {
      if (!this.canInteract) return false
      if (!areAdjacent(from, to)) return false

      this.isAnimating = true
      this.selectedElement = null

      // 重置交互时间和清除提示
      this.lastInteractionTime = Date.now()
      this.hintPositions = []
      this.isShowingHint = false

      // 设置交换动画数据
      this.swapAnimation = { from, to }
      this.setAnimationState(from, 'swapping')
      this.setAnimationState(to, 'swapping')

      // 等待交换动画完成 (300ms)
      await this.delay(300)

      // 执行实际交换
      this.board = swapElements(this.board, from, to)

      // 清除交换动画状态
      this.setAnimationState(from, null)
      this.setAnimationState(to, null)
      this.swapAnimation = null

      // 检查是否有匹配
      const matches = findAllMatches(this.board)

      if (matches.length === 0) {
        // 没有匹配，交换回来
        this.swapAnimation = { from: to, to: from }
        this.setAnimationState(from, 'swapping')
        this.setAnimationState(to, 'swapping')
        await this.delay(300)
        this.board = swapElements(this.board, from, to)
        this.setAnimationState(from, null)
        this.setAnimationState(to, null)
        this.swapAnimation = null
        this.isAnimating = false
        return false
      }

      // 有匹配，开始消除流程，传递交换位置
      await this.processMatches({ from, to })
      
      // 检查游戏是否结束
      this.checkGameOver()
      
      this.isAnimating = false
      return true
    },

    /**
     * 处理匹配消除流程
     */
    async processMatches(swapPositions?: { from: Position; to: Position }) {
      let matches = findAllMatches(this.board)
      let combo = 0
      let isFirstMatch = true
      
      while (matches.length > 0) {
        combo++
        this.combo = combo
        
        // 收集所有匹配位置
        const matchPositions: Position[] = []
        matches.forEach(match => {
          matchPositions.push(...match.positions)
        })

        // 收集被消除的特殊道具及其类型信息
        const specialItems: SpecialItemInfo[] = []
        matchPositions.forEach(pos => {
          const element = this.board[pos.row]?.[pos.col]
          if (element?.special) {
            specialItems.push({
              position: pos,
              specialType: element.special
            })
          }
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

        // 移除匹配的元素（第一次匹配时传递交换位置）
        const { newBoard } = removeMatches(this.board, matches, isFirstMatch ? swapPositions : undefined)
        this.board = newBoard
        isFirstMatch = false

        // 清除匹配动画状态
        matchPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 触发被消除的特殊道具效果
        if (specialItems.length > 0) {
          await this.triggerSpecialsInMatch(specialItems)
        }

        // 元素下落动画
        const dropResult = dropElements(this.board)
        
        // 先设置动画状态，再更新board，避免闪烁
        const fallPositions: Position[] = dropResult.movedElements.map(m => m.to)
        this.fallingAnimations = dropResult.movedElements
        this.setBatchAnimationStates(fallPositions, 'falling')
        
        // 然后更新board
        this.board = dropResult.newBoard
        
        // 等待下落动画 (400ms)
        await this.delay(400)

        // 清除下落动画状态
        fallPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 填充新元素
        const fillResult = fillBoard(this.board)
        this.board = fillResult.newBoard
        
        // 只标记真正新填充的元素
        this.setBatchAnimationStates(fillResult.filledPositions, 'appearing')

        // 等待新元素出现动画 (300ms)
        await this.delay(300)

        // 清除新元素动画状态
        fillResult.filledPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 检查新的匹配
        matches = findAllMatches(this.board)
      }

      // 重置连击
      this.combo = 0
    },

    /**
     * 触发被消除的特殊道具效果（连锁触发）
     */
    async triggerSpecialsInMatch(specialItems: SpecialItemInfo[]) {
      // 收集所有需要触发的特殊道具及其影响范围
      const allAffectedPositions: Position[] = []
      const processedPositions = new Set<string>()
      
      for (const item of specialItems) {
        const key = `${item.position.row}-${item.position.col}`
        // 避免重复处理同一位置
        if (processedPositions.has(key)) continue
        processedPositions.add(key)
        
        // 使用传入的特殊道具类型信息，直接计算影响范围
        const affectedPositions = triggerSpecialEffect(this.board, item.position, item.specialType)
        
        if (affectedPositions.length > 0) {
          allAffectedPositions.push(...affectedPositions)
        }
      }
      
      if (allAffectedPositions.length === 0) return
      
      // 去重
      const uniquePositions: Position[] = []
      const seenPositions = new Set<string>()
      for (const pos of allAffectedPositions) {
        const key = `${pos.row}-${pos.col}`
        if (!seenPositions.has(key)) {
          seenPositions.add(key)
          uniquePositions.push(pos)
        }
      }
      
      // 收集受影响区域中的其他特殊道具
      const additionalSpecials: SpecialItemInfo[] = []
      uniquePositions.forEach(pos => {
        const element = this.board[pos.row]?.[pos.col]
        if (element?.special && !processedPositions.has(`${pos.row}-${pos.col}`)) {
          additionalSpecials.push({
            position: pos,
            specialType: element.special
          })
        }
      })
      
      // 标记动画元素
      this.setBatchAnimationStates(uniquePositions, 'matching')
      
      // 计算分数
      this.score += calculateScore(uniquePositions.length, this.combo, true)
      
      // 更新最高分
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.saveHighScore()
      }
      
      // 等待消除动画 (300ms)
      await this.delay(300)
      
      // 清除动画状态
      uniquePositions.forEach(pos => {
        this.setAnimationState(pos, null)
      })
      
      // 移除受影响的元素
      for (const pos of uniquePositions) {
        this.board[pos.row][pos.col] = null as any
      }
      
      // 如果有额外的特殊道具被触发，递归处理
      if (additionalSpecials.length > 0) {
        await this.triggerSpecialsInMatch(additionalSpecials)
      }
      
      // 元素下落动画
      const dropResult = dropElements(this.board)
      this.board = dropResult.newBoard
      
      const fallPositions: Position[] = dropResult.movedElements.map(m => m.to)
      this.fallingAnimations = dropResult.movedElements
      this.setBatchAnimationStates(fallPositions, 'falling')
      
      // 等待下落动画 (400ms)
      await this.delay(400)
      
      // 清除下落动画状态
      fallPositions.forEach(pos => {
        this.setAnimationState(pos, null)
      })
      
      // 填充新元素
      const fillResult = fillBoard(this.board)
      this.board = fillResult.newBoard
      
      this.setBatchAnimationStates(fillResult.filledPositions, 'appearing')
      
      // 等待新元素出现动画 (300ms)
      await this.delay(300)
      
      // 清除新元素动画状态
      fillResult.filledPositions.forEach(pos => {
        this.setAnimationState(pos, null)
      })
    },

    /**
     * 触发特殊道具
     */
    async activateSpecial(position: Position) {
      if (!this.canInteract) return

      const element = this.board[position.row]?.[position.col]
      if (!element?.special) return

      this.isAnimating = true
      this.selectedElement = null

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
        const dropResult = dropElements(this.board)
        this.board = dropResult.newBoard
        
        // 只标记真正移动了的元素
        const fallPositions: Position[] = dropResult.movedElements.map(m => m.to)
        this.fallingAnimations = dropResult.movedElements
        this.setBatchAnimationStates(fallPositions, 'falling')

        // 等待下落动画 (400ms)
        await this.delay(400)

        // 清除下落动画状态
        fallPositions.forEach(pos => {
          this.setAnimationState(pos, null)
        })

        // 填充新元素
        const fillResult = fillBoard(this.board)
        this.board = fillResult.newBoard

        // 只标记真正新填充的元素
        this.setBatchAnimationStates(fillResult.filledPositions, 'appearing')

        // 等待新元素出现动画 (300ms)
        await this.delay(300)

        // 清除新元素动画状态
        fillResult.filledPositions.forEach(pos => {
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

      // 重置交互时间和清除提示
      this.lastInteractionTime = Date.now()
      this.hintPositions = []
      this.isShowingHint = false

      const clickedElement = this.board[position.row]?.[position.col]

      // 如果点击的是特殊道具，且没有选中其他元素，直接激活
      if (clickedElement?.special && !this.selectedElement) {
        this.activateSpecial(position)
        return
      }

      if (!this.selectedElement) {
        // 第一次选择
        this.selectedElement = position
      } else if (
        this.selectedElement.row === position.row &&
        this.selectedElement.col === position.col
      ) {
        // 再次点击同一元素，取消选择
        this.selectedElement = null
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

    /**
     * 显示提示 - 抖动可消除的方块
     */
    showHint() {
      if (this.isShowingHint || this.isAnimating || !this.isPlaying || this.isGameOver) {
        return
      }
      
      const validMoves = findValidMoves(this.board)
      if (validMoves.length > 0) {
        this.hintPositions = validMoves
        this.isShowingHint = true
      }
    },

    /**
     * 清除提示
     */
    clearHint() {
      this.hintPositions = []
      this.isShowingHint = false
    },
  },
})
