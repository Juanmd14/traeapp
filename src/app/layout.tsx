import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vadelivery — Pedí lo que quieras, llega rápido",
    template: "%s · Vadelivery",
  },
  description: "El delivery de tu ciudad. Comercios locales, repartidores propios.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FF4D3A",
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
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