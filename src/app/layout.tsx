import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vadelivery.vercel.app"
  ),
  title: {
    default: "Trae App — Pedí lo que quieras, llega rápido",
    template: "%s · Trae App",
  },
  description:
    "El delivery de tu ciudad. Comercios locales, repartidores propios.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Trae App",
    title: "Trae App — Marketplace de delivery local",
    description:
      "Auth OTP, RLS en Postgres, checkout con Mercado Pago y tracking realtime. Next.js + Supabase + Mercado Pago.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trae App — Marketplace de delivery local",
    description:
      "Next.js + Supabase + Mercado Pago. Checkout integrado y tracking realtime.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF4D29",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-AR"
      className={`${GeistSans.variable} ${GeistMono.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}