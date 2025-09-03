import { clsx, type ClassValue } from "clsx"
import { tmpdir } from "os"
import { join } from "path"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const tempFolder = join(tmpdir(), "audiobook-wizard")
