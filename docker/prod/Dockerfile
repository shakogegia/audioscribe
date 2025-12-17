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

# Set environment variables for whisper.cpp compilation
ENV CFLAGS="-mtune=generic"
ENV CXXFLAGS="-mtune=generic"
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_CPU_HBM=OFF"
ENV CC="gcc"
ENV CXX="g++"

# Set multi-architecture library paths (works for both Intel and ARM)
# ENV PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
# ENV LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:/usr/lib/aarch64-linux-gnu:$LD_LIBRARY_PATH"

# Install newer GLIBC from testing repository
RUN echo "deb http://deb.debian.org/debian testing main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -t testing libc6 -y && \
    rm -rf /var/lib/apt/lists/*

# Log detected architecture for debugging
RUN echo "Building for architecture: $(dpkg --print-architecture)"

# Install Piper TTS
RUN pip3 install --no-cache-dir piper-tts==1.2.0 --break-system-packages

RUN pip3 install --no-cache-dir chromadb --break-system-packages


# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

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
RUN npm install -g nodemon

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/sqlite/store.db"
ENV DATA_DIR="/app/data"
ENV CHROMA_HOST="localhost"
ENV CHROMA_PORT="8000"
ENV CLEANUP_TEMP_FILES="true"
ENV CHROMA_CORS_ALLOW_ORIGINS='["*"]'
ENV CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]'
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV REDIS_HOST="localhost"
ENV REDIS_PORT="6379"
ENV PIPER_MODELS_DIR="/app/data/piper-models"

USER root

EXPOSE 3000

COPY ./docker/prod/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./docker/prod/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]