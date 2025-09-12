import { promises as fs } from "fs"
import ffmpeg from "fluent-ffmpeg"
import audioconcat from "audioconcat"
import path from "path"

export async function stitchAudioFiles(files: string[], outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputDir, "stitched.wav")
    audioconcat(files)
      .concat(outputFile)
      .on("start", function (command: string) {
        console.log("ffmpeg process started:", command)
      })
      .on("error", function (err: Error, stdout: string, stderr: string) {
        console.error("Error:", err)
        console.error("ffmpeg stderr:", stderr)
        reject(new Error(`Failed to convert to WAV: ${err}`))
      })
      .on("end", function (output: string) {
        console.error("Audio created in:", output)
        resolve(outputFile)
      })
  })
}

export async function preprocessAudio(inputPath: string, outputDir: string): Promise<string> {
  // Process audio for better transcription quality
  const outputPath = path.join(outputDir, "processed.wav")

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
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
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", error => reject(error))
        .run()
    })

    await Promise.all([fs.unlink(inputPath).catch(() => {})])

    return outputPath
  } catch (error) {
    console.error("Error preprocessing audio:", error)

    // Clean up temp files on error
    await Promise.all([fs.unlink(inputPath).catch(() => {}), fs.unlink(outputPath).catch(() => {})])

    return inputPath // Fallback to original
  }
}
