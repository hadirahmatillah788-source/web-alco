# Multi-stage Dockerfile for Next.js & Prisma on Railway (Debian glibc)
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXTAUTH_SECRET="build-secret-dummy-alco"
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Automatically sync Prisma database tables on startup, then start Next.js
CMD ["sh", "-c", "npx prisma db push && npm run start"]
