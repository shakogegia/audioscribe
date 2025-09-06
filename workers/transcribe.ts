import "dotenv/config"
import { program } from "commander"
import { nodewhisper } from "nodejs-whisper"
import fs from "fs"
import fsPromise from "fs/promises"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { getBook, getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import path from "path"
import { shiftTimestamps } from "@/ai/transcription/utils/utils"

interface Props {
  bookId: string
  modelName: WhisperModel
}

program
  .requiredOption("-b, --book-id <string>", "The ID of the book")
  .requiredOption("-m, --model-name <string>", "The name of the model to use")

program.parse()

// Get arguments
const { bookId, modelName } = program.opts<Props>()

async function transcribeAudioFile(audioFilePath: string): Promise<string> {
  console.info(`[Whisper Worker] Starting transcription of: ${audioFilePath}`)
  console.info(`[Whisper Worker] Model: ${modelName}`)

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
  })

  console.info(`[Whisper Worker] Transcription completed successfully`)

  return result
}

async function saveTranscription(transcription: string, outputPath: string) {
  console.info(`[Whisper Worker] Saving transcription to: ${outputPath}`)
  await fsPromise.writeFile(outputPath, transcription)
}

async function transcribe() {
  try {
    const bookFiles = await getBookFiles(bookId)

    const downloadsFolder = await folders.book(bookId).downloads()
    const transcriptsFolder = await folders.book(bookId).transcripts()

    const audioFiles = bookFiles
      .map(file => ({
        ...file,
        fileName: file.path,
        localPath: path.join(downloadsFolder, file.path),
      }))
      .sort((a, b) => a.index - b.index)

    const transcriptions: { text: string; start: number }[] = []

    for (const audioFile of audioFiles) {
      const transcription = await transcribeAudioFile(audioFile.localPath)
      const audioFileTranscriptionPath = path.join(transcriptsFolder, `${audioFile.fileName}.txt`)
      await saveTranscription(transcription, audioFileTranscriptionPath)
      transcriptions.push({ text: transcription, start: audioFile.start })
    }

    const fullTranscription = transcriptions
      .map(transcription => {
        return shiftTimestamps(transcription.text, transcription.start)
      })
      .join("\n")

    const fullTranscriptionPath = path.join(transcriptsFolder, `full-${modelName}.txt`)
    await saveTranscription(fullTranscription, fullTranscriptionPath)

    process.exit(0)
  } catch (error) {
    console.error(`[Whisper Worker] Transcription failed:`, error)

    // Write error to output file
    // fs.writeFileSync(
    //   outputPath,
    //   JSON.stringify({
    //     success: false,
    //     error: error instanceof Error ? error.message : "Unknown error",
    //   })
    // )

    process.exit(1)
  }
}

transcribe()
