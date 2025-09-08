import { Prisma, PrismaClient } from "@prisma/client"
import { JobData } from "@/jobs/runner"

const prisma = new PrismaClient()

export interface JobOptions {
  priority?: number
  delay?: number
  maxAttempts?: number
  processAt?: Date
}
export interface JobStatus {
  id: string
  type: string
  status: string
  attempts: number
  maxAttempts: number
  createdAt: Date
  completedAt?: Date | null
  failedAt?: Date | null
  error?: string | null
  result?: string | null
}

export class JobQueue {
  async add(jobType: "setupBook", data: JobData, options: JobOptions = {}): Promise<string> {
    const { priority = 0, delay = 0, maxAttempts = 3, processAt = new Date(Date.now() + delay * 1000) } = options

    const job = await prisma.job.create({
      data: {
        type: jobType,
        data: JSON.stringify(data),
        priority,
        delay,
        maxAttempts,
        processAt,
      },
    })

    console.log(`Job ${job.id} queued for ${jobType}`)
    return job.id
  }

  async getJob(jobId: string): Promise<JobStatus | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) return null

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      error: job.error,
      result: job.result,
    }
  }

  async getJobs(status?: string, type?: string, limit: number = 100, offset: number = 0): Promise<JobStatus[]> {
    const where: Prisma.JobWhereInput = {}
    if (status) where.status = status
    if (type) where.type = type

    const jobs = await prisma.job.findMany({
      where,
      include: {
        book: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return jobs.map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      error: job.error,
      result: job.result,
    }))
  }

  async getPendingJobs(): Promise<JobStatus[]> {
    return this.getJobs("pending")
  }

  async getRunningJobs(): Promise<JobStatus[]> {
    return this.getJobs("running")
  }

  async getCompletedJobs(): Promise<JobStatus[]> {
    return this.getJobs("completed")
  }

  async getFailedJobs(): Promise<JobStatus[]> {
    return this.getJobs("failed")
  }

  async retryJob(jobId: string, delay: number = 0): Promise<boolean> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job || job.status !== "failed") {
      return false
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "pending",
        attempts: 0,
        processAt: new Date(Date.now() + delay * 1000),
        error: null,
        failedAt: null,
      },
    })

    console.log(`Job ${jobId} queued for retry`)
    return true
  }

  async deleteJob(jobId: string): Promise<boolean> {
    try {
      await prisma.job.delete({
        where: { id: jobId },
      })
      return true
    } catch {
      return false
    }
  }

  async clearCompletedJobs(): Promise<number> {
    const result = await prisma.job.deleteMany({
      where: { status: "completed" },
    })
    console.log(`Cleared ${result.count} completed jobs`)
    return result.count
  }

  async clearFailedJobs(): Promise<number> {
    const result = await prisma.job.deleteMany({
      where: { status: "failed" },
    })
    console.log(`Cleared ${result.count} failed jobs`)
    return result.count
  }

  async resetRunningJobs(): Promise<number> {
    const result = await prisma.job.updateMany({
      where: { status: "running" },
      data: {
        status: "pending",
        processAt: new Date(),
        attempts: 0,
        error: null,
        failedAt: null,
      },
    })
    if (result.count > 0) {
      console.log(`Reset ${result.count} running jobs to pending`)
    }
    return result.count
  }

  async getQueueStats(): Promise<{
    pending: number
    running: number
    completed: number
    failed: number
    total: number
  }> {
    const [pending, running, completed, failed] = await Promise.all([
      prisma.job.count({ where: { status: "pending" } }),
      prisma.job.count({ where: { status: "running" } }),
      prisma.job.count({ where: { status: "completed" } }),
      prisma.job.count({ where: { status: "failed" } }),
    ])

    return {
      pending,
      running,
      completed,
      failed,
      total: pending + running + completed + failed,
    }
  }
}

export const jobQueue = new JobQueue()

export async function setupBook(data: { bookId: string; model: string }, options?: JobOptions): Promise<string> {
  return jobQueue.add("setupBook", data, options)
}
