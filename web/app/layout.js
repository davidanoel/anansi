import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollReveal from '../components/ScrollReveal'

export const metadata = {
  title: 'Anansi Technology Corporation',
  description: 'AI and software for the real world. Finance, intelligence, identity.',
  openGraph: {
    title: 'Anansi Technology Corporation',
    description: 'AI and software for the real world.',
    url: 'https://anansi.tech',
    siteName: 'Anansi',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-anansi-black text-anansi-white font-body min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  )
}
