FROM oven/bun:1.3.14 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma 7 loads prisma.config.ts even for `generate`, and Next evaluates server
# modules during build. Use non-secret build-time placeholders only in this stage;
# Koyeb/runtime must still provide the real DATABASE_URL/JWT_SECRET values.
RUN DATABASE_URL="file:./build.db" bunx prisma generate
RUN DATABASE_URL="file:./build.db" JWT_SECRET="build-time-only-placeholder-change-in-runtime" bun run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Keep the free Koyeb instance from overcommitting memory during cold starts.
ENV NODE_OPTIONS=--max-old-space-size=384

COPY --from=builder /app/.next/standalone ./

EXPOSE 3000

CMD ["node", "server.js"]
