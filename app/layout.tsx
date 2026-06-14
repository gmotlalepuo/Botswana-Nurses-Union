import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { FeedbackToast } from "@/components/feedback-toast"
import { FormSubmitLoading } from "@/components/form-submit-loading"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "BONU Member Services Platform",
  description:
    "Digital self-service and back-office platform for Botswana Nurses Union services, subscriptions, payments, and case processing.",
  generator: "BONU Member Services Platform",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <FormSubmitLoading />
        <FeedbackToast />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
