# Use Node.js official image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat ffmpeg build-base python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image, copy all the files and run Next.js
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for FFmpeg and nodejs-whisper
RUN apk add --no-cache libc6-compat ffmpeg build-base python3 make g++ wget cmake git

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy static files
COPY --from=builder /app/public ./public

# Copy package files
COPY package.json package-lock.json* ./
# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Build whisper-cli binary in the nodejs-whisper directory where it expects it
# Debug: Check current user and permissions
RUN whoami && id && ls -la /app/node_modules/nodejs-whisper/cpp/

# First ensure the entire whisper.cpp directory tree has proper permissions for CMake
RUN chmod -R 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/ && \
	mkdir -p /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build && \
	chmod -R 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build && \
	chown -R root:root /app/node_modules/nodejs-whisper/cpp/whisper.cpp/

RUN git config --global --add safe.directory /app/node_modules/nodejs-whisper/cpp/whisper.cpp
# Full write permissions for the entire whisper.cpp tree
RUN chmod -R 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/

# Debug: Verify permissions after setting them
RUN ls -la /app/node_modules/nodejs-whisper/cpp/whisper.cpp/ && \
	ls -la /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build/

# Initialize a git repository to avoid git warnings during CMake configuration
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
	git init . && \
	git config user.email "docker@build.local" && \
	git config user.name "Docker Build" && \
	git add . && \
	git commit -m "Initial commit for build" || true

# Create a clean build directory and ensure it's writable
RUN rm -rf /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build && \
	mkdir -p /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build && \
	chmod 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build && \
	chown root:root /app/node_modules/nodejs-whisper/cpp/whisper.cpp/build

# Build with proper CMake flags
RUN cd /app/node_modules/nodejs-whisper/cpp/whisper.cpp && \
	cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_CCACHE=OFF && \
	cmake --build build --config Release && \
	chmod +x build/bin/whisper-cli

# Fix permissions for nodejs-whisper models directory so any user can write
RUN chmod -R 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/models/ || true
RUN chmod -R 777 /app/node_modules/nodejs-whisper/cpp/whisper.cpp/

# Create directories with proper permissions for any user
# Note: /app/data is NOT created here - let the app create it at runtime with correct ownership
RUN mkdir -p .next /app/.next /app/.next/cache /tmp/audiobook-wizard && \
	chmod 777 .next /app/.next /app/.next/cache /tmp/audiobook-wizard


# Copy the build output (standalone includes all necessary node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]