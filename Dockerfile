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
RUN pnpm build
RUN pnpm prune --prod

# Stage 3: Install Python dependencies
FROM python:3.12-slim AS python
RUN pip install --no-cache-dir \
    "faster-whisper>=1.1.0" \
    "piper-tts==1.2.0" \
    "requests>=2.32.0"

# Stage 4: Runtime
FROM node:24-slim AS runtime
WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sqlite3 \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy built Next.js app + prod node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public

# Copy Python environment from python stage
COPY --from=python /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/dist-packages
COPY --from=python /usr/local/bin /usr/local/bin

# Copy runtime source files
COPY prisma ./prisma
COPY scripts ./scripts
COPY entrypoint.sh ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CLEANUP_TEMP_FILES="true"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

EXPOSE 3000
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
