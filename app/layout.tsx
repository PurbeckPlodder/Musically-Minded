import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chart Rewind — The 80s music quiz",
  description:
    "Guess the UK chart hits from the 1980s. Hear an official 30-second preview and see how each song ranked.",
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
