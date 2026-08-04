# Monitor Frontend

Vue 3 + TypeScript + Vite 构建的监控系统前端。当前前端已经从单独的“AI分析”页面收敛为“运维助手”入口，面向日常监控、告警处理、容量/成本分析、知识库排障和巡检报告查看。

## 当前能力

- 监控面板：主机概览、在线/离线统计、Top 指标和最新上报时间。
- 监控大屏：全屏展示主机、CPU、内存、GPU、告警和资源异常。
- 主机管理：主机列表、主机详情、历史指标趋势。
- 进程监控：进程列表、CPU/内存趋势，多核 CPU 使用按主机总容量归一化展示。
- Docker 监控：容器列表、容器资源使用和历史趋势。
- GPU 监控：GPU 设备、厂商、显存、使用率、温度、功耗。
- 日志查看：按主机、级别、关键字筛选日志。
- 服务状态：systemd/Windows 服务和端口探测结果展示。
- 脚本执行：查看 Agent 上报的脚本执行结果。
- 告警管理：规则、历史、静默、通知渠道管理。
- 运维助手：统一承载原 AI 分析能力，支持流式诊断、工具执行时间线、结构化报告、历史会话恢复和删除。
- 知识库：故障处理、最佳实践、故障案例维护，以及 LLM 流式搜索。
- 智能巡检：触发巡检、查看巡检报告、流式生成巡检日报。
- LLM 配置：管理员维护 OpenAI 兼容模型配置、测试连接、设置默认模型。
- 用户管理：管理员维护用户、角色、状态和密码重置。

## 运维助手说明

运维助手页面位于 `/ops-assistant`，是当前系统的 AI 运维统一入口。页面支持：

- 选择主机、时间范围、资源类型、预测天数、阈值和分析时长作为上下文。
- 使用示例问题快速触发全局风险巡检、主机性能诊断、容量规划、成本优化、告警根因、异常检测、知识库排障和巡检总结。
- 展示后端 Eino 图节点和工具调用时间线。
- 展示结构化诊断报告，包括风险等级、置信度、关键证据、可能原因、建议步骤和关联实体。
- 通过历史会话抽屉恢复、删除会话；当前会话会高亮。

独立 `AIAnalysis.vue` 页面已经不再是当前功能入口；相关能力已整合到运维助手。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- ECharts
- Pinia
- Vue Router
- Axios
- Server-Sent Events

## 快速开始

```bash
cd monitor-frontend
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

开发环境 API 地址通过 `.env.development` 配置：

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。当前构建命令会先执行 `vue-tsc -b`，再执行 `vite build`。

预览构建结果：

```bash
npm run preview
```

## 项目结构

```text
monitor-frontend/
├── src/
│   ├── api/                 # API 封装
│   │   ├── opsAssistant.ts  # 运维助手 SSE、会话、报告类型
│   │   ├── agent.ts
│   │   ├── metrics.ts
│   │   ├── alert.ts
│   │   ├── knowledge.ts
│   │   ├── inspection.ts
│   │   └── ...
│   ├── components/          # 公共组件和导航
│   ├── views/               # 页面
│   │   ├── OpsAssistant.vue
│   │   ├── Dashboard.vue
│   │   ├── Agents.vue
│   │   ├── AgentDetail.vue
│   │   ├── AgentHistory.vue
│   │   ├── BigScreen.vue
│   │   ├── Alerts.vue
│   │   ├── Knowledge.vue
│   │   ├── Inspection.vue
│   │   └── components/      # 页面级子组件
│   ├── router/
│   ├── stores/
│   ├── types/
│   └── utils/
├── public/
├── dist/
├── package.json
├── vite.config.ts
└── README.md
```

## 主要路由

- `/dashboard`：监控面板
- `/bigscreen`：监控大屏
- `/agents`：主机管理
- `/agents/:id`：主机详情
- `/agents/:id/history`：历史指标
- `/crash-analysis`：宕机分析
- `/processes`：进程监控
- `/docker`：Docker 监控
- `/gpu`：GPU 监控
- `/logs`：日志查看
- `/scripts`：脚本执行
- `/services`：服务状态
- `/alerts`：告警管理，管理员可见
- `/llm-config`：LLM 配置，管理员可见
- `/ops-assistant`：运维助手
- `/knowledge`：知识库
- `/inspection`：智能巡检
- `/users`：用户管理，管理员可见

## API 与鉴权

所有接口通过 `src/utils/request.ts` 统一封装：

- 自动携带 JWT token。
- token 过期时尝试刷新。
- 401 自动跳转登录页。
- 后端响应统一按 `{ code, message, data }` 解包。

运维助手流式输出使用 `fetch` + SSE，接口为：

```text
GET /api/v1/ops-assistant/chat/stream
```

## 部署

Docker 构建：

```bash
cd monitor-frontend
docker build -t monitor-frontend:latest .
```

如果前后端同域部署，默认使用 `/api`：

```bash
docker run -d --name monitor-frontend -p 80:80 monitor-frontend:latest
```

如果后端是独立域名，构建时指定：

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api -t monitor-frontend:latest .
```

更多部署细节见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 开发约定

- 新增页面需要同步更新 `src/router/index.ts` 和 `src/components/NavMenu.vue`。
- 新增 API 先在 `src/api/` 定义类型和方法，不直接在页面里拼请求。
- 页面使用 Element Plus 组件，图表使用 ECharts。
- 提交前至少运行：

```bash
npm run build
```

## 相关文档

- [Backend README](../monitor-backend/README.md)
- [Agent README](../monitor-agent/README.md)
- [部署文档](./DEPLOYMENT.md)

## 许可证

MIT license
