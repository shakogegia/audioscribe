import { jobRunner } from "@/server/jobs/runner"

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

export async function jobs() {
  try {
    console.log("Starting job runner...")
    await jobRunner.start()
  } catch (error) {
    console.error("Failed to start job runner:", error)
  }
}
