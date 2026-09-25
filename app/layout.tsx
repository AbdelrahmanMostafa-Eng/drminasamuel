import type { Metadata, Viewport } from "next"
import { Manrope, Sora } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from "@/lib/store"
import { Toaster } from "@/components/ui/sonner"
import { Preloader } from "@/components/premium/preloader"
import "./globals.css"

const fontSans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const fontHeading = Sora({ subsets: ["latin"], variable: "--font-heading", display: "swap" })

export const metadata: Metadata = {
  title: {
    default: "Bioacademy | Dr. Mina Samuel",
    template: "%s | Bioacademy",
  },
  description:
    "Premium biology education for Egyptian students. Live sessions, structured lessons, MCQ quizzes, and personal follow-up with Dr. Mina Samuel.",
  icons: { icon: "/brand/logo.png" },
  openGraph: {
    title: "Bioacademy | Dr. Mina Samuel",
    description: "Master biology with Dr. Mina Samuel. Basics and Advanced courses with live Zoom sessions.",
    images: ["/brand/logo.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a22" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <StoreProvider>
            <Preloader />
            {children}
            <Toaster position="top-center" richColors closeButton />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
