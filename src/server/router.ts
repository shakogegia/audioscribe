import type { Express } from "express"
import { spawnTranscribeWorker } from "./utils/workers"

export const router = (server: Express) => {
  server.get("/health", (_, res) => {
    res.send("OK")
  })

  server.get("/gego", (_, res) => {
    spawnTranscribeWorker("a3940781-61c5-40a0-a3d8-85a683b00180", "tiny.en")

    res.send("OK")
  })
}
