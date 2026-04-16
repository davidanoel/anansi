import localFont from "next/font/local";
import { DM_Sans, JetBrains_Mono, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

// const display = Space_Grotesk({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-display",
// });

// const display = Syne({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700", "800"],
//   variable: "--font-display",
// });

// const display = localFont({
//   src: "./fonts/ClashDisplay-Variable.woff2",
//   variable: "--font-display",
// });

const display = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-display",
});

// const body = localFont({
//   src: "./fonts/Satoshi-Variable.woff2",
//   variable: "--font-body",
// });

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Anansi Technology Corporation",
  description: "AI and software for the real world. Finance, intelligence, identity.",
  openGraph: {
    title: "Anansi Technology Corporation",
    description: "AI and software for the real world.",
    url: "https://anansi.tech",
    siteName: "Anansi",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} bg-anansi-black text-anansi-white font-body min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
