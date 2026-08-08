import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://mandiritokuteiginou.com";
const SITE_TITLE =
  "Mandiri Tokutei Ginou — Jalur Karier SSW Jepang untuk Talenta Indonesia";
const SITE_DESCRIPTION =
  "Mandiri Tokutei Ginou membantu talenta Indonesia siap kerja di Jepang lewat program Specified Skilled Worker (Tokutei Ginou): pelatihan, penempatan, dan pengurusan dokumen.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Mandiri Tokutei Ginou",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Tokutei Ginou",
    "Specified Skilled Worker",
    "kerja di Jepang",
    "SSW Jepang",
    "lowongan kerja Jepang",
    "visa kerja Jepang",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Mandiri Tokutei Ginou",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EmploymentAgency",
  name: "Mandiri Tokutei Ginou",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Sudirman No. 123",
    addressLocality: "Jakarta Selatan",
    addressCountry: "ID",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+62-812-3456-7890",
    contactType: "customer service",
    email: "info@mandiritokuteiginou.id",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
