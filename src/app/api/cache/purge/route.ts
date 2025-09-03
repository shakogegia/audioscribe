import { folders } from "@/lib/folders"
import fs from "fs"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const directory = await folders.cache()
    const results = await clearFolder(directory)

    return NextResponse.json(
      {
        message: "Cache purge completed",
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function clearFolder(directory: string) {
  return deleteRecursively(directory, directory)
}

async function deleteRecursively(
  itemPath: string,
  itemName: string
): Promise<{ item: string; status: string; reason?: string }> {
  try {
    // Check if item can be accessed
    await fs.promises.access(itemPath, fs.constants.F_OK)

    const stats = await fs.promises.stat(itemPath)

    if (stats.isDirectory()) {
      // Check if directory is writable
      await fs.promises.access(itemPath, fs.constants.W_OK)

      // Recursively delete directory contents
      await fs.promises.rm(itemPath, { recursive: true, force: true })
      return { item: itemName, status: "deleted (directory)" }
    } else {
      // Check if file is writable
      await fs.promises.access(itemPath, fs.constants.W_OK)

      // Delete file
      await fs.promises.unlink(itemPath)
      return { item: itemName, status: "deleted (file)" }
    }
  } catch (accessError) {
    console.warn(`Cannot delete ${itemName}:`, accessError)
    return {
      item: itemName,
      status: "skipped",
      reason: "permission denied or item not accessible",
    }
  }
}
