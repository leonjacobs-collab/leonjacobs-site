import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leon Jacobs",
  description: "Leon Jacobs — personal site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
