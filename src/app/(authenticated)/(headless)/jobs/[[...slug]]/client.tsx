"use client"

import { QueueDashApp } from "@queuedash/ui"
import "@queuedash/ui/dist/styles.css"

// Patch fetch to include credentials for queuedash API requests
if (typeof window !== "undefined") {
  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    if (url.includes("/api/queuedash")) {
      init = { ...init, credentials: "include" }
    }
    return originalFetch.call(this, input, init)
  }
}

export function QueueDashClient() {
  return <QueueDashApp apiUrl="/api/queuedash" basename="/jobs" />
}
