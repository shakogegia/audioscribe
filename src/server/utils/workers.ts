import { getBook, getBookFiles } from "@/lib/audiobookshelf"
import { folders } from "@/lib/folders"
import fs from "fs/promises"
import path from "path"
import { spawn, ChildProcess } from "child_process"
import { prisma } from "@/lib/prisma"

const runningProcesses = new Map<string, ChildProcess>()

export async function spawnDownloadWorker(bookId: string): Promise<boolean> {
  try {
    const files = await getBookFiles(bookId)
    const audioFolder = await folders.book(bookId).downloads()
    // Regular download without progress
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const localPath = path.join(audioFolder, file.path)

      if (
        await fs
          .access(localPath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false)
      ) {
        continue
      }
      const response = await fetch(file.downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      await fs.writeFile(localPath, Buffer.from(buffer))
      // progress in percentage with 2 decimal places
      const progress = Math.round(((index + 1) / files.length) * 100 * 100) / 100
      await updateJobProgress(bookId, "download", progress)
    }
    return true
  } catch (error) {
    console.error(`[Download Worker] Failed to download files for book ${bookId}:`, error)
    return false
  }
}

export async function spawnTranscribeWorker(bookId: string, model: string, jobId?: string): Promise<boolean> {
  const book = await getBook(bookId)

  return new Promise((resolve, reject) => {
    spawnWorker({
      workerScript: "transcribe.ts",
      args: ["--book-id", bookId, "--model", model],
      logPrefix: "Transcribe Job",
      jobId,
      log(message) {
        const lastTimestamp = parseLastTimestamp(message)
        if (lastTimestamp) {
          const processedDuration = lastTimestamp / 1000
          const totalDuration = book.duration
          const progress = Math.round((processedDuration / totalDuration) * 100 * 100) / 100
          updateJobProgress(bookId, "transcribe", progress)
          console.log(`Transcribe Job Progress: ${progress}%`)
        }
      },
      onComplete: async () => {
        resolve(true)
      },
      onError: async error => {
        console.error(`[Transcribe Job] Transcription failed for book ${bookId}:`, error)
        reject(error)
      },
    })
  })
}

export async function spawnVectorizeWorker(bookId: string, jobId?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    spawnWorker({
      workerScript: "vectorize.ts",
      args: ["--book-id", bookId],
      logPrefix: "Vectorize Job",
      jobId,
      onComplete: async () => {
        await updateJobProgress(bookId, "vectorize", 100)
        resolve(true)
      },
      onError: async error => {
        console.error(`[Vectorize Job] Vectorization failed for book ${bookId}:`, error)
        reject(error)
      },
    })
  })
}

export interface SpawnWorkerOptions {
  workerScript: string
  args: string[]
  logPrefix?: string
  log?: (message: string) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  jobId?: string
}

export async function spawnWorker(options: SpawnWorkerOptions): Promise<unknown> {
  const { workerScript, args, logPrefix = workerScript, log, onError, onComplete, jobId } = options

  return new Promise(async (resolve, reject) => {
    const fullArgs = ["--import=tsx", `src/server/workers/${workerScript}`, ...args]

    const child = spawn("node", fullArgs, {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    if (jobId) {
      runningProcesses.set(jobId, child)

      // Store PID in database for cross-process cancellation
      try {
        const { PrismaClient } = await import("@prisma/client")
        const prisma = new PrismaClient()
        await prisma.job.update({
          where: { id: jobId },
          data: { pid: child.pid },
        })
        await prisma.$disconnect()
      } catch (error) {
        console.error(`Failed to store PID for job ${jobId}:`, error)
      }
    }

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", data => {
      stdout += data.toString()
      console.log(`[${logPrefix}] ${data}`)
      log?.(data.toString())
    })

    child.stderr?.on("data", data => {
      stderr += data.toString()
      console.error(`[${logPrefix} Error] ${data}`)
    })

    child.on("close", async code => {
      if (jobId) {
        runningProcesses.delete(jobId)

        // Clear PID from database
        try {
          const { PrismaClient } = await import("@prisma/client")
          const prisma = new PrismaClient()
          await prisma.job.update({
            where: { id: jobId },
            data: { pid: null },
          })
          await prisma.$disconnect()
        } catch (error) {
          console.error(`Failed to clear PID for job ${jobId}:`, error)
        }
      }
      if (code === 0) {
        onComplete?.()
        resolve({ stdout, exitCode: code })
      } else {
        onError?.(new Error(`${logPrefix} failed with exit code ${code}. stderr: ${stderr}`))
        reject(new Error(`${logPrefix} failed with exit code ${code}. stderr: ${stderr}`))
      }
    })

    child.on("error", async error => {
      if (jobId) {
        runningProcesses.delete(jobId)

        // Clear PID from database
        try {
          const { PrismaClient } = await import("@prisma/client")
          const prisma = new PrismaClient()
          await prisma.job.update({
            where: { id: jobId },
            data: { pid: null },
          })
          await prisma.$disconnect()
        } catch (dbError) {
          console.error(`Failed to clear PID for job ${jobId}:`, dbError)
        }
      }
      reject(error)
    })
  })
}

async function updateJobProgress(bookId: string, stage: string, progress: number): Promise<void> {
  await prisma.bookSetupProgress.update({
    where: { bookId_stage: { bookId, stage } },
    data: { progress },
  })
}

export function killJobProcess(jobId: string): boolean {
  const process = runningProcesses.get(jobId)
  if (!process) {
    return false
  }

  try {
    process.kill("SIGTERM")
    runningProcesses.delete(jobId)
    return true
  } catch (error) {
    console.error(`Failed to kill process for job ${jobId}:`, error)
    return false
  }
}

export function getRunningProcesses(): string[] {
  return Array.from(runningProcesses.keys())
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
