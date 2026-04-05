import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architect Office Admin",
  description: "Manage architectural office projects, images, and descriptions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}