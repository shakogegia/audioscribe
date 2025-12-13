import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../../generated/prisma"

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaBetterSqlite3({ url: connectionString })
const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    book: {
      ready: {
        needs: { audioProcessed: true, transcribed: true, vectorized: true, downloaded: true },
        compute(book) {
          return book.audioProcessed && book.transcribed && book.vectorized && book.downloaded
        },
      },
    },
  },
})

export { prisma }
