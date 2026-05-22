#!/bin/sh
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      FTZ-ERP Platform — Khởi động...     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Chờ database sẵn sàng
echo "⏳ Đang kết nối database..."
until pg_isready -h postgres -U ftzuser -d ftzdb 2>/dev/null; do
  sleep 1
done
echo "✅ Database đã sẵn sàng"

# Tạo bảng trong database
echo "🗄️  Đồng bộ cấu trúc database..."
cd /app/packages/db
npx prisma db push --schema prisma/schema --accept-data-loss 2>/dev/null
echo "✅ Database đã cập nhật"

# Kiểm tra nếu chưa có dữ liệu mẫu thì tạo
RESULT=$(npx prisma --schema prisma/schema db execute --stdin <<'EOF' 2>/dev/null
SELECT COUNT(*)::text FROM tenants;
EOF
)
if echo "$RESULT" | grep -q "^0$" || [ -z "$RESULT" ]; then
  echo "🌱 Đang tạo dữ liệu mẫu..."
  npx tsx prisma/seed/index.ts
  echo "✅ Dữ liệu mẫu đã tạo"
else
  echo "✅ Dữ liệu đã có sẵn"
fi

cd /app

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ FTZ-ERP đã sẵn sàng!                 ║"
echo "║                                          ║"
echo "║  🌐 Mở trình duyệt: http://localhost:3000 ║"
echo "║  📧 Email:    admin@ftz-erp.com          ║"
echo "║  🔑 Mật khẩu: (gõ bất kỳ)               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Chạy app
exec pnpm --filter "@ftz-erp/web" run dev
