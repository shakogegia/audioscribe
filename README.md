# AudioScribe

A companion app for [Audiobookshelf](https://www.audiobookshelf.org/) that helps to manage audiobook bookmarks with AI bookmark suggestions and transcription.

![Bookmark Editing](demo/screenshots/edit.png)

## Features

### Bookmarking

- **AI Suggestions**: Generate intelligent, meaningful bookmark titles using LLM's
- **Multiple AI Providers**: Support for OpenAI, Google Gemini, Claude, and local Ollama models
- **Manual Bookmarking**: Easily rename and manage your own bookmarks

### Transcription

- Audio transcription is powered by Whisper model

## Prerequisites

- Docker and Docker Compose installed
- An Audiobookshelf server with API access
- API keys for AI providers

### Installation (Docker)

The included `docker-compose.yml` provides a complete setup:

```yaml
version: "3.8"

services:
  audiobook-bookmark-wizard:
    image: shakogegia/audiobook-bookmark-wizard:latest
    container_name: audiobook-bookmark-wizard
    user: "${UID:-1000}:${GID:-1000}"
    ports:
      - 3000:3000
    restart: unless-stopped
    volumes:
      - ./app-data:/app/data # Persist config files
      - ./temp-cache:/tmp/audiobook-wizard # Persist audio cache
```

## Screenshots

![Book Search](demo/screenshots/search.png)
![Book Management](demo/screenshots/book.png)
![ASR Transcription](demo/screenshots/asr.png)
![Audiobookshelf](demo/screenshots/audiobookshelf.png)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Audiobookshelf](https://www.audiobookshelf.org/) - Amazing audiobook server
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition model
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
