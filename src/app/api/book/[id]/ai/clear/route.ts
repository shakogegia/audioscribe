import { vectorDb } from "@/ai/lib/vector";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await vectorDb.initialize(id);
  await vectorDb.clearCollection(id);

  return NextResponse.json({ message: "Vector collection cleared" });
}
