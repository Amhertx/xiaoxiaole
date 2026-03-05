# Tasks

## 项目初始化
- [x] Task 1: 初始化 Vue3 + Vite + Pinia 项目
  - [x] SubTask 1.1: 使用 Vite 创建 Vue3 项目
  - [x] SubTask 1.2: 安装 Pinia 状态管理库
  - [x] SubTask 1.3: 配置项目结构和基础文件

## 核心游戏系统
- [x] Task 2: 创建游戏状态管理（Pinia Store）
  - [x] SubTask 2.1: 设计游戏状态数据结构（棋盘、分数、连击等）
  - [x] SubTask 2.2: 实现棋盘初始化逻辑
  - [x] SubTask 2.3: 实现元素交换逻辑
  - [x] SubTask 2.4: 实现匹配检测算法
  - [x] SubTask 2.5: 实现元素消除和下落逻辑
  - [x] SubTask 2.6: 实现分数计算逻辑

- [x] Task 3: 创建游戏元素系统
  - [x] SubTask 3.1: 定义元素类型和颜色配置
  - [x] SubTask 3.2: 创建元素渲染组件（几何图形）
  - [x] SubTask 3.3: 实现元素动画效果

- [x] Task 4: 创建游戏棋盘组件
  - [x] SubTask 4.1: 创建棋盘容器组件
  - [x] SubTask 4.2: 实现棋盘网格布局
  - [x] SubTask 4.3: 实现元素点击和拖动交互
  - [x] SubTask 4.4: 实现元素交换动画

## 特殊道具系统
- [x] Task 5: 实现特殊道具系统
  - [x] SubTask 5.1: 设计特殊道具类型（炸弹、超级炸弹）
  - [x] SubTask 5.2: 实现特殊道具生成逻辑（消除4个或5个时生成）
  - [x] SubTask 5.3: 实现特殊道具触发效果
  - [x] SubTask 5.4: 创建特殊道具渲染和特效

## 连击和特效系统
- [x] Task 6: 实现连击系统
  - [x] SubTask 6.1: 实现连击检测和计数
  - [x] SubTask 6.2: 实现连击加成分数计算
  - [x] SubTask 6.3: 创建连击提示组件

- [x] Task 7: 实现视觉特效系统
  - [x] SubTask 7.1: 实现元素消除动画和粒子特效
  - [x] SubTask 7.2: 实现连击特效（屏幕震动、光效）
  - [x] SubTask 7.3: 实现特殊道具特效（爆炸、光线）

## 用户界面
- [x] Task 8: 创建游戏主界面
  - [x] SubTask 8.1: 创建游戏标题和分数显示组件
  - [x] SubTask 8.2: 创建游戏控制按钮（开始、重新开始）
  - [x] SubTask 8.3: 创建游戏结束弹窗组件
  - [x] SubTask 8.4: 实现响应式布局设计

## 游戏流程
- [x] Task 9: 实现游戏流程控制
  - [x] SubTask 9.1: 实现游戏开始流程
  - [x] SubTask 9.2: 实现游戏结束检测（无可行移动）
  - [x] SubTask 9.3: 实现游戏重置功能

## 数据持久化
- [x] Task 10: 实现本地存储
  - [x] SubTask 10.1: 使用 localStorage 保存最高分
  - [x] SubTask 10.2: 实现最高分加载和显示

## 测试和优化
- [x] Task 11: 测试和优化
  - [x] SubTask 11.1: 测试游戏核心逻辑
  - [x] SubTask 11.2: 测试特殊道具系统
  - [x] SubTask 11.3: 测试连击和特效
  - [x] SubTask 11.4: 性能优化和bug修复

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2, Task 3]
- [Task 5] depends on [Task 2, Task 4]
- [Task 6] depends on [Task 2]
- [Task 7] depends on [Task 4, Task 5, Task 6]
- [Task 8] depends on [Task 4]
- [Task 9] depends on [Task 2, Task 4, Task 8]
- [Task 10] depends on [Task 2, Task 8]
- [Task 11] depends on [Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10]
