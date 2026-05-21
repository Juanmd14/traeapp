import Link from "next/link";
import { Bike, Store, Clock, MapPin, ShieldCheck, Zap, Star } from "lucide-react";

export const metadata = {
  title: "Vadelivery — Pedí lo que quieras, llega rápido",
  description:
    "Conectamos los mejores comercios de tu ciudad con repartidores de confianza. Seguí tu pedido en tiempo real.",
  openGraph: {
    title: "Vadelivery — Delivery en tu ciudad",
    description: "Pedí a los mejores comercios locales. Rápido, fácil y seguro.",
    siteName: "Vadelivery",
  },
};

const features = [
  {
    icon: Zap,
    title: "Pedidos al instante",
    desc: "Confirmación en segundos y seguimiento en tiempo real desde que confirmás hasta la puerta.",
  },
  {
    icon: Store,
    title: "Comercios locales",
    desc: "Apoyá los negocios de tu ciudad. Más opciones, más frescas, más cercanas.",
  },
  {
    icon: MapPin,
    title: "Mapa en vivo",
    desc: "Seguí a tu repartidor en el mapa. Sabés exactamente dónde está en todo momento.",
  },
  {
    icon: Bike,
    title: "Repartidores propios",
    desc: "Nuestros repartidores son parte del equipo. Entregas confiables y bien pagas.",
  },
  {
    icon: Clock,
    title: "Siempre puntual",
    desc: "Horario estimado de entrega desde que hacés el pedido. Sin sorpresas.",
  },
  {
    icon: ShieldCheck,
    title: "Pagos seguros",
    desc: "Pagá con Mercado Pago o en efectivo. Tu plata siempre protegida.",
  },
];

const steps = [
  {
    number: "01",
    title: "Elegí tu comercio",
    desc: "Explorá los negocios disponibles cerca tuyo — pizzerías, heladerías, supermercados y más.",
    emoji: "🏪",
  },
  {
    number: "02",
    title: "Armá tu pedido",
    desc: "Personalizá cada producto, aplicá promociones y elegí cómo querés pagar.",
    emoji: "🛒",
  },
  {
    number: "03",
    title: "Seguílo en el mapa",
    desc: "Ve en tiempo real dónde está tu repartidor. Llega en minutos, no en sorpresas.",
    emoji: "📍",
  },
];

const metrics = [
  { value: "12+", label: "Comercios activos" },
  { value: "1.200+", label: "Pedidos procesados" },
  { value: "4.8", label: "Calificación promedio", star: true },
  { value: "~25 min", label: "Tiempo de entrega" },
];

const testimonials = [
  {
    name: "Claudia R.",
    role: "Cliente frecuente",
    text: "Me encanta ver en el mapa exactamente dónde está mi pedido. Nunca más llamé al local para preguntar.",
    rating: 5,
  },
  {
    name: "Marcelo T.",
    role: "Dueño de pizzería",
    text: "El panel de gestión es clarísimo. Los pedidos llegan organizados y el KDS me cambió la operación.",
    rating: 5,
  },
  {
    name: "Sofía G.",
    role: "Repartidora",
    text: "La app de repartidor es muy intuitiva. Veo los pedidos disponibles, los acepto y listo.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Fondo con gradiente sutil */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-white dark:from-primary-900/10 dark:via-neutral-950 dark:to-neutral-950 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100 rounded-full opacity-40 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 text-body-xs font-semibold px-3 py-1 rounded-full mb-6 border border-primary-100 dark:border-primary-800/40">
            <span className="size-1.5 rounded-full bg-primary-500 animate-pulse" />
            Delivery en tu ciudad
          </span>

          <h1 className="text-display-lg sm:text-[3.5rem] sm:leading-[4rem] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-6 max-w-3xl mx-auto">
            Pedí lo que querés,{" "}
            <span className="text-primary">llega rápido</span>
          </h1>

          <p className="text-body-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-10">
            Conectamos los mejores comercios de tu ciudad con repartidores de confianza.
            Seguí tu pedido en tiempo real, desde la cocina hasta tu puerta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/registro"
              className="w-full sm:w-auto bg-primary text-white font-bold px-8 py-4 rounded-xl text-body-lg hover:bg-primary-600 transition shadow-primary"
            >
              Hacer mi primer pedido
            </Link>
            <Link
              href="/comercio/onboarding"
              className="w-full sm:w-auto bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold px-8 py-4 rounded-xl text-body-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition"
            >
              Sumar mi comercio
            </Link>
          </div>

          {/* Métricas de trayectoria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur rounded-xl border border-neutral-200 dark:border-neutral-700 py-4 px-3">
                <p className="text-heading-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1">
                  {m.value}
                  {m.star && <Star className="size-5 text-warning fill-warning" />}
                </p>
                <p className="text-body-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Tres pasos, sin complicaciones
            </h2>
            <p className="text-body-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
              De querer algo a tenerlo en casa, en minutos.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Línea conectora (solo desktop) */}
            <div
              aria-hidden
              className="hidden sm:block absolute top-9 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent"
            />

            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="size-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-100 dark:border-primary-800/40 flex items-center justify-center text-2xl">
                    {step.emoji}
                  </div>
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-label font-bold w-6 h-6 rounded-full flex items-center justify-center text-[10px]">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-body-md text-neutral-500 dark:text-neutral-400 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 dark:bg-neutral-950 border-y border-neutral-100 dark:border-neutral-800 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Todo lo que necesitás
            </h2>
            <p className="text-body-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
              Una plataforma completa para clientes, comercios y repartidores.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-card hover:border-neutral-300 dark:hover:border-neutral-600 transition group"
                >
                  <div className="size-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-body-md text-neutral-500 dark:text-neutral-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonios ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Lo que dicen los usuarios
            </h2>
            <p className="text-body-lg text-neutral-500 dark:text-neutral-400">
              Clientes, comercios y repartidores hablan por nosotros.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-card"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-body-md text-neutral-700 dark:text-neutral-300 mb-5 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.name}</p>
                  <p className="text-body-xs text-neutral-400 dark:text-neutral-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para comercios ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-neutral-900 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
          {/* Decoración */}
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 bg-primary-500/20 text-primary-300 text-body-xs font-semibold px-3 py-1 rounded-full mb-6">
              Para comercios
            </span>
            <h2 className="text-display-md font-bold text-white mb-4">
              ¿Tenés un comercio?
            </h2>
            <p className="text-body-lg text-neutral-400 mb-3 max-w-lg mx-auto">
              Unite a Vadelivery y empezá a recibir pedidos hoy.
            </p>
            <ul className="text-body-md text-neutral-400 space-y-1 mb-8">
              <li>✓ Panel de gestión completo con KDS en tiempo real</li>
              <li>✓ Pagos automáticos con Mercado Pago</li>
              <li>✓ Estadísticas de ventas y productos más vendidos</li>
            </ul>
            <Link
              href="/comercio/onboarding"
              className="inline-flex bg-white text-neutral-900 font-bold px-8 py-4 rounded-xl text-body-lg hover:bg-neutral-100 transition"
            >
              Registrar mi comercio gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
