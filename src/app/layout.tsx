import { Header } from "@/components/navigation/header"
import AppProviders from "@/context/app-providers"
import { ThemeProvider } from "@/context/theme-provider"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#262626" },
  ],
}

export const metadata: Metadata = {
  title: "AudioScribe",
  description: "Audiobook companion app for Audiobookshelf",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/favicon/favicon-black.png",
        href: "/favicon/favicon-black.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/favicon/favicon-white.png",
        href: "/favicon/favicon-white.png",
      },
    ],
  },
}

type Props = Readonly<{ children: React.ReactNode }>

export default async function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geistSans.variable, geistMono.variable)}>
      <body className="antialiased h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProviders>
            <div className="font-sans min-h-screen">{children}</div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
