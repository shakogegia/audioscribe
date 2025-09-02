import { vectorDb } from "@/ai/lib/vector";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const query = request.nextUrl.searchParams.get("query") ?? "";

  await vectorDb.initialize(id);
  const results = await vectorDb.searchSimilar(query, 5);

  return NextResponse.json({ results });
}
