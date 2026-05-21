# Vadelivery

[![CI](https://github.com/Juanmd14/vadelivery/actions/workflows/ci.yml/badge.svg)](https://github.com/Juanmd14/vadelivery/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-checkout-009EE3?logo=mercadopago&logoColor=white)](https://www.mercadopago.com.ar/developers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

🇺🇸 **English** · [🇪🇸 Español](./README.md)

> 🌐 **Live demo**: [vadelivery.vercel.app](https://vadelivery.vercel.app)

Local delivery marketplace (à la PedidosYa / Rappi) built for a small city.
Stack: **Next.js 14 (App Router) · Supabase · PostgreSQL · TailwindCSS · TypeScript · Vercel**.

## 🖼️ Screenshots

<p align="center">
  <img src="./public/home.webp" alt="Home — store listing" width="32%" />
  <img src="./public/checkout.webp" alt="Checkout — address + payment" width="32%" />
  <img src="./public/tracking.webp" alt="Live order tracking" width="32%" />
</p>

---

## 🚀 Quick start (15 minutes)

### 1. Requirements
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Free [Supabase](https://supabase.com) account
- A test account on [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)

### 2. Install
```bash
pnpm install
cp .env.example .env.local
```

### 3. Create a Supabase project
1. https://supabase.com/dashboard → **New project**
2. Settings → API → copy Project URL, anon key and service_role key into `.env.local`

### 4. Apply the schema
SQL Editor → New query → paste `supabase/schema.sql` → Run.
Then run `supabase/seed/seed.sql` for demo data.

### 5. Configure Auth
- Authentication → Providers → enable **Email** (OTP provider).
- Authentication → URL Configuration → Site URL: `http://localhost:3000`.
- Authentication → Email Templates → optional: translate the copy.

### 6. Configure Mercado Pago
- In the MP developers panel, create an application.
- Copy `MP_ACCESS_TOKEN` and `MP_PUBLIC_KEY` to `.env.local` (use TEST credentials).
- For local webhooks: use **ngrok** (`ngrok http 3000`) and configure `https://XXX.ngrok.io/api/webhooks/mercadopago` in MP → Webhooks → select the "Payments" event.
- Copy the webhook secret into `MP_WEBHOOK_SECRET`.

### 7. Generate types and run
```bash
pnpm db:types
pnpm dev
```

---

## 🧠 Architecture

Design decisions (stack, security, webhook idempotency, realtime, known trade-offs) are documented in [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md).

---

## ✅ Implemented blocks

### Block 1 — Foundation + design
- Full folder structure, route groups
- Design system: coral palette + green accent + stone neutrals, Geist typography
- Complete SQL schema (13 migrations, role-based RLS, idempotent RPC)
- Seed with 5 stores + 25 demo products
- Home, store page (SSR catalog + ISR), 404, error boundary
- Shop components: StoreCard, ProductCard, CategoryPill, PromoBanner

### Block 2 — Auth + Onboarding
- Passwordless login with 6-digit OTP
- Session helpers and RBAC (`getSession`, `requireAuth`, `requireRole`)
- next-safe-action with `action`, `authAction`, `adminAction`
- 5-step store onboarding: data → address → operation → products → publish
- Panel layout with sidebar (desktop) + bottom nav (mobile)
- Server Actions: stores, products

### Block 3 — Cart
- Zustand store persisted in localStorage
- "Single-store cart" logic (switch modal)
- ProductCard with add-to-cart + feedback animation
- Cart page with summary, quantity controls, minimum-order validation
- Sticky CartFloatingButton

### Block 4 — Checkout + Mercado Pago + Tracking
- **Pricing service**: subtotal/total/fee computed server-side
- **createOrderAction**: creates the order using real product prices (does not trust the client)
- **CheckoutForm**: address + payment method + notes, single screen
- **Mercado Pago Service**: creates preference, maps MP status → internal enum
- **MP Webhook**: route handler at `/api/webhooks/mercadopago` that re-queries the payment from MP and applies the update via an idempotent RPC (HMAC verification pending — details in [ARCHITECTURE.md](./docs/ARCHITECTURE.md))
- **RPC `apply_payment_webhook`**: idempotent — updates payment + order + creates delivery
- **OrderTracker**: 5-step visual stepper with animations
- **useOrderRealtime**: hook subscribed to order changes via Supabase Realtime
- **`/pedido/[id]` page**: live tracking + full detail + store contact
- **Store actions**: accept / mark ready / reject order

---

## 🔜 Next blocks

- **Store KDS panel**: Kanban with live orders (Realtime), accept/reject/ready buttons
- **Driver app**: claim available orders, geolocation, status updates
- **Driver tracking on map**: Realtime broadcast client ↔ client
- **Notifications**: transactional email with Resend, web push, WhatsApp confirmation
- **Admin panel**: stores, drivers, finance, commissions
- **Store products page (panel)**: CRUD with drag & drop

---

## 📁 Structure

```
src/
├── app/
│   ├── (auth)/                    Login + signup (OTP)
│   ├── (shop)/                    Consumer marketplace
│   │   ├── page.tsx               Home
│   │   ├── s/[storeSlug]/         Store page
│   │   ├── carrito/
│   │   ├── checkout/              ← block 4
│   │   └── pedido/[id]/           ← block 4 (tracking)
│   ├── (account)/                 Logged-in customer area
│   ├── comercio/
│   │   ├── onboarding/            5 steps
│   │   └── (panel)/               Main panel
│   ├── driver/                    Driver app
│   ├── admin/
│   └── api/webhooks/mercadopago/  ← block 4
│
├── components/
│   ├── ui/                        button, input, label, switch, form-field
│   ├── shop/                      store-card, product-card, category-pill, promo-banner
│   ├── cart/                      cart-floating-button
│   ├── checkout/                  checkout-form ← block 4
│   ├── order/                     order-tracker, order-tracker-live ← block 4
│   ├── store-admin/               onboarding-{stepper,basic,address,operation,products,publish}
│   └── shared/                    shop-header, bottom-nav, login-form
│
├── server/
│   ├── auth/session.ts
│   ├── actions/
│   │   ├── safe-action.ts         clients
│   │   ├── auth.ts
│   │   ├── stores.ts
│   │   ├── products.ts
│   │   └── orders.ts              ← block 4
│   └── services/
│       ├── pricing.service.ts     ← block 4
│       └── mercadopago.service.ts ← block 4
│
├── lib/
│   ├── supabase/                  client, server, admin
│   └── utils.ts
│
├── stores/cart.ts                 Zustand
├── schemas/                       Zod
├── hooks/use-order-realtime.ts    ← block 4
├── styles/globals.css
└── middleware.ts

supabase/
├── migrations/                    13 files
├── schema.sql                     concatenated
├── seed/seed.sql                  5 stores + 25 products
└── config.toml
```

---

## 🔄 End-to-end order flow

1. Customer builds cart → `/checkout`
2. Confirms → `createOrderAction`:
   - Loads real products from the database (does not trust client-side prices)
   - Applies promotion if a code was passed
   - Computes pricing server-side
   - Inserts `orders` + `order_items` + `payments` (status `pending`)
3. If **cash** → status `pending` → store accepts and moves to `preparing`
4. If **Mercado Pago**:
   - Creates a preference with `external_reference = order.id`
   - Redirects to `init_point`
   - Customer pays in MP
   - Webhook `/api/webhooks/mercadopago` receives the notification
   - `getPayment(id)` against MP to confirm the payment (HMAC pending)
   - Calls RPC `apply_payment_webhook` (idempotent):
     - Upsert in `payments` by `mp_payment_id`
     - If `approved` → `orders.payment_status='approved'`, `status='confirmed'`, creates a `deliveries` row
5. Store accepts → `preparing` → `ready`
6. Driver claims → `picked_up` → `delivered` → `completed`
7. Realtime: the customer sees changes on `/pedido/[id]` without refreshing

---

## 🎨 Design system

| Token | Hex | Usage |
|---|---|---|
| `primary-500` | #FF4D3A | Brand |
| `primary-600` | #E63823 | CTAs |
| `accent-500` | #22C55E | Free shipping, success |
| `warning-500` | #F59E0B | % off promos |
| `neutral-900` | #1C1917 | Headings |
| `neutral-500` | #78716C | Secondary text |

Typography: **Geist**. Mobile-first: container `max-w-screen-sm`.

---

## 🔑 Roles

| Role | Can |
|---|---|
| `customer` | Browse, order, see own orders, cancel before acceptance |
| `store_owner` | Everything for their store + accept/reject/mark ready |
| `store_staff` | Whatever is allowed in `store_users` |
| `delivery_driver` | Claim available orders, update statuses |
| `admin` | Everything |

RLS enforces rules at the database level. Critical mutations go through Server Actions with `service_role` after permission validation.

---

## 📦 Scripts

```bash
pnpm dev          # next dev
pnpm build        # next build
pnpm lint
pnpm type-check
pnpm db:types     # regenerates src/types/database.types.ts
pnpm db:seed      # runs seed.sql
```

---

## 🐛 Debugging Mercado Pago

- **Sandbox**: use TEST credentials and the test buyer account (created in MP Developers).
- **Local webhook**: `ngrok http 3000` and paste the HTTPS URL in MP → Webhooks.
- **Idempotency**: delete `payments` rows with the same `mp_payment_id` to reproduce.

---

## 📚 Environment variables

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Vadelivery
NEXT_PUBLIC_SUPABASE_URL=https://XXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MP_ACCESS_TOKEN=TEST-...
MP_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=your_secret
```

---

## 👤 Author

**Juan M.** — Full-stack developer with a product mindset.

- GitHub: [@Juanmd14](https://github.com/Juanmd14)

Built as an end-to-end case study: architecture, data, auth, payments, realtime and UX, keeping the stack scoped to real production tools.

---

## 📄 License

[MIT](./LICENSE) © 2026 Juan M.
