"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { FastForward, Pause, Play, Rewind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

interface AudioPlayerProps {
  bookId: string;
  startTime?: number;
  className?: string;
}

export function AudioPlayer({ bookId, startTime = 0, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && startTime > 0) {
      audio.currentTime = startTime;
      setCurrentTime(startTime);
    }
  }, [startTime]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const rewind = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, currentTime - 10);
  };

  const forward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, currentTime + 10);
  };

  return (
    <div className={twMerge("flex flex-col gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border", className)}>
      <audio ref={audioRef} src={`/api/book/${bookId}/stream?time=${startTime}`} preload="metadata" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button onClick={togglePlayPause} variant="outline" size="icon" className="w-10 h-10">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button onClick={() => rewind()} variant="outline" size="icon" className="w-20 h-10">
            <Rewind className="w-5 h-5" /> 10s
          </Button>
          <Button onClick={() => forward()} variant="outline" size="icon" className="w-20 h-10">
            <FastForward className="w-5 h-5" /> 10s
          </Button>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-mono min-w-[3rem]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
