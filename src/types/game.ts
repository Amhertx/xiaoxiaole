/**
 * 游戏元素类型 - 6种几何图形
 */
export type ElementType = 'circle' | 'square' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon'

/**
 * 特殊道具类型
 */
export type SpecialType = 'bomb' | 'superBomb' | null

/**
 * 位置坐标
 */
export interface Position {
  row: number
  col: number
}

/**
 * 游戏元素
 */
export interface GameElement {
  id: string // 唯一标识符，用于Vue的key绑定
  type: ElementType
  special: SpecialType
  position: Position
}

/**
 * 匹配结果
 */
export interface Match {
  positions: Position[]
  type: ElementType
  intersection?: Position // L形匹配的交叉点位置
}

/**
 * 动画任务类型
 */
export type AnimationType = 'swap' | 'match' | 'fall' | 'appear'

/**
 * 动画任务
 */
export interface AnimationTask {
  type: AnimationType
  positions: Position[]
  duration: number
}

/**
 * 棋盘尺寸类型
 */
export type BoardSize = 6 | 8

/**
 * 动画状态类型
 */
export type AnimationState = 'matching' | 'falling' | 'swapping' | 'appearing' | 'bomb-explode' | 'superBomb-cross' | null

/**
 * 特殊道具特效信息
 */
export interface SpecialEffect {
  type: 'bomb' | 'superBomb'
  position: Position
  affectedPositions: Position[]
}

/**
 * 游戏状态
 */
export interface GameState {
  board: GameElement[][] // 棋盘（尺寸由boardSize决定）
  boardSize: BoardSize // 棋盘尺寸
  score: number // 当前分数
  combo: number // 连击数
  highScore: number // 当前尺寸的最高分
  highScores: Record<BoardSize, number> // 各尺寸的最高分
  isGameOver: boolean // 游戏是否结束
  isPlaying: boolean // 是否正在游戏
  selectedElement: Position | null // 当前选中的元素
  isAnimating: boolean // 是否正在播放动画
  animatingElements: Record<string, AnimationState> // 动画状态映射
  swapAnimation: { from: Position; to: Position } | null // 交换动画数据
  fallingAnimations: Array<{ from: Position; to: Position }> // 下落动画数据
  lastInteractionTime: number // 最后一次交互时间戳
  hintPositions: Position[] // 需要提示的方块位置数组
  isShowingHint: boolean // 是否正在显示提示
  // 拖动状态
  isDragging: boolean // 是否正在拖动
  draggingElement: Position | null // 被拖动的方块位置
  dragOffset: { x: number; y: number } // 拖动偏移量
  dragTarget: Position | null // 拖动目标位置
  // 特殊道具特效
  specialEffect: SpecialEffect | null
}

/**
 * 元素颜色配置
 */
export const ELEMENT_COLORS: Record<ElementType, string> = {
  circle: '#FF6B6B',    // 红色
  square: '#4ECDC4',    // 青色
  triangle: '#FFE66D',  // 黄色
  diamond: '#95E1D3',   // 绿色
  pentagon: '#F38181',  // 粉色
  hexagon: '#AA96DA',   // 紫色
}

/**
 * 元素类型列表
 */
export const ELEMENT_TYPES: ElementType[] = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
]

/**
 * 棋盘尺寸配置
 */
export const BOARD_SIZES: BoardSize[] = [6, 8]

/**
 * 默认棋盘尺寸
 */
export const DEFAULT_BOARD_SIZE: BoardSize = 8

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  HIGH_SCORE: (size: BoardSize) => `match3_high_score_${size}x${size}`,
  BOARD_SIZE: 'match3_board_size',
}

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768
}
