import { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Ayuda — Vadelivery",
  description: "Encontrá respuestas a las preguntas más frecuentes sobre Vadelivery.",
};

const faqs: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Inicio de sesión",
    items: [
      {
        q: "No puedo iniciar sesión, ¿qué hago?",
        a: "Verificá que el email y la contraseña sean correctos. Si olvidaste tu contraseña, usá la opción '¿Olvidaste tu contraseña?' en la pantalla de login para recibir un link de recuperación en tu email.",
      },
      {
        q: "No me llega el código de verificación",
        a: "Revisá tu carpeta de spam o correo no deseado. El código tarda hasta 2 minutos. Si pasaron más de 5 minutos, podés pedir un reenvío desde la misma pantalla.",
      },
      {
        q: "Quiero cambiar mi contraseña",
        a: "Podés cambiarla desde la pantalla de login usando '¿Olvidaste tu contraseña?'. Te enviaremos un link seguro a tu email registrado.",
      },
      {
        q: "¿Puedo iniciar sesión con Google?",
        a: "Sí. En la pantalla de login encontrás el botón 'Continuar con Google'. Usará el email de tu cuenta de Google.",
      },
    ],
  },
  {
    category: "Mis pedidos",
    items: [
      {
        q: "¿Cómo sigo mi pedido en tiempo real?",
        a: "Una vez confirmado el pedido, vas a ver el estado actualizado en la sección 'Mis pedidos'. Cuando el repartidor salga, podés seguirlo en el mapa en vivo.",
      },
      {
        q: "Mi pedido tardó demasiado, ¿qué hago?",
        a: "Podés contactarnos por email a vadelivery2026@gmail.com indicando el número de pedido. Revisamos cada caso y te respondemos a la brevedad.",
      },
      {
        q: "Quiero cancelar mi pedido",
        a: "Los pedidos pueden cancelarse mientras están en estado 'Pendiente'. Una vez que el comercio lo confirmó, la cancelación queda sujeta a su política.",
      },
    ],
  },
  {
    category: "Pagos y precios",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos todos los medios disponibles en Mercado Pago: tarjetas de crédito y débito, dinero en cuenta MP y cuotas sin interés según el banco.",
      },
      {
        q: "¿Por qué se rechazó mi pago?",
        a: "Puede ser por fondos insuficientes, datos incorrectos o una restricción de tu banco. Revisá los datos de la tarjeta o intentá con otro método.",
      },
      {
        q: "¿Cuánto cuesta el envío?",
        a: "El costo de envío varía según la distancia y el comercio. Lo ves antes de confirmar el pedido, sin sorpresas.",
      },
    ],
  },
  {
    category: "Para repartidores",
    items: [
      {
        q: "¿Cómo me sumo como repartidor?",
        a: "Creá una cuenta desde el botón 'Registrarse'. Una vez dentro, podés solicitar unirte como repartidor y un administrador activará tu perfil.",
      },
      {
        q: "¿Cómo funciona la app para repartidores?",
        a: "Desde tu panel podés ver los pedidos disponibles, aceptarlos, actualizar el estado y ver tu historial de entregas. Todo en tiempo real.",
      },
    ],
  },
];

export default function AyudaPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          ¿En qué podemos ayudarte?
        </h1>
        <p className="text-body-lg text-neutral-500 dark:text-neutral-400">
          Encontrá respuestas a las preguntas más frecuentes.
        </p>
      </div>

      {/* FAQ por categoría */}
      <div className="space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none text-body-md font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    {item.q}
                    <span className="flex-shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pt-1 text-body-md text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contacto */}
      <div className="mt-16 rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-8 text-center">
        <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          ¿No encontraste lo que buscabas?
        </h3>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mb-5">
          Escribinos y te respondemos a la brevedad.
        </p>
        <a
          href="mailto:vadelivery2026@gmail.com"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition"
        >
          <Mail className="size-4" />
          vadelivery2026@gmail.com
        </a>
      </div>
    </main>
  );
}
