import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Anansi Technology Corporation',
  description: 'Caribbean intelligence, global reach. Building technology that unlocks trapped value — starting with real-world assets, expanding into AI, education, and culture.',
  openGraph: {
    title: 'Anansi Technology Corporation',
    description: 'Caribbean intelligence, global reach.',
    url: 'https://anansi.tech',
    siteName: 'Anansi',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-anansi-cream text-anansi-black min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
