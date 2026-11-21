import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chart Rewind — The 80s & 90s music quiz",
  description:
    "Guess UK chart hits from 1980 to 1999. Choose a preview length and see how each song ranked.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
