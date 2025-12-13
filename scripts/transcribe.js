import { program } from "commander"
import "dotenv/config"
import fs from "fs"
import fsPromise from "fs/promises"
import { nodewhisper } from "nodejs-whisper"

program
  .requiredOption("-f, --file <string>", "The path to the audio file to transcribe")
  .requiredOption("-m, --model <string>", "The name of the model to use")

program.parse(process.argv)

// Get arguments
const { file, model } = program.opts()

// Debug logging
console.log("Parsed arguments:", { file, model })
console.log("Process argv:", process.argv)

async function transcribeAudioFile(audioFilePath) {
  console.info(`[Whisper Worker] Starting transcription of: ${audioFilePath}`)
  console.info(`[Whisper Worker] Model: ${model}`)

  // Check if audio file exists
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`)
  }

  // Check audio file size
  const audioStats = fs.statSync(audioFilePath)
  console.info(`[Whisper Worker] Audio file size: ${audioStats.size} bytes`)

  if (audioStats.size === 0) {
    throw new Error(`Audio file is empty: ${audioFilePath}`)
  }

  await nodewhisper(audioFilePath, {
    modelName: model,
    autoDownloadModelName: model,
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
  })

  const wavAudioFilePath = audioFilePath.replace(/\.[^/.]+$/, ".wav")
  const outputJsonPath = `${wavAudioFilePath}.json`
  const outputContent = await fsPromise.readFile(outputJsonPath, "utf8")
  const resultJson = JSON.parse(outputContent)

  console.info(`[Whisper Worker] Transcription completed successfully`)

  return { result: resultJson, file: outputJsonPath }
}

async function transcribe() {
  try {
    await transcribeAudioFile(file)
    process.exit(0)
  } catch (error) {
    console.error(`[Whisper Worker] Transcription failed:`, error)
    process.exit(1)
  }
}

transcribe()
