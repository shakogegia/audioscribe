import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AudioScribe",
    short_name: "AudioScribe",
    description: "AudioScribe",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
  }
}
