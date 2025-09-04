import type { TranscriptionResult } from "@/ai/transcription/types/transription"
import { WhisperModel } from "@/ai/transcription/types/transription"
import { folders } from "@/lib/folders"
import { cleanUpTempFiles } from "@/lib/utils"
import { exec } from "child_process"
import { promises as fs } from "fs"
import path, { join } from "path"

/**
 * Transcribe audio buffer using local Whisper via external worker
 */
export async function transcribe(
  audioBuffer: Buffer,
  bookId: string,
  modelName: WhisperModel = "large-v3-turbo"
): Promise<TranscriptionResult> {
  const audioFolder = await folders.book(bookId).audio()
  const transcriptsFolder = await folders.book(bookId).transcripts()
  const tempAudioPath = join(audioFolder, `whisper_input_${Date.now()}.wav`)
  const outputPath = join(transcriptsFolder, `whisper_output_${Date.now()}.json`)

  try {
    // Write buffer to temporary file
    await fs.writeFile(tempAudioPath, audioBuffer)

    // Use external worker script to avoid Next.js context issues
    const workerPath = path.join(process.cwd(), "workers/whisper.js")

    console.info(`[Transcription] Using worker: ${workerPath}`)
    console.info(`[Transcription] Input: ${tempAudioPath}`)
    console.info(`[Transcription] Output: ${outputPath}`)
    console.info(`[Transcription] Model: ${modelName}`)

    // Run the worker script
    await new Promise<void>((resolve, reject) => {
      const worker = exec(`node ${workerPath} ${modelName} ${tempAudioPath} ${outputPath}`)

      worker.on("message", message => {
        console.info("[Transcription] Worker message:", message)
      })

      worker.on("error", error => {
        console.error("[Transcription] Worker error:", error)
        reject(new Error(`Worker error: ${error.message}`))
      })

      worker.on("exit", code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Worker exited with code ${code}`))
        }
      })
    })

    // Read the result
    const resultJson = await fs.readFile(outputPath, "utf8")
    const workerResult = JSON.parse(resultJson)

    if (!workerResult.success) {
      throw new Error(workerResult.error)
    }

    const result = workerResult.result

    // Parse the result - nodewhisper returns different structures depending on options
    let transcriptionText = ""
    let segments: Array<{ text: string; start: number; end: number }> = []

    if (typeof result === "string") {
      transcriptionText = result.trim()
    } else if (result && typeof result === "object") {
      // Handle structured output
      if (Array.isArray(result)) {
        // Segments array
        segments = (result as unknown[]).map((segment: unknown) => {
          const segmentObj = segment as Record<string, unknown>
          return {
            text: (segmentObj.text as string) || (segmentObj.transcript as string) || "",
            start: (segmentObj.start as number) || (segmentObj.from as number) || 0,
            end: (segmentObj.end as number) || (segmentObj.to as number) || 0,
          }
        })
        transcriptionText = segments
          .map(s => s.text)
          .join(" ")
          .trim()
      } else {
        const resultObj = result as Record<string, unknown>
        if (resultObj.text) {
          transcriptionText = (resultObj.text as string).trim()
          if (resultObj.segments && Array.isArray(resultObj.segments)) {
            segments = (resultObj.segments as Record<string, unknown>[]).map(segment => ({
              text: (segment.text as string) || "",
              start: (segment.start as number) || 0,
              end: (segment.end as number) || 0,
            }))
          }
        }
      }
    }

    return {
      text: transcriptionText,
      confidence: 0.85, // nodewhisper doesn't provide confidence scores
      segments: segments.length > 0 ? segments : undefined,
    }
  } catch (error) {
    throw new Error(`Whisper transcription failed: ${error}`)
  } finally {
    // Clean up temp files
    if (cleanUpTempFiles) {
      await Promise.all([
        fs.unlink(tempAudioPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {}),
        fs.unlink(`${tempAudioPath}.json`).catch(() => {}),
      ])
    }
  }
}
