import { downloadQueue } from "@/server/jobs/queues/download.queue"
import { notificationQueue } from "@/server/jobs/queues/notification.queue"
import { processAudioQueue } from "@/server/jobs/queues/process-audio.queue"
import { transcribeQueue } from "@/server/jobs/queues/transcribe.queue"
import { vectorizeQueue } from "@/server/jobs/queues/vectorize.queue"
import { appRouter } from "@queuedash/api"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/queuedash",
    req,
    router: appRouter,
    allowBatching: true,
    createContext: () => ({
      queues: [
        { queue: downloadQueue, displayName: "Download Book", type: "bullmq" as const },
        { queue: processAudioQueue, displayName: "Process Audio", type: "bullmq" as const },
        { queue: transcribeQueue, displayName: "Transcribe Book", type: "bullmq" as const },
        { queue: vectorizeQueue, displayName: "Vectorize Book", type: "bullmq" as const },
        { queue: notificationQueue, displayName: "Send Notification", type: "bullmq" as const },
      ],
    }),
  })
}

export { handler as GET, handler as POST }
