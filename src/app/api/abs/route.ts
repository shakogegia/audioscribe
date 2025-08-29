import { api } from "@/lib/audiobookshelf";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const results = await api.get(query);
    return NextResponse.json(results.data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
