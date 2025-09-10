import { Header } from "@/components/navigation/header"
import AppProviders from "@/context/app-providers"
import { ThemeProvider } from "@/context/theme-provider"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProviders>
            <div className="font-sans min-h-screen">
              <Header />
              <main>{children}</main>
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
