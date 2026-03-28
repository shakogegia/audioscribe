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
