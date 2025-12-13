import type { Express } from "express"
import { router } from "./router"

export const boot = (server: Express) => {
  console.log("Booting server...")

  // Register the routes
  router(server)
}
