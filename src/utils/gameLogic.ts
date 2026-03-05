import type { GameElement, Position, Match, ElementType, SpecialType } from '../types/game'
import { ELEMENT_TYPES, BOARD_SIZE } from '../types/game'

let elementIdCounter = 0

/**
 * 生成唯一ID
 */
function generateElementId(): string {
  return `element-${Date.now()}-${elementIdCounter++}`
}

/**
 * 创建一个游戏元素
 */
export function createElement(row: number, col: number, type?: ElementType): GameElement {
  return {
    id: generateElementId(),
    type: type || getRandomElementType(),
    special: null,
    position: { row, col },
  }
}

/**
 * 获取随机元素类型
 */
export function getRandomElementType(): ElementType {
  const index = Math.floor(Math.random() * ELEMENT_TYPES.length)
  return ELEMENT_TYPES[index]
}

/**
 * 初始化棋盘 - 确保没有初始匹配
 */
export function initializeBoard(): GameElement[][] {
  const board: GameElement[][] = []
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = []
    for (let col = 0; col < BOARD_SIZE; col++) {
      let element = createElement(row, col)
      
      // 确保新元素不会形成匹配
      while (wouldCreateMatch(board, row, col, element.type)) {
        element = createElement(row, col)
      }
      
      board[row][col] = element
    }
  }
  
  return board
}

/**
 * 检查在指定位置放置元素是否会形成匹配
 */
function wouldCreateMatch(
  board: GameElement[][],
  row: number,
  col: number,
  type: ElementType
): boolean {
  // 检查水平方向（左侧）
  if (col >= 2) {
    const left1 = board[row][col - 1]
    const left2 = board[row][col - 2]
    if (left1?.type === type && left2?.type === type) {
      return true
    }
  }
  
  // 检查垂直方向（上方）
  if (row >= 2) {
    const up1 = board[row - 1]?.[col]
    const up2 = board[row - 2]?.[col]
    if (up1?.type === type && up2?.type === type) {
      return true
    }
  }
  
  return false
}

/**
 * 检测所有匹配
 */
export function findAllMatches(board: GameElement[][]): Match[] {
  const matches: Match[] = []
  const visited = new Set<string>()
  
  // 先收集所有水平和垂直匹配
  const horizontalMatches: Match[] = []
  const verticalMatches: Match[] = []
  
  // 检测水平匹配
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE - 2; col++) {
      const match = findHorizontalMatch(board, row, col)
      if (match) {
        horizontalMatches.push(match)
      }
    }
  }
  
  // 检测垂直匹配
  for (let row = 0; row < BOARD_SIZE - 2; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const match = findVerticalMatch(board, row, col)
      if (match) {
        verticalMatches.push(match)
      }
    }
  }
  
  // 检测L形匹配：找交叉点
  const usedHorizontal = new Set<number>()
  const usedVertical = new Set<number>()
  
  for (let hi = 0; hi < horizontalMatches.length; hi++) {
    const hMatch = horizontalMatches[hi]
    for (let vi = 0; vi < verticalMatches.length; vi++) {
      const vMatch = verticalMatches[vi]
      
      // 必须是同类型
      if (hMatch.type !== vMatch.type) continue
      
      // 找交叉点
      const intersection = findIntersection(hMatch.positions, vMatch.positions)
      if (!intersection) continue
      
      // 检查每边是否都有至少3个（交叉点只算一次）
      const hLength = hMatch.positions.length
      const vLength = vMatch.positions.length
      
      if (hLength >= 3 && vLength >= 3) {
        // 合并为L形匹配
        const mergedPositions = mergeLShapePositions(hMatch.positions, vMatch.positions)
        
        if (!isVisited(visited, mergedPositions)) {
          matches.push({
            positions: mergedPositions,
            type: hMatch.type,
            intersection: intersection
          })
          markVisited(visited, mergedPositions)
          usedHorizontal.add(hi)
          usedVertical.add(vi)
        }
      }
    }
  }
  
  // 添加未参与L形的水平匹配
  for (let i = 0; i < horizontalMatches.length; i++) {
    if (!usedHorizontal.has(i)) {
      const match = horizontalMatches[i]
      if (!isVisited(visited, match.positions)) {
        matches.push(match)
        markVisited(visited, match.positions)
      }
    }
  }
  
  // 添加未参与L形的垂直匹配
  for (let i = 0; i < verticalMatches.length; i++) {
    if (!usedVertical.has(i)) {
      const match = verticalMatches[i]
      if (!isVisited(visited, match.positions)) {
        matches.push(match)
        markVisited(visited, match.positions)
      }
    }
  }
  
  return matches
}

