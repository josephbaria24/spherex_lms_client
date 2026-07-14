import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const poppins = localFont({
  src: [
    { path: "../public/fonts/poppins/Poppins-Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Black.ttf", weight: "900", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.className} ${poppins.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Providers>{children}</Providers>
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
