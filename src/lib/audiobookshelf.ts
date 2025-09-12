import type * as Audiobookshelf from "@/types/audiobookshelf"
import { Book, BookSetupProgress } from "@prisma/client"
import axios from "axios"
import { AudioFile, SearchResult } from "../types/api"
import { load } from "./config"
import { getBookCacheSize } from "./folders"
import { prisma } from "./prisma"

type Library = {
  id: string
  name: string
}

export const getApi = async () => {
  const config = await load()
  return axios.create({
    baseURL: config?.audiobookshelf.url ?? "",
    headers: {
      Authorization: `Bearer ${config?.audiobookshelf.apiKey}`,
    },
  })
}

export async function getAllLibraries(): Promise<Library[]> {
  try {
    const api = await getApi()
    const response = await api.get<{ libraries: Audiobookshelf.Library[] }>("/api/libraries")
    return response.data.libraries.map(library => ({
      id: library.id,
      name: library.name,
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getLibraryItems(libraryId: string): Promise<SearchResult[]> {
  const api = await getApi()
  type ApiResponse = {
    total: number
    limit: number
    page: number
    sortDesc: boolean
    mediaType: string
    minified: false
    collapseseries: false
    include: string
    offset: number
    results: Audiobookshelf.LibraryItem[]
  }
  const response = await api.get<ApiResponse>(`/api/libraries/${libraryId}/items`)
  const libraryItemIds = response.data.results.map(x => x.id)
  const books = await getBatchLibraryItems(libraryItemIds)
  return books
}

async function getBookFromDatabase(
  libraryItemId: string
): Promise<{ book: Book | null; progress?: BookSetupProgress }> {
  const book = await prisma.book.findUnique({
    where: { id: libraryItemId },
    include: {
      bookSetupProgress: true,
    },
  })
  return { book, progress: book?.bookSetupProgress[0] }
}

export async function searchBook(libraryId: string, query: string): Promise<SearchResult[]> {
  const api = await getApi()
  const response = await api.get<{ book: { libraryItem: Audiobookshelf.LibraryItem }[] }>(
    `/api/libraries/${libraryId}/search`,
    {
      params: {
        limit: 10,
        q: query,
      },
    }
  )

  const config = await load()

  return Promise.all(
    response.data.book.map(async ({ libraryItem }) => {
      const { book, progress } = await getBookFromDatabase(libraryItem.id)
      return {
        id: libraryItem.id,
        title: libraryItem.media.metadata.title ?? "",
        authors: libraryItem.media.metadata.authors.map(author => author.name),
        series: libraryItem.media.metadata.series.map(series => series.name),
        duration: libraryItem.media.duration ?? 0,
        coverPath: `${config?.audiobookshelf.url}/audiobookshelf/api/items/${
          libraryItem.id
        }/cover?ts=${Date.now()}&raw=1`,
        narrators: libraryItem.media.metadata.narrators,
        publishedYear: libraryItem.media.metadata.publishedYear ?? "",
        libraryId: libraryId,
        bookmarks: await getBookmarks(libraryItem.id),
        chapters: libraryItem.media.chapters,
        cacheSize: await getBookCacheSize(libraryItem.id),
        currentTime: (await getLastSession(libraryItem.id))?.currentTime,
        setup: book?.setup ?? false,
        model: book?.model ?? null,
        progress: progress,
      }
    })
  )
}

export async function getBatchLibraryItems(libraryItemIds: string[]): Promise<SearchResult[]> {
  const api = await getApi()
  const response = await api.post<{ libraryItems: Audiobookshelf.LibraryItem[] }>(`/api/items/batch/get`, {
    libraryItemIds,
  })

  const config = await load()

  return Promise.all(
    response.data.libraryItems.map(async libraryItem => {
      const { book, progress } = await getBookFromDatabase(libraryItem.id)
      return {
        id: libraryItem.id,
        title: libraryItem.media.metadata.title ?? "",
        authors: libraryItem.media.metadata.authors.map(author => author.name),
        series: libraryItem.media.metadata.series.map(series => series.name),
        duration: libraryItem.media.duration ?? 0,
        coverPath: `${config?.audiobookshelf.url}/audiobookshelf/api/items/${
          libraryItem.id
        }/cover?ts=${Date.now()}&raw=1`,
        narrators: libraryItem.media.metadata.narrators,
        publishedYear: libraryItem.media.metadata.publishedYear ?? "",
        libraryId: libraryItem.libraryId,
        bookmarks: await getBookmarks(libraryItem.id),
        chapters: libraryItem.media.chapters,
        cacheSize: await getBookCacheSize(libraryItem.id),
        currentTime: (await getLastSession(libraryItem.id))?.currentTime,
        setup: book?.setup ?? false,
        model: book?.model ?? null,
        progress: progress,
      }
    })
  )
}

export async function getBookmarks(libraryItemId: string): Promise<Audiobookshelf.AudioBookmark[]> {
  const api = await getApi()
  const response = await api.get<Audiobookshelf.User>(`/api/me`)

  const files = await getBookFiles(libraryItemId)

  return response.data.bookmarks
    .filter(bookmark => bookmark.libraryItemId === libraryItemId)
    .map(bookmark => {
      // Find which audio file contains this bookmark time
      const containingFile = files.find(file => {
        const fileStart = file.start
        const fileEnd = file.start + file.duration
        return bookmark.time >= fileStart && bookmark.time < fileEnd
      })

      // If no containing file found, use the last file (edge case)
      const targetFile = containingFile || files[files.length - 1]

      // Convert book time to file time
      const fileStartTime = targetFile ? bookmark.time - targetFile.start : 0

      return {
        ...bookmark,
        fileStartTime: Math.max(0, fileStartTime), // Ensure non-negative
      }
    })
}

export async function getBook(libraryItemId: string): Promise<SearchResult> {
  const api = await getApi()
  const response = await api.get<Audiobookshelf.LibraryItem>(`/api/items/${libraryItemId}`)
  const config = await load()

  const session = await getLastSession(libraryItemId)

  const { book, progress } = await getBookFromDatabase(libraryItemId)

  return {
    id: response.data.id,
    title: response.data.media.metadata.title ?? "",
    authors: response.data.media.metadata.authors.map(author => author.name),
    series: response.data.media.metadata.series.map(series => series.name),
    duration: response.data.media.audioFiles.reduce((acc, file) => acc + file.duration, 0),
    narrators: response.data.media.metadata.narrators,
    libraryId: response.data.libraryId,
    chapters: response.data.media.chapters,
    bookmarks: await getBookmarks(libraryItemId),
    publishedYear: response.data.media.metadata.publishedYear ?? "",
    coverPath: `${config?.audiobookshelf.url}/audiobookshelf/api/items/${libraryItemId}/cover?ts=${Date.now()}&raw=1`,
    cacheSize: await getBookCacheSize(libraryItemId),
    currentTime: session?.currentTime,
    setup: book?.setup ?? false,
    model: book?.model ?? null,
    progress: progress,
    favorite: book?.favorite ?? false,
  }
}

export async function getBookFiles(libraryItemId: string): Promise<AudioFile[]> {
  const api = await getApi()
  const response = await api.get<Audiobookshelf.LibraryItem>(`/api/items/${libraryItemId}`)

  const sortedFiles = response.data.media.audioFiles.sort((a, b) => a.index - b.index)

  let cumulativeStart = 0

  const config = await load()

  return sortedFiles.map(file => {
    const audioFile = {
      ino: file.ino,
      index: file.index,
      duration: file.duration ?? 0,
      start: cumulativeStart,
      path: `${file.ino}${file.metadata.ext}`,
      downloadUrl: `${config?.audiobookshelf.url}/audiobookshelf/api/items/${libraryItemId}/file/${file.ino}/download?token=${config?.audiobookshelf.apiKey}`,
      size: file.metadata.size,
      fileName: file.metadata.filename,
    }

    cumulativeStart += audioFile.duration
    return audioFile
  })
}

export async function updateBookmark(libraryItemId: string, bookmark: Audiobookshelf.AudioBookmark) {
  const api = await getApi()
  const response = await api.patch(`/api/me/item/${libraryItemId}/bookmark`, bookmark)
  return response.data
}

export async function createBookmark(libraryItemId: string, bookmark: Audiobookshelf.AudioBookmark) {
  const api = await getApi()
  const response = await api.post(`/api/me/item/${libraryItemId}/bookmark`, bookmark)
  return response.data
}

export async function deleteBookmark(libraryItemId: string, time: number) {
  const api = await getApi()
  const response = await api.delete(`/api/me/item/${libraryItemId}/bookmark/${time}`)
  return response.data
}

export async function updateBookmarks(libraryItemId: string, bookmarks: Audiobookshelf.AudioBookmark[]) {
  const allBookmarks = await getBookmarks(libraryItemId)

  const newBookmarks = bookmarks.filter(bookmark => !allBookmarks.some(b => b.time === bookmark.time))
  const updatedBookmarks = bookmarks.filter(bookmark => allBookmarks.some(b => b.time === bookmark.time))
  const deletedBookmarks = allBookmarks.filter(bookmark => !bookmarks.some(b => b.time === bookmark.time))

  return Promise.all([
    ...newBookmarks.map(bookmark => createBookmark(libraryItemId, bookmark)),
    ...updatedBookmarks.map(bookmark => updateBookmark(libraryItemId, bookmark)),
    ...deletedBookmarks.map(bookmark => deleteBookmark(libraryItemId, bookmark.time)),
  ])
}

// TODO: better cache management
let cacheAllSessions: Audiobookshelf.Session[] = []

export async function getAllSessions() {
  if (cacheAllSessions.length > 0) {
    return cacheAllSessions
  }

  const api = await getApi()
  type SessionResponse = {
    total: number
    numPages: number
    page: number
    itemsPerPage: number
    sessions: Audiobookshelf.Session[]
  }

  let allSessions: Audiobookshelf.Session[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const response = await api.get<SessionResponse>(`/api/sessions?page=${page}`)
    allSessions = allSessions.concat(response.data.sessions)

    hasMore = page + 1 < response.data.numPages
    page++
  }

  cacheAllSessions = allSessions
  return allSessions
}

export async function getLastSession(libraryItemId: string) {
  const sessions = await getAllSessions()
  return sessions
    .filter(session => session.libraryItemId === libraryItemId)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
}
