import { spawn, ChildProcess } from "child_process"

const runningProcesses = new Map<string, ChildProcess>()

export interface SpawnWorkerOptions {
  workerScript: string
  args: string[]
  logPrefix?: string
  log?: (message: string) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  jobId?: string
}

export async function spawnWorker(options: SpawnWorkerOptions): Promise<unknown> {
  const { workerScript, args, logPrefix = workerScript, log, onError, onComplete, jobId } = options

  return new Promise(async (resolve, reject) => {
    const fullArgs = ["--project", "workers/tsconfig.json", `workers/${workerScript}`, ...args]

    const child = spawn("ts-node", fullArgs, {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    if (jobId) {
      runningProcesses.set(jobId, child)
      
      // Store PID in database for cross-process cancellation
      try {
        const { PrismaClient } = await import("@prisma/client")
        const prisma = new PrismaClient()
        await prisma.job.update({
          where: { id: jobId },
          data: { pid: child.pid }
        })
        await prisma.$disconnect()
      } catch (error) {
        console.error(`Failed to store PID for job ${jobId}:`, error)
      }
    }

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", data => {
      stdout += data.toString()
      console.log(`[${logPrefix}] ${data}`)
      log?.(data.toString())
    })

    child.stderr?.on("data", data => {
      stderr += data.toString()
      console.error(`[${logPrefix} Error] ${data}`)
    })

    child.on("close", async code => {
      if (jobId) {
        runningProcesses.delete(jobId)
        
        // Clear PID from database
        try {
          const { PrismaClient } = await import("@prisma/client")
          const prisma = new PrismaClient()
          await prisma.job.update({
            where: { id: jobId },
            data: { pid: null }
          })
          await prisma.$disconnect()
        } catch (error) {
          console.error(`Failed to clear PID for job ${jobId}:`, error)
        }
      }
      if (code === 0) {
        onComplete?.()
        resolve({ stdout, exitCode: code })
      } else {
        onError?.(new Error(`${logPrefix} failed with exit code ${code}. stderr: ${stderr}`))
        reject(new Error(`${logPrefix} failed with exit code ${code}. stderr: ${stderr}`))
      }
    })

    child.on("error", async error => {
      if (jobId) {
        runningProcesses.delete(jobId)
        
        // Clear PID from database
        try {
          const { PrismaClient } = await import("@prisma/client")
          const prisma = new PrismaClient()
          await prisma.job.update({
            where: { id: jobId },
            data: { pid: null }
          })
          await prisma.$disconnect()
        } catch (dbError) {
          console.error(`Failed to clear PID for job ${jobId}:`, dbError)
        }
      }
      reject(error)
    })
  })
}

export function killJobProcess(jobId: string): boolean {
  const process = runningProcesses.get(jobId)
  if (!process) {
    return false
  }

  try {
    process.kill('SIGTERM')
    runningProcesses.delete(jobId)
    return true
  } catch (error) {
    console.error(`Failed to kill process for job ${jobId}:`, error)
    return false
  }
}

export function getRunningProcesses(): string[] {
  return Array.from(runningProcesses.keys())
}
