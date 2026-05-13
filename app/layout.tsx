import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "./components/SiteNav";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "Leon Jacobs",
    template: "%s — Leon Jacobs",
  },
  description: "Leon Jacobs — personal site & blog",
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

/** Inline script to apply theme before first paint — prevents FOUC */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('leonmay-theme') || 'system';
    var r = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.setAttribute('data-theme', r);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://departuremono.com/assets/DepartureMono-1_422.css"
        />
      </head>
      <body>
        <SiteNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
