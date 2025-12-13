import type { Express } from "express"

export const router = (server: Express) => {
  server.get("/health", (_, res) => {
    res.send("OK")
  })
}
