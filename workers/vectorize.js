const { program } = require("commander");
const { chunkTranscript } = require("./lib/chunk-transcript");
const { AudiobookVectorDB } = require("./lib/chroma-db");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

program.requiredOption("-b, --book-id <string>", "The ID of the book").parse(process.argv);

program.parse();

const { transcript, bookId } = program.opts();

async function setupNewBook(transcriptPath, bookId) {
  console.log("Setting up audiobook:", bookId);

  // temp dir
  const response = await axios.post(`http://localhost:3000/api/book/${bookId}/transcribe/full`, {
    config: {
      transcriptionModel: "tiny.en",
    },
  });
  const { transcriptions } = response.data;

  // Read transcript
  const transcript = transcriptions
    .map(transcription => {
      const text = transcription.text;
      const fileStartTime = transcription.start;

      // update timestamps and add file start time
      // format is [starttime --> endtime]
      // result should be [file start time + starttime --> file start time + endtime]
      // timestamps are in this format: 00:00:00.000

      // Helper function to convert timestamp to seconds
      const timestampToSeconds = timestamp => {
        const [hours, minutes, seconds] = timestamp.split(":");
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      };

      // Helper function to convert seconds to timestamp
      const secondsToTimestamp = totalSeconds => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toFixed(3)
          .padStart(6, "0")}`;
      };

      // Process the text to update timestamps
      const result = text.replace(
        /\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\]/g,
        (match, startTime, endTime) => {
          const startSeconds = timestampToSeconds(startTime) + fileStartTime;
          const endSeconds = timestampToSeconds(endTime) + fileStartTime;
          return `[${secondsToTimestamp(startSeconds)} --> ${secondsToTimestamp(endSeconds)}]`;
        }
      );

      return result;
    })
    .join("\n");

  // Chunk transcript
  console.log("Chunking transcript...");
  const chunks = chunkTranscript(transcript, { maxChunkDuration: 120, maxChunkLines: 25, minChunkDuration: 30 });
  console.log(`Created ${chunks.length} chunks`);

  // Initialize vector database
  const vectorDb = new AudiobookVectorDB();
  await vectorDb.clearCollection(bookId);
  await vectorDb.initialize(bookId);

  // Add chunks to vector database
  console.log("Creating embeddings and storing in vector database...");
  await vectorDb.addChunks(chunks);

  console.log("Setup complete!");
  return { chunks: chunks.length, bookId };
}

setupNewBook(transcript, bookId);
