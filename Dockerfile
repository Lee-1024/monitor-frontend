# ============================================
# Monitor Frontend - 多阶段构建（Node 构建 + Nginx 托管）
# ============================================

# 阶段一：构建前端资源
FROM node:20-alpine AS builder

WORKDIR /app

# 构建时 API 地址，同域名部署用 /api，跨域则传入完整地址
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# 阶段二：Nginx 托管静态资源
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA 路由回退到 index.html；API 请求使用构建时传入的 VITE_API_BASE_URL，如需反向代理可挂载自定义 nginx 配置
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
