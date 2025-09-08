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

# Create a non-root user with configurable UID/GID
# Default to 1000, but can be overridden for Portainer/Docker deployments
ARG UID=1000
ARG GID=1000
RUN set -e; \
    # Handle existing group gracefully \
    if ! getent group ${GID} >/dev/null; then \
        groupadd -g ${GID} appuser; \
    else \
        existing_group=$(getent group ${GID} | cut -d: -f1); \
        if [ "$existing_group" != "appuser" ]; then \
            groupadd appuser; \
        fi; \
    fi && \
    # Handle existing user gracefully \
    if ! getent passwd ${UID} >/dev/null; then \
        useradd -r -u ${UID} -g appuser -s /bin/sh appuser; \
    else \
        existing_user=$(getent passwd ${UID} | cut -d: -f1); \
        if [ "$existing_user" != "appuser" ]; then \
            useradd -r -g appuser -s /bin/sh appuser; \
        fi; \
    fi

# Install pm2 globally
RUN npm install -g pm2

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Create necessary directories and set proper permissions
RUN mkdir -p /app/data /app/.next && \
    chmod +x /app/entrypoint.sh && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]