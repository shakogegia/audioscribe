"use client"

import { QueueDashApp } from "@queuedash/ui"
import "@queuedash/ui/dist/styles.css"

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/queuedash`
  }

  return `http://localhost:${process.env.PORT ?? 3000}/api/queuedash`
}

export default function QueueDashPages() {
  return <QueueDashApp apiUrl={getBaseUrl()} basename="/jobs" />
}
