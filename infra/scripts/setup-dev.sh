#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up FTZ-ERP development environment..."

# Check prerequisites
command -v docker &>/dev/null || { echo "❌ Docker is required"; exit 1; }
command -v pnpm &>/dev/null || { echo "❌ pnpm is required: npm install -g pnpm"; exit 1; }
command -v node &>/dev/null || { echo "❌ Node.js 22+ is required"; exit 1; }

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example — update values as needed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start infrastructure services
echo "🐳 Starting Docker services..."
docker compose -f infra/docker/docker-compose.yml up -d --wait postgres redis minio meilisearch

# Wait for Postgres
echo "⏳ Waiting for PostgreSQL..."
until docker exec ftz-postgres pg_isready -U ftzuser -d ftzdb &>/dev/null; do
  sleep 1
done

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Seed database
echo "🌱 Seeding database..."
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Start dev server: pnpm dev"
echo "   App:              http://localhost:3000"
echo "   MinIO Console:    http://localhost:9001  (minioadmin / minioadmin)"
echo "   Meilisearch:      http://localhost:7700"
echo "   Mailhog:          http://localhost:8025"
echo "   Temporal UI:      http://localhost:8080"
echo ""
echo "   Default login: admin@ftz-erp.com / admin123"
