import { promises as fs } from "fs"
import path, { join } from "path"

const cacheFolder = join(process.env.DATA_DIR!, "cache")

export async function ensureFolder(folder: string) {
  if (
    !(await fs
      .access(folder)
      .then(() => true)
      .catch(() => false))
  ) {
    await fs.mkdir(folder, { recursive: true })
  }
}

export const folders = {
  cache: async () => {
    const path = join(cacheFolder)
    await ensureFolder(path)
    return path
  },
  book: (id: string) => ({
    async folder() {
      const path = join(cacheFolder, id)
      await ensureFolder(path)
      return path
    },
    async downloads() {
      const folder = await this.folder()
      const path = join(folder, "downloads")
      await ensureFolder(path)
      return join(folder, "downloads")
    },
    async transcripts() {
      const folder = await this.folder()
      const path = join(folder, "transcripts")
      await ensureFolder(path)
      return join(folder, "transcripts")
    },
    async audio() {
      const folder = await this.folder()
      const path = join(folder, "audio")
      await ensureFolder(path)
      return join(folder, "audio")
    },
  }),
}

export async function dirSize(dirPath: string) {
  let size = 0
  const files = await fs.readdir(dirPath)

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i])
    const stats = await fs.stat(filePath)

    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      size += await dirSize(filePath)
    }
  }

  return size
}

export async function humanReadableSize(size: number): Promise<string> {
  return size < 1024 * 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(2)} MB`
    : `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export async function getBookCacheSize(id: string): Promise<{ size: number; humanReadableSize: string }> {
  const size = await dirSize(await folders.book(id).folder())
  return {
    size,
    humanReadableSize: await humanReadableSize(size),
  }
}

export function clearFolder(directory: string) {
  return deleteRecursively(directory, directory)
}

export async function deleteRecursively(
  itemPath: string,
  itemName: string
): Promise<{ item: string; status: string; reason?: string }> {
  try {
    // Check if item can be accessed
    await fs.access(itemPath, fs.constants.F_OK)

    const stats = await fs.stat(itemPath)

    if (stats.isDirectory()) {
      // Check if directory is writable
      await fs.access(itemPath, fs.constants.W_OK)

      // Recursively delete directory contents
      await fs.rm(itemPath, { recursive: true, force: true })
      return { item: itemName, status: "deleted (directory)" }
    } else {
      // Check if file is writable
      await fs.access(itemPath, fs.constants.W_OK)

      // Delete file
      await fs.unlink(itemPath)
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
