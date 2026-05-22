FROM node:22-alpine
RUN npm install -g pnpm

WORKDIR /app

# Copy toàn bộ source code
COPY . .

# Cài dependencies
RUN pnpm install

# Generate Prisma Client
RUN cd packages/db && npx prisma generate --schema prisma/schema

EXPOSE 3000

# Startup script
RUN chmod +x docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]
