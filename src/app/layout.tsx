import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr"),
  title: "YogaOps - Yoga femmes, en ligne, sur place et entreprise",
  description:
    "Yoga pour femmes: gestion du stress, soulagement du dos, seances en ligne, sur place et yoga sur chaise en entreprise.",
  openGraph: {
    title: "YogaOps - Yoga femmes, en ligne, sur place et entreprise",
    description:
      "Seances de yoga pour femmes: bien-etre, mal de dos, stress au travail et interventions en entreprise.",
    type: "website",
    locale: "fr_FR",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "YogaOps - Yoga femmes, en ligne, sur place et entreprise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YogaOps - Yoga femmes, en ligne, sur place et entreprise",
    description:
      "Seances de yoga pour femmes: bien-etre, mal de dos, stress au travail et interventions en entreprise.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
