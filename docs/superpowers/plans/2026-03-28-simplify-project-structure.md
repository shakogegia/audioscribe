# Simplify Project Structure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch to pnpm, consolidate Docker to a single Dockerfile with xtc-style Makefile, add Conductor bin/ scripts.

**Architecture:** Replace npm with pnpm as package manager. Collapse two nearly-identical Docker setups into one root-level Dockerfile for production only. Makefile provides `docker build`/`docker run` commands directly (no docker-compose). Conductor workspace automation via shell scripts in `bin/`.

**Tech Stack:** pnpm, Docker, Make, shell scripts, Prisma, Next.js

---

### Task 1: Switch to pnpm

**Files:**
- Modify: `package.json`
- Create: `pnpm-lock.yaml` (via `pnpm import`)
- Delete: `package-lock.json`

- [ ] **Step 1: Install pnpm if not present**

Run: `corepack enable && corepack prepare pnpm@latest --activate`
Expected: pnpm available globally

- [ ] **Step 2: Add packageManager field to package.json**

In `package.json`, add after `"private": true,`:

```json
"packageManager": "pnpm@10.12.1",
```

(Use the actual version from `pnpm --version` output)

- [ ] **Step 3: Update npm references in package.json scripts**

Change `"dev:all"` from:
```json
"dev:all": "concurrently \"npm run dev\" \"npm run dev:workers\""
```
to:
```json
"dev:all": "concurrently \"pnpm dev\" \"pnpm dev:workers\""
```

- [ ] **Step 4: Import lockfile and install**

Run:
```bash
pnpm import
pnpm install
```
Expected: `pnpm-lock.yaml` created, `node_modules` populated

- [ ] **Step 5: Delete old lockfile**

Run: `rm package-lock.json`

- [ ] **Step 6: Verify the app still works**

Run: `pnpm dev`
Expected: Next.js dev server starts on port 3000

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git rm package-lock.json
git commit -m "chore: switch from npm to pnpm"
```

---

### Task 2: Create bin/ scripts for Conductor

**Files:**
- Create: `bin/env.sh`
- Create: `bin/setup.sh`
- Create: `bin/run.sh`
- Create: `bin/archive.sh`
- Modify: `conductor.json`

- [ ] **Step 1: Create bin/env.sh**

```bash
#!/bin/bash

# Copy .env from conductor root if it doesn't exist locally
if [ ! -f .env ]; then
  if [ -n "$CONDUCTOR_ROOT_PATH" ] && [ -f "$CONDUCTOR_ROOT_PATH/.env" ]; then
    cp "$CONDUCTOR_ROOT_PATH/.env" .env
    echo "Copied .env from conductor root"
  elif [ -f .env.example ]; then
    cp .env.example .env
    echo "Copied .env from .env.example"
  else
    echo "Warning: No .env file found"
  fi
fi
```

- [ ] **Step 2: Create bin/setup.sh**

```bash
#!/bin/bash
set -e

# Setup environment
source "$(dirname "$0")/env.sh"

# Install dependencies
pnpm install

# Setup database
pnpm db:generate
pnpm db:push
```

- [ ] **Step 3: Create bin/run.sh**

```bash
#!/bin/bash
set -e

