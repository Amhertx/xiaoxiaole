import type { GameElement, Position, Match, ElementType, SpecialType, BoardSize } from '../types/game'
import { ELEMENT_TYPES } from '../types/game'

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
export function initializeBoard(boardSize: BoardSize = 8): GameElement[][] {
  const board: GameElement[][] = []
  
  for (let row = 0; row < boardSize; row++) {
    board[row] = []
    for (let col = 0; col < boardSize; col++) {
      let element = createElement(row, col)
      
      while (wouldCreateMatch(board, row, col, element.type, boardSize)) {
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
  type: ElementType,
  _boardSize?: BoardSize
): boolean {
  if (col >= 2) {
    const left1 = board[row][col - 1]
    const left2 = board[row][col - 2]
    if (left1?.type === type && left2?.type === type) {
      return true
    }
  }
  
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
export function findAllMatches(board: GameElement[][], boardSize: BoardSize = 8): Match[] {
  const matches: Match[] = []
  const visited = new Set<string>()
  
  const horizontalMatches: Match[] = []
  const verticalMatches: Match[] = []
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize - 2; col++) {
      const match = findHorizontalMatch(board, row, col, boardSize)
      if (match) {
        horizontalMatches.push(match)
      }
    }
  }
  
  for (let row = 0; row < boardSize - 2; row++) {
    for (let col = 0; col < boardSize; col++) {
      const match = findVerticalMatch(board, row, col, boardSize)
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
  startCol: number,
  boardSize: BoardSize
): Match | null {
  const type = board[row][startCol]?.type
  if (!type) return null
  
  const positions: Position[] = [{ row, col: startCol }]
  
  for (let col = startCol + 1; col < boardSize; col++) {
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
  col: number,
  boardSize: BoardSize
): Match | null {
  const type = board[startRow]?.[col]?.type
  if (!type) return null
  
  const positions: Position[] = [{ row: startRow, col }]
  
  for (let row = startRow + 1; row < boardSize; row++) {
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
  specialType?: SpecialType,
  boardSize: BoardSize = 8
): Position[] {
  const type = specialType ?? board[position.row]?.[position.col]?.special
  if (!type) return []
  
  const positions: Position[] = []
  
  if (type === 'bomb') {
    for (let row = position.row - 1; row <= position.row + 1; row++) {
      for (let col = position.col - 1; col <= position.col + 1; col++) {
        if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
          positions.push({ row, col })
        }
      }
    }
  } else if (type === 'superBomb') {
    for (let col = 0; col < boardSize; col++) {
      positions.push({ row: position.row, col })
    }
    for (let row = 0; row < boardSize; row++) {
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
export function dropElements(board: GameElement[][], boardSize: BoardSize = 8): { 
  newBoard: GameElement[][], 
  movedElements: Array<{ from: Position, to: Position }> 
} {
  const newBoard = board.map(row => [...row])
  const movedElements: Array<{ from: Position, to: Position }> = []
  
  for (let col = 0; col < boardSize; col++) {
    let writeRow = boardSize - 1
    
    for (let row = boardSize - 1; row >= 0; row--) {
      if (newBoard[row][col]) {
        if (row !== writeRow) {
          movedElements.push({
            from: { row, col },
            to: { row: writeRow, col }
          })
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
export function fillBoard(board: GameElement[][], boardSize: BoardSize = 8): { 
  newBoard: GameElement[][], 
  filledPositions: Position[] 
} {
  const newBoard = board.map(row => [...row])
  const filledPositions: Position[] = []
  
  for (let col = 0; col < boardSize; col++) {
    for (let row = 0; row < boardSize; row++) {
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
 * 检查棋盘上是否存在特殊道具
 */
export function hasSpecialItems(board: GameElement[][], boardSize: BoardSize = 8): boolean {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const element = board[row]?.[col]
      if (element?.special) {
        return true
      }
    }
  }
  return false
}

/**
 * 检查是否有可行的移动
 */
export function hasValidMoves(board: GameElement[][], boardSize: BoardSize = 8): boolean {
  // 如果棋盘上存在特殊道具，玩家可以直接激活，不算游戏结束
  if (hasSpecialItems(board, boardSize)) {
    return true
  }
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (col < boardSize - 1) {
        const testBoard = swapElements(board, { row, col }, { row, col: col + 1 })
        if (findAllMatches(testBoard, boardSize).length > 0) {
          return true
        }
      }
      
      if (row < boardSize - 1) {
        const testBoard = swapElements(board, { row, col }, { row: row + 1, col })
        if (findAllMatches(testBoard, boardSize).length > 0) {
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
export function findValidMoves(board: GameElement[][], boardSize: BoardSize = 8): Position[] {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (col < boardSize - 1) {
        const from = { row, col }
        const to = { row, col: col + 1 }
        const testBoard = swapElements(board, from, to)
        const matches = findAllMatches(testBoard, boardSize)
        if (matches.length > 0) {
          const positions: Position[] = []
          for (const match of matches) {
            for (const pos of match.positions) {
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
      
      if (row < boardSize - 1) {
        const from = { row, col }
        const to = { row: row + 1, col }
        const testBoard = swapElements(board, from, to)
        const matches = findAllMatches(testBoard, boardSize)
        if (matches.length > 0) {
          const positions: Position[] = []
          for (const match of matches) {
            for (const pos of match.positions) {
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

/**
 * 创建测试棋盘 - 用于测试游戏结束逻辑
 * 场景：消除一组方块后无法继续触发消除，棋盘上留一个特殊道具
 */
export function createTestBoard(boardSize: BoardSize = 8): GameElement[][] {
  const board: GameElement[][] = []
  
  // 创建一个精心设计的棋盘布局
  // 使用固定的类型分布，确保消除后不会形成新匹配
  const types: ElementType[] = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon']
  
  for (let row = 0; row < boardSize; row++) {
    board[row] = []
    for (let col = 0; col < boardSize; col++) {
      // 使用特定的布局模式，避免形成匹配
      // 模式：交替使用不同类型，但故意留一组可消除的
      let type: ElementType
      
      if (row === 0 && col === 0) {
        // 左上角放置3个可消除的 circle
        type = 'circle'
      } else if (row === 0 && col === 1) {
        type = 'circle'
      } else if (row === 0 && col === 2) {
        type = 'circle'
      } else if (row === 0 && col === 3) {
        // 在 (0, 3) 放置一个特殊道具 (bomb)
        type = 'square'
      } else {
        // 其他位置使用交替模式，确保没有匹配
        // 使用 (row + col) % 6 但跳过会形成匹配的情况
        const baseIndex = (row * 3 + col) % 6
        type = types[baseIndex]
        
        // 检查是否会形成水平匹配
        if (col >= 2) {
          const left1 = board[row][col - 1]?.type
          const left2 = board[row][col - 2]?.type
          if (left1 === type && left2 === type) {
            // 换一个类型
            type = types[(baseIndex + 1) % 6]
          }
        }
        
        // 检查是否会形成垂直匹配
        if (row >= 2) {
          const up1 = board[row - 1]?.[col]?.type
          const up2 = board[row - 2]?.[col]?.type
          if (up1 === type && up2 === type) {
            // 换一个类型
            type = types[(baseIndex + 2) % 6]
          }
        }
      }
      
      board[row][col] = createElement(row, col, type)
    }
  }
  
  // 在 (0, 3) 位置放置一个 bomb 特殊道具
  board[0][3] = {
    id: generateElementId(),
    type: 'square',
    special: 'bomb',
    position: { row: 0, col: 3 }
  }
  
  // 验证：只有第一行的前3个 circle 可以消除
  // 消除后下落填充，不会形成新匹配
  
  return board
}
