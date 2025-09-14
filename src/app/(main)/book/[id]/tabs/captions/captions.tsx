import { Button } from "@/components/ui/button"
import { useTranscript } from "@/hooks/use-transcript"
import { usePlayerStore } from "@/stores/player"
import { SearchResult } from "@/types/api"
import { MaximizeIcon, MinimizeIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"

interface CaptionsProps {
  book: SearchResult
  time: number
}

export function Captions({ book }: CaptionsProps) {
  const { findMergedCaption, fetchTranscript } = useTranscript()
  const [fullScreen, setFullScreen] = useState(false)
  const caption = findMergedCaption(0)

  useEffect(() => {
    if (book.id) {
      fetchTranscript(book.id)
    }
  }, [book.id, fetchTranscript])

  // Enhanced infinite carousel - track more elements for smoother flow
  const [carouselElements, setCarouselElements] = useState([
    { id: "elem1", text: "", segmentId: "", position: -1 }, // position -1 = prev2 (hidden above)
    { id: "elem2", text: "", segmentId: "", position: 0 }, // position 0 = previous
    { id: "elem3", text: "", segmentId: "", position: 1 }, // position 1 = current
    { id: "elem4", text: "", segmentId: "", position: 2 }, // position 2 = next
    { id: "elem5", text: "", segmentId: "", position: 3 }, // position 3 = next2 (hidden below)
  ])

  const [isAnimating, setIsAnimating] = useState(false)
  const [currentSegmentId, setCurrentSegmentId] = useState("")

  // Refs for each carousel element (not positions)
  const elem1Ref = useRef<HTMLDivElement>(null)
  const elem2Ref = useRef<HTMLDivElement>(null)
  const elem3Ref = useRef<HTMLDivElement>(null)
  const elem4Ref = useRef<HTMLDivElement>(null)
  const elem5Ref = useRef<HTMLDivElement>(null)

  const elementRefs = useMemo(
    () => [elem1Ref, elem2Ref, elem3Ref, elem4Ref, elem5Ref],
    [elem1Ref, elem2Ref, elem3Ref, elem4Ref, elem5Ref]
  )

  // Initialize carousel elements on first load
  useEffect(() => {
    if (!currentSegmentId && caption.current?.text) {
      const newElements = [
        {
          id: "elem1",
          text: caption.prev2?.text || "",
          segmentId: caption.prev2?.id?.toString() || "",
          position: -1,
        },
        {
          id: "elem2",
          text: caption.previous?.text || "",
          segmentId: caption.previous?.id?.toString() || "",
          position: 0,
        },
        {
          id: "elem3",
          text: caption.current?.text || "",
          segmentId: caption.current?.id?.toString() || "",
          position: 1,
        },
        { id: "elem4", text: caption.next?.text || "", segmentId: caption.next?.id?.toString() || "", position: 2 },
        { id: "elem5", text: caption.next2?.text || "", segmentId: caption.next2?.id?.toString() || "", position: 3 },
      ]
      setCarouselElements(newElements)
      setCurrentSegmentId(caption.current?.id?.toString() || "")
    }
  }, [caption, currentSegmentId])

  // Get position styles based on position index
  const getPositionStyles = (position: number) => {
    switch (position) {
      case -1: // prev2 (hidden above)
        return {
          transform: "translateY(-110px)", // Start from above, will move down to -80px
          fontSize: "18px",
          fontWeight: "100",
          opacity: "0",
        }
      case 0: // previous
        return {
          transform: "translateY(-80px)", // 80px above center
          fontSize: "20px",
          fontWeight: "400",
          opacity: "0.5",
        }
      case 1: // current
        return {
          transform: "translateY(0px)", // center reference point
          fontSize: "32px",
          fontWeight: "bold",
          opacity: "1",
        }
      case 2: // next
        return {
          transform: "translateY(80px)", // 80px below center
          fontSize: "20px",
          fontWeight: "400",
          opacity: "0.3",
        }
      case 3: // next2 (hidden below)
        return {
          transform: "translateY(110px)", // Start from below, will move up to 80px
          fontSize: "18px",
          fontWeight: "100",
          opacity: "0",
        }
      default:
        return {
          transform: "translateY(-150px)", // Far above for elements that cycle out
          fontSize: "16px",
          fontWeight: "300",
          opacity: "0",
        }
    }
  }

  const animateCarousel = useCallback(() => {
    if (elementRefs.some(ref => !ref.current)) return

    setIsAnimating(true)

    // Move all elements up one position
    const newElements = carouselElements.map(elem => ({
      ...elem,
      position: elem.position - 1,
    }))

    // Find element that moved to position -2 (off screen above) and cycle it to bottom
    const elementToRecycle = newElements.find(elem => elem.position === -2)
    if (elementToRecycle) {
      elementToRecycle.position = 3
      elementToRecycle.text = caption.next2?.text || ""
      elementToRecycle.segmentId = caption.next2?.id?.toString() || ""
    }

    // Animate all elements to their new positions
    newElements.forEach((elem, index) => {
      const ref = elementRefs[index].current
      if (ref) {
        const styles = getPositionStyles(elem.position)
        ref.style.transform = styles.transform
        ref.style.fontSize = styles.fontSize
        ref.style.fontWeight = styles.fontWeight
        ref.style.opacity = styles.opacity

        // Update content for recycled element
        if (elem.position === 3) {
          ref.textContent = elem.text
        }
      }
    })

    setCarouselElements(newElements)
    setIsAnimating(false)
  }, [carouselElements, caption.next2, elementRefs])

  // Detect when content should flow and trigger animation
  useEffect(() => {
    if (isAnimating) return

    const newCurrentId = caption.current?.id?.toString() || ""

    // Check if we have a new current caption
    if (newCurrentId && newCurrentId !== currentSegmentId && currentSegmentId) {
      animateCarousel()
      setCurrentSegmentId(newCurrentId)
    }
  }, [caption.current?.id, isAnimating, currentSegmentId, animateCarousel, caption])

  useEffect(() => {
    // on exit full screen, remove the fullscreen class
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        setFullScreen(false)
      }
    })
  }, [])

  async function toggleFullScreen() {
    // go fullscreen
    if (!fullScreen) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
    setFullScreen(!fullScreen)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"></div>

      <div
        className={twMerge(
          "w-full h-[500px] bg-black text-white rounded-lg overflow-hidden",
          fullScreen && "fixed inset-0 rounded-none w-screen h-screen"
        )}
      >
        <div className="w-full h-full relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullScreen}
            className="hover:bg-neutral-800 hover:text-neutral-200 opacity-5 hover:opacity-100 transition-all duration-300 ease-out absolute top-2 right-2"
          >
            {fullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </Button>

          {/* Carousel Elements - each element moves through positions */}
          {carouselElements.map((elem, index) => {
            const styles = getPositionStyles(elem.position)
            return (
              <div
                key={elem.id}
                ref={elementRefs[index]}
                className="transition-all duration-300 ease-out absolute left-10 right-10 top-1/2"
                style={{
                  transitionProperty: "transform, opacity, font-size, font-weight",
                  transform: `translateY(-50%) ${styles.transform}`,
                  fontSize: styles.fontSize,
                  fontWeight: styles.fontWeight,
                  opacity: styles.opacity,
                }}
              >
                {elem.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
