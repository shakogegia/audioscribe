import { folders } from "@/lib/folders"
import { redis } from "@/server/redis"
import { Worker } from "bullmq"
import { spawn } from "child_process"
import "dotenv/config"
import path from "path"
import { BookSetupStage, Prisma } from "../../../../generated/prisma"
import { completeStageProgress, failStageProgress, resetStageProgress, updateStageProgress } from "./utils/utils"
import { getBook } from "@/lib/audiobookshelf"
import { prisma } from "@/lib/prisma"
import fsPromise from "fs/promises"

type WhisperTranscriptionResult = {
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

export const transcribeWorker = new Worker(
  "transcribe-book",
  async job => {
    const { bookId, model } = job.data

    // Reset stage progress
    await resetStageProgress(bookId, BookSetupStage.Transcribe)

    try {
      const audioFolder = await folders.book(bookId).audio()
      const processedAudioFilePath = path.join(audioFolder, "processed.wav")

      const book = await getBook(bookId)

      await eraseTranscripts(bookId)

      await spawnTranscribeScript({
        file: processedAudioFilePath,
        model,
        log: message => {
          const lastTimestamp = parseLastTimestamp(message)
          if (lastTimestamp) {
            const processedDuration = lastTimestamp / 1000
            const totalDuration = book.duration
            const progress = Math.round((processedDuration / totalDuration) * 100 * 100) / 100
            updateStageProgress(bookId, BookSetupStage.Transcribe, progress)
            console.log(`Transcribe Job Progress: ${progress}%`)
          }
        },
      })

      // save transcript segments to database
      const wavAudioFilePath = processedAudioFilePath.replace(/\.[^/.]+$/, ".wav")
      const outputJsonPath = `${wavAudioFilePath}.json`
      const outputContent = await fsPromise.readFile(outputJsonPath, "utf8")
      const result = JSON.parse(outputContent) as WhisperTranscriptionResult
      await saveTranscriptions({
        bookId,
        model,
        fileIno: "ino",
        transcription: result,
        offset: 0,
      })

      // Complete stage progress
      await completeStageProgress(bookId, BookSetupStage.Transcribe)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      await failStageProgress(bookId, BookSetupStage.Transcribe, message)
      throw error
    }
  },
  { connection: redis }
)

function spawnTranscribeScript({ file, model, log }: { file: string; model: string; log: (message: string) => void }) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/transcribe.js", "--file", file, "--model", model], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    child.stdout?.on("data", data => {
      log(data.toString())
    })
    child.stderr?.on("data", data => {
      console.error(`[Transcribe Job] Error: ${data}`)
    })
    child.on("exit", code => {
      if (code !== 0) {
        reject(new Error(`Transcribe script exited with code ${code}`))
      }
      resolve(true)
    })
    child.on("error", error => {
      reject(error)
    })
    child.on("close", code => {
      if (code !== 0) {
        reject(new Error(`Transcribe script exited with code ${code}`))
      }
      resolve(true)
    })
  })
}

function parseLastTimestamp(message: string): number | null {
  /**
   * message example:
   *  [00:03:16.000 --> 00:03:17.290]   There is a flower
   *  [00:03:17.290 --> 00:03:19.000]   that grows on Mars.
   *  [00:03:19.000 --> 00:03:20.740]   It is red and harsh
   *  [00:03:20.740 --> 00:03:22.140]   and fit for our
   *  [00:03:22.140 --> 00:03:23.000]   soil.
   *
   *  output: 00:03:23.000
   */

  const matches = message.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/g)
  const matchArray = Array.from(matches)

  if (matchArray.length > 0) {
    // Get the last match and extract the end timestamp (match[2])
    const lastMatch = matchArray[matchArray.length - 1]
    const lastTimestamp = lastMatch[2] // The end timestamp of the last segment
    if (lastTimestamp) {
      const timestampInMilliseconds = timestampToMilliseconds(lastTimestamp)
      return timestampInMilliseconds
    }
  }
  return null
}

function timestampToMilliseconds(timestamp: string) {
  const [time, ms] = timestamp.split(".")
  const [hours, minutes, seconds] = time.split(":")
  return parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(ms)
}

async function eraseTranscripts(bookId: string) {
  return await prisma.transcriptSegment.deleteMany({ where: { bookId } })
}

async function saveTranscriptions({
  bookId,
  model,
  fileIno,
  transcription,
  offset,
}: {
  bookId: string
  model: string
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
