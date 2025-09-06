import { PrismaClient } from "@prisma/client"
import { executeTranscribeJob, executeVectorizeJob } from "@/jobs/processors"

const prisma = new PrismaClient()

export interface JobData {
  [key: string]: unknown
}

export interface Job {
  id: string
  type: string
  data: JobData
  status: "pending" | "running" | "completed" | "failed"
  result?: string
  error?: string
  attempts: number
  maxAttempts: number
  delay: number
  priority: number
  processAt: Date
  completedAt?: Date
  failedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface JobProcessor {
  (data: JobData): Promise<unknown>
}

export class JobRunner {
  private isRunning = false
  private processors = new Map<string, JobProcessor>()
  private polling = true
  private pollInterval = 1000

  constructor() {
    this.registerDefaultProcessors()
  }

  private registerDefaultProcessors() {
    this.processors.set("transcribe", this.createTranscribeProcessor())
    this.processors.set("vectorize", this.createVectorizeProcessor())
  }

  private createTranscribeProcessor(): JobProcessor {
    return async (data: JobData) => {
      return executeTranscribeJob(data)
    }
  }

  private createVectorizeProcessor(): JobProcessor {
    return async (data: JobData) => {
      return executeVectorizeJob(data)
    }
  }

  register(jobType: string, processor: JobProcessor): void {
    this.processors.set(jobType, processor)
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Job runner is already running")
      return
    }

    this.isRunning = true
    this.polling = true
    console.log("Job runner started")

    while (this.polling) {
      try {
        await this.processNextJob()
        await new Promise(resolve => setTimeout(resolve, this.pollInterval))
      } catch (error) {
        console.error("Error in job runner:", error)
        await new Promise(resolve => setTimeout(resolve, this.pollInterval))
      }
    }
  }

  async stop(): Promise<void> {
    this.polling = false
    this.isRunning = false
    console.log("Job runner stopped")
  }

  private async processNextJob(): Promise<void> {
    const job = await prisma.job.findFirst({
      where: {
        status: "pending",
        processAt: {
          lte: new Date(),
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    })

    if (!job) {
      return
    }

    const processor = this.processors.get(job.type)
    if (!processor) {
      console.error(`No processor found for job type: ${job.type}`)
      await this.failJob(job.id, `No processor found for job type: ${job.type}`)
      return
    }

    console.log(`Processing job ${job.id} of type ${job.type}`)

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "running",
        attempts: job.attempts + 1,
      },
    })

    try {
      const data = JSON.parse(job.data)
      const result = await processor(data)

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "completed",
          result: JSON.stringify(result),
          completedAt: new Date(),
        },
      })

      console.log(`Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)

      const newAttempts = job.attempts + 1

      if (newAttempts >= job.maxAttempts) {
        await this.failJob(job.id, error instanceof Error ? error.message : "Unknown error")
      } else {
        const nextProcessAt = new Date(Date.now() + job.delay * 1000)

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "pending",
            error: error instanceof Error ? error.message : "Unknown error",
            processAt: nextProcessAt,
          },
        })

        console.log(`Job ${job.id} will be retried at ${nextProcessAt}`)
      }
    }
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error,
        failedAt: new Date(),
      },
    })
  }
}

export const jobRunner = new JobRunner()
