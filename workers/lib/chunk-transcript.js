// lib/chunkTranscript.js - Improved version
module.exports.chunkTranscript = function chunkTranscript(transcriptText, options = {}) {
  const {
    maxChunkDuration = 180, // 3 minutes
    maxChunkLines = 50, // Maximum lines per chunk
    minChunkDuration = 30, // Minimum 30 seconds per chunk
  } = options;

  console.log("🔄 Starting transcript chunking...");

  const lines = transcriptText.split("\n").filter(line => line.trim());
  const chunks = [];
  let currentChunk = [];
  let chunkStartTime = null;
  let chunkEndTime = null;
  let lastValidEndTime = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue; // Skip empty lines

    // Check if line contains timestamp
    if (line.includes("-->")) {
      const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]/);

      if (timeMatch) {
        const startTime = timeMatch[1].split(".")[0];
        const endTime = timeMatch[2].split(".")[0];

        // Set chunk start time if this is the first timestamp in chunk
        if (!chunkStartTime) {
          chunkStartTime = startTime;
        }

        chunkEndTime = endTime;
        lastValidEndTime = endTime;
        const processedLine = line
          .replace(/(\d{1,2}:\d{2}:\d{2})\.\d{1,3}/g, "$1") // remove milliseconds
          .replace(/\[\d{2}:\d{2}:\d{2}\s*-->\s*\d{2}:\d{2}:\d{2}\]/g, "") // remove timestamps
          .replace(/\s+/g, " ")
          .replace(/\n/g, "")
          .replace(/\\n/g, " ")
          .replace(/^[ \t]+|[ \t]+$/g, "")
          .replace(/[\n\r]/g, " ")
          .replace(/\\n/g, " ");

        currentChunk.push(processedLine);

        // Check if we should end this chunk
        const duration = getTimeDifference(chunkStartTime, endTime);
        const shouldEndChunk =
          duration >= maxChunkDuration ||
          currentChunk.length >= maxChunkLines ||
          (duration >= minChunkDuration && isNaturalBreak(line, lines[i + 1]));

        if (shouldEndChunk && currentChunk.length > 5) {
          // Ensure minimum chunk size
          // Create chunk
          const chunk = createChunk(currentChunk, chunkStartTime, chunkEndTime, chunks.length);
          chunks.push(chunk);

          console.log(`✅ Created chunk ${chunks.length}: ${chunk.duration}s, ${currentChunk.length} lines`);

          // Reset for next chunk
          currentChunk = [];
          chunkStartTime = null;
          chunkEndTime = null;
        }
      }
    } else {
      // Add content line to current chunk
      currentChunk.push(line);
    }
  }

  // Handle final chunk
  if (currentChunk.length > 0) {
    const finalChunk = createChunk(
      currentChunk,
      chunkStartTime || "00:00:00.000",
      chunkEndTime || lastValidEndTime || "00:00:00.000",
      chunks.length
    );
    chunks.push(finalChunk);
    console.log(`✅ Created final chunk ${chunks.length}: ${finalChunk.duration}s, ${currentChunk.length} lines`);
  }

  console.log(`🎉 Chunking complete! Generated ${chunks.length} chunks`);

  // Log chunk statistics
  const avgDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0) / chunks.length;
  const avgLines = chunks.reduce((sum, chunk) => sum + chunk.lineCount, 0) / chunks.length;
  console.log(`📊 Average chunk: ${Math.round(avgDuration)}s duration, ${Math.round(avgLines)} lines`);

  return chunks;
};

function createChunk(lines, startTime, endTime, index) {
  const rawText = lines.join(" ");

  // Clean text for better embeddings
  const cleanText = rawText
    .replace(/\[\d{2}:\d{2}:\d{2}.*?\]/g, "") // Remove all timestamps
    .replace(/-->/g, "") // Remove arrows
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, " ") // Remove special chars but keep punctuation
    .trim();

  const duration = getTimeDifference(startTime, endTime);

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
  };
}

