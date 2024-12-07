import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Wrapped",
  description:
    "A comprehensive dashboard for analyzing your Spotify listening habits, including charts and statistics for artists, albums, platforms, and listening behavior.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-medium antialiased">{children}</body>
    </html>
  );
}
