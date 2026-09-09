import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

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
    default: "CS Family Star — FUE Campus Food Guide",
    template: "%s · CS Family Star",
  },
  description:
    "Student ratings, prices, distances and directions for 100 cafes, restaurants and fast food spots around the Future University in Egypt campus in New Cairo.",
  applicationName: "CS Family Star",
  keywords: ["FUE", "Future University in Egypt", "New Cairo", "food", "student reviews"],
  openGraph: {
    title: "CS Family Star — FUE Campus Food Guide",
    description:
      "Student ratings, prices and directions for 100 food spots around the FUE campus.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* First tab stop, so keyboard users can jump the header and filters. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
