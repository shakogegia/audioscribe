import fs from "fs";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";

export async function GET() {
  try {
    const tempFolder = path.join(os.tmpdir(), "audiobook-wizard");
    // async files inside temp folder
    const files = await fs.promises.readdir(tempFolder);
    for (const file of files) {
      await fs.promises.unlink(path.join(tempFolder, file));
    }

    return NextResponse.json({ message: "Cache purged" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
