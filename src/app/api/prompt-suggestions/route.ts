import { getSuggestions } from "@/actions/suggestions"
import { NextResponse } from "next/server"

export async function GET() {
  const suggestions = await getSuggestions()
  return NextResponse.json(suggestions)
}