function getTimeDifference(start, end) {
  try {
    const startSeconds = timeToSeconds(start);
    const endSeconds = timeToSeconds(end);
    return Math.max(0, endSeconds - startSeconds);
  } catch (error) {
    console.warn("Error calculating time difference:", error);
    return 0;
  }
}

function timeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;

  const parts = timeStr.split(":");
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
}

function isNaturalBreak(currentLine, nextLine) {
  if (!nextLine) return true;

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
  ];

  return breakIndicators.some(indicator => nextLine.includes(indicator) || currentLine.includes(indicator));
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
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Get word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Return top 10 most frequent meaningful words
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Alternative simple chunking for testing
module.exports.simpleChunkTranscript = function simpleChunkTranscript(transcriptText, linesPerChunk = 30) {
  console.log("🔄 Using simple line-based chunking...");

  const lines = transcriptText.split("\n").filter(line => line.trim());
  const chunks = [];

  for (let i = 0; i < lines.length; i += linesPerChunk) {
    const chunkLines = lines.slice(i, i + linesPerChunk);

    // Find first and last timestamps in this chunk
    let startTime = "00:00:00.000";
    let endTime = "00:00:00.000";

    for (const line of chunkLines) {
      const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
      if (timeMatch) {
        if (startTime === "00:00:00.000") startTime = timeMatch[1];
        endTime = timeMatch[2];
      }
    }

    const chunk = {
      text: chunkLines.join("\n"),
      startTime,
      endTime,
      duration: Math.round(getTimeDifference(startTime, endTime)),
      lineCount: chunkLines.length,
      chapterIndex: Math.floor(chunks.length / 20),
      id: `chunk_${chunks.length}`,
    };

    chunks.push(chunk);
    console.log(`✅ Created simple chunk ${chunks.length}: ${chunk.lineCount} lines`);
  }

  console.log(`🎉 Simple chunking complete! Generated ${chunks.length} chunks`);
  return chunks;
};

// Usage in setup script:
module.exports.setupNewBook = async function setupNewBook(transcriptPath, bookId, options = {}) {
  console.log("📚 Setting up audiobook:", bookId);

  const fs = await import("fs");
  const transcript = fs.readFileSync(transcriptPath, "utf-8");

  console.log(`📄 Transcript loaded: ${transcript.length} characters`);

  // Try advanced chunking first, fall back to simple if it fails
  let chunks;
  try {
    chunks = chunkTranscript(transcript, options);
  } catch (error) {
    console.warn("⚠️ Advanced chunking failed, using simple chunking:", error.message);
    chunks = simpleChunkTranscript(transcript);
  }

  if (chunks.length === 0) {
    throw new Error("❌ No chunks generated - check transcript format");
  }

  if (chunks.length === 1) {
    console.log("⚠️ Only 1 chunk generated - trying simple chunking instead");
    chunks = simpleChunkTranscript(transcript, 25); // Smaller chunks
  }

  // Show chunk preview
  console.log("\n📋 Chunk Preview:");
  chunks.slice(0, 3).forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`);
    console.log(`  📏 Duration: ${chunk.duration}s`);
    console.log(`  📄 Lines: ${chunk.lineCount}`);
    console.log(`  ⏰ Time: ${chunk.startTime} - ${chunk.endTime}`);
    console.log(`  📝 Preview: ${chunk.text.substring(0, 100)}...`);
  });

  // Initialize vector database
  const { AudiobookVectorDB } = await import("./vectorDb.js");
  const vectorDb = new AudiobookVectorDB();
  await vectorDb.initialize(bookId);

  // Add chunks to vector database
  console.log("🧠 Creating embeddings and storing in vector database...");
  await vectorDb.addChunks(chunks);

  console.log("✅ Setup complete!");
  return {
    chunks: chunks.length,
    bookId,
    totalDuration: chunks.reduce((sum, chunk) => sum + chunk.duration, 0),
    avgChunkDuration: Math.round(chunks.reduce((sum, chunk) => sum + chunk.duration, 0) / chunks.length),
  };
};
