FROM node:24-slim

WORKDIR /app

# Install system dependencies
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

# Set environment variables for whisper.cpp ARM compilation
ENV CFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics"
ENV CXXFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics"
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF"
ENV CC="gcc"
ENV CXX="g++"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Pre-build whisper.cpp to avoid runtime compilation issues
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
    export CFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics" && \
    export CXXFLAGS="-march=armv8-a -mtune=generic -mno-outline-atomics" && \
    mkdir -p build && \
    cd build && \
    cmake .. -DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) || echo "Pre-build failed, will build at runtime"

# Copy source code
COPY . .

# Install PM2 globally
RUN npm install -g pm2

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="localhost"
ENV CHROMA_PORT="8000"
ENV CLEANUP_TEMP_FILES="true"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER root

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]