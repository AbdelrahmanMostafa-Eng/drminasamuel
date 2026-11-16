# Bioacademy — production image (VPS / any Docker host)
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN node scripts/copy-pdf-worker.mjs && npx prisma generate && npx next build

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app ./
RUN mkdir -p /app/storage
EXPOSE 3000
# Applies pending migrations, then starts the server
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
