// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Prompt Library - Grey Cells',
  description: 'Browse and explore our collection of AI prompts',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}