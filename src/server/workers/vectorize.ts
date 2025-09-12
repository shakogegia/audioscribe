import "dotenv/config"
import { vectorDb } from "@/ai/lib/vector"
import { prisma } from "@/lib/prisma"
import { chunkTranscript } from "@/server/workers/chunk-transcript"
import { program } from "commander"

program.requiredOption("-b, --book-id <string>", "The ID of the book").parse(process.argv)

program.parse(process.argv)

const { bookId } = program.opts()

async function setupNewBook(bookId: string) {
  console.log("Setting up audiobook:", bookId)

  // Fetch segments from API
  const segments = await prisma.transcriptSegment.findMany({
    where: { bookId },
  })

  // Chunk transcript
  console.log("Chunking transcript...")
  const chunks = chunkTranscript(segments, { maxChunkDuration: 120, maxChunkLines: 25, minChunkDuration: 30 })
  console.log(`Created ${chunks.length} chunks`)

  // Initialize vector database
  await vectorDb.clearCollection(bookId)
  await vectorDb.initialize(bookId)

  // Add chunks to vector database
  console.log("Creating embeddings and storing in vector database...")
  await vectorDb.addChunks(chunks)

  console.log("Setup complete!")
  return { chunks: chunks.length, bookId }
}

setupNewBook(bookId)
