#!/bin/bash

# ============================================
# 监控系统前端自动化部署脚本
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量（请根据实际情况修改）
SERVER_USER="${DEPLOY_USER:-your-user}"
SERVER_HOST="${DEPLOY_HOST:-your-server.com}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/monitor-frontend}"
NGINX_CONFIG_PATH="${NGINX_CONFIG:-/etc/nginx/sites-available/monitor-frontend}"

# 函数：打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请先安装 Node.js >= 18.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js 版本过低，需要 >= 18.0.0，当前版本: $(node -v)"
        exit 1
    fi
    
    info "Node.js 版本检查通过: $(node -v)"
}

# 安装依赖
install_dependencies() {
    info "检查并安装依赖..."
    
    if [ ! -d "node_modules" ]; then
        info "安装 npm 依赖..."
        npm install
    else
        info "依赖已存在，跳过安装"
    fi
}

# 构建项目
build_project() {
    info "开始构建项目..."
    
    # 检查是否存在 .env.production
    if [ ! -f ".env.production" ]; then
        warn ".env.production 文件不存在，将使用默认配置"
    fi
    
    npm run build
    
    if [ ! -d "dist" ]; then
        error "构建失败，dist 目录不存在"
        exit 1
    fi
    
    info "构建完成"
}

# 上传文件
upload_files() {
    info "上传文件到服务器..."
    
    # 检查是否配置了服务器信息
    if [ "$SERVER_USER" = "your-user" ] || [ "$SERVER_HOST" = "your-server.com" ]; then
        error "请先配置服务器信息："
        error "  export DEPLOY_USER=your-user"
        error "  export DEPLOY_HOST=your-server.com"
        error "  或直接修改脚本中的 SERVER_USER 和 SERVER_HOST 变量"
        exit 1
    fi
    
    # 使用 rsync 上传
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        dist/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
    
    info "文件上传完成"
}

# 重启 Nginx
reload_nginx() {
    info "重新加载 Nginx 配置..."
    
    ssh ${SERVER_USER}@${SERVER_HOST} << EOF
        # 测试 Nginx 配置
        if sudo nginx -t; then
            echo "Nginx 配置测试通过"
            sudo systemctl reload nginx
            echo "Nginx 重新加载完成"
        else
            echo "Nginx 配置测试失败，请检查配置文件"
            exit 1
        fi
EOF
    
    info "Nginx 重新加载完成"
}

# 验证部署
verify_deployment() {
    info "验证部署..."
    
    # 检查文件是否存在
    ssh ${SERVER_USER}@${SERVER_HOST} << EOF
        if [ -f "${DEPLOY_PATH}/index.html" ]; then
            echo "✓ index.html 存在"
        else
            echo "✗ index.html 不存在"
            exit 1
        fi
EOF
    
    info "部署验证完成"
}

# 主函数
main() {
    info "========================================="
    info "开始部署监控系统前端"
    info "========================================="
    
    # 检查配置
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --build-only   仅构建，不上传"
        echo "  --upload-only  仅上传，不构建（需要先有 dist 目录）"
        echo ""
        echo "环境变量:"
        echo "  DEPLOY_USER    服务器用户名（默认: your-user）"
        echo "  DEPLOY_HOST    服务器地址（默认: your-server.com）"
        echo "  DEPLOY_PATH    部署路径（默认: /var/www/monitor-frontend）"
        echo ""
        echo "示例:"
        echo "  DEPLOY_USER=admin DEPLOY_HOST=192.168.1.100 $0"
        exit 0
    fi
    
    # 执行步骤
    check_node
    install_dependencies
    
    if [ "$1" != "--upload-only" ]; then
        build_project
    else
        if [ ! -d "dist" ]; then
            error "dist 目录不存在，无法仅上传"
            exit 1
        fi
        info "跳过构建，直接上传"
    fi
    
    if [ "$1" != "--build-only" ]; then
        upload_files
        reload_nginx
        verify_deployment
        
        info "========================================="
        info "部署完成！"
        info "========================================="
    else
        info "========================================="
        info "构建完成（未上传）"
        info "========================================="
    fi
}

# 执行主函数
main "$@"

