import { Worker } from "bullmq"
import { redis } from "../../redis"
import { completeStageProgress, resetStageProgress } from "./utils/utils"
import { BookSetupStage, TranscriptSegment } from "../../../../generated/prisma"
import { prisma } from "@/lib/prisma"
import { vectorDb } from "@/ai/lib/vector"

export const vectorizeWorker = new Worker(
  "vectorize-book",
  async job => {
    const { bookId } = job.data
    // Reset stage progress
    await resetStageProgress(bookId, BookSetupStage.Vectorize)

    // Fetch segments from API
    const segments = await prisma.transcriptSegment.findMany({ where: { bookId } })

    // Chunk transcript
    console.log("Chunking transcript...")
    const chunks = chunkTranscript(segments, { maxChunkDuration: 5 * 60 })
    console.log(`Created ${chunks.length} chunks`)

    // Initialize vector database
    await vectorDb.clearCollection(bookId)
    await vectorDb.initialize(bookId)

    // Add chunks to vector database
    console.log("Creating embeddings and storing in vector database...")
    await vectorDb.addChunks(chunks)

    // Complete stage progress
    await completeStageProgress(bookId, BookSetupStage.Vectorize)
  },
  { connection: redis }
)

interface TranscriptChunk {
  text: string
  startTime: number
  endTime: number
}

function chunkTranscript(
  segments: TranscriptSegment[],
  options: { maxChunkDuration?: number } = {}
): TranscriptChunk[] {
  const { maxChunkDuration = 180 } = options

  console.log("🔄 Starting transcript chunking...")

  const chunks: TranscriptChunk[] = []
  let currentChunk: string[] = []
  let chunkStartTime = null
  let chunkEndTime = null
  let lastValidEndTime = null

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if (!segment.text || !segment.text.trim()) continue // Skip empty segments

    // Set chunk start time if this is the first segment in chunk
    if (!chunkStartTime) {
      chunkStartTime = segment.startTime
    }

    chunkEndTime = segment.endTime
    lastValidEndTime = segment.endTime

    // Add segment text to current chunk
    currentChunk.push(segment.text.trim())

    // Check if we should end this chunk based only on duration
    const duration = (chunkEndTime - chunkStartTime) / 1000 // Convert from milliseconds to seconds

    if (duration >= maxChunkDuration && currentChunk.length > 0) {
      // Look for sentence boundary to avoid splitting sentences
      const chunkEndIndex = findSentenceBreakPoint(currentChunk)

      if (chunkEndIndex !== -1) {
        // Create chunk up to the sentence boundary
        const chunkSegments = currentChunk.slice(0, chunkEndIndex + 1)
        const chunk = createChunk(
          chunkSegments,
          chunkStartTime,
          segments[i - (currentChunk.length - chunkEndIndex - 1)].endTime
        )
        chunks.push(chunk)

        // Keep remaining segments for next chunk
        currentChunk = currentChunk.slice(chunkEndIndex + 1)
        chunkStartTime = segments[i - (currentChunk.length - 1)]?.startTime || segment.startTime
      } else if (currentChunk.length > 1) {
        // Fallback: create chunk without the last segment to avoid splitting
        const chunkSegments = currentChunk.slice(0, -1)
        const chunk = createChunk(chunkSegments, chunkStartTime, segments[i - 1].endTime)
        chunks.push(chunk)

        // Keep last segment for next chunk
        currentChunk = [currentChunk[currentChunk.length - 1]]
        chunkStartTime = segment.startTime
      }
    }
  }

  // Handle final chunk
  if (currentChunk.length > 0) {
    const finalChunk = createChunk(currentChunk, chunkStartTime || 0, chunkEndTime || lastValidEndTime || 0)
    chunks.push(finalChunk)
    console.log(`✅ Created final chunk ${chunks.length}: ${currentChunk.length} segments`)
  }

  console.log(`🎉 Chunking complete! Generated ${chunks.length} chunks`)

  return chunks
}

function findSentenceBreakPoint(currentChunk: string[]): number {
  // Look backwards from the end of the current chunk to find a sentence ending
  for (let i = currentChunk.length - 1; i >= 0; i--) {
    const text = currentChunk[i]
    // Check if this segment ends with sentence-ending punctuation
    if (/[.!?]\s*$/.test(text.trim())) {
      return i
    }
  }
  return -1 // No sentence boundary found
}

function createChunk(lines: string[], startTime: number, endTime: number): TranscriptChunk {
  const rawText = lines.join(" ")

  return {
    text: rawText,
    startTime,
    endTime,
  }
}
