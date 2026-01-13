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
├── public/              # 静态资源
├── src/
│   ├── api/           # API 接口
│   ├── assets/        # 资源文件
│   ├── components/    # 公共组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── views/         # 页面组件
│   └── App.vue        # 根组件
├── index.html         # HTML 模板
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置
└── package.json       # 项目配置
```

## 功能特性

- ✅ 用户认证和授权（JWT）
- ✅ 主机监控和管理
- ✅ 实时指标展示（CPU、内存、磁盘、网络）
- ✅ 进程监控
- ✅ 服务状态监控
- ✅ 日志查看
- ✅ 脚本执行
- ✅ 告警管理
- ✅ 告警历史
- ✅ 监控大屏
- ✅ 响应式设计

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

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

[添加您的许可证信息]

## 联系方式

[添加联系方式]
