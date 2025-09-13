import { TranscriptSegment } from "@prisma/client"

export function chunkTranscript(
  segments: TranscriptSegment[],
  options: { maxChunkDuration?: number; maxChunkLines?: number; minChunkDuration?: number } = {}
) {
  const {
    maxChunkDuration = 180, // 3 minutes
    maxChunkLines = 50, // Maximum lines per chunk
    minChunkDuration = 30, // Minimum 30 seconds per chunk
  } = options

  console.log("🔄 Starting transcript chunking...")

  const chunks = []
  let currentChunk = []
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

    // Check if we should end this chunk
    const duration = (chunkEndTime - chunkStartTime) / 1000 // Convert from milliseconds to seconds
    const shouldEndChunk =
      duration >= maxChunkDuration ||
      currentChunk.length >= maxChunkLines ||
      (duration >= minChunkDuration && isNaturalBreak(segment, segments[i + 1]))

    if (shouldEndChunk && currentChunk.length > 5) {
      // Ensure minimum chunk size
      // Create chunk
      const chunk = createChunk(currentChunk, chunkStartTime, chunkEndTime, chunks.length)
      chunks.push(chunk)

      // Reset for next chunk
      currentChunk = []
      chunkStartTime = null
      chunkEndTime = null
    }
  }

  // Handle final chunk
  if (currentChunk.length > 0) {
    const finalChunk = createChunk(
      currentChunk,
      chunkStartTime || 0,
      chunkEndTime || lastValidEndTime || 0,
      chunks.length
    )
    chunks.push(finalChunk)
    console.log(`✅ Created final chunk ${chunks.length}: ${finalChunk.duration}s, ${currentChunk.length} lines`)
  }

  console.log(`🎉 Chunking complete! Generated ${chunks.length} chunks`)

  // Log chunk statistics
  const avgDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0) / chunks.length
  const avgLines = chunks.reduce((sum, chunk) => sum + chunk.lineCount, 0) / chunks.length
  console.log(`📊 Average chunk: ${Math.round(avgDuration)}s duration, ${Math.round(avgLines)} lines`)

  return chunks
}

function createChunk(lines: string[], startTime: number, endTime: number, index: number) {
  const rawText = lines.join(" ")

  const duration = (endTime - startTime) / 1000 // Convert from milliseconds to seconds

  return {
    text: rawText, // Keep original for display
    startTime,
    endTime,
    duration: Math.round(duration),
    lineCount: lines.length,
    chapterIndex: Math.floor(index / 15),
    wordCount: rawText.split(/\s+/).length,
    id: `chunk_${index}`,
    keyPhrases: extractKeyPhrases(rawText),
  }
}

function isNaturalBreak(currentSegment: TranscriptSegment, nextSegment: TranscriptSegment) {
  if (!nextSegment) return true

  // Look for natural breaking points
  const breakIndicators = [
    "Chapter",
    "CHAPTER",
    "Part",
    "PART",
    "***",
    "---",
    "Meanwhile",
    "Later",
    "The next day",
    "Hours later",
  ]

  return breakIndicators.some(
    indicator => nextSegment.text.includes(indicator) || currentSegment.text.includes(indicator)
  )
}

function extractKeyPhrases(text: string) {
  // Simple key phrase extraction for better search
  const commonWords = new Set([
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "must",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))

  // Get word frequency
  const wordFreq: Record<string, number> = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Return top 10 most frequent meaningful words
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}
