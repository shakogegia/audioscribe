<div align="center">
    <img src="./public/logo/logo-dark.png" width=200 height=200>
    <h1>AudioScribe</h1>
</div>

A companion app for [Audiobookshelf](https://www.audiobookshelf.org/) that leverages multiple AI providers to enhance audiobook experiences through transcription, intelligent bookmarking, and contextual chat.

> [!NOTE]  
> This project is purely an experiment. I’m not sure where it’s headed, how it will evolve, or even if it’s useful or needed at all. For now, it’s just a playground to explore ideas around audiobooks + AI assistance. Feel free to try it out or share feedback

See [Youtube Demo](https://youtu.be/zyr6M5ebI38)

<img alt="screenshot" src="https://github.com/user-attachments/assets/bb617e0a-310c-4235-9d7b-49bf59cd6506" />

## Features

- **Library Integration**: Seamless connection with Audiobookshelf servers for book management and progress syncing
- **Transcription**: Automatic speech recognition (ASR) with Whisper for high-quality audiobook
  transcription
- **Chat Assistant**: Interactive chat with contextual understanding of audiobook content, supporting
  time-based and chapter-based queries
- **Bookmark Title Suggestions**: AI-generated meaningful bookmark titles using transcript analysis and
  context awareness
- **Real-time Captions**: View synchronized captions during audiobook playback with transcript navigation
- **Multiple AI Providers**: Comprehensive support for OpenAI, Google Gemini, Anthropic Claude, xAI, and
  local Ollama models
- **Context Management**: Dynamic transcript context windows with chapter boundary awareness for
  optimal AI responses
- **Search & Discovery**: Full-text search across your audiobook library with transcript-based results
- **Export/Import**: Transcript export in multiple formats and import capabilities for existing
  transcriptions

## Prerequisites

- An Audiobookshelf server with API access
- API keys for AI providers (Ollama, Gemini, OpenAI)

### Installation

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
```

#### Run

```sh
# Dev (Next.js + workers + ChromaDB)
make dev

# Or production
pnpm build && pnpm start
```

</details>

<details>
<summary>Docker</summary>

#### Using Make

```sh
# Build and run with default settings
make run

# With custom credentials
AUTH_EMAIL=me@example.com AUTH_PASSWORD=secret SESSION_SECRET=mysecret make run
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
  --shm-size=2g \
  -v audioscribe-data:/app/data \
  shakogegia/audioscribe:latest
```

</details>

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `AUTH_EMAIL` | Login email | `email` |
| `AUTH_PASSWORD` | Login password | `password` |
| `SESSION_SECRET` | Session encryption key | `secret` |
| `DATA_DIR` | Data storage path | `./data` |
| `CHROMA_HOST` | ChromaDB host | `localhost` |
| `CHROMA_PORT` | ChromaDB port | `8000` |

AI providers are configured in the app UI after login.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
