import type { TranscriptionRequest, TranscriptionResult } from "@/ai/transcription/types/transription"
import { folders } from "@/lib/folders"
import { createHash } from "crypto"
import { promises as fs } from "fs"
import { join } from "path"

/**
 * Generate a unique cache key for a transcription request
 */
export function generateCacheKey(request: TranscriptionRequest): string {
  // Create a deterministic string representation of all key components
  const keyComponents = [
    `provider_type:${request.provider.type}`,
    `provider_model:${request.provider.model}`,
    `audioUrl:${request.audioUrl}`,
    `startTime:${request.startTime}`,
    `duration:${request.duration}`,
    `offset:${request.offset}`,
  ]

  // Sort components to ensure consistent ordering
  const keyString = keyComponents.sort().join("|")

  return createHash("sha256").update(keyString).digest("hex")
}

/**
 * Get the cache file path for a given cache key and book ID
 */
async function getCacheFilePath(cacheKey: string, bookId: string): Promise<string> {
  const transcriptsFolder = await folders.book(bookId).transcripts()
  return join(transcriptsFolder, `${cacheKey}.json`)
}

/**
 * Ensure the cache directory exists for a specific book
 */
async function ensureCacheDirectory(bookId: string): Promise<void> {
  await folders.book(bookId).transcripts()
  // The folders.book().transcripts() already ensures the directory exists
}

/**
 * Check if a cached transcription exists for the given request
 */
export async function getCachedTranscription(
  request: TranscriptionRequest,
  bookId: string
): Promise<TranscriptionResult | null> {
  try {
    const cacheKey = generateCacheKey(request)
    const cacheFilePath = await getCacheFilePath(cacheKey, bookId)

    console.info(`[Transcription Cache] Checking cache for key: ${cacheKey}`)

    // Check if cache file exists
    const cacheData = await fs.readFile(cacheFilePath, "utf8")
    const cachedResult = JSON.parse(cacheData) as {
      result: TranscriptionResult
      timestamp: number
      request: TranscriptionRequest
    }

    console.info(
      `[Transcription Cache] Cache hit! Using cached result from ${new Date(cachedResult.timestamp).toISOString()}`
    )

    return cachedResult.result
  } catch {
    // Cache miss or error reading cache
    console.info(`[Transcription Cache] Cache miss for request`)
    return null
  }
}

/**
 * Store a transcription result in the cache
 */
export async function cacheTranscription(
  request: TranscriptionRequest,
  result: TranscriptionResult,
  bookId: string
): Promise<void> {
  try {
    await ensureCacheDirectory(bookId)

    const cacheKey = generateCacheKey(request)
    const cacheFilePath = await getCacheFilePath(cacheKey, bookId)

    const cacheData = {
      result,
      timestamp: Date.now(),
      request,
    }

    await fs.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2))

    console.info(`[Transcription Cache] Cached result with key: ${cacheKey}`)
  } catch (error) {
    console.error(`[Transcription Cache] Failed to cache transcription:`, error)
    // Don't throw error - caching failure shouldn't break transcription
  }
}

/**
 * Get cache statistics for a specific book
 */
export async function getCacheStats(bookId: string): Promise<{
  totalFiles: number
  totalSize: number
  oldestFile?: { path: string; timestamp: number }
  newestFile?: { path: string; timestamp: number }
}> {
  try {
    const transcriptsFolder = await folders.book(bookId).transcripts()
    const files = await fs.readdir(transcriptsFolder)
    const jsonFiles = files.filter(f => f.endsWith(".json"))

    let totalSize = 0
    let oldestFile: { path: string; timestamp: number } | undefined
    let newestFile: { path: string; timestamp: number } | undefined

    for (const file of jsonFiles) {
      const filePath = join(transcriptsFolder, file)
      const stats = await fs.stat(filePath)
      totalSize += stats.size

      try {
        const cacheData = JSON.parse(await fs.readFile(filePath, "utf8"))
        const timestamp = cacheData.timestamp || stats.mtime.getTime()

        if (!oldestFile || timestamp < oldestFile.timestamp) {
          oldestFile = { path: file, timestamp }
        }

        if (!newestFile || timestamp > newestFile.timestamp) {
          newestFile = { path: file, timestamp }
        }
      } catch {
        // Skip invalid cache files
      }
    }

    return {
      totalFiles: jsonFiles.length,
      totalSize,
      oldestFile,
      newestFile,
    }
  } catch (error) {
    console.error("Failed to get cache stats:", error)
    return { totalFiles: 0, totalSize: 0 }
  }
}

/**
 * Clear old cache entries for a specific book (older than specified days)
 */
export async function clearOldCache(bookId: string, olderThanDays: number = 30): Promise<number> {
  try {
    const transcriptsFolder = await folders.book(bookId).transcripts()
    const files = await fs.readdir(transcriptsFolder)
    const jsonFiles = files.filter(f => f.endsWith(".json"))

    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    let deletedCount = 0

    for (const file of jsonFiles) {
      const filePath = join(transcriptsFolder, file)

      try {
        const cacheData = JSON.parse(await fs.readFile(filePath, "utf8"))
        const timestamp = cacheData.timestamp

        if (timestamp && timestamp < cutoffTime) {
          await fs.unlink(filePath)
          deletedCount++
          console.info(`[Transcription Cache] Deleted old cache file: ${file}`)
        }
      } catch {
        // Skip invalid cache files
      }
    }

    return deletedCount
  } catch (error) {
    console.error("Failed to clear old cache:", error)
    return 0
  }
}
