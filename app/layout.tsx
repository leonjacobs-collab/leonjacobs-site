import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "./components/SiteNav";

export const metadata: Metadata = {
  title: {
    default: "Leon Jacobs",
    template: "%s — Leon Jacobs",
  },
  description: "Leon Jacobs — personal site & blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://departuremono.com/assets/DepartureMono-1_422.css"
        />
      </head>
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
