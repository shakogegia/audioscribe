import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const image = searchParams.get("image")

  if (!image) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 })
  }

  // stream image from image url
  const imageUrl = await fetch(image)
  const imageBlob = await imageUrl.blob()
  const imageStream = new ReadableStream({
    start(controller) {
      const reader = imageBlob.stream().getReader()
      reader.read().then(({ done, value }) => {
        if (done) {
          controller.close()
          return
        }
        controller.enqueue(value)
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close()
            return
          }
          controller.enqueue(value)
        })
      })
    },
  })

  return new NextResponse(imageStream, { headers: { "Content-Type": "image/jpeg" } })
}
