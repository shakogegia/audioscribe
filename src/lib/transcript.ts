import { prisma } from "@/lib/prisma"
import { TranscriptSegment } from "../../generated/prisma"

export async function getTranscriptByOffset({
  bookId,
  time,
  offset,
}: {
  bookId: string
  time: number
  offset: number
}): Promise<TranscriptSegment[]> {
  const timeInMilliseconds = time * 1000
  const offsetInMilliseconds = offset * 1000

  const startTimeInMilliseconds = timeInMilliseconds - offsetInMilliseconds
  const endTimeInMilliseconds = timeInMilliseconds + offsetInMilliseconds

  const segments = await prisma.transcriptSegment.findMany({
    where: {
      bookId,
      AND: [{ startTime: { gte: startTimeInMilliseconds } }, { endTime: { lte: endTimeInMilliseconds } }],
    },
    orderBy: {
      startTime: "asc",
    },
  })

  return segments
}

export async function getTranscriptRangeByTime({
  bookId,
  time,
  before = 0,
  after = 0,
}: {
  bookId: string
  time: number
  before?: number
  after?: number
}): Promise<TranscriptSegment[]> {
  const timeInMilliseconds = time * 1000
  const beforeOffsetInMilliseconds = before * 1000
  const afterOffsetInMilliseconds = after * 1000

  const startTimeInMilliseconds = timeInMilliseconds - beforeOffsetInMilliseconds
  const endTimeInMilliseconds = timeInMilliseconds + afterOffsetInMilliseconds

  const segments = await prisma.transcriptSegment.findMany({
    where: {
      bookId,
      AND: [{ startTime: { gte: startTimeInMilliseconds } }, { endTime: { lte: endTimeInMilliseconds } }],
    },
    orderBy: {
      startTime: "asc",
    },
  })

  return segments
}

export async function getTranscriptByRange({
  bookId,
  startTime,
  endTime,
}: {
  bookId: string
  startTime: number // seconds
  endTime: number // seconds
}): Promise<TranscriptSegment[]> {
  const startTimeInMilliseconds = startTime * 1000
  const endTimeInMilliseconds = endTime * 1000

  const segments = await prisma.transcriptSegment.findMany({
    where: { bookId, startTime: { gte: startTimeInMilliseconds }, endTime: { lte: endTimeInMilliseconds } },
    orderBy: {
      startTime: "asc",
    },
  })

  return segments
}
