-- ================================================================
-- SEED — Datos demo para mostrar a comercios prospecto
--
-- Correr con:
--   psql $DATABASE_URL -f supabase/seed/seed.sql
-- o desde supabase: supabase db reset (lo corre automáticamente si está
-- en supabase/seed.sql).
-- ================================================================

-- Limpiar (cuidado: solo en dev)
truncate table
  public.audit_logs,
  public.reviews,
  public.notifications,
  public.payments,
  public.delivery_tracking,
  public.deliveries,
  public.driver_status,
  public.order_items,
  public.orders,
  public.cart_items,
  public.carts,
  public.promotions,
  public.inventory,
  public.product_modifier_options,
  public.product_modifiers,
  public.products,
  public.product_categories,
  public.store_hours,
  public.store_users,
  public.stores,
  public.categories,
  public.addresses
restart identity cascade;

-- ============ CATEGORIES ============
insert into public.categories (id, slug, name, emoji, bg_class, sort_order, is_active) values
  (gen_random_uuid(), 'comida',       'Comida',         '🍕', 'bg-primary-100', 1, true),
  (gen_random_uuid(), 'supermercado', 'Supermercado',   '🛒', 'bg-warning-100', 2, true),
  (gen_random_uuid(), 'farmacia',     'Farmacia',       '💊', 'bg-accent-100',  3, true),
  (gen_random_uuid(), 'bebidas',      'Bebidas',        '🍺', 'bg-blue-100',    4, true),
  (gen_random_uuid(), 'heladeria',    'Heladería',      '🍦', 'bg-pink-100',    5, true),
  (gen_random_uuid(), 'mascotas',     'Mascotas',       '🐕', 'bg-orange-100',  6, true);

-- ============ STORES ============

-- Pizzería La Esquina
with cat as (select id from public.categories where slug='comida')
insert into public.stores (id, slug, name, description, phone, email, address, lat, lng,
                           category_id, status, min_order_amount, delivery_fee,
                           avg_prep_minutes, accepts_cash, accepts_mp, is_featured,
                           rating_avg, rating_count)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  'pizzeria-la-esquina',
  'Pizzería La Esquina',
  'Las mejores pizzas a la piedra de la ciudad. Receta familiar desde 1985.',
  '+54 9 381 555-0101',
  'lasquinapizza@example.com',
  'Av. San Martín 450',
  -26.8083, -65.2176,
  cat.id, 'active', 0, 0, 30, true, true, true,
  4.8, 240
from cat;

-- Verdulería Don Pepe
with cat as (select id from public.categories where slug='supermercado')
insert into public.stores (id, slug, name, description, phone, email, address, lat, lng,
                           category_id, status, min_order_amount, delivery_fee,
                           avg_prep_minutes, accepts_cash, accepts_mp, is_featured,
                           rating_avg, rating_count)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  'verduleria-don-pepe',
  'Verdulería Don Pepe',
  'Frutas y verduras frescas todos los días. Selección de productos del mercado central.',
  '+54 9 381 555-0102',
  'donpepe@example.com',
  'Belgrano 720',
  -26.8090, -65.2200,
  cat.id, 'active', 1500, 400, 15, true, true, false,
  4.6, 87
from cat;

-- Burger House
with cat as (select id from public.categories where slug='comida')
insert into public.stores (id, slug, name, description, phone, email, address, lat, lng,
                           category_id, status, min_order_amount, delivery_fee,
                           avg_prep_minutes, accepts_cash, accepts_mp, is_featured,
                           rating_avg, rating_count)
select
  '33333333-3333-3333-3333-333333333333'::uuid,
  'burger-house',
  'Burger House',
  'Hamburguesas artesanales con carne 100% Angus. Papas rústicas hechas en casa.',
  '+54 9 381 555-0103',
  'burgerhouse@example.com',
  '25 de Mayo 130',
  -26.8050, -65.2150,
  cat.id, 'active', 0, 600, 35, true, true, true,
  4.7, 156
from cat;

-- Farmacia Central
with cat as (select id from public.categories where slug='farmacia')
insert into public.stores (id, slug, name, description, phone, email, address, lat, lng,
                           category_id, status, min_order_amount, delivery_fee,
                           avg_prep_minutes, accepts_cash, accepts_mp, is_featured,
                           rating_avg, rating_count)
select
  '44444444-4444-4444-4444-444444444444'::uuid,
  'farmacia-central',
  'Farmacia Central',
  'Medicamentos y perfumería. Atención de turno las 24hs.',
  '+54 9 381 555-0104',
  'farmaciacentral@example.com',
  'Plaza Independencia 50',
  -26.8073, -65.2185,
  cat.id, 'active', 0, 500, 20, true, true, false,
  4.9, 312
from cat;

-- Heladería Frutos
with cat as (select id from public.categories where slug='heladeria')
insert into public.stores (id, slug, name, description, phone, email, address, lat, lng,
                           category_id, status, min_order_amount, delivery_fee,
                           avg_prep_minutes, accepts_cash, accepts_mp, is_featured,
                           rating_avg, rating_count)
