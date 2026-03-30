<div align="center">
    <img src="./public/logo/logo-dark.png" width=200 height=200>
    <h1>AudioScribe</h1>
</div>

A companion app for [Audiobookshelf](https://www.audiobookshelf.org/) that adds local transcription, transcript-aware chat, AI summaries, smarter bookmarks, and optional iOS shortcut integrations.

> [!NOTE]  
> This project is purely an experiment. I’m not sure where it’s headed, how it will evolve, or even if it’s useful or needed at all. For now, it’s just a playground to explore ideas around audiobooks + AI assistance. Feel free to try it out or share feedback

See [Youtube Demo](https://youtu.be/zyr6M5ebI38)

<img alt="screenshot" src="https://github.com/user-attachments/assets/bb617e0a-310c-4235-9d7b-49bf59cd6506" />

## iOS Shortcuts
<img width="1179" height="790" alt="image" src="https://github.com/user-attachments/assets/d4009e32-2277-4678-b06c-ef968991f601" />


## Features

- **Audiobookshelf integration**: Connect to your server, browse libraries, open books, sync favorites, and work with live listening progress.
- **Local transcription pipeline**: Books are processed in stages: `Download` -> `PrepareAudio` -> `Transcribe`, powered by a Python worker and `faster-whisper`.
- **Transcript-aware chat**: Ask questions about a book with context pulled from the transcript around the current moment or chapter.
- **AI-generated extras**: Create bookmark title suggestions, chapter summaries, and "Previously on" recaps.
- **Piper TTS playback**: Preview local voices and turn summaries into spoken audio.
- **Captions and transcript navigation**: Read along while playing audio and jump through the transcript.
- **Import/export**: Import an existing transcript JSON or export processed transcript data.
- **Search and stats**: Search your library and inspect processing and transcription analytics.
- **iOS shortcuts support**: Use built-in shortcut endpoints for spoken recaps and chapter summaries.
- **Optional notifications**: Send a Pushover notification when a book finishes processing.

## Current AI Support

The current app setup UI and backend expose these providers today:

- **Google Gemini**
- **Ollama**

The repository still contains some package dependencies for other providers, but the active configuration flow and model resolution currently target Gemini and Ollama.

## How It Works

AudioScribe is a Next.js app backed by SQLite via Prisma, plus a Python worker that handles the heavy lifting for audiobook processing.

1. Sign in with the app credentials from your environment variables.
2. Connect AudioScribe to your Audiobookshelf server with a user API key.
3. Enable Gemini or Ollama in the setup screens.
4. Start setup for a book.
5. The worker downloads audio, prepares chunks, and transcribes them locally.
6. The app uses those transcripts for chat, summaries, bookmark suggestions, captions, search, and iOS shortcut responses.

## Prerequisites

- Node.js 24+
- `pnpm` 10+
- Python 3.10+
- `ffmpeg`
- An Audiobookshelf server with API access
- At least one AI provider configured in the app: Gemini or Ollama

## Installation

<details>
<summary>Local</summary>

#### System Dependencies

```sh
brew install ffmpeg
brew install cmake
```

#### Setup

```sh
git clone git@github.com:shakogegia/audioscribe.git
cd audioscribe
pnpm install
cp .env.example .env
python3 -m pip install -r scripts/requirements.txt
```

Add the missing runtime variables to `.env`:

```sh
DATABASE_URL=file:./data/sqlite/store.db
SESSION_SECRET=change-me
AUTH_EMAIL=me@example.com
AUTH_PASSWORD=supersecret

# Optional, but recommended if you want to use iOS shortcuts/endpoints
SECRET_KEY=another-secret

# Optional, set true only when serving over HTTPS
SECURE_COOKIES=false
```

Initialize the local database and seed the prompt templates:

```sh
mkdir -p data/sqlite
pnpm db:generate
pnpm db:push
pnpm db:seed
```

#### Run

Development starts the Next.js app and the Python worker together:

```sh
make dev

# equivalent
pnpm dev:all
```

If you want a production-style local run, start both processes:

```sh
pnpm build
pnpm start

# separate terminal
python3 -m scripts.worker
```

</details>

<details>
<summary>Docker</summary>

The container image handles database initialization, prompt seeding, and starts both the Next.js app and the Python worker automatically.

#### Using Make

```sh
# Build and run with default settings
make run

# With custom credentials and port
AUTH_EMAIL=me@example.com AUTH_PASSWORD=secret SESSION_SECRET=mysecret PORT=8080 make run
```

Available targets: `build`, `run`, `stop`, `logs`, `shell`, `push`, `clean`

#### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
services:
  audioscribe:
    image: shakogegia/audioscribe:latest
    container_name: audioscribe
    ports:
      - 3000:3000
    environment:
      - AUTH_EMAIL=me@example.com
      - AUTH_PASSWORD=secret
      - SESSION_SECRET=mysecret
      - SECRET_KEY=my-shortcuts-secret
    volumes:
      - audioscribe-data:/app/data
    restart: unless-stopped
    shm_size: "2gb"
    deploy:
      resources:
        limits:
          memory: 10G
        reservations:
          memory: 4G

volumes:
  audioscribe-data:
```

```sh
docker compose up -d
```

#### Using Docker Run

```sh
docker run -d \
  --name audioscribe \
  -p 3000:3000 \
  -e AUTH_EMAIL=me@example.com \
  -e AUTH_PASSWORD=secret \
  -e SESSION_SECRET=mysecret \
  -e SECRET_KEY=my-shortcuts-secret \
  --shm-size=2g \
  -v audioscribe-data:/app/data \
  shakogegia/audioscribe:latest
```

</details>

## First Run

After signing in, the app will guide you through setup:

1. Configure your Audiobookshelf server URL and API key.
2. Enable at least one AI provider: Gemini or Ollama.
3. Optionally choose a default LLM, transcription model, Piper voice, and Pushover keys.
4. Open a book and run setup to download, prepare, and transcribe it.

## Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | App port | `3000` |
| `AUTH_EMAIL` | Login email for the built-in auth screen | `email@audioscribe.com` |
| `AUTH_PASSWORD` | Login password for the built-in auth screen | `password` |
| `SESSION_SECRET` | Secret used to sign login sessions | `secret` |
| `DATABASE_URL` | SQLite database path used by Prisma | `file:./data/sqlite/store.db` |
| `DATA_DIR` | App data directory for config, cache, chunks, and downloaded assets | `./data` |
| `SECRET_KEY` | Shared secret for iOS shortcut and API access through `?secret=...` | no default |
| `SECURE_COOKIES` | Set to `true` when serving over HTTPS | `false` |

AI providers, TTS model selection, transcription settings, Audiobookshelf credentials, and Pushover keys are configured in the app UI after login.

`CHROMA_HOST` and `CHROMA_PORT` still appear in `.env.example`, but they are not used by the current code paths.

## iOS Shortcuts and Endpoints

AudioScribe ships with shortcut-oriented endpoints for:

- `GET /api/ios/previously-on`
- `GET /api/ios/summary/chapter?chapter=current`
- `GET /api/ios/summary/chapter?chapter=previous`

These routes are protected by the same middleware as the rest of the app. For shortcut-based access, pass `?secret=<SECRET_KEY>` and make sure `SECRET_KEY` is configured in the environment.

## Notes

- The Audiobookshelf API key should belong to a user with download and update permissions.
- Transcript-based features depend on running the Python worker.
- Piper voices are fetched from Hugging Face and downloaded on first use.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
