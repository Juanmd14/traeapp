import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "DeliveryLocal — Pedí lo que quieras, llega rápido",
    template: "%s · DeliveryLocal",
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
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
