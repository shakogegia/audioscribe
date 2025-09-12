declare module "audioconcat" {
  interface AudioConcat {
    concat(outputPath: string): AudioConcat
    on(event: "start", callback: (command: string) => void): AudioConcat
    on(event: "error", callback: (err: Error, stdout: string, stderr: string) => void): AudioConcat
    on(event: "end", callback: (output: string) => void): AudioConcat
  }

  function audioconcat(files: string[]): AudioConcat
  export = audioconcat
}
