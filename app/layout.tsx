import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F8 Office Admin",
  description: "Manage architectural office projects, images, and descriptions.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.png",
    apple: "/apple.png" 
  },


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