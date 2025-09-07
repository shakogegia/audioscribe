const { program } = require("commander")
const { chunkTranscript } = require("./lib/chunk-transcript")
const { AudiobookVectorDB } = require("./lib/chroma-db")
const fs = require("fs")
const path = require("path")
const os = require("os")
const axios = require("axios")

program.requiredOption("-b, --book-id <string>", "The ID of the book").parse(process.argv)

program.parse()

const { bookId } = program.opts()

async function setupNewBook(bookId) {
  console.log("Setting up audiobook:", bookId)

  // Fetch segments from API
  const response = await axios.get(`http://localhost:3000/api/book/${bookId}/transcript`, {
    params: {
      model: "tiny.en",
    },
  })
  const { segments } = response.data

  // Chunk transcript
  console.log("Chunking transcript...")
  const chunks = chunkTranscript(segments, { maxChunkDuration: 120, maxChunkLines: 25, minChunkDuration: 30 })
  console.log(`Created ${chunks.length} chunks`)

  // Initialize vector database
  const vectorDb = new AudiobookVectorDB()
  await vectorDb.clearCollection(bookId)
  await vectorDb.initialize(bookId)

  // Add chunks to vector database
  console.log("Creating embeddings and storing in vector database...")
  await vectorDb.addChunks(chunks)

  console.log("Setup complete!")
  return { chunks: chunks.length, bookId }
}

setupNewBook(bookId)
