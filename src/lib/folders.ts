import { promises as fs } from "fs"
import { join } from "path"

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
