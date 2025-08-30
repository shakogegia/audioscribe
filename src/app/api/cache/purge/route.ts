import { tempFolder } from "@/lib/utils";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function DELETE() {
  try {
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
