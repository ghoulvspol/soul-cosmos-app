#!/bin/bash
# Soul Cosmos 本地部署启动脚本
# 用法: ./start.sh [start|stop|restart|status|logs]

set -e
cd "$(dirname "$0")"

APP_NAME="soul-cosmos"
PORT=${PORT:-8066}
PID_FILE=".server.pid"
LOG_FILE="server.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 加载 .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 检查 API Key
check_env() {
  if [ -z "$MIFY_API_KEY" ]; then
    echo -e "${RED}❌ 缺少 MIFY_API_KEY${NC}"
    echo "请执行: cp .env.example .env && 编辑 .env 填入 API Key"
    exit 1
  fi
}

# 安装依赖
install_deps() {
  if [ ! -d "server/node_modules" ]; then
    echo -e "${CYAN}📦 安装依赖...${NC}"
    cd server && npm install --production && cd ..
  fi
}

# 启动服务
do_start() {
  check_env
  install_deps

  if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  服务已在运行 (PID: $(cat $PID_FILE))${NC}"
    return 0
  fi

  echo -e "${CYAN}🚀 启动 Soul Cosmos...${NC}"
  cd server
  nohup node index.js > "../$LOG_FILE" 2>&1 &
  echo $! > "../$PID_FILE"
  cd ..

  # 等待启动
  for i in {1..10}; do
    if curl -s "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
      echo -e "${GREEN}✅ 启动成功！${NC}"
      echo -e "   地址: ${CYAN}http://localhost:$PORT${NC}"
      echo -e "   PID:  $(cat $PID_FILE)"
      echo -e "   日志: $LOG_FILE"
      return 0
    fi
    sleep 0.5
  done

  echo -e "${RED}❌ 启动超时，请检查日志: $LOG_FILE${NC}"
  return 1
}

# 停止服务
do_stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      rm -f "$PID_FILE"
      echo -e "${GREEN}✅ 已停止 (PID: $PID)${NC}"
    else
      rm -f "$PID_FILE"
      echo -e "${YELLOW}⚠️  进程已不存在${NC}"
    fi
  else
    # 尝试通过端口查找
    PID=$(lsof -t -i :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
      kill $PID
      echo -e "${GREEN}✅ 已停止 (PID: $PID)${NC}"
    else
      echo -e "${YELLOW}⚠️  服务未在运行${NC}"
    fi
  fi
}

# 查看状态
do_status() {
  PID=$(lsof -t -i :$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "${GREEN}✅ 运行中${NC}"
    echo -e "   PID:  $PID"
    echo -e "   地址: ${CYAN}http://localhost:$PORT${NC}"
    echo -e "   内存: $(ps -o rss= -p $PID 2>/dev/null | awk '{printf "%.1f MB", $1/1024}')"
    # 测试 API
    HEALTH=$(curl -s "http://localhost:$PORT/api/health" 2>/dev/null)
    echo -e "   健康: $HEALTH"
  else
    echo -e "${RED}❌ 未运行${NC}"
  fi
}

# 查看日志
do_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    echo -e "${YELLOW}⚠️  日志文件不存在${NC}"
  fi
}

# 主入口
case "${1:-start}" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; sleep 1; do_start ;;
  status)  do_status ;;
  logs)    do_logs ;;
  *)
    echo "用法: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
