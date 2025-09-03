import { tempFolder } from "@/lib/utils"
import ffmpeg from "fluent-ffmpeg"
import { promises as fs } from "fs"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const cleanUpTempFiles = true

/**
 * Preprocess audio for better transcription quality
 */
export async function preprocessAudio(audioBuffer: Buffer): Promise<Buffer> {
  const tempInputPath = join(tempFolder, `preprocess_input_${uuidv4()}.wav`)
  const tempOutputPath = join(tempFolder, `preprocess_output_${uuidv4()}.wav`)

  try {
    // Write input buffer to temp file
    await fs.writeFile(tempInputPath, audioBuffer)

    // Process audio for better transcription quality
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .audioFrequency(16000) // 16kHz for Whisper
        .audioChannels(1) // Mono
        .audioCodec("pcm_s16le") // 16-bit PCM
        .format("wav")
        // Audio filters for better quality
        .audioFilters([
          "highpass=f=80", // Remove low-frequency noise
          "lowpass=f=8000", // Remove high-frequency noise (above human speech)
          "volume=1.5", // Boost volume slightly
          "acompressor=threshold=-20dB:ratio=3:attack=1:release=50", // Gentle compression
        ])
        .output(tempOutputPath)
        .on("end", () => resolve())
        .on("error", error => reject(error))
        .run()
    })

    // Read processed audio
    const processedBuffer = await fs.readFile(tempOutputPath)

    // Clean up temp files
    if (cleanUpTempFiles) {
      await Promise.all([fs.unlink(tempInputPath).catch(() => {}), fs.unlink(tempOutputPath).catch(() => {})])
    }

    return processedBuffer
  } catch (error) {
    console.error("Error preprocessing audio:", error)

    // Clean up temp files on error
    await Promise.all([fs.unlink(tempInputPath).catch(() => {}), fs.unlink(tempOutputPath).catch(() => {})])

    return audioBuffer // Fallback to original
  }
}
