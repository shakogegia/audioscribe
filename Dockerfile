# Stage 1: Install Node dependencies
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Stage 2: Build Next.js application
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATA_DIR="/app/data"
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
RUN mkdir -p /app/data/sqlite && pnpm db:generate && pnpm db:push
RUN pnpm build
RUN pnpm prune --prod

# Stage 3: Runtime
FROM node:24-slim AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install runtime dependencies + Python with pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sqlite3 \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages directly in the runtime image
RUN pip3 install --no-cache-dir --break-system-packages \
    "faster-whisper>=1.1.0" \
    "requests>=2.32.0" \
    && pip3 install --no-cache-dir --break-system-packages "piper-tts==1.2.0" || true

# Copy built Next.js app + prod node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public

# Copy runtime source files
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts
COPY entrypoint.sh ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CLEANUP_TEMP_FILES="true"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

EXPOSE 3000
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
