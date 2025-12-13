import { clearFolder, folders } from "@/lib/folders"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const folder = await folders.book(id).folder()
  await clearFolder(folder)

  await prisma.transcriptSegment.deleteMany({ where: { bookId: id } })
  await prisma.bookSetupProgress.deleteMany({ where: { bookId: id } })
  await prisma.book.delete({ where: { id } })

  return NextResponse.json({ message: "Book removed" })
}
