import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "ExamProctor - Secure Online Examination Platform",
    template: "%s | ExamProctor"
  },
  description: "The most advanced online examination platform with AI-powered proctoring, real-time camera monitoring, tab tracking, and comprehensive cheating detection. Trusted by 500+ institutions worldwide.",
  keywords: [
    "online exam",
    "proctoring",
    "exam platform",
    "anti-cheating",
    "online test",
    "AI proctoring",
    "remote exam",
    "secure exam",
    "camera monitoring",
    "tab detection",
    "education technology"
  ],
  authors: [
    { name: "ExamProctor Team" }
  ],
  creator: "ExamProctor",
  publisher: "ExamProctor",

  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examproctor.com",
    siteName: "ExamProctor",
    title: "ExamProctor - Secure Online Examination Platform",
    description: "AI-powered online examination platform with advanced proctoring features. Real-time monitoring, cheating detection, and comprehensive analytics.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ExamProctor - Secure Online Examination"
      }
    ]
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "ExamProctor - Secure Online Examination Platform",
    description: "AI-powered proctoring for secure online exams. Trusted by 500+ institutions.",
    images: ["/og-image.png"],
    creator: "@examproctor"
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ],
  },

  // Manifest for PWA
  manifest: "/manifest.json",

  // App specific
  applicationName: "ExamProctor",
  category: "Education",
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for Supabase */}
        <link rel="dns-prefetch" href="https://pfpvtdxywjzdihmqsnur.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