export PORT="${CONDUCTOR_PORT:-3000}"
pnpm dev:all
```

- [ ] **Step 4: Create bin/archive.sh**

```bash
#!/bin/bash
# No cleanup needed for now
```

- [ ] **Step 5: Make all scripts executable**

Run: `chmod +x bin/*.sh`

- [ ] **Step 6: Update conductor.json**

Replace the entire file with:
```json
{
  "scripts": {
    "setup": "bash bin/setup.sh",
    "run": "bash bin/run.sh",
    "archive": "bash bin/archive.sh"
  },
  "runScriptMode": "nonconcurrent"
}
```

- [ ] **Step 7: Commit**

```bash
git add bin/ conductor.json
git commit -m "feat: add conductor bin/ scripts for workspace automation"
```

---

### Task 3: Create root-level entrypoint.sh and supervisord.conf

**Files:**
- Create: `entrypoint.sh` (at project root)
- Create: `supervisord.conf` (at project root)

- [ ] **Step 1: Create entrypoint.sh at project root**

```bash
#!/bin/sh

mkdir -p $DATA_DIR /app/.next /app/data/redis

# Start Redis with persistence
echo "Starting Redis server..."
redis-cli shutdown 2>/dev/null || true
redis-server --daemonize yes \
    --dir /app/data/redis \
    --appendonly yes \
    --appendfilename "appendonly.aof"

# Setup environment
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Setup database
npx prisma generate
npx prisma db seed
npx prisma db push --accept-data-loss

# Build the application
echo "Building Next.js application..."
pnpm build

echo "Starting supervisor..."
supervisord -c /app/supervisord.conf
```

- [ ] **Step 2: Create supervisord.conf at project root**

```ini
[unix_http_server]
file=/tmp/supervisor.sock

[supervisorctl]
serverurl=unix:///tmp/supervisor.sock

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisord]
nodaemon=true
pidfile=/tmp/supervisord.pid
stderr_logfile=/dev/stdout
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
logfile=/dev/null
loglevel=warn

[program:audioscribe]
command=pnpm start
autostart=true
autorestart=true
stderr_logfile=/dev/stdout
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
directory=/app

[program:workers]
command=pnpm start:workers
autostart=true
autorestart=true
stderr_logfile=/dev/stdout
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
directory=/app

[program:chroma]
command=chroma run --host 127.0.0.1 --port 8000 --path ./data/chromadb
priority=10
autostart=true
autorestart=true
stderr_logfile=/dev/stdout
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
directory=/app
```

- [ ] **Step 3: Make entrypoint executable**

Run: `chmod +x entrypoint.sh`

- [ ] **Step 4: Commit**

```bash
git add entrypoint.sh supervisord.conf
git commit -m "feat: add root-level entrypoint and supervisord config"
```

---

### Task 4: Create root-level Dockerfile

**Files:**
- Create: `Dockerfile` (at project root)

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:24-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    python3 \
    python3-pip \
    make \
    wget \
    cmake \
    git \
    sqlite3 \
    libsqlite3-dev \
    pkg-config \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswresample-dev \
    libc6 \
    redis-server \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Whisper.cpp compilation flags
ENV CFLAGS="-mtune=generic"
ENV CXXFLAGS="-mtune=generic"
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF"
ENV CC="gcc"
ENV CXX="g++"

# Install newer GLIBC from testing
RUN echo "deb http://deb.debian.org/debian testing main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -t testing libc6 -y && \
    rm -rf /var/lib/apt/lists/*

# Install Python tools
RUN pip3 install --no-cache-dir piper-tts==1.2.0 chromadb --break-system-packages

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Pre-build whisper.cpp for architecture compatibility
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
    rm -rf build && mkdir -p build && cd build && \
    cmake .. -DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) && \
    echo "whisper.cpp build complete" || \
    (echo "whisper.cpp build failed, cleaning up" && rm -rf /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build)

# Copy source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="127.0.0.1"
ENV CHROMA_PORT="8000"
ENV CLEANUP_TEMP_FILES="true"
ENV CHROMA_CORS_ALLOW_ORIGINS='["*"]'
ENV CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]'
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV REDIS_HOST="localhost"
ENV REDIS_PORT="6379"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

EXPOSE 3000

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add single root-level Dockerfile using pnpm"
```

---

### Task 5: Create xtc-style Makefile

**Files:**
- Modify: `Makefile`

- [ ] **Step 1: Replace Makefile with xtc-style version**

Replace the entire `Makefile` with:

```makefile
IMAGE_NAME := audioscribe
CONTAINER_NAME := audioscribe
DOCKER_REPO ?= shakogegia/audioscribe
PORT ?= 3000
VOLUME_NAME := audioscribe-data

RUN_ENV :=
ifdef SESSION_SECRET
RUN_ENV += -e SESSION_SECRET=$(SESSION_SECRET)
endif
ifdef AUTH_EMAIL
RUN_ENV += -e AUTH_EMAIL=$(AUTH_EMAIL)
endif
ifdef AUTH_PASSWORD
RUN_ENV += -e AUTH_PASSWORD=$(AUTH_PASSWORD)
endif

.PHONY: dev build run stop logs push clean shell

dev:
	pnpm dev:all

build:
	docker build -t $(IMAGE_NAME) .

run: build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		--memory=10g \
		--memory-reservation=4g \
		--shm-size=2g \
		$(RUN_ENV) \
		-v $(VOLUME_NAME):/app/data \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(PORT)"

stop:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

logs:
	docker logs -f $(CONTAINER_NAME)

shell:
	docker exec -it $(CONTAINER_NAME) sh

push:
	docker buildx build --platform linux/amd64,linux/arm64 -t $(DOCKER_REPO):latest --push .

clean: stop
	-docker rmi $(IMAGE_NAME)
	-docker volume rm $(VOLUME_NAME)
```

- [ ] **Step 2: Commit**

```bash
git add Makefile
git commit -m "chore: simplify Makefile to xtc-style docker commands"
```

---

### Task 6: Delete old Docker files

**Files:**
- Delete: `docker/dev/Dockerfile`
- Delete: `docker/dev/entrypoint.sh`
- Delete: `docker/dev/supervisord.conf`
- Delete: `docker/prod/Dockerfile`
- Delete: `docker/prod/entrypoint.sh`
- Delete: `docker/prod/supervisord.conf`
- Delete: `docker-compose.dev.yml`
- Delete: `docker-compose.prod.yml`

- [ ] **Step 1: Remove all old Docker files**

```bash
rm -rf docker/
rm docker-compose.dev.yml docker-compose.prod.yml
```

- [ ] **Step 2: Update package.json publish script**

Change the `"publish"` script from:
```json
"publish": "docker buildx build --platform linux/amd64,linux/arm64 --push . -t shakogegia/audioscribe"
```
to:
```json
"publish": "make push"
```

- [ ] **Step 3: Verify .gitignore**

Ensure `pnpm-lock.yaml` is NOT in `.gitignore` (it should be committed).

- [ ] **Step 4: Commit**

```bash
git rm -r docker/
git rm docker-compose.dev.yml docker-compose.prod.yml
git add package.json
git commit -m "chore: remove old Docker files and docker-compose"
```

---

### Task 7: Verify

- [ ] **Step 1: Verify local dev works**

Run: `pnpm dev:all`
Expected: Next.js + workers start successfully

- [ ] **Step 2: Verify Docker build works**

Run: `make build`
Expected: Docker image builds successfully

- [ ] **Step 3: Final commit if any adjustments needed**
