# AudioScribe

A companion app for [Audiobookshelf](https://www.audiobookshelf.org/) that helps to enhance audiobook experience with AI bookmark title suggestions, transcription, chat and more.

See [Youtube Demo](https://youtu.be/zyr6M5ebI38)

![Bookmark Editing](demo/screenshots/edit.png)

## Features

- **AI Suggestions**: Generate meaningful bookmark titles using LLM's
- **Transcription**: Transcribe audiobook
- **Captions**: View generated captions for your audiobooks
- **Multiple AI Providers**: Support for OpenAI, Google Gemini, Claude, and local Ollama models
- **Manual Bookmarking**: Easily rename and manage your own bookmarks

### Transcription

- Audio transcription is powered by OpenAI's Whisper model

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

#### Ollama

```sh
 # Embedder
ollama pull all-minilm:latest

ollama pull llama3.2:3b
```

#### Install

```sh
clone git@github.com:shakogegia/audioscribe.git
cd audioscribe
npm install

# set env variables
cp .env.example .env
```

#### Run

```sh
npm run dev

# or
npm run build
npm run start

```

</details>

<details>
<summary>Docker</summary>

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

</details>

## Demo

<details>
<summary>Screenshots</summary>

![Book Search](demo/screenshots/search.png)
![Book Management](demo/screenshots/book.png)
![ASR Transcription](demo/screenshots/asr.png)
![Audiobookshelf](demo/screenshots/audiobookshelf.png)

</details>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Audiobookshelf](https://www.audiobookshelf.org/) - Amazing audiobook server
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition model
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
