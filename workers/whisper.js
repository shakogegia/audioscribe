#!/usr/bin/env node
const { nodewhisper } = require("nodejs-whisper"); // eslint-disable-line @typescript-eslint/no-require-imports
const fs = require("fs"); // eslint-disable-line @typescript-eslint/no-require-imports

// Get arguments
const [, , modelName, audioFilePath, outputPath] = process.argv;

if (!audioFilePath || !outputPath) {
  console.error("Usage: node whisper.js <modelName> <audioFile> <outputFile>");
  process.exit(1);
}

async function transcribe() {
  try {
    console.info(`[Whisper Worker] Starting transcription of: ${audioFilePath}`);
    console.info(`[Whisper Worker] Model: ${modelName}`);

    // Check if audio file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Check audio file size
    const audioStats = fs.statSync(audioFilePath);
    console.info(`[Whisper Worker] Audio file size: ${audioStats.size} bytes`);

    if (audioStats.size === 0) {
      throw new Error(`Audio file is empty: ${audioFilePath}`);
    }

    const result = await nodewhisper(audioFilePath, {
      modelName: modelName,
      autoDownloadModelName: modelName,
      removeWavFileAfterTranscription: false,
      withCuda: false,
      whisperOptions: {
        outputInText: false,
        outputInVtt: false,
        outputInSrt: false,
        outputInCsv: false,
        outputInJson: true,
        translateToEnglish: false,
        wordTimestamps: true,
        timestamps_length: 20,
        splitOnWord: true,
      },
    });

    console.info(`[Whisper Worker] Transcription completed successfully`);

    // Write result to output file
    fs.writeFileSync(outputPath, JSON.stringify({ success: true, result: result }));

    process.exit(0);
  } catch (error) {
    console.error(`[Whisper Worker] Transcription failed:`, error);

    // Write error to output file
    fs.writeFileSync(
      outputPath,
      JSON.stringify({
        success: false,
        error: error.message,
      })
    );

    process.exit(1);
  }
}

transcribe();
