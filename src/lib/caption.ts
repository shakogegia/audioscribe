export function findTranscriptLine(
  transcription: string,
  time: number
): { previousLine: string | null; nextLine: string | null; line: string | null } | null {
  const regex = /\[(\d{2}):(\d{2}):(\d{2}\.\d{3}) --> (\d{2}):(\d{2}):(\d{2}\.\d{3})\]\s*(.+)/g;
  const lines: { start: number; end: number; text: string }[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(transcription)) !== null) {
    const [, sh, sm, ss, eh, em, es, text] = match;

    const start = parseInt(sh) * 3600 + parseInt(sm) * 60 + parseFloat(ss);

    const end = parseInt(eh) * 3600 + parseInt(em) * 60 + parseFloat(es);

    lines.push({ start, end, text: text.trim() });
  }

  // Binary search to find the matching line
  let low = 0;
  let high = lines.length - 1;
  let foundIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const line = lines[mid];

    if (time >= line.start && time <= line.end) {
      foundIndex = mid;
      break;
    }
    if (time < line.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  if (foundIndex === -1) {
    return null;
  }

  return {
    previousLine: lines[foundIndex - 1]?.text,
    nextLine: lines[foundIndex + 1]?.text,
    line: lines[foundIndex]?.text,
  };
}
