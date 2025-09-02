import { Header } from "@/components/navigation/header";
import AppProviders from "@/context/app-providers";
import { ThemeProvider } from "@/context/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Audiobook Bookmark Wizard",
  description: "A tool to help you configure your bookmarks.",
};

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children, }: Props) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProviders>
            <div className="font-sans flex flex-col min-h-screen">
              <Header />
              <main>{children}</main>
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
