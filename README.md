<div align="center">
    <img src="./public/logo/logo-dark.png" width=200 height=200>
    <h1>AudioScribe</h1>
</div>

A companion app for [Audiobookshelf](https://www.audiobookshelf.org/) that leverages multiple AI providers to enhance audiobook experiences through transcription, intelligent bookmarking, and contextual chat.

> [!NOTE]  
> This project is purely an experiment. I’m not sure where it’s headed, how it will evolve, or even if it’s useful or needed at all.  
> For now, it’s just a playground to explore ideas around audiobooks + AI assistance
> Feel free to try it out or share feedback

See [Youtube Demo](https://youtu.be/zyr6M5ebI38)

<img width="1489" height="1237" alt="screenshot" src="https://github.com/user-attachments/assets/bb617e0a-310c-4235-9d7b-49bf59cd6506" />


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

Clone repository, install npm dependencies and set env variables

```sh
# Clone repo and install npm dependencies
clone git@github.com:shakogegia/audioscribe.git
cd audioscribe
npm install
cp .env.example .env
```

#### Run

```sh
npm run dev

# or
npm run build && npm run start
```

</details>

<details>
<summary>Docker</summary>

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  audioscribe:
    image: shakogegia/audioscribe:latest
    container_name: audioscribe
    ports:
      - 3000:3000
    restart: unless-stopped
    user: "1000:1000" # Match your host user UID:GID
    volumes:
      - /path/to/data:/app/data # Persist application data including database, audio files, and configuration
```

Then run:

```sh
docker-compose up -d
```

</details>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
