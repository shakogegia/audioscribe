import axios from "axios"
import { load } from "./config"

export async function sendNotification(
  title: string,
  message: string,
  attachmentBase64?: string | null
): Promise<boolean> {
  try {
    const config = await load()
    if (!config.pushover.token || !config.pushover.user) {
      return false
    }
    const response = await axios.post("https://api.pushover.net/1/messages.json", {
      token: config.pushover.token,
      user: config.pushover.user,
      title,
      message,
      ...(attachmentBase64
        ? {
            attachment_base64: attachmentBase64,
            attachment_type: "image/png",
          }
        : {}),
    })
    return response.status === 200
  } catch (error) {
    console.error("Failed to send notification:", error)
    return false
  }
}
