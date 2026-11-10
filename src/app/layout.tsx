import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Internship Radar",
  description:
    "Discover student internships, hackathons, research programs, scholarships, and competitions matched to your interests.",
  openGraph: {
    title: "Internship Radar",
    description:
      "Discover student internships, hackathons, research programs, scholarships, and competitions matched to your interests.",
    siteName: "Internship Radar",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Internship Radar opportunity discovery" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Internship Radar",
    description:
      "Discover student internships, hackathons, research programs, scholarships, and competitions matched to your interests."
  },
  icons: { icon: "/icon.svg" }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{const t=localStorage.getItem("internship-radar-theme");const d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch{}'
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <footer className="mx-auto max-w-7xl px-5 pb-6 text-xs leading-5 text-muted-foreground sm:px-8">
            Listings are curated, not live. Check the source before applying.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
