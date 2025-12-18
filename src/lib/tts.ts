import { folders } from "@/lib/folders"
import { spawn } from "child_process"
import crypto from "crypto"
import fs from "fs/promises"
import path from "path"

type TTSOptions = {
  bookId: string
  text: string
  voice?: string
}

export async function generateTTS({
  bookId,
  text,
  voice = "en_US-hfc_female-medium",
}: TTSOptions): Promise<{ url: string; duration: number }> {
  try {
    if (!text || !text.trim()) {
      throw new Error("Text is required")
    }

    // Generate unique audio ID based on text hash
    const audioId = crypto.createHash("md5").update(text).digest("hex")

    // Get TTS folder for this book
    const ttsFolder = await folders.book(bookId).tts()
    const outputPath = path.join(ttsFolder, `${audioId}.wav`)

    // Spawn Python Piper TTS script
    const scriptPath = path.join(process.cwd(), "scripts", "piper_tts.py")

    console.log(`Generating TTS audio for book ${bookId}, text length: ${text.length}`)

    const result = await spawnPiperTTS({
      text,
      output: outputPath,
      model: voice,
      scriptPath,
    })

    if (!result.success) {
      throw new Error(result.error || "TTS generation failed")
    }

    // Get file stats for duration estimation
    const stats = await fs.stat(outputPath)
    const duration = Math.round(stats.size / 32000) // Rough estimate

    const fileUrl = path.join(ttsFolder, `${audioId}.wav`)

    return {
      url: fileUrl,
      duration,
    }
  } catch (error) {
    console.error("TTS generation error:", error)
    throw new Error("Failed to generate TTS audio")
  }
}

interface SpawnPiperTTSOptions {
  text: string
  output: string
  model: string
  scriptPath: string
}

function spawnPiperTTS(options: SpawnPiperTTSOptions): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const { text, output, model, scriptPath } = options

    const args = ["--text", text, "--output", output, "--model", model]

    console.log(`Spawning Piper TTS: python3 ${scriptPath} ${args.join(" ")}`)

    const child = spawn("python3", [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", data => {
      stdout += data.toString()
    })

    child.stderr.on("data", data => {
      const message = data.toString()
      stderr += message
      console.log(`[Piper TTS] ${message.trim()}`)
    })

    child.on("error", error => {
      console.error("Piper TTS spawn error:", error)
      resolve({ success: false, error: error.message })
    })

    child.on("close", code => {
      if (code === 0) {
        console.log("Piper TTS generation completed successfully")
        resolve({ success: true })
      } else {
        console.error(`Piper TTS exited with code ${code}`)
        console.error(`stderr: ${stderr}`)
        resolve({ success: false, error: `TTS process exited with code ${code}` })
      }
    })
  })
}
