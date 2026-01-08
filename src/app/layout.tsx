import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YCW POS App',
  description: 'Point of Sale Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        {children}
      </body>
    </html>
  )
}
