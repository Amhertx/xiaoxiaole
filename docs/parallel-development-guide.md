# 并行开发 MCP 使用指南

## 概述

`mcp_fullstack-multi-agent` 是一个支持多智能体并行开发的 MCP 工具，适用于全栈项目的快速开发。

## 可用智能体

### 前端层

| 智能体 | 职责 | 适用场景 |
|--------|------|----------|
| `Agent-FE-Structure` | 组件结构、模板、布局 | 新建组件、重构组件结构 |
| `Agent-FE-Style` | CSS 样式、动画效果 | 样式调整、动画开发 |
| `Agent-FE-Logic` | 状态管理、业务逻辑 | Store 修复、逻辑重构 |

### 后端层

| 智能体 | 职责 | 适用场景 |
|--------|------|----------|
| `Agent-BE-API` | API 路由、接口定义 | 新增接口、API 重构 |
| `Agent-BE-Service` | 业务服务、数据处理 | 业务逻辑开发 |
| `Agent-BE-Auth` | 认证授权、安全 | 登录系统、权限控制 |

### 数据库层

| 智能体 | 职责 | 适用场景 |
|--------|------|----------|
| `Agent-DB-Schema` | 数据模型、表结构 | 新建表、字段调整 |
| `Agent-DB-Access` | 数据访问、查询优化 | 查询性能优化 |

### 基础设施层

| 智能体 | 职责 | 适用场景 |
|--------|------|----------|
| `Agent-Infra-Deploy` | 部署配置、CI/CD | 部署流程配置 |
| `Agent-Infra-Config` | 环境配置、参数 | 环境变量管理 |

## 使用流程

### 1. 分析项目

```javascript
mcp_fullstack-multi-agent_analyze_project({
  description: "项目描述",
  tech_stack_hint: "Vue3 + TypeScript + Pinia" // 可选
})
```

### 2. 生成 API 契约（后端开发时）

```javascript
mcp_fullstack-multi-agent_generate_api_contract({
  endpoints: [
    {
      method: "GET",
      path: "/api/users",
      description: "获取用户列表",
      request: "void",
      response: "User[]"
    }
  ],
  shared_types: [
    {
      name: "User",
      fields: { id: "string", name: "string" }
    }
  ]
})
```

### 3. 生成智能体上下文

```javascript
mcp_fullstack-multi-agent_generate_agent_context({
  task_id: "task-001",
  project_name: "newxiao",
  tech_stack: {
    frontend: "Vue3",
    backend: "Node.js",
    database: "PostgreSQL",
    deployment: "Docker"
  },
  agent_role: "Agent-FE-Logic",
  output_path: "/path/to/context",
  api_contract: "..." // 可选
})
```

### 4. 检测冲突

```javascript
mcp_fullstack-multi-agent_detect_conflicts({
  frontend_api_calls: [
    { method: "GET", path: "/api/users" }
  ],
  backend_routes: [
    { method: "GET", path: "/api/users" }
  ],
  shared_types: { ... }
})
```

## 并行开发示例

### 场景：修复动画错乱

```
任务分解：
┌─────────────────────────────────────────────────────┐
│  Agent-FE-Logic                    Agent-FE-Style   │
│  ├─ 修复 Map 响应式问题            ├─ 动画 CSS 定义  │
│  ├─ 改造 animatingElements         ├─ keyframes 优化│
│  └─ 重构 getter/action             └─ 过渡效果调整  │
└─────────────────────────────────────────────────────┘
```

### 执行步骤

1. **分析任务可并行性**
2. **分配智能体职责**
3. **并行启动 Task**
4. **收集结果并验证**

---

## MCP 改进建议

### 1. 缺少浏览器调试集成

**问题**：当前无法在智能体中直接进行运行时调试

**建议**：

```diff
+ 新增 Agent-FE-Debug 智能体
  - 集成 chrome-devtools MCP
  - 专门负责运行时问题诊断
  - 输出问题定位报告给其他智能体
```

**预期效果**：
- 智能体可以自动检测运行时错误
- 输出结构化的问题报告
- 支持截图和 DOM 快照

### 2. 缺少智能体间协调机制

**问题**：多个智能体可能修改同一文件导致冲突

**建议**：

```diff
+ 新增协调器功能
  - 自动检测跨智能体依赖
  - 生成共享资源清单（如类型定义）
  - 冲突检测与合并策略
```

**预期效果**：
- 自动识别共享文件
- 提供文件锁定机制
- 支持三方合并

### 3. 缺少任务分解建议

**问题**：用户不知道任务是否适合并行

**建议**：

```diff
+ 新增 analyze_task 工具增强
  输入：用户任务描述
  输出：
  {
    "parallelizable": true/false,
    "suggested_agents": ["Agent-FE-Logic", "Agent-FE-Style"],
    "shared_resources": ["types/game.ts"],
    "execution_order": "parallel" | "sequential",
    "risk_level": "low" | "medium" | "high"
  }
```

**预期效果**：
- 自动判断任务是否可并行
- 推荐合适的智能体组合
- 提示潜在风险

### 4. 缺少增量验证机制

**问题**：智能体完成后没有自动验证

**建议**：

```diff
+ 新增验证检查点
  - 每个智能体完成后自动运行 lint/typecheck
  - 失败时自动回滚或提示
  - 最终合并验证
```

**预期效果**：
- 实时反馈代码质量
- 减少合并后的错误
- 提供回滚能力

### 5. 缺少进度可视化

**问题**：无法直观看到各智能体的进度

**建议**：

```diff
+ 新增进度追踪面板
  - 实时显示各智能体状态
  - 文件修改热力图
  - 预计剩余时间
```

---

## 最佳实践

### 适合并行的场景

- ✅ 前后端分离开发
- ✅ 多个独立功能模块
- ✅ 样式与逻辑分离
- ✅ 多页面同时开发

### 不适合并行的场景

- ❌ 单一模块深度调试
- ❌ 强依赖链的修改
- ❌ 需要频繁验证的迭代
- ❌ 共享资源过多的任务

### 并行开发检查清单

- [ ] 任务是否可以拆分为独立子任务？
- [ ] 子任务之间是否有共享文件？
- [ ] 是否需要先生成 API 契约？
- [ ] 是否需要协调执行顺序？
- [ ] 是否有验证机制？

---

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-03-05 | 初始版本 |
