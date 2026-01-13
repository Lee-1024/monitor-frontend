# 前端部署说明文档

本文档说明如何将监控系统前端项目打包并**使用 Nginx 反向代理**部署到生产环境。

## 部署架构

本方案采用 **Nginx 反向代理** 架构：

```
用户请求
   ↓
Nginx (80/443端口)
   ├─→ 静态文件服务 (前端打包文件: /dist)
   │   └─→ /var/www/monitor-frontend/dist
   │
   └─→ 反向代理 (后端 API)
       └─→ http://localhost:8080/api
```

**优势**：
- ✅ 前后端统一域名，避免跨域问题
- ✅ Nginx 高性能静态文件服务
- ✅ 统一入口，便于管理和维护
- ✅ 支持负载均衡和 SSL 终止

## 目录

- [环境要求](#环境要求)
- [构建步骤](#构建步骤)
- [Nginx 反向代理配置](#nginx-反向代理配置)
- [部署步骤](#部署步骤)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 环境要求

### 构建环境

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **操作系统**: Linux / macOS / Windows

### 生产环境

- **Nginx**: >= 1.18.0
- **操作系统**: Linux (推荐 Ubuntu 20.04+ / CentOS 7+)

## 构建步骤

### 1. 安装依赖

```bash
cd monitor-frontend
npm install
# 或使用 yarn
yarn install
```

### 2. 配置环境变量（使用反向代理时通常不需要）

**使用 Nginx 反向代理时**，前端和后端通过同一域名访问，**通常不需要配置环境变量**，使用默认的 `/api` 即可。

只有在特殊情况下（如后端在不同域名），才需要创建 `.env.production`：

```bash
# .env.production（仅在特殊情况下需要）
# 使用反向代理时，通常不需要此配置
VITE_API_BASE_URL=/api
```

**注意**：
- ✅ **推荐**：使用 Nginx 反向代理，前端使用 `/api`（默认值），无需配置环境变量
- ❌ **不推荐**：跨域部署，需要配置完整后端地址，且后端需要配置 CORS

### 3. 构建生产版本

```bash
npm run build
# 或使用 yarn
yarn build
```

构建完成后，会在 `monitor-frontend/dist` 目录下生成生产文件。

### 4. 验证构建结果

```bash
# 预览构建结果（可选）
npm run preview
```

访问 `http://localhost:4173` 查看构建结果是否正确。

## Nginx 反向代理配置

### 核心配置说明

Nginx 作为反向代理服务器，同时承担两个角色：
1. **静态文件服务器**：直接提供前端打包后的静态文件（HTML、CSS、JS 等）
2. **反向代理服务器**：将 `/api` 请求转发到后端服务

### 标准配置（推荐）

使用 Nginx 反向代理，前端和后端通过同一域名访问：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    # ============================================
    # 1. 静态文件服务（前端打包文件）
    # ============================================
    root /var/www/monitor-frontend/dist;  # 前端打包文件路径
    index index.html;
    
    # 前端路由支持（Vue Router History 模式）
    # 当访问不存在的路径时，返回 index.html，由前端路由处理
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ============================================
    # 2. 反向代理（后端 API）
    # ============================================
    location /api {
        # 代理到后端服务
        proxy_pass http://localhost:8080;  # 后端服务地址和端口
        
        # HTTP 版本
        proxy_http_version 1.1;
        
        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # 请求头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # ============================================
    # 3. 静态资源缓存优化
    # ============================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # ============================================
    # 4. Gzip 压缩
    # ============================================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types 
        text/plain 
        text/css 
        text/xml 
        text/javascript 
        application/javascript 
        application/xml+rss 
        application/json
        application/x-font-ttf
        application/vnd.ms-fontobject
        font/opentype
        image/svg+xml
        image/x-icon;
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 后端服务在不同服务器

如果后端服务部署在不同的服务器上，只需修改 `proxy_pass` 地址：

```nginx
location /api {
    # 代理到远程后端服务器
    proxy_pass http://backend-server-ip:8080;  # 后端服务器 IP 和端口
    
    # 其他配置保持不变...
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**注意**：
- 确保后端服务器防火墙允许 Nginx 服务器访问
- 如果使用 HTTPS，将 `http://` 改为 `https://`
- 如果后端需要认证，可以在 Nginx 配置中添加认证头

### HTTPS 配置（推荐生产环境）

使用 HTTPS 时，Nginx 作为 SSL 终止点，处理 SSL/TLS 加密：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 反向代理配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # ============================================
    # SSL 证书配置
    # ============================================
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # ============================================
    # 静态文件服务（前端）
    # ============================================
    root /var/www/monitor-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ============================================
    # 反向代理（后端 API）
    # ============================================
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ============================================
    # 静态资源缓存
    # ============================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # ============================================
    # Gzip 压缩
    # ============================================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # ============================================
    # 安全头
    # ============================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**SSL 证书获取**（使用 Let's Encrypt）：

```bash
# 安装 certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已自动配置）
sudo certbot renew --dry-run
```

## 部署步骤

### 1. 准备部署目录

```bash
# 创建部署目录
sudo mkdir -p /var/www/monitor-frontend

# 设置目录权限
sudo chown -R $USER:$USER /var/www/monitor-frontend
```

### 2. 上传构建文件

将构建后的 `dist` 目录内容上传到服务器：

```bash
# 方式一：使用 scp
scp -r monitor-frontend/dist/* user@your-server:/var/www/monitor-frontend/

# 方式二：使用 rsync（推荐）
rsync -avz --delete monitor-frontend/dist/ user@your-server:/var/www/monitor-frontend/

# 方式三：在服务器上直接构建
# 在服务器上克隆代码，安装依赖，执行构建
```

### 3. 配置 Nginx 反向代理

```bash
# 编辑 Nginx 配置文件
sudo nano /etc/nginx/sites-available/monitor-frontend

# 将上面的反向代理配置内容复制到文件中
# 重要：需要修改以下配置项
#   - server_name: 您的域名
#   - root: 前端打包文件路径（如 /var/www/monitor-frontend/dist）
#   - proxy_pass: 后端服务地址（如 http://localhost:8080）

# 创建软链接（如果使用 sites-available/sites-enabled）
sudo ln -s /etc/nginx/sites-available/monitor-frontend /etc/nginx/sites-enabled/

# 测试 Nginx 配置（重要：确保配置正确）
sudo nginx -t

# 如果测试通过，重新加载 Nginx
sudo systemctl reload nginx
# 或
sudo service nginx reload
```

**配置要点**：
1. ✅ **静态文件路径**：`root` 指向前端打包后的 `dist` 目录
2. ✅ **反向代理路径**：`location /api` 中的 `proxy_pass` 指向后端服务地址
3. ✅ **路由支持**：`location /` 必须包含 `try_files $uri $uri/ /index.html;` 以支持 Vue Router
4. ✅ **后端地址**：确保 `proxy_pass` 中的后端服务地址和端口正确

### 4. 验证部署

访问 `http://your-domain.com` 或 `https://your-domain.com`，检查：

1. **前端页面**：
   - ✅ 页面是否正常加载
   - ✅ 静态资源（CSS、JS）是否正常加载
   - ✅ 路由跳转是否正常（刷新页面不出现 404）

2. **反向代理**：
   - ✅ 打开浏览器开发者工具（F12）→ Network 标签
   - ✅ 查看 API 请求（如 `/api/v1/auth/login`）
   - ✅ 确认请求状态码为 200 或正常响应
   - ✅ 确认请求 URL 为前端域名（不是后端地址）

3. **功能测试**：
   - ✅ 登录功能是否正常
   - ✅ 数据加载是否正常
   - ✅ 所有页面路由是否正常

**验证反向代理是否生效**：

```bash
# 在服务器上测试 API 代理
curl -I http://localhost/api/v1/health
# 或
curl -I http://your-domain.com/api/v1/health

# 应该返回后端服务的响应
```

## 环境变量配置

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

### 构建时使用环境变量

```bash
# 使用生产环境变量构建
npm run build

# 或指定环境文件
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

## 常见问题

### 1. 页面刷新后 404

**问题**：使用 Vue Router History 模式时，刷新页面出现 404。

**解决**：确保 Nginx 配置中包含：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. API 请求失败

**问题**：前端无法访问后端 API。

**解决**：
- 检查 Nginx 的 `/api` 代理配置是否正确
- 检查后端服务是否正常运行
- 检查防火墙设置
- 查看 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`

### 3. 静态资源加载失败

**问题**：CSS、JS 等静态资源无法加载。

**解决**：
- 检查 `dist` 目录权限
- 检查 Nginx 的 `root` 配置路径是否正确
- 检查文件是否完整上传

### 4. 跨域问题

**问题**：前后端跨域部署时出现 CORS 错误。

**解决**：
- 在 `.env.production` 中配置完整的后端 API 地址
- 后端需要配置 CORS 允许前端域名访问
- 检查浏览器控制台的错误信息

### 5. 构建文件过大

**问题**：构建后的文件体积过大。

**解决**：
- 启用 Gzip 压缩（已在配置中）
- 使用 CDN 加速静态资源
- 检查是否有未使用的依赖

### 6. 页面加载慢

**问题**：首次加载页面速度慢。

**解决**：
- 启用静态资源缓存（已在配置中）
- 使用 CDN 加速
- 检查服务器带宽
- 优化图片资源大小

### 7. 权限问题

**问题**：Nginx 无法读取文件。

**解决**：
```bash
# 设置正确的文件权限
sudo chown -R www-data:www-data /var/www/monitor-frontend
sudo chmod -R 755 /var/www/monitor-frontend
```

### 8. Nginx 配置测试失败

**问题**：`nginx -t` 测试失败。

**解决**：
- 检查配置文件语法
- 检查路径是否正确
- 查看错误提示信息

## 自动化部署脚本示例

### 使用脚本部署

创建 `deploy.sh`：

```bash
#!/bin/bash

# 配置变量
SERVER_USER="your-user"
SERVER_HOST="your-server.com"
DEPLOY_PATH="/var/www/monitor-frontend"
NGINX_CONFIG="/etc/nginx/sites-available/monitor-frontend"

# 构建
echo "Building frontend..."
npm run build

# 上传文件
echo "Uploading files..."
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# 重启 Nginx
echo "Reloading Nginx..."
ssh ${SERVER_USER}@${SERVER_HOST} "sudo nginx -t && sudo systemctl reload nginx"

echo "Deployment completed!"
```

使用：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 监控和维护

### 查看 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 定期更新

1. 在本地构建新版本
2. 上传新的 `dist` 文件
3. 重新加载 Nginx（无需重启）

### 回滚

如果新版本有问题，可以：

```bash
# 恢复之前的版本
cd /var/www/monitor-frontend
# 从备份恢复或使用 git 回退
```

## 安全建议

1. **使用 HTTPS**：生产环境必须启用 HTTPS
2. **定期更新**：保持 Nginx 和系统更新
3. **防火墙配置**：只开放必要的端口
4. **访问控制**：如有需要，配置 IP 白名单
5. **日志监控**：定期检查访问日志和错误日志

## 联系支持

如遇到问题，请：
1. 查看本文档的常见问题部分
2. 检查 Nginx 和浏览器控制台日志
3. 联系技术支持团队

---

**最后更新**: 2024年

