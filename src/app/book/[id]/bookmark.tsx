"use client";

import { AudioPlayer } from "@/components/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import type * as Audiobookshelf from "@/types/audiobookshelf";
import { ChevronsDownUpIcon, ChevronsUpDownIcon, Trash, WandSparkles } from "lucide-react";
import { useState } from "react";
import useBookmarksStore from "./store";

interface BookmarksProps {
  bookId: string;
  bookmark: Audiobookshelf.AudioBookmark;
}

export function Bookmark({ bookId, bookmark }: BookmarksProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const updateBookmark = useBookmarksStore(state => state.update);

  const handlePlayClick = () => {
    setShowPlayer(!showPlayer);
  };

  return (
    <div className="flex flex-col gap-2 border rounded-md p-2 text-sm w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Badge variant="outline">{formatTime(bookmark.time)}</Badge>
          <input
            type="text"
            className="font-semibold outline-none w-full"
            value={bookmark.title}
            onChange={e => {
              updateBookmark({ ...bookmark, title: e.target.value });
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <BookmarkAction>
            <WandSparkles className="w-4 h-4" />
          </BookmarkAction>

          <BookmarkAction>
            <Trash className="w-4 h-4" />
          </BookmarkAction>

          <BookmarkAction onClick={handlePlayClick}>
            {showPlayer ? <ChevronsDownUpIcon className="w-4 h-4" /> : <ChevronsUpDownIcon className="w-4 h-4" />}
          </BookmarkAction>
        </div>
      </div>

      {showPlayer && (
        <div className="mt-2">
          <AudioPlayer bookId={bookId} startTime={bookmark.time} className="p-2" />
        </div>
      )}
    </div>
  );
}

function BookmarkAction({ onClick, children }: { onClick?: VoidFunction; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
