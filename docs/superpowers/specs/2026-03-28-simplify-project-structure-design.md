# Simplify Project Structure — Design Spec

## Goal

Switch from npm to pnpm, consolidate Docker setup from 2 Dockerfiles + 2 docker-compose files into a single root-level Dockerfile with no docker-compose, adopt an xtc-style Makefile, and add bin/ scripts for Conductor workspace automation.

## Current State

- npm with `package-lock.json`
- `docker/dev/Dockerfile`, `docker/dev/entrypoint.sh`, `docker/dev/supervisord.conf`
- `docker/prod/Dockerfile`, `docker/prod/entrypoint.sh`, `docker/prod/supervisord.conf`
- `docker-compose.dev.yml`, `docker-compose.prod.yml`
- Dev and prod Dockerfiles are 95% identical
- Dev and prod entrypoints differ by one line (`npm run build` in prod)
- Dev and prod supervisord configs differ only in `dev` vs `start` commands
- Makefile wraps docker-compose commands

## Target State

```
Dockerfile              # single prod Dockerfile using pnpm
Makefile                # xtc-style: dev, build, run, stop, logs, shell, push, clean
entrypoint.sh           # prod container entrypoint
supervisord.conf        # prod process manager config
conductor.json          # points to bin/ scripts
bin/
  env.sh                # copy .env from conductor root
  setup.sh              # pnpm install + prisma setup
  run.sh                # pnpm dev:all
  archive.sh            # no-op placeholder
```

## Files to Delete

- `docker/` (entire directory — dev and prod)
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`

## Decisions

- No dev Docker — development happens locally with `pnpm dev:all`
- No docker-compose — `docker build`/`docker run` via Makefile
- Memory limits (`--memory=10g --memory-reservation=4g --shm-size=2g`) go in Makefile `run` target
- Dockerfile uses pnpm for install
- `entrypoint.sh` and `supervisord.conf` live at project root
- Conductor bin/ scripts use `$CONDUCTOR_ROOT_PATH` for .env, `$CONDUCTOR_PORT` for dev server port
