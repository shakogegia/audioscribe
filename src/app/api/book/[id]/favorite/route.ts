import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const book = await prisma.book.findUnique({ where: { id } })

    return NextResponse.json({ favorite: book?.favorite }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { favorite } = (await request.json()) as { favorite?: boolean }

    const book = await prisma.book.findUnique({ where: { id } })
    const newFavorite = favorite ?? !book?.favorite ?? true
    await prisma.book.update({ where: { id }, data: { favorite: newFavorite } })

    return NextResponse.json({ favorite: newFavorite }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
