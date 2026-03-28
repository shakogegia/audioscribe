#!/bin/bash
set -e

# Setup environment
source "$(dirname "$0")/env.sh"

# Install dependencies
pnpm install

# Setup database
pnpm db:generate
pnpm db:push
