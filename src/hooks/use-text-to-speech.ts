"use client"

import { useCallback, useEffect, useState } from "react"

interface UseTextToSpeechReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports speech synthesis
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) {
        console.warn("Speech synthesis not supported or empty text provided")
        return
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel()

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure voice settings
      utterance.rate = 1.0 // Normal speed
      utterance.pitch = 1.0 // Normal pitch
      utterance.volume = 1.0 // Full volume

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = error => {
        console.error("Speech synthesis error:", error)
        setIsSpeaking(false)
      }

      // Start speaking
      window.speechSynthesis.speak(utterance)
    },
    [isSupported]
  )

  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  }
}
