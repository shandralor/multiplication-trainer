import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Numerals that read like a dial: fractions, scores, safe combinations.
const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Tafel Trainer",
  description: "Oefen tafels, delen en breuken — en kraak de kluis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The vault is a night world: dark is the app's only theme, so the
    // class is set here rather than toggled.
    <html lang="nl" className="dark">
      <body
        className={`${bricolage.variable} ${geistSans.variable} ${plexMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
