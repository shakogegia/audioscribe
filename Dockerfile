FROM node:24-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    python3 \
    make \
    wget \
    cmake \
    git \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to fix whisper.cpp ARM NEON compilation issues
ENV CFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics"
ENV CXXFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics"
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF"
ENV CC="gcc"
ENV CXX="g++"

# Copy package files first
COPY package*.json ./

RUN npm ci

# Pre-configure whisper.cpp to avoid ARM NEON issues during runtime
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
    export CFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics" && \
    export CXXFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics" && \
    mkdir -p build && \
    cd build && \
    cmake .. -DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) || echo "Pre-build failed, will build at runtime"

# Copy the rest of the source code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set required environment variables
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="localhost"
ENV CHROMA_PORT="8000"
ENV CLEANUP_TEMP_FILES="true"

RUN npm install -g pm2

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]