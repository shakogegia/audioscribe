import { getAllLibraries } from "@/lib/audiobookshelf"
import { Search } from "./search"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { redirect } from "next/navigation"
import * as queue from "@/jobs/queue"

async function setupBook(bookId: string, model: WhisperModel) {
  "use server"

  await queue.setupBook({ bookId, model })

  redirect(`/book/${bookId}`)
}

export default async function SearchPage() {
  const libraries = await getAllLibraries()

  return <Search libraries={libraries} setupBook={setupBook} />
}
