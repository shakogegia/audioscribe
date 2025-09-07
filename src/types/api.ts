import type * as Audiobookshelf from "@/types/audiobookshelf"
import { BookSetupProgress } from "@prisma/client"

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  authors: string[]
  narrators: string[]
  series: string[]
  publishedYear?: string
  description?: string
  coverPath?: string
  duration: number
  libraryId: string
  bookmarks: Audiobookshelf.AudioBookmark[]
  chapters: Audiobookshelf.Chapter[]
  cacheSize: { size: number; humanReadableSize: string }
  currentTime?: number
  transcribed: boolean
  vectorized: boolean
  cached: boolean
  progress?: BookSetupProgress
}

export interface AudioFile {
  ino: string
  index: number
  start: number
  duration: number
  downloadUrl: string
  path: string
  size: number
  fileName: string
}
