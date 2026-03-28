#!/bin/bash
set -e

export PORT="${CONDUCTOR_PORT:-3000}"
pnpm dev:all