/**
 * 找到两个位置数组的交叉点
 */
function findIntersection(positions1: Position[], positions2: Position[]): Position | null {
  for (const p1 of positions1) {
    for (const p2 of positions2) {
      if (p1.row === p2.row && p1.col === p2.col) {
        return p1
      }
    }
  }
  return null
}

/**
 * 合并L形位置（去重）
 */
function mergeLShapePositions(horizontal: Position[], vertical: Position[]): Position[] {
  const result: Position[] = [...horizontal]
  const seen = new Set(horizontal.map(p => `${p.row},${p.col}`))
  
  for (const p of vertical) {
    const key = `${p.row},${p.col}`
    if (!seen.has(key)) {
      result.push(p)
      seen.add(key)
    }
  }
  
  return result
}

/**
 * 检测水平方向的匹配
 */
function findHorizontalMatch(
  board: GameElement[][],
  row: number,
  startCol: number
): Match | null {
  const type = board[row][startCol]?.type
  if (!type) return null
  
  const positions: Position[] = [{ row, col: startCol }]
  
  for (let col = startCol + 1; col < BOARD_SIZE; col++) {
    if (board[row][col]?.type === type) {
      positions.push({ row, col })
    } else {
      break
    }
  }
  
  return positions.length >= 3 ? { positions, type } : null
}

/**
 * 检测垂直方向的匹配
 */
function findVerticalMatch(
  board: GameElement[][],
  startRow: number,
  col: number
): Match | null {
  const type = board[startRow]?.[col]?.type
  if (!type) return null
  
  const positions: Position[] = [{ row: startRow, col }]
  
  for (let row = startRow + 1; row < BOARD_SIZE; row++) {
    if (board[row]?.[col]?.type === type) {
      positions.push({ row, col })
    } else {
      break
    }
  }
  
  return positions.length >= 3 ? { positions, type } : null
}

/**
 * 检查位置是否已访问
 */
function isVisited(visited: Set<string>, positions: Position[]): boolean {
  return positions.some(pos => visited.has(`${pos.row},${pos.col}`))
}

/**
 * 标记位置为已访问
 */
function markVisited(visited: Set<string>, positions: Position[]): void {
  positions.forEach(pos => visited.add(`${pos.row},${pos.col}`))
}

/**
 * 检查两个位置是否相邻
 */
export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row)
  const colDiff = Math.abs(pos1.col - pos2.col)
  
  // 相邻意味着行或列相差1，但不能同时相差
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

/**
 * 交换两个元素
 */
export function swapElements(
  board: GameElement[][],
  pos1: Position,
  pos2: Position
): GameElement[][] {
  const newBoard = board.map(row => [...row])
  
  const temp = newBoard[pos1.row][pos1.col]
  newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col]
  newBoard[pos2.row][pos2.col] = temp
  
  // 更新位置信息
  newBoard[pos1.row][pos1.col].position = pos1
  newBoard[pos2.row][pos2.col].position = pos2
  
  return newBoard
}

/**
 * 确定特殊道具类型
 * @param matchLength 匹配长度
 * @param isLShape 是否是L形匹配
 */
