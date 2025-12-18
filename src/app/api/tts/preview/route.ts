import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import crypto from "crypto"
import fs from "fs/promises"
import os from "os"

interface TTSPreviewRequestBody {
  text: string
  model: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSPreviewRequestBody = await request.json()

    const { text, model } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    // Generate unique ID for this preview
    const previewId = crypto.createHash("md5").update(`${text}-${model}-${Date.now()}`).digest("hex")

    // Use temp directory for preview files
    const tmpDir = os.tmpdir()
    const outputPath = path.join(tmpDir, `tts-preview-${previewId}.wav`)

    console.log(`Generating TTS preview: model=${model}, text length=${text.length}`)

    // Spawn Python Piper TTS script
    const scriptPath = path.join(process.cwd(), "scripts", "piper_tts.py")

    const result = await spawnPiperTTS({
      text,
      output: outputPath,
      model,
      scriptPath,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "TTS generation failed" }, { status: 500 })
    }

    // Read the generated audio file
    const audioBuffer = await fs.readFile(outputPath)

    // Clean up the temp file
    try {
      await fs.unlink(outputPath)
    } catch (error) {
      console.error("Failed to delete temp file:", error)
    }

    // Return the audio file as a stream
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("TTS preview error:", error)
    return NextResponse.json({ error: "Failed to generate TTS preview" }, { status: 500 })
  }
}

interface SpawnPiperTTSOptions {
  text: string
  output: string
  model: string
  scriptPath: string
}

function spawnPiperTTS(options: SpawnPiperTTSOptions): Promise<{ success: boolean; error?: string }> {
  return new Promise(resolve => {
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
        console.log("Piper TTS preview generated successfully")
        resolve({ success: true })
      } else {
        console.error(`Piper TTS exited with code ${code}`)
        console.error(`stderr: ${stderr}`)
        resolve({ success: false, error: `TTS process exited with code ${code}` })
      }
    })
  })
}
