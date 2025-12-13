import { sendNotification } from "@/lib/notification"
import { NextResponse } from "next/server"

export async function GET() {
  const success = await sendNotification("Test Notification", "This is a test notification from AudioScribe")
  if (success) {
    return NextResponse.json({ success: true, message: "Notification sent successfully" })
  } else {
    return NextResponse.json({ success: false, message: "Failed to send notification" })
  }
}