export function determineSpecialType(matchLength: number, isLShape: boolean = false): SpecialType {
  // L形匹配生成炸弹
  if (isLShape) return 'bomb'
  if (matchLength >= 5) return 'superBomb'
  if (matchLength === 4) return 'bomb'
  return null
}

/**
 * 移除匹配的元素并返回新的棋盘和需要生成的特殊道具
 */
export function removeMatches(
  board: GameElement[][],
  matches: Match[],
  swapPositions?: { from: Position; to: Position }
): { newBoard: GameElement[][]; specials: Array<{ position: Position; special: SpecialType }> } {
  const newBoard = board.map(row => [...row])
  const specials: Array<{ position: Position; special: SpecialType }> = []
  
  for (const match of matches) {
    const isLShape = !!match.intersection
    const specialType = determineSpecialType(match.positions.length, isLShape)
    
    // 如果需要生成特殊道具
    if (specialType) {
      let specialPos: Position
      
      // L形匹配：使用交叉点位置
      if (isLShape && match.intersection) {
        specialPos = match.intersection
      } else if (swapPositions) {
        // 普通匹配：优先使用交换位置
        const { from, to } = swapPositions
        const fromInMatch = match.positions.some(p => p.row === from.row && p.col === from.col)
        const toInMatch = match.positions.some(p => p.row === to.row && p.col === to.col)
        
        if (fromInMatch) {
          specialPos = from
        } else if (toInMatch) {
          specialPos = to
        } else {
          // 交换位置都不在匹配中，使用中间位置
          const middleIndex = Math.floor(match.positions.length / 2)
          specialPos = match.positions[middleIndex]
        }
      } else {
        // 没有交换位置，使用中间位置
        const middleIndex = Math.floor(match.positions.length / 2)
        specialPos = match.positions[middleIndex]
      }
      
      specials.push({ position: specialPos, special: specialType })
    }
    
    // 移除匹配位置的元素（标记为null）
    for (const pos of match.positions) {
      // 如果这个位置要生成特殊道具，保留元素但添加特殊属性
      const isSpecialPos = specialType && specials.some(s => 
        s.position.row === pos.row && s.position.col === pos.col
      )
      
      if (isSpecialPos) {
        newBoard[pos.row][pos.col] = {
          ...newBoard[pos.row][pos.col],
          special: specialType,
        }
      } else {
        newBoard[pos.row][pos.col] = null as any
      }
    }
  }
  
  return { newBoard, specials }
}

/**
 * 触发特殊道具效果 - 返回需要消除的位置
 * @param board 棋盘
 * @param position 特殊道具位置
 * @param specialType 可选的特殊道具类型，如果不提供则从board中读取
 */
export function triggerSpecialEffect(
  board: GameElement[][],
  position: Position,
  specialType?: SpecialType
): Position[] {
  // 如果没有传入特殊类型，从board中读取
  const type = specialType ?? board[position.row]?.[position.col]?.special
  if (!type) return []
  
  const positions: Position[] = []
  
  if (type === 'bomb') {
    // 炸弹：消除3x3范围
    for (let row = position.row - 1; row <= position.row + 1; row++) {
      for (let col = position.col - 1; col <= position.col + 1; col++) {
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          positions.push({ row, col })
        }
      }
    }
  } else if (type === 'superBomb') {
    // 超级炸弹：消除整行和整列
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row: position.row, col })
    }
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (row !== position.row) {
        positions.push({ row, col: position.col })
      }
    }
  }
  
  return positions
}

/**
 * 元素下落 - 填充空位
 * 返回新棋盘和移动信息
 */
