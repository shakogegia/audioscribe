"use client"

import axios from "axios"
import { useCallback, useEffect, useRef, useState } from "react"

interface UseTextToSpeechReturn {
  speak: (bookId: string, text: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
  isGenerating: boolean
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (bookId: string, text: string) => {
    if (!text.trim()) {
      console.warn("Empty text provided for TTS")
      return
    }

    try {
      setIsGenerating(true)

      // Call API to generate TTS audio
      const response = await axios.post(`/api/book/${bookId}/tts/generate`, {
        text,
      })

      const { audioId } = response.data

      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio()

        // Set up event listeners
        audioRef.current.onplay = () => {
          setIsSpeaking(true)
          setIsGenerating(false)
        }

        audioRef.current.onended = () => {
          setIsSpeaking(false)
        }

        audioRef.current.onerror = error => {
          console.error("Audio playback error:", error)
          setIsSpeaking(false)
          setIsGenerating(false)
        }

        audioRef.current.onpause = () => {
          setIsSpeaking(false)
        }
      }

      // Set audio source and play
      audioRef.current.src = `/api/book/${bookId}/tts/${audioId}`
      await audioRef.current.play()
    } catch (error) {
      console.error("TTS generation error:", error)
      setIsGenerating(false)
      setIsSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSpeaking(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isGenerating,
  }
}
