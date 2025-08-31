import { getBook, getBookFiles } from "@/lib/audiobookshelf";
import Book from "./components/book";

export default async function BookPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const book = await getBook(id);
  const files = await getBookFiles(id);

  return <Book id={id} book={book} files={files} />;
}
