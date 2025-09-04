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
    async wav() {
      const folder = await this.folder()
      const path = join(folder, "wav")
      await ensureFolder(path)
      return join(folder, "wav")
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
