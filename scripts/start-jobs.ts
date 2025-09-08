#!/usr/bin/env ts-node
import "dotenv/config"
import { jobRunner } from "@/jobs/runner"

console.log("Starting job runner...")

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down job runner gracefully...")
  await jobRunner.stop()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down job runner gracefully...")
  await jobRunner.stop()
  process.exit(0)
})

async function startJobRunner() {
  try {
    await jobRunner.start()
  } catch (error) {
    console.error("Failed to start job runner:", error)
    process.exit(1)
  }
}

startJobRunner()
