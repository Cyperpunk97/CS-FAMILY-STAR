import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SkipLink from "./components/SkipLink";
import LanguageToggle from "./components/LanguageToggle";

/**
 * Only one family is loaded now. Geist_Mono was downloaded and preloaded on every
 * route and never rendered a single glyph.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CS Family Star — FUE Campus Food Guide & Memories",
    template: "%s · CS Family Star",
  },
  description:
    "Student ratings, prices, distances, and outing memories for cafes, restaurants and campus spots around the Future University in Egypt in New Cairo.",
  applicationName: "CS Family Star",
  keywords: ["FUE", "Future University in Egypt", "New Cairo", "food", "student reviews", "outing memories"],
  openGraph: {
    title: "CS Family Star — FUE Campus Food Guide & Memories",
    description:
      "Student ratings, prices, and outing memories for food spots around the FUE campus.",
    type: "website",
    locale: "en_EG",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#822727",
  width: "device-width",
  initialScale: 1,
  // Not set to 1 — capping zoom stops low-vision users pinching to read.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SkipLink />

        {/*
          Mounted once here rather than per page: it is also what syncs
          `<html lang>` and `<html dir>` when the language changes.
        */}
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 pt-3 sm:px-6">
          <LanguageToggle />
        </div>

        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
