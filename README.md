# 监控系统前端

基于 Vue 3 + TypeScript + Vite 构建的监控系统前端应用。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 组件库
- **ECharts** - 数据可视化图表库
- **Pinia** - Vue 状态管理
- **Vue Router** - Vue 官方路由管理器
- **Axios** - HTTP 客户端

## 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建文件将输出到 `dist` 目录。

### 预览构建结果

```bash
npm run preview
# 或
yarn preview
```

## 部署

详细的部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署

使用提供的部署脚本：

```bash
# 配置环境变量
export DEPLOY_USER=your-user
export DEPLOY_HOST=your-server.com

# 执行部署
./deploy.sh
```

更多部署选项：

```bash
# 查看帮助
./deploy.sh --help

# 仅构建，不上传
./deploy.sh --build-only

# 仅上传，不构建
./deploy.sh --upload-only
```

## 环境变量

### 开发环境

创建 `.env.development`：

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

### 生产环境

创建 `.env.production`：

```bash
# 同域名部署（推荐）
VITE_API_BASE_URL=/api

# 跨域部署
VITE_API_BASE_URL=https://api.your-domain.com/api
```

## 项目结构

```
monitor-frontend/
├── public/                    # 静态资源
│   ├── vite.svg
│   └── vitebak.svg
│
├── src/
│   ├── api/                   # API 接口
│   │   ├── agent.ts          # 主机相关API
│   │   ├── auth.ts           # 认证相关API
│   │   ├── metrics.ts        # 指标相关API
│   │   ├── anomaly.ts        # 异常检测API
│   │   ├── prediction.ts     # 预测分析API
│   │   ├── performance.ts    # 性能分析API
│   │   ├── inspection.ts     # 巡检API
│   │   ├── knowledge.ts      # 知识库API
│   │   ├── llm.ts            # LLM配置API
│   │   ├── logs.ts           # 日志API
│   │   ├── user.ts           # 用户管理API
│   │   └── ...
│   │
│   ├── components/            # 公共组件
│   │   ├── NavMenu.vue       # 导航菜单
│   │   ├── TopNav.vue        # 顶部导航
│   │   ├── AgentTable.vue    # 主机表格
│   │   ├── CPUHistoryChart.vue    # CPU历史图表
│   │   ├── MemoryHistoryChart.vue  # 内存历史图表
│   │   ├── DiskHistoryChart.vue    # 磁盘历史图表
│   │   ├── NetworkHistoryChart.vue # 网络历史图表
│   │   ├── ProcessHistoryChart.vue # 进程历史图表
│   │   └── ...
│   │
│   ├── views/                 # 页面组件
│   │   ├── Login.vue         # 登录页
│   │   ├── Dashboard.vue     # 仪表盘
│   │   ├── Agents.vue         # 主机列表
│   │   ├── AgentDetail.vue    # 主机详情
│   │   ├── AIAnalysis.vue    # AI分析（包含多个tab）
│   │   ├── CrashAnalysis.vue # 宕机分析
│   │   ├── Logs.vue          # 日志查看
│   │   ├── Processes.vue     # 进程监控
│   │   ├── Services.vue      # 服务监控
│   │   ├── Scripts.vue       # 脚本执行
│   │   ├── Alerts.vue        # 告警管理
│   │   ├── Users.vue         # 用户管理
│   │   ├── Knowledge.vue     # 知识库
│   │   ├── Inspection.vue    # 智能巡检
│   │   ├── LLMConfig.vue     # LLM配置
│   │   ├── BigScreen.vue     # 监控大屏
│   │   └── components/        # 页面子组件
│   │       ├── KnowledgeList.vue
│   │       └── KnowledgeDetailDialog.vue
│   │
│   ├── router/                # 路由配置
│   │   └── index.ts
│   │
│   ├── stores/                # Pinia 状态管理
│   │   ├── user.ts           # 用户状态
│   │   └── alert.ts          # 告警状态
│   │
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── utils/                 # 工具函数
│   │   └── request.ts        # Axios封装
│   │
│   ├── icons/                 # 图标组件
│   │   ├── CpuIcon.vue
│   │   ├── MemoryIcon.vue
│   │   ├── DiskIcon.vue
│   │   └── NetworkIcon.vue
│   │
│   ├── App.vue                # 根组件
│   ├── main.ts                # 入口文件
│   └── style.css              # 全局样式
│
├── index.html                 # HTML 模板
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── tsconfig.app.json          # TypeScript 应用配置
├── tsconfig.node.json         # TypeScript Node配置
├── package.json               # 项目配置
├── nginx.conf.example         # Nginx配置示例
├── deploy.sh                  # 部署脚本
├── DEPLOYMENT.md              # 部署文档
└── README.md                  # 本文档
```

