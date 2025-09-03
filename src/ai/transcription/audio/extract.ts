import { tempFolder } from "@/lib/utils"
import ffmpeg from "fluent-ffmpeg"
import { promises as fs } from "fs"
import { join } from "path"

/**
 * Extract a specific time segment from an audio file
 */
export async function extractAudioSegment(
  audioUrl: string,
  startTime: number,
  duration: number,
  offset: number
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const tempOutputPath = join(tempFolder, `audio_segment_${Date.now()}.wav`)

    try {
      // Convert to WAV format for better Whisper compatibility
      ffmpeg(audioUrl)
        .seekInput(startTime - offset)
        .duration(duration + offset * 2)
        .audioFrequency(16000) // 16kHz for Whisper
        .audioChannels(1) // Mono
        .audioCodec("pcm_s16le") // 16-bit PCM
        .format("wav")
        .output(tempOutputPath)
        .on("end", async () => {
          try {
            // Read the extracted audio file as buffer
            const audioBuffer = await fs.readFile(tempOutputPath)

            // Clean up temp file
            await fs.unlink(tempOutputPath).catch(() => {}) // Ignore cleanup errors

            resolve(audioBuffer)
          } catch (error) {
            reject(new Error(`Failed to read extracted audio: ${error}`))
          }
        })
        .on("error", error => {
          reject(new Error(`FFmpeg extraction failed: ${error.message}`))
        })
        .run()
    } catch (error) {
      reject(new Error(`Failed to extract audio segment: ${error}`))
    }
  })
}
