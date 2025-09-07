import { WhisperModel } from "@/ai/transcription/types/transription"
import { getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import { prisma } from "@/lib/prisma"
import { type Prisma } from "@prisma/client"
import { program } from "commander"
import "dotenv/config"
import fs from "fs"
import fsPromise from "fs/promises"
import { nodewhisper } from "nodejs-whisper"
import path from "path"

interface Props {
  bookId: string
  model: WhisperModel
}

program
  .requiredOption("-b, --book-id <string>", "The ID of the book")
  .requiredOption("-m, --model <string>", "The name of the model to use")

program.parse()

// Get arguments
const { bookId, model } = program.opts<Props>()

export type WhisperTranscriptionResult = {
  systeminfo: string
  model: {
    type: string
    multilingual: boolean
    vocab: number
    audio: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    text: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    mels: number
    ftype: number
  }
  params: {
    model: string
    language: string
    translate: boolean
  }
  result: {
    language: string
  }
  transcription: Array<{
    timestamps: {
      from: string
      to: string
    }
    offsets: {
      from: number
      to: number
    }
    text: string
  }>
}

async function transcribeAudioFile(
  audioFilePath: string
): Promise<{ result: WhisperTranscriptionResult; file: string }> {
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
  const resultJson = JSON.parse(outputContent) as WhisperTranscriptionResult

  console.info(`[Whisper Worker] Transcription completed successfully`)

  return { result: resultJson, file: outputJsonPath }
}

async function saveTranscriptions({
  bookId,
  fileIno,
  transcription,
  offset,
}: {
  bookId: string
  fileIno: string
  transcription: WhisperTranscriptionResult
  offset: number
}) {
  // timestamp format is 00:00:00,000

  function convertTimestampToMilliseconds(timestamp: string): number {
    // Split into [hh, mm, ss, mmm]
    // Example: "01:23:45,678"
    const match = timestamp.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/)
    if (!match) {
      throw new Error(`Invalid timestamp format: ${timestamp}`)
    }
    const [, hours, minutes, seconds, milliseconds] = match
    return (
      parseInt(hours, 10) * 60 * 60 * 1000 +
      parseInt(minutes, 10) * 60 * 1000 +
      parseInt(seconds, 10) * 1000 +
      parseInt(milliseconds, 10)
    )
  }

  const data: Prisma.TranscriptSegmentCreateManyInput[] = transcription.transcription.map(item => ({
    bookId: bookId,
    model: model,
    fileIno: fileIno,
    text: item.text,
    startTime: offset + convertTimestampToMilliseconds(item.timestamps.from),
    endTime: offset + convertTimestampToMilliseconds(item.timestamps.to),
  }))

  await prisma.transcriptSegment.createMany({ data })
}

function cleanUpTempFiles(files: string[]) {
  return Promise.all(files.map(file => fsPromise.unlink(file).catch(() => {})))
}

async function cleanUpOldTranscripts(bookId: string) {
  return await prisma.transcriptSegment.deleteMany({ where: { bookId } })
}

async function updateBook(bookId: string, data: Prisma.BookUncheckedCreateInput) {
  await prisma.book.upsert({
    where: { id: bookId },
    update: data,
    create: { id: bookId, ...data },
  })
}

async function transcribe() {
  try {
    const bookFiles = (await getBookFiles(bookId)).sort((a, b) => a.index - b.index)

    const downloadsFolder = await folders.book(bookId).downloads()

    await updateBook(bookId, { transcribed: false, model: null })

    await cleanUpOldTranscripts(bookId)

    for (const audioFile of bookFiles) {
      const localAudioFilePath = path.join(downloadsFolder, audioFile.path)

      const { result, file } = await transcribeAudioFile(localAudioFilePath)

      await saveTranscriptions({
        bookId,
        fileIno: audioFile.ino,
        transcription: result,
        offset: audioFile.start * 1000,
      })

      await cleanUpTempFiles([file])
    }

    await updateBook(bookId, { transcribed: true, model: model })

    process.exit(0)
  } catch (error) {
    console.error(`[Whisper Worker] Transcription failed:`, error)

    process.exit(1)
  }
}

transcribe()
