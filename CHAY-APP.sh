#!/bin/bash
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   FTZ-ERP Platform — Khởi động      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Kiểm tra Docker
if ! command -v docker &>/dev/null; then
    echo "❌ Chưa cài Docker Desktop!"
    echo "   Tải tại: https://www.docker.com/products/docker-desktop"
    echo "   Cài xong rồi chạy lại file này."
    exit 1
fi

echo "✅ Docker đã sẵn sàng"
echo ""
echo "⏳ Đang khởi động FTZ-ERP..."
echo "   (Lần đầu có thể mất 3-5 phút)"
echo ""

docker compose up --build
