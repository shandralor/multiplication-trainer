import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Baloo 2 for anything big and loud: headings, scores, button labels.
// Rounded terminals and a heavy weight are what make a number feel like
// a game rather than a worksheet.
const baloo = Baloo_2({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Nunito everywhere else — same rounded family feel, but it stays
// readable at 11px, which Baloo does not.
const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// The app has no monospaced content; the old mono was doing typographic
// work that the rounded family now does. Numerals get `.tabular` instead.
const nunitoNumerals = Nunito({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["600", "700"],
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
    <html lang="nl">
      <body
        className={`${baloo.variable} ${nunito.variable} ${nunitoNumerals.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
