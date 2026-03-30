"use server"

import { prisma } from "@/lib/prisma"
import { getBatchLibraryItems } from "@/lib/audiobookshelf"

export interface StatsData {
  overview: {
    booksTranscribed: number
    audioHoursProcessed: number
    medianRtf: number
    successRate: number
  }
  processingBreakdown: Array<{
    bookId: string
    bookTitle: string
    download: number // minutes
    prepare: number // minutes
    transcribe: number // minutes
  }>
  transcriptionSpeed: Array<{
    bookId: string
    bookTitle: string
    rtf: number
    model: string
    audioDuration: number // minutes
    processingTime: number // minutes
  }>
  modelUsage: Array<{
    model: string
    bookCount: number
    avgRtf: number
    medianRtf: number
    totalHours: number
  }>
  pipelineHealth: {
    failureRates: Array<{ stage: string; rate: number; total: number; failed: number }>
    retryDistribution: Array<{ attempts: number; count: number }>
    recentErrors: Array<{
      bookId: string
      bookTitle: string
      stage: string
      error: string
      timestamp: string
    }>
  }
  activity: Array<{
    period: string // "2026-03" format
    booksProcessed: number
    audioHours: number
  }>
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function jobDurationMinutes(job: { startedAt: Date | null; completedAt: Date | null }): number {
  if (!job.startedAt || !job.completedAt) return 0
  return (job.completedAt.getTime() - job.startedAt.getTime()) / 60000
}

export async function getTranscriptionStats(): Promise<StatsData> {
  // Query transcribed books with their jobs and audioChunks
  const books = await prisma.book.findMany({
    where: { transcribed: true },
    include: {
      jobs: true,
      audioChunks: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const bookIds = books.map(b => b.id)

  // Fetch book titles from audiobookshelf API
  let titleMap = new Map<string, string>()
  try {
    const libraryItems = await getBatchLibraryItems(bookIds)
    for (const item of libraryItems) {
      titleMap.set(item.id, item.title)
    }
  } catch {
    // Fall back to truncated IDs
    for (const id of bookIds) {
      titleMap.set(id, id.slice(0, 8) + "...")
    }
  }

  // Query ALL jobs for pipeline health stats
  const allJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  })

  // --- Overview ---
  const booksTranscribed = books.length

  const audioHoursProcessed =
    books.reduce((sum, book) => {
      const totalSeconds = book.audioChunks.reduce((s, c) => s + c.duration, 0)
      return sum + totalSeconds
    }, 0) / 3600

  // Compute RTF per book: audioDuration / transcribeTime
  const bookRtfs: number[] = []
  for (const book of books) {
    const transcribeJobs = book.jobs.filter(
      j => j.type === "Transcribe" && j.status === "Completed" && j.startedAt && j.completedAt
    )
    if (transcribeJobs.length === 0) continue

    const totalTranscribeMinutes = transcribeJobs.reduce((sum, j) => sum + jobDurationMinutes(j), 0)
    if (totalTranscribeMinutes === 0) continue

    const audioDurationMinutes =
      book.audioChunks.reduce((s, c) => s + c.duration, 0) / 60
    const rtf = audioDurationMinutes / totalTranscribeMinutes
    bookRtfs.push(rtf)
  }

  const medianRtf = median(bookRtfs)

  const completedBooks = allJobs.filter(j => j.type === "Transcribe" && j.status === "Completed")
  const failedBooks = allJobs.filter(j => j.type === "Transcribe" && j.status === "Failed")
  const totalAttempted = completedBooks.length + failedBooks.length
  const successRate = totalAttempted > 0 ? (completedBooks.length / totalAttempted) * 100 : 0

  // --- Processing Breakdown ---
  const processingBreakdown = books
    .map(book => {
      const title = titleMap.get(book.id) ?? book.id.slice(0, 8) + "..."

      const downloadMinutes = book.jobs
        .filter(j => j.type === "Download" && j.status === "Completed")
        .reduce((sum, j) => sum + jobDurationMinutes(j), 0)

      const prepareMinutes = book.jobs
        .filter(j => j.type === "PrepareAudio" && j.status === "Completed")
        .reduce((sum, j) => sum + jobDurationMinutes(j), 0)

      const transcribeMinutes = book.jobs
        .filter(j => j.type === "Transcribe" && j.status === "Completed")
        .reduce((sum, j) => sum + jobDurationMinutes(j), 0)

      return {
        bookId: book.id,
        bookTitle: title,
        download: Math.round(downloadMinutes * 10) / 10,
        prepare: Math.round(prepareMinutes * 10) / 10,
        transcribe: Math.round(transcribeMinutes * 10) / 10,
      }
    })
    .filter(b => b.download + b.prepare + b.transcribe > 0)

  // --- Transcription Speed ---
  const transcriptionSpeed = books
    .flatMap(book => {
      const title = titleMap.get(book.id) ?? book.id.slice(0, 8) + "..."

      const transcribeJobs = book.jobs.filter(
        j => j.type === "Transcribe" && j.status === "Completed" && j.startedAt && j.completedAt
      )
      if (transcribeJobs.length === 0) return []

      const totalTranscribeMinutes = transcribeJobs.reduce(
        (sum, j) => sum + jobDurationMinutes(j),
        0
      )
      if (totalTranscribeMinutes === 0) return []

      const audioDurationMinutes =
        book.audioChunks.reduce((s, c) => s + c.duration, 0) / 60
      const rtf = audioDurationMinutes / totalTranscribeMinutes

      // Get model from first transcribe job metadata
      let model = "unknown"
      const firstTranscribeJob = transcribeJobs[0]
      if (firstTranscribeJob.metadata) {
        try {
          const meta = JSON.parse(firstTranscribeJob.metadata) as { model?: string }
          model = meta.model ?? "unknown"
        } catch {
          // ignore parse errors
        }
      }

      return [
        {
          bookId: book.id,
          bookTitle: title,
          rtf: Math.round(rtf * 100) / 100,
          model,
          audioDuration: Math.round(audioDurationMinutes * 10) / 10,
          processingTime: Math.round(totalTranscribeMinutes * 10) / 10,
        },
      ]
    })
    .sort((a, b) => b.rtf - a.rtf)

  // --- Model Usage ---
  type ModelStats = {
    bookCount: number
    rtfs: number[]
    totalAudioMinutes: number
  }
  const modelMap = new Map<string, ModelStats>()

  for (const book of books) {
    const transcribeJobs = book.jobs.filter(
      j => j.type === "Transcribe" && j.status === "Completed" && j.startedAt && j.completedAt
    )
    if (transcribeJobs.length === 0) continue

    const totalTranscribeMinutes = transcribeJobs.reduce(
      (sum, j) => sum + jobDurationMinutes(j),
      0
    )
    if (totalTranscribeMinutes === 0) continue

    const audioDurationMinutes =
      book.audioChunks.reduce((s, c) => s + c.duration, 0) / 60
    const rtf = audioDurationMinutes / totalTranscribeMinutes

    let model = "unknown"
    const firstTranscribeJob = transcribeJobs[0]
    if (firstTranscribeJob.metadata) {
      try {
        const meta = JSON.parse(firstTranscribeJob.metadata) as { model?: string }
        model = meta.model ?? "unknown"
      } catch {
        // ignore parse errors
      }
    }

    if (!modelMap.has(model)) {
      modelMap.set(model, { bookCount: 0, rtfs: [], totalAudioMinutes: 0 })
    }
    const stats = modelMap.get(model)!
    stats.bookCount += 1
    stats.rtfs.push(rtf)
    stats.totalAudioMinutes += audioDurationMinutes
  }

  const modelUsage = Array.from(modelMap.entries()).map(([model, stats]) => ({
    model,
    bookCount: stats.bookCount,
    avgRtf: Math.round((stats.rtfs.reduce((s, v) => s + v, 0) / stats.rtfs.length) * 100) / 100,
    medianRtf: Math.round(median(stats.rtfs) * 100) / 100,
    totalHours: Math.round((stats.totalAudioMinutes / 60) * 10) / 10,
  }))

  // --- Pipeline Health ---
  const stages = ["Download", "PrepareAudio", "Transcribe"] as const

  const failureRates = stages.map(stage => {
    const stageJobs = allJobs.filter(j => j.type === stage)
    const failed = stageJobs.filter(j => j.status === "Failed").length
    const total = stageJobs.length
    return {
      stage,
      rate: total > 0 ? (failed / total) * 100 : 0,
      total,
      failed,
    }
  })

  const retryMap = new Map<number, number>()
  for (const job of allJobs) {
    if (job.attempts > 1) {
      retryMap.set(job.attempts, (retryMap.get(job.attempts) ?? 0) + 1)
    }
  }
  const retryDistribution = Array.from(retryMap.entries())
    .map(([attempts, count]) => ({ attempts, count }))
    .sort((a, b) => a.attempts - b.attempts)

  const errorJobs = allJobs
    .filter(j => j.status === "Failed" && j.error)
    .slice(0, 10)

  // Build a quick id->title map from books we already fetched
  const fetchedTitleMap = new Map<string, string>(titleMap)

  const recentErrors = errorJobs.map(j => ({
    bookId: j.bookId,
    bookTitle: fetchedTitleMap.get(j.bookId) ?? j.bookId.slice(0, 8) + "...",
    stage: j.type,
    error: j.error ?? "",
    timestamp: (j.completedAt ?? j.updatedAt).toISOString(),
  }))

  // --- Activity ---
  type ActivityEntry = { booksProcessed: number; audioSeconds: number }
  const activityMap = new Map<string, ActivityEntry>()

  for (const book of books) {
    const completedTranscribeJob = book.jobs
      .filter(j => j.type === "Transcribe" && j.status === "Completed" && j.completedAt)
      .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()))
      .at(0)

    if (!completedTranscribeJob?.completedAt) continue

    const date = completedTranscribeJob.completedAt
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!activityMap.has(period)) {
      activityMap.set(period, { booksProcessed: 0, audioSeconds: 0 })
    }
    const entry = activityMap.get(period)!
    entry.booksProcessed += 1
    entry.audioSeconds += book.audioChunks.reduce((s, c) => s + c.duration, 0)
  }

  const activity = Array.from(activityMap.entries())
    .map(([period, entry]) => ({
      period,
      booksProcessed: entry.booksProcessed,
      audioHours: Math.round((entry.audioSeconds / 3600) * 10) / 10,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  return {
    overview: {
      booksTranscribed,
      audioHoursProcessed: Math.round(audioHoursProcessed * 10) / 10,
      medianRtf: Math.round(medianRtf * 100) / 100,
      successRate: Math.round(successRate * 10) / 10,
    },
    processingBreakdown,
    transcriptionSpeed,
    modelUsage,
    pipelineHealth: {
      failureRates,
      retryDistribution,
      recentErrors,
    },
    activity,
  }
}
