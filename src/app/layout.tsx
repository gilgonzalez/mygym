
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@fontsource/dseg7-classic/400.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { AuthInitializer } from "@/components/AuthInitializer";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mygymgigo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MyGym · Crea, comparte y ejecuta rutinas de gimnasio",
    template: "%s | MyGym",
  },
  description:
    "MyGym es la plataforma fitness social para crear rutinas profesionales, ejecutar entrenamientos con retos AMRAP, compartir tu progreso y gamificar cada repetición con una biblioteca de más de 2300 ejercicios.",
  keywords: [
    "mygym",
    "rutinas gimnasio",
    "entrenamiento",
    "workout",
    "ejercicios gym",
    "plan de entrenamiento",
    "AMRAP",
    "gamificacion fitness",
    "social network gym",
    "gym rats",
    "crear rutina",
    "retos fitness",
    "progreso gym",
    "ejercicios musculacion",
  ],
  authors: [{ name: "MyGym Team", url: APP_URL }],
  creator: "MyGym",
  publisher: "MyGym",
  category: "Fitness",
  applicationName: "MyGym",
  appLinks: {
    web: {
      url: APP_URL,
      should_fallback: true,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.png"],
  },
  manifest: "/favicon.png",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "MyGym",
    title: "MyGym · Entrena. Comparte. Evoluciona.",
    description:
      "Crea rutinas profesionales, ejecuta entrenamientos con retos AMRAP, comparte tu progreso y gamifica cada repetición. Todo en una sola app.",
    locale: "es_ES",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyGym - Plataforma fitness para crear y compartir rutinas de gimnasio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyGym · Entrena. Comparte. Evoluciona.",
    description:
      "Crea rutinas profesionales, ejecuta entrenamientos con retos AMRAP, comparte tu progreso y gamifica cada repetición.",
    creator: "@mygym",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyGym",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="transition-colors duration-300 ease-in-out">
      <body className={cn("min-h-screen bg-background font-sans antialiased transition-colors duration-300 ease-in-out", inter.className)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <AuthInitializer />
            <QueryProvider>
              {children}
              <Toaster
                richColors
                closeButton
                position="bottom-right"
                toastOptions={{
                  classNames: {
                    toast: 'group-[.toaster]:shadow-lg',
                  },
                }}
              />
            </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
