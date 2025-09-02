import type * as Audiobookshelf from "@/types/audiobookshelf";
import { create } from "zustand";

interface BookmarksState {
  bookmarks: Audiobookshelf.AudioBookmark[];
  setBookmarks: (bookmarks: Audiobookshelf.AudioBookmark[]) => void;
  update: (bookmark: Audiobookshelf.AudioBookmark) => void;
  add: (bookmark: Audiobookshelf.AudioBookmark) => void;
}

const useBookmarksStore = create<BookmarksState>(set => ({
  bookmarks: [],
  setBookmarks: (bookmarks: Audiobookshelf.AudioBookmark[]) => set({ bookmarks }),
  update: (bookmark: Audiobookshelf.AudioBookmark) =>
    set(state => ({
      bookmarks: state.bookmarks.map(b => (b.createdAt === bookmark.createdAt ? bookmark : b)),
    })),
  add: (bookmark: Audiobookshelf.AudioBookmark) =>
    set(state => ({
      bookmarks: [...state.bookmarks, bookmark],
    })),
}));

export default useBookmarksStore;
