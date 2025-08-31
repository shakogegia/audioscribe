import { AudioFile } from "@/types/api";
import { getBookFiles } from "./audiobookshelf";

export async function getAudioFileByTime(bookId: string, startTime: number): Promise<AudioFile> {
  const files = await getBookFiles(bookId);
  const file = files.find(file => startTime >= file.start && startTime < file.start + file.duration);

  if (!file) {
    throw new Error("File not found");
  }

  return file;
}
