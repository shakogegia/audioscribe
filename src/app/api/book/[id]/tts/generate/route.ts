import { folders } from "@/lib/folders"
import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import crypto from "crypto"
import fs from "fs/promises"

interface TTSGenerateRequestBody {
  text: string
  voice?: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const body: TTSGenerateRequestBody = await request.json()

    const { text, voice = "en_US-ljspeech-high" } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Generate unique audio ID based on text hash
    const audioId = crypto.createHash("md5").update(text).digest("hex")

    // Get TTS folder for this book
    const ttsFolder = await folders.book(bookId).tts()
    const outputPath = path.join(ttsFolder, `${audioId}.wav`)

    // Check if audio already exists (cached)
    try {
      await fs.access(outputPath)
      console.log(`TTS audio already exists (cached): ${audioId}`)

      // Get file stats for duration estimation (approximate)
      const stats = await fs.stat(outputPath)
      const duration = Math.round(stats.size / 32000) // Rough estimate based on 16kHz mono WAV

      return NextResponse.json({
        audioId,
        duration,
        cached: true,
      })
    } catch {
      // File doesn't exist, continue with generation
    }

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
      return NextResponse.json({ error: result.error || "TTS generation failed" }, { status: 500 })
    }

    // Get file stats for duration estimation
    const stats = await fs.stat(outputPath)
    const duration = Math.round(stats.size / 32000) // Rough estimate

    return NextResponse.json({
      audioId,
      duration,
      cached: false,
    })
  } catch (error) {
    console.error("TTS generation error:", error)
    return NextResponse.json({ error: "Failed to generate TTS audio" }, { status: 500 })
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