## 功能特性

### 核心功能

- ✅ **用户认证和授权**: JWT认证，支持用户登录、注册、权限管理
- ✅ **主机监控和管理**: 主机列表、详情查看、状态监控
- ✅ **实时指标展示**: CPU、内存、磁盘、网络等指标实时图表
- ✅ **历史趋势分析**: 指标历史数据查询和趋势图表
- ✅ **进程监控**: 进程列表、资源使用、历史趋势分析
- ✅ **服务状态监控**: 系统服务状态查看
- ✅ **日志查看**: 日志搜索、筛选、分页展示
- ✅ **脚本执行**: 脚本执行记录查看
- ✅ **告警管理**: 告警规则配置、告警历史查询
- ✅ **监控大屏**: 全屏监控大屏展示

### 智能分析功能

- ✅ **AI智能分析**: 基于LLM的资源使用分析和建议
- ✅ **容量预测**: 资源使用趋势预测和扩容时间预测
- ✅ **成本优化**: LLM生成的成本优化建议
- ✅ **异常检测**: 异常事件检测、分析和LLM智能总结
- ✅ **性能分析**: 性能瓶颈分析、资源效率评估、优化建议
- ✅ **宕机分析**: 宕机事件记录、原因分析、趋势统计、批量删除
- ✅ **知识库**: 故障处理知识库、最佳实践文档、故障案例库、LLM智能搜索
- ✅ **智能巡检**: 自动化主机巡检、巡检报告生成、LLM生成巡检日报

### UI/UX特性

- ✅ **响应式设计**: 支持桌面、平板、移动设备
- ✅ **流式输出**: LLM分析结果流式展示
- ✅ **分页展示**: 列表数据分页和统计信息
- ✅ **实时更新**: 指标数据实时刷新
- ✅ **图表可视化**: ECharts图表展示

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码格式化，建议在提交前运行：

```bash
npm run lint
```

### 提交规范

建议使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

## 主要页面说明

### 仪表盘 (Dashboard)
- 系统概览统计
- Top指标展示
- 主机状态概览

### AI分析 (AIAnalysis)
包含三个子tab页：
- **AI智能分析**: 容量预测、成本优化建议
- **成本分析建议**: 成本优化分析
- **异常检测**: 异常检测和LLM智能总结
- **性能分析**: 性能瓶颈分析、资源效率评估、优化建议

### 宕机分析 (CrashAnalysis)
- 宕机事件列表（支持分页和批量删除）
- 宕机统计信息
- 宕机原因分析
- 宕机趋势图表

### 日志查看 (Logs)
- 日志列表（支持分页）
- 按主机和级别筛选
- 日志搜索

### 知识库 (Knowledge)
包含三个子tab页：
- **故障处理知识库**: 故障处理指南管理
- **最佳实践文档**: 最佳实践文档管理
- **故障案例库**: 故障案例管理
- **AI智能搜索**: LLM智能搜索知识库

### 智能巡检 (Inspection)
- 执行巡检任务
- 巡检报告列表（支持分页）
- 巡检报告详情
- LLM生成巡检日报（流式输出）

### 其他页面
- **主机管理**: 主机列表和详情
- **进程监控**: 进程资源使用监控
- **服务监控**: 系统服务状态
- **脚本执行**: 脚本执行记录
- **告警管理**: 告警规则和历史
- **用户管理**: 用户和权限管理（管理员）
- **LLM配置**: LLM模型配置管理
- **监控大屏**: 全屏监控展示

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 开发注意事项

### API请求

所有API请求通过 `src/utils/request.ts` 封装，自动处理：
- JWT Token认证
- 请求拦截和响应拦截
- 错误处理
- 超时设置

### 状态管理

使用Pinia进行状态管理：
- `stores/user.ts`: 用户信息和认证状态
- `stores/alert.ts`: 告警相关状态

### 路由守卫

在 `router/index.ts` 中配置路由守卫：
- 认证检查
- 权限检查（管理员功能）
- 自动跳转到登录页

### 流式输出

LLM分析结果使用Server-Sent Events (SSE)进行流式输出：
- 异常分析流式输出
- 性能分析流式输出
- 巡检日报流式输出
- 知识库搜索流式输出

### 分页功能

列表页面支持分页：
- 宕机分析：支持分页和批量删除
- 日志查看：支持分页
- 巡检报告：支持分页

## 许可证

[添加您的许可证信息]

## 联系方式

[添加联系方式]

## 相关文档

- [部署文档](./DEPLOYMENT.md) - 详细的部署说明
- [Backend README](../monitor-backend/README.md) - Backend服务文档
- [Agent README](../monitor-agent/README.md) - Agent采集代理文档
