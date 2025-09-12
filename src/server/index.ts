import type { Express } from "express"
import { jobs } from "@/server/jobs"
import { router } from "./router"

export const boot = (server: Express) => {
  console.log("Booting server...")

  // Start the job runner
  jobs()

  // Register the routes
  router(server)
}
