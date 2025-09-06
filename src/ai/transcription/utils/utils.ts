// [00:00:00 --> 00:00:00] ==> 00:00:00
export function removeEndTimestampsAndBrackets(text: string): string {
  return text.replace(/\[?(\d{2}:\d{2}:\d{2})\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]?/g, "$1")
}

// Replaces every newline character with a Markdown line break ("  \n") for proper formatting.
export function formatMarkdownLineBreaks(text: string): string {
  return text.replace(/\n/g, "  \n")
}

export function removeTimestamps(text: string) {
  return text
    .replace(/\[\d{2}:\d{2}:\d{2}\s*-->\s*\d{2}:\d{2}:\d{2}\]/g, "") // remove timestamps
    .replace(/\s+/g, " ")
    .replace(/\n/g, "")
    .replace(/\\n/g, " ")
    .replace(/^[ \t]+|[ \t]+$/g, "")
    .replace(/[\n\r]/g, " ")
    .replace(/\\n/g, " ")
}

// [00:00:00.000 --> 00:00:00.000] ==> [00:00:00 --> 00:00:00]
export function removeMilliSeconds(text: string) {
  return text.replace(/(\d{1,2}:\d{2}:\d{2})\.\d{1,3}/g, "$1")
}

// [00:00:00.000 --> 00:00:10.000] ==> [00:00:20.000 --> 00:00:30.000]
export function shiftTimestamps(transcript: string, secondsToShift: number): string {
  function shiftTime(timeString: string, secondsToShift: number): string {
    // Parse time string (HH:MM:SS.mmm)
    const [time, milliseconds] = timeString.split(".")
    const [hours, minutes, seconds] = time.split(":").map(Number)

    // Convert to total milliseconds
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000 + Number(milliseconds)

    // Add shift (convert seconds to milliseconds)
    const shiftedMs = totalMs + secondsToShift * 1000

    // Handle negative results (if shifting backwards past 00:00:00)
    const finalMs = Math.max(0, shiftedMs)

    // Convert back to HH:MM:SS.mmm format
    const newHours = Math.floor(finalMs / 3600000)
    const newMinutes = Math.floor((finalMs % 3600000) / 60000)
    const newSeconds = Math.floor((finalMs % 60000) / 1000)
    const newMilliseconds = Math.floor(finalMs % 1000)

    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}:${newSeconds
      .toString()
      .padStart(2, "0")}.${newMilliseconds.toString().padStart(3, "0")}`
  }

  return transcript.replace(
    /\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]/g,
    (match, startTime, endTime) => {
      const shiftStart = shiftTime(startTime, secondsToShift)
      const shiftEnd = shiftTime(endTime, secondsToShift)
      return `[${shiftStart} --> ${shiftEnd}]`
    }
  )
}

export function removeEmptyLines(text: string): string {
  return text.replace(/\n\n/g, "\n")
}
