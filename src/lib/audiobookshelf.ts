import type * as Audiobookshelf from "@/types/audiobookshelf"
import { promises as fsPromises } from "fs"
import axios from "axios"
import { AudioFile, SearchResult } from "../types/api"
import { load } from "./config"
import { dirSize, folders, getBookCacheSize, humanReadableSize } from "./folders"
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

async function checkIfBookIsTranscribed(libraryItemId: string): Promise<boolean> {
  const book = await prisma.book.findUnique({
    where: { id: libraryItemId },
  })
  return book?.transcribed ?? false
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
    response.data.book.map(async ({ libraryItem }) => ({
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
      transcribed: await checkIfBookIsTranscribed(libraryItem.id),
    }))
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
  return {
    id: response.data.id,
    title: response.data.media.metadata.title ?? "",
    authors: response.data.media.metadata.authors.map(author => author.name),
    series: response.data.media.metadata.series.map(series => series.name),
    duration: response.data.media.duration ?? 0,
    narrators: response.data.media.metadata.narrators,
    libraryId: response.data.libraryId,
    chapters: response.data.media.chapters,
    bookmarks: await getBookmarks(libraryItemId),
    publishedYear: response.data.media.metadata.publishedYear ?? "",
    coverPath: `${config?.audiobookshelf.url}/audiobookshelf/api/items/${libraryItemId}/cover?ts=${Date.now()}&raw=1`,
    cacheSize: await getBookCacheSize(libraryItemId),
    transcribed: await checkIfBookIsTranscribed(libraryItemId),
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
