import { jobQueue } from "@/jobs/queue"
import { clearFolder, folders } from "@/lib/folders"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const folder = await folders.book(id).folder()
  await clearFolder(folder)

  const jobs = await prisma.job.findMany({ where: { bookId: id } })
  for (const job of jobs) {
    await jobQueue.cancelJob(job.id)
  }

  await prisma.transcriptSegment.deleteMany({ where: { bookId: id } })
  await prisma.bookSetupProgress.deleteMany({ where: { bookId: id } })
  await prisma.job.deleteMany({ where: { bookId: id } })
  await prisma.book.delete({ where: { id } })

  return NextResponse.json({ message: "Book removed" })
}
