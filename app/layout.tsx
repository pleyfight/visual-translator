import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Visual Translator',
  description: 'Upload images, extract text with OCR, and translate to different languages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}