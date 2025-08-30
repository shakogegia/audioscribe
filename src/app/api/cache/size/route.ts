import { tempFolder } from "@/lib/utils";
import { readdir, stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const size = await dirSize(tempFolder);

    const humanReadableSize =
      size < 1024 * 1024 * 1024
        ? `${(size / 1024 / 1024).toFixed(2)} MB`
        : `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;

    return NextResponse.json({ size, humanReadableSize }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function dirSize(directory: string) {
  const files = await readdir(directory);
  const stats = files.map(file => stat(path.join(directory, file)));

  return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}
