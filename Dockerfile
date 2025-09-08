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
    pkg-config \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswresample-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for whisper.cpp compilation
ENV CFLAGS="-mtune=generic"
ENV CXXFLAGS="-mtune=generic"
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF"
ENV CC="gcc"
ENV CXX="g++"

# Set multi-architecture library paths (works for both Intel and ARM)
ENV PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
ENV LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:/usr/lib/aarch64-linux-gnu:$LD_LIBRARY_PATH"

# Log detected architecture for debugging
RUN echo "Building for architecture: $(dpkg --print-architecture)"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Pre-build whisper.cpp to avoid runtime compilation issues
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
    export CFLAGS="-mtune=generic" && \
    export CXXFLAGS="-mtune=generic" && \
    rm -rf build && \
    mkdir -p build && \
    cd build && \
    cmake .. -DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) && \
    echo "Pre-build completed successfully" || \
    (echo "Pre-build failed, cleaning up build directory" && rm -rf /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build)

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