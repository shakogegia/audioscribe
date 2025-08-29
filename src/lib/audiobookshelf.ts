import type * as Audiobookshelf from "@/types/audiobookshelf";
import axios from "axios";
import { AudioFile, SearchResult } from "./api";

export const api = axios.create({
  baseURL: process.env.ABS_URL,
  headers: {
    Authorization: `Bearer ${process.env.ABS_API_KEY}`,
  },
});

type Library = {
  id: string;
  name: string;
};

export async function getAllLibraries(): Promise<Library[]> {
  const response = await api.get<{ libraries: Audiobookshelf.Library[] }>("/api/libraries");
  return response.data.libraries.map(library => ({
    id: library.id,
    name: library.name,
  }));
}

export async function searchBook(libraryId: string, query: string): Promise<SearchResult[]> {
  const response = await api.get<{ book: { libraryItem: Audiobookshelf.LibraryItem }[] }>(
    `/api/libraries/${libraryId}/search`,
    {
      params: {
        limit: 10,
        q: query,
      },
    }
  );

  return Promise.all(
    response.data.book.map(async ({ libraryItem }) => ({
      id: libraryItem.id,
      title: libraryItem.media.metadata.title ?? "",
      authors: libraryItem.media.metadata.authors.map(author => author.name),
      series: libraryItem.media.metadata.series.map(series => series.name),
      duration: libraryItem.media.duration ?? 0,
      // coverPath: libraryItem.media.coverPath ?? "",
      coverPath: `${process.env.ABS_URL}/audiobookshelf/api/items/${libraryItem.id}/cover?ts=1756297482038&raw=1`,
      narrators: libraryItem.media.metadata.narrators,
      publishedYear: libraryItem.media.metadata.publishedYear ?? "",
      libraryId: libraryId,
      bookmarks: await getBookmarks(libraryItem.id),
    }))
  );
}

export async function getBookmarks(libraryItemId: string): Promise<Audiobookshelf.AudioBookmark[]> {
  const response = await api.get<Audiobookshelf.User>(`/api/me`);
  return response.data.bookmarks.filter(bookmark => bookmark.libraryItemId === libraryItemId);
}

export async function getBook(libraryItemId: string): Promise<SearchResult> {
  const response = await api.get<Audiobookshelf.LibraryItem>(`/api/items/${libraryItemId}`);
  return {
    id: response.data.id,
    title: response.data.media.metadata.title ?? "",
    authors: response.data.media.metadata.authors.map(author => author.name),
    series: response.data.media.metadata.series.map(series => series.name),
    duration: response.data.media.duration ?? 0,
    narrators: response.data.media.metadata.narrators,
    libraryId: response.data.libraryId,
    bookmarks: await getBookmarks(libraryItemId),
    publishedYear: response.data.media.metadata.publishedYear ?? "",
    coverPath: `${process.env.ABS_URL}/audiobookshelf/api/items/${libraryItemId}/cover?ts=1756297482038&raw=1`,
  };
}

export async function getBookFiles(libraryItemId: string): Promise<AudioFile[]> {
  const response = await api.get<Audiobookshelf.LibraryItem>(`/api/items/${libraryItemId}`);

  return response.data.media.audioFiles
    .map((file, index) => ({
      ino: file.ino,
      index: file.index,
      duration: file.duration ?? 0,
      start: index * (file.duration ?? 0),
      path: `${file.ino}${file.metadata.ext}`,
      downloadUrl: `${process.env.ABS_URL}/audiobookshelf/api/items/${libraryItemId}/file/${file.ino}/download?token=${process.env.ABS_API_KEY}`,
      size: file.metadata.size,
      fileName: file.metadata.filename,
    }))
    .sort((a, b) => a.index - b.index);
}

export async function updateBookmark(libraryItemId: string, bookmark: Audiobookshelf.AudioBookmark) {
  const response = await api.patch(`/api/me/item/${libraryItemId}/bookmark`, bookmark);
  return response.data;
}

export async function updateBookmarks(libraryItemId: string, bookmarks: Audiobookshelf.AudioBookmark[]) {
  return Promise.all(bookmarks.map(bookmark => updateBookmark(libraryItemId, bookmark)));
}

export async function deleteBookmark(libraryItemId: string, time: number) {
  const response = await api.delete(`/api/me/item/${libraryItemId}/bookmark/${time}`);
  return response.data;
}
