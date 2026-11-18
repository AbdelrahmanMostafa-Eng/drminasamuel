import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter-tight";
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { Providers } from "@/components/app/providers";
import { PageLoader } from "@/components/ui/loader";

const url = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "Bioacademy — ACT2 & EST Biology with Dr. Mina Samuel", template: "%s · Bioacademy" },
  description:
    "Premium online Biology courses for American Diploma students preparing for the EST2 and ACT2 Biology tests. Live Zoom sessions, recorded lessons, homework, chapter quizzes and progress analytics.",
  applicationName: "Bioacademy",
  keywords: ["ACT2 Biology", "EST2 Biology", "EST Biology", "American Diploma", "Biology course Egypt", "Dr. Mina Samuel", "Bioacademy"],
  icons: {
    icon: [{ url: "/brand/favicon-48.png", sizes: "48x48" }, { url: "/brand/icon-192.png", sizes: "192x192" }],
    apple: "/brand/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    title: "Bioacademy — ACT2 & EST Biology with Dr. Mina Samuel",
    description: "Live sessions, recorded lessons, homework and quizzes — everything you need to ace ACT2 & EST Biology.",
    images: [{ url: "/brand/icon-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Show the intro loader only on the first page load of a visit */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("ba_loaded"))document.documentElement.classList.add("ba-noloader");else{document.documentElement.dataset.intro="playing";setTimeout(function(){delete document.documentElement.dataset.intro},4500)}}catch(e){}` }} />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <PageLoader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
