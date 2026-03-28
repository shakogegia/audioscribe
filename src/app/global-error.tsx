"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: "flex",
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#737373" }}>
              A critical error occurred. Please try again.
            </p>
          </div>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "#171717",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
