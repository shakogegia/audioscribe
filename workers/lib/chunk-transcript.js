// lib/chunkTranscript.js - Improved version
module.exports.chunkTranscript = function chunkTranscript(segments, options = {}) {
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

      console.log(`✅ Created chunk ${chunks.length}: ${chunk.duration}s, ${currentChunk.length} lines`)

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

function createChunk(lines, startTime, endTime, index) {
  const rawText = lines.join(" ")

  // Clean text for better embeddings
  const cleanText = rawText
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, " ") // Remove special chars but keep punctuation
    .trim()

  const duration = (endTime - startTime) / 1000 // Convert from milliseconds to seconds

  return {
    text: rawText, // Keep original for display
    cleanText: cleanText, // Use this for embeddings
    startTime,
    endTime,
    duration: Math.round(duration),
    lineCount: lines.length,
    chapterIndex: Math.floor(index / 15),
    wordCount: cleanText.split(/\s+/).length,
    id: `chunk_${index}`,
    keyPhrases: extractKeyPhrases(cleanText),
  }
}

function getTimeDifference(start, end) {
  try {
    const startSeconds = timeToSeconds(start)
    const endSeconds = timeToSeconds(end)
    return Math.max(0, endSeconds - startSeconds)
  } catch (error) {
    console.warn("Error calculating time difference:", error)
    return 0
  }
}

function timeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0

  const parts = timeStr.split(":")
  if (parts.length !== 3) return 0

  const hours = parseInt(parts[0]) || 0
  const minutes = parseInt(parts[1]) || 0
  const seconds = parseFloat(parts[2]) || 0

  return hours * 3600 + minutes * 60 + seconds
}

function isNaturalBreak(currentSegment, nextSegment) {
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

function extractKeyPhrases(text) {
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
  const wordFreq = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Return top 10 most frequent meaningful words
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

// Alternative simple chunking for testing
module.exports.simpleChunkTranscript = function simpleChunkTranscript(segments, segmentsPerChunk = 30) {
  console.log("🔄 Using simple segment-based chunking...")

  const chunks = []

  for (let i = 0; i < segments.length; i += segmentsPerChunk) {
    const chunkSegments = segments.slice(i, i + segmentsPerChunk)

    // Get first and last segment times
    const startTime = chunkSegments[0]?.startTime || 0
    const endTime = chunkSegments[chunkSegments.length - 1]?.endTime || 0

    const chunk = {
      text: chunkSegments.map(s => s.text).join(" "),
      startTime,
      endTime,
      duration: Math.round((endTime - startTime) / 1000), // Convert to seconds
      lineCount: chunkSegments.length,
      chapterIndex: Math.floor(chunks.length / 20),
      id: `chunk_${chunks.length}`,
    }

    chunks.push(chunk)
    console.log(`✅ Created simple chunk ${chunks.length}: ${chunk.lineCount} segments`)
  }

  console.log(`🎉 Simple chunking complete! Generated ${chunks.length} chunks`)
  return chunks
}

// Usage in setup script:
module.exports.setupNewBook = async function setupNewBook(segments, bookId, options = {}) {
  console.log("📚 Setting up audiobook:", bookId)

  console.log(`📄 Transcript loaded: ${segments.length} segments`)

  // Try advanced chunking first, fall back to simple if it fails
  let chunks
  try {
    chunks = chunkTranscript(segments, options)
  } catch (error) {
    console.warn("⚠️ Advanced chunking failed, using simple chunking:", error.message)
    chunks = simpleChunkTranscript(segments)
  }

  if (chunks.length === 0) {
    throw new Error("❌ No chunks generated - check transcript format")
  }

  if (chunks.length === 1) {
    console.log("⚠️ Only 1 chunk generated - trying simple chunking instead")
    chunks = simpleChunkTranscript(segments, 25) // Smaller chunks
  }

  // Show chunk preview
  console.log("\n📋 Chunk Preview:")
  chunks.slice(0, 3).forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`)
    console.log(`  📏 Duration: ${chunk.duration}s`)
    console.log(`  📄 Segments: ${chunk.lineCount}`)
    console.log(`  ⏰ Time: ${chunk.startTime}ms - ${chunk.endTime}ms`)
    console.log(`  📝 Preview: ${chunk.text.substring(0, 100)}...`)
  })

  // Initialize vector database
  const { AudiobookVectorDB } = await import("./vectorDb.js")
  const vectorDb = new AudiobookVectorDB()
  await vectorDb.initialize(bookId)

  // Add chunks to vector database
  console.log("🧠 Creating embeddings and storing in vector database...")
  await vectorDb.addChunks(chunks)

  console.log("✅ Setup complete!")
  return {
    chunks: chunks.length,
    bookId,
    totalDuration: chunks.reduce((sum, chunk) => sum + chunk.duration, 0),
    avgChunkDuration: Math.round(chunks.reduce((sum, chunk) => sum + chunk.duration, 0) / chunks.length),
  }
}