select
  '55555555-5555-5555-5555-555555555555'::uuid,
  'heladeria-frutos',
  'Heladería Frutos',
  'Helados artesanales de fruta natural. Sin conservantes ni colorantes.',
  '+54 9 381 555-0105',
  'frutos@example.com',
  'Av. Mitre 880',
  -26.8120, -65.2230,
  cat.id, 'active', 1000, 300, 10, true, true, false,
  4.8, 124
from cat;

-- ============ HORARIOS (todas abiertas L-D 11:00-23:30) ============
insert into public.store_hours (store_id, weekday, opens_at, closes_at)
select s.id, d.weekday, '11:00'::time, '23:30'::time
from public.stores s
cross join generate_series(0, 6) as d(weekday);

-- ============ PRODUCT CATEGORIES ============

-- Pizzería
insert into public.product_categories (id, store_id, name, sort_order) values
  ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Pizzas', 1),
  ('aaaa1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Empanadas', 2),
  ('aaaa1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Bebidas', 3);

-- Burger
insert into public.product_categories (id, store_id, name, sort_order) values
  ('bbbb3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Hamburguesas', 1),
  ('bbbb3333-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Acompañamientos', 2),
  ('bbbb3333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Bebidas', 3);

-- ============ PRODUCTS ============

-- Pizzería
insert into public.products (store_id, product_category_id, name, description, price, compare_at_price, is_active, is_available, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000001', 'Muzzarella grande',  'Salsa de tomate, queso muzzarella, oregano. 8 porciones.', 8500, 10500, true, true, 1),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000001', 'Napolitana',         'Tomate fresco, ajo, muzzarella, oregano.',                  9200, null,  true, true, 2),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000001', 'Fugazzeta',          'Cebolla caramelizada, muzzarella, oregano.',                9800, null,  true, true, 3),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000001', 'Especial',           'Jamón, morrones, aceitunas, muzzarella.',                  10500, null,  true, true, 4),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000002', 'Empanada de carne',  'Carne cortada a cuchillo. Unidad.',                          900, null,  true, true, 5),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000002', 'Empanada jamón y queso','Unidad.',                                                850, null,  true, true, 6),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000003', 'Coca-Cola 1.5L',     'Botella retornable.',                                       1800, null,  true, true, 7),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000003', 'Sprite 1.5L',        '',                                                          1800, null,  true, true, 8);

-- Burger House
insert into public.products (store_id, product_category_id, name, description, price, compare_at_price, is_active, is_available, sort_order) values
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000001', 'Classic Burger',     'Carne 180g, queso cheddar, lechuga, tomate, salsa de la casa.',  4800, null, true, true, 1),
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000001', 'Doble Bacon',        'Doble carne 360g, doble queso, panceta crocante, BBQ.',          6900, 7900, true, true, 2),
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000001', 'Veggie Burger',      'Medallon de garbanzos y lentejas. Hummus, tomate, rúcula.',      4500, null, true, true, 3),
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000002', 'Papas rústicas',     'Porción grande. Sal y pimienta.',                                2400, null, true, true, 4),
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000002', 'Aros de cebolla',    '8 aros.',                                                        2200, null, true, true, 5),
  ('33333333-3333-3333-3333-333333333333', 'bbbb3333-0000-0000-0000-000000000003', 'Cerveza artesanal',  'Pinta 500ml. IPA o Golden.',                                     2800, null, true, true, 6);

-- Verdulería
insert into public.products (store_id, name, description, price, is_active, is_available, sort_order) values
  ('22222222-2222-2222-2222-222222222222', 'Tomate kg',     'Tomate redondo seleccionado.', 1200, true, true, 1),
  ('22222222-2222-2222-2222-222222222222', 'Lechuga unidad','Lechuga mantecosa fresca.',     800, true, true, 2),
  ('22222222-2222-2222-2222-222222222222', 'Cebolla kg',    'Cebolla blanca.',               900, true, true, 3),
  ('22222222-2222-2222-2222-222222222222', 'Papa kg',       'Papa lavada.',                  650, true, true, 4),
  ('22222222-2222-2222-2222-222222222222', 'Banana kg',     'Banana ecuatoriana.',          1400, true, true, 5),
  ('22222222-2222-2222-2222-222222222222', 'Manzana kg',    'Manzana roja.',                1800, true, true, 6);

-- ============ PROMOTIONS ============
insert into public.promotions (store_id, code, type, value, min_order_amount, is_active, starts_at, ends_at) values
  ('11111111-1111-1111-1111-111111111111', null,     'percent', 20, 5000, true, now(), now() + interval '30 days'),
  ('33333333-3333-3333-3333-333333333333', null,     'percent', 15, 4000, true, now(), now() + interval '30 days'),
  (null,                                    'BIENVENIDA', 'amount', 500, 3000, true, now(), now() + interval '90 days');