export function dropElements(board: GameElement[][]): { 
  newBoard: GameElement[][], 
  movedElements: Array<{ from: Position, to: Position }> 
} {
  const newBoard = board.map(row => [...row])
  const movedElements: Array<{ from: Position, to: Position }> = []
  
  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1
    
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col]) {
        if (row !== writeRow) {
          movedElements.push({
            from: { row, col },
            to: { row: writeRow, col }
          })
          // 创建新的对象，避免引用问题
          newBoard[writeRow][col] = {
            ...newBoard[row][col],
            position: { row: writeRow, col }
          }
          newBoard[row][col] = null as any
        }
        writeRow--
      }
    }
  }
  
  return { newBoard, movedElements }
}

/**
 * 填充新元素
 * 返回新棋盘和新填充的位置
 */
export function fillBoard(board: GameElement[][]): { 
  newBoard: GameElement[][], 
  filledPositions: Position[] 
} {
  const newBoard = board.map(row => [...row])
  const filledPositions: Position[] = []
  
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = createElement(row, col)
        filledPositions.push({ row, col })
      }
    }
  }
  
  return { newBoard, filledPositions }
}

/**
 * 计算分数
 * 基础分数 = 消除数量 × 10
 * 连击加成 = 连击次数 × 5
 * 特殊道具额外分数
 */
export function calculateScore(
  matchCount: number,
  combo: number,
  hasSpecial: boolean
): number {
  const baseScore = matchCount * 10
  const comboBonus = combo * 5
  const specialBonus = hasSpecial ? 50 : 0
  
  return baseScore + comboBonus + specialBonus
}

/**
 * 检查是否有可行的移动
 */
export function hasValidMoves(board: GameElement[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // 检查向右交换
      if (col < BOARD_SIZE - 1) {
        const testBoard = swapElements(board, { row, col }, { row, col: col + 1 })
        if (findAllMatches(testBoard).length > 0) {
          return true
        }
      }
      
      // 检查向下交换
      if (row < BOARD_SIZE - 1) {
        const testBoard = swapElements(board, { row, col }, { row: row + 1, col })
        if (findAllMatches(testBoard).length > 0) {
          return true
        }
      }
    }
  }
  
  return false
}

/**
 * 查找可消除的方块位置
 * 返回第一个有效交换后会被消除的方块位置数组（在原始棋盘上的位置）
 */
export function findValidMoves(board: GameElement[][]): Position[] {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // 检查向右交换
      if (col < BOARD_SIZE - 1) {
        const from = { row, col }
        const to = { row, col: col + 1 }
        const testBoard = swapElements(board, from, to)
        const matches = findAllMatches(testBoard)
        if (matches.length > 0) {
          // 将交换后棋盘上的位置映射回原始棋盘
          const positions: Position[] = []
          for (const match of matches) {
            for (const pos of match.positions) {
              // 如果这个位置参与了交换，映射回原始位置
              if (pos.row === to.row && pos.col === to.col) {
                positions.push(from)
              } else if (pos.row === from.row && pos.col === from.col) {
                positions.push(to)
              } else {
                positions.push(pos)
              }
            }
          }
          return positions
        }
      }
      
      // 检查向下交换
      if (row < BOARD_SIZE - 1) {
        const from = { row, col }
        const to = { row: row + 1, col }
        const testBoard = swapElements(board, from, to)
        const matches = findAllMatches(testBoard)
        if (matches.length > 0) {
          // 将交换后棋盘上的位置映射回原始棋盘
          const positions: Position[] = []
          for (const match of matches) {
            for (const pos of match.positions) {
              // 如果这个位置参与了交换，映射回原始位置
              if (pos.row === to.row && pos.col === to.col) {
                positions.push(from)
              } else if (pos.row === from.row && pos.col === from.col) {
                positions.push(to)
              } else {
                positions.push(pos)
              }
            }
          }
          return positions
        }
      }
    }
  }
  
  return []
}

/**
 * 深拷贝棋盘
 */
export function cloneBoard(board: GameElement[][]): GameElement[][] {
  return board.map(row => 
    row.map(element => ({ ...element, position: { ...element.position } }))
  )
}
