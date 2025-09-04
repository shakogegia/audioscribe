import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// TODO: this is only for development purposes, remove it in the future
export const cleanUpTempFiles = process.env.CLEANUP_TEMP_FILES !== "false"
