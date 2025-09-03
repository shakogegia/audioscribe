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

export function removeMilliSeconds(text: string) {
  return text.replace(/(\d{1,2}:\d{2}:\d{2})\.\d{1,3}/g, "$1")
}
