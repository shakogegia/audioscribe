import axios from "axios"

export async function sendNotification(
  title: string,
  message: string,
  attachmentBase64?: string | null
): Promise<boolean> {
  try {
    const response = await axios.post("https://api.pushover.net/1/messages.json", {
      token: process.env.PUSHOVER_TOKEN,
      user: process.env.PUSHOVER_USER,
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
