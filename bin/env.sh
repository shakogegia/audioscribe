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
