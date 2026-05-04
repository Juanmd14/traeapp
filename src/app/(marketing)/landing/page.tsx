import Link from "next/link";
import { Bike, Store, Clock, MapPin, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Vadelivery — Pedí lo que quieras, llega rápido",
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

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-600 text-body-xs font-semibold px-3 py-1 rounded-full mb-6">
          <span className="size-1.5 rounded-full bg-primary-500 animate-pulse" />
          Delivery en tu ciudad
        </span>

        <h1 className="text-display-lg sm:text-[3.5rem] sm:leading-[4rem] font-bold text-neutral-900 tracking-tight mb-6 max-w-3xl mx-auto">
          Pedí lo que querés,{" "}
          <span className="text-primary">llega rápido</span>
        </h1>

        <p className="text-body-lg text-neutral-500 max-w-xl mx-auto mb-10">
          Conectamos los mejores comercios de tu ciudad con repartidores de confianza.
          Seguí tu pedido en tiempo real, desde la cocina hasta tu puerta.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-primary text-white font-bold px-8 py-4 rounded-xl text-body-lg hover:bg-primary/90 transition shadow-primary"
          >
            Hacer mi primer pedido
          </Link>
          <Link
            href="/comercio/onboarding"
            className="w-full sm:w-auto bg-white text-neutral-800 font-semibold px-8 py-4 rounded-xl text-body-lg border border-neutral-200 hover:border-neutral-400 transition"
          >
            Sumar mi comercio
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-display-md font-bold text-neutral-900 text-center mb-3">
            Todo lo que necesitás
          </h2>
          <p className="text-body-lg text-neutral-500 text-center mb-12 max-w-lg mx-auto">
            Una plataforma completa para clientes, comercios y repartidores.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-card transition"
                >
                  <div className="size-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-heading-md font-semibold text-neutral-900 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-body-md text-neutral-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA para comercios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="bg-neutral-900 rounded-3xl p-10 sm:p-16 text-center">
          <h2 className="text-display-md font-bold text-white mb-4">
            ¿Tenés un comercio?
          </h2>
          <p className="text-body-lg text-neutral-400 mb-8 max-w-lg mx-auto">
            Unite a Vadelivery y empezá a recibir pedidos hoy.
            Panel de gestión completo, pagos automáticos y soporte 24/7.
          </p>
          <Link
            href="/comercio/onboarding"
            className="inline-flex bg-white text-neutral-900 font-bold px-8 py-4 rounded-xl text-body-lg hover:bg-neutral-100 transition"
          >
            Registrar mi comercio
          </Link>
        </div>
      </section>
    </main>
  );
}
