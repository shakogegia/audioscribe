import { Hero } from "@/components/hero";
import { Badge } from "@/components/ui/badge";
import { getBook } from "@/lib/audiobookshelf";
import { formatTime } from "@/lib/format";
import { Play } from "lucide-react";
import Image from "next/image";

export default async function BookPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const book = await getBook(id);

  return (
    <div className="w-full h-full flex flex-col items-center gap-8 py-10">
      <Hero
        title={book.title}
        icon={
          <Image
            src={book.coverPath ?? ""}
            alt={book.title}
            className="w-32 h-32 object-cover rounded-md shadow-md"
            width={128}
            height={128}
          />
        }
      />

      <div className="flex flex-col gap-4 w-full">
        <h3 className="text-2xl font-semibold text-center">Bookmarks</h3>

        <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
          {book.bookmarks.map(bookmark => (
            <div key={bookmark.createdAt} className="flex flex-col gap-2 border rounded-md p-2 text-sm w-full">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatTime(bookmark.time)}</Badge>
                  <span className="font-semibold">{bookmark.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
