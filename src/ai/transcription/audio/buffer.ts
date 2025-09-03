import { v4 as uuidv4 } from "uuid"
import { tempFolder } from "@/lib/utils"
import ffmpeg from "fluent-ffmpeg"
import { promises as fs } from "fs"
import { join } from "path"

const cleanUpTempFiles = true

// Convert to WAV format for better Whisper compatibility and return buffer
export async function convertToWavBuffer(audioUrl: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const tempOutputPath = join(tempFolder, `audio_full_${uuidv4()}.wav`)

    try {
      // Convert to WAV format for better Whisper compatibility
      ffmpeg(audioUrl)
        .format("wav")
        .output(tempOutputPath)
        .on("end", async () => {
          try {
            // Read the extracted audio file as buffer
            const audioBuffer = await fs.readFile(tempOutputPath)

            // Clean up temp file
            if (cleanUpTempFiles) {
              await fs.unlink(tempOutputPath).catch(() => {}) // Ignore cleanup errors
            }

            resolve(audioBuffer)
          } catch (error) {
            reject(new Error(`Failed to read extracted audio: ${error}`))
          }
        })
        .on("error", error => {
          reject(new Error(`FFmpeg conversion failed: ${error.message}`))
        })
        .run()
    } catch (error) {
      reject(new Error(`Failed to convert to WAV: ${error}`))
    }
  })
}
