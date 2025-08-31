import { getBook } from "@/lib/audiobookshelf";
import Book from "./components/book";

export default async function BookPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const book = await getBook(id);

  return <Book id={id} book={book} />;
}
