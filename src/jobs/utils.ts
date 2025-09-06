import { spawn } from "child_process"

export interface SpawnWorkerOptions {
  workerScript: string
  args: string[]
  logPrefix: string
}

export async function spawnWorker(options: SpawnWorkerOptions): Promise<any> {
  const { workerScript, args, logPrefix } = options

  return new Promise((resolve, reject) => {
    const fullArgs = ["--project", "workers/tsconfig.json", `workers/${workerScript}`, ...args]

    const child = spawn("ts-node", fullArgs, {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", data => {
      stdout += data.toString()
      console.log(`[${logPrefix}] ${data}`)
    })

    child.stderr?.on("data", data => {
      stderr += data.toString()
      console.error(`[${logPrefix} Error] ${data}`)
    })

    child.on("close", code => {
      if (code === 0) {
        resolve({ stdout, exitCode: code })
      } else {
        reject(new Error(`${logPrefix} failed with exit code ${code}. stderr: ${stderr}`))
      }
    })

    child.on("error", error => {
      reject(error)
    })
  })
}
