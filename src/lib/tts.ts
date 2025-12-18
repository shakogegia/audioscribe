import { spawn } from "child_process"
import path from "path"

type TTSOptions = {
  text: string
  voice?: string
}

export async function generateTTS({ text, voice = "en_US-hfc_female-medium" }: TTSOptions): Promise<Buffer> {
  if (!text || !text.trim()) {
    throw new Error("Text is required")
  }

  const scriptPath = path.join(process.cwd(), "scripts", "piper_tts.py")
  const args = ["--text", text, "--output", "-", "--model", voice]

  console.log(`Generating TTS audio: model=${voice}, text length=${text.length}`)

  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    })

    const chunks: Buffer[] = []
    let stderr = ""

    child.stdout.on("data", (data: Buffer) => {
      chunks.push(data)
    })

    child.stderr.on("data", (data: Buffer) => {
      const message = data.toString()
      stderr += message
      console.log(`[Piper TTS] ${message.trim()}`)
    })

    child.on("error", error => {
      console.error("Piper TTS spawn error:", error)
      reject(new Error(`TTS process error: ${error.message}`))
    })

    child.on("close", code => {
      if (code === 0) {
        const audioBuffer = Buffer.concat(chunks)
        console.log(`TTS generation completed: ${audioBuffer.length} bytes`)
        resolve(audioBuffer)
      } else {
        console.error(`Piper TTS exited with code ${code}`)
        console.error(`stderr: ${stderr}`)
        reject(new Error(`TTS process exited with code ${code}`))
      }
    })
  })
}
