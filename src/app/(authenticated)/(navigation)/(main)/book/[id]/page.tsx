import { getBook, getBookFiles } from "@/lib/audiobookshelf"
import Book from "./book"
import { revalidatePath } from "next/cache"

async function revalidateBook(id: string) {
  "use server"
  revalidatePath(`/book/${id}`)
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const book = await getBook(id)
  const files = await getBookFiles(id)

  return <Book id={id} book={book} files={files} revalidate={revalidateBook} />
}
