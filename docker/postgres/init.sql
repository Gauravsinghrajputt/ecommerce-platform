-- Runs once, on first initialisation of the postgres data volume.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE order_status   AS ENUM ('PENDING_PAYMENT','PAID','FAILED','SHIPPED','DELIVERED','CANCELLED','REFUNDED');
CREATE TYPE payment_status AS ENUM ('created','authorized','captured','failed','refunded');
CREATE TYPE user_role      AS ENUM ('customer','admin');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'home-desk' CHECK (category IN ('apparel','bags','home-desk','drinkware')),
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency    CHAR(3) NOT NULL DEFAULT 'INR',
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_active ON products (is_active);
CREATE INDEX idx_products_category ON products (category);

CREATE TABLE carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  status            order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  total_cents       INTEGER NOT NULL CHECK (total_cents >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'INR',
  shipping_address  JSONB,
  idempotency_key   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'PENDING_PAYMENT';
-- One checkout per (user, Idempotency-Key): retries return the same order instead of double-charging stock
CREATE UNIQUE INDEX uq_orders_user_idem ON orders (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  UNIQUE (order_id, product_id)
);

CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  provider     TEXT NOT NULL CHECK (provider IN ('razorpay','stripe')),
  provider_order_id   TEXT UNIQUE NOT NULL,   -- Razorpay order_id (order_xxx)
  provider_payment_id TEXT UNIQUE,            -- Razorpay payment id (pay_xxx), set by webhook
  status       payment_status NOT NULL DEFAULT 'created',
  amount_cents INTEGER NOT NULL,
  currency     CHAR(3) NOT NULL DEFAULT 'INR',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY,                -- the JWT `jti`
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);

-- Idempotency store for payment webhooks (processed by worker-service)
CREATE TABLE webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  payload     JSONB NOT NULL,
  processed   BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_upd BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_upd   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_upd BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed data (prices in paise). created_at is staggered so 'newest first' follows this list.
INSERT INTO products (slug, name, category, description, price_cents, stock, image_url, created_at) VALUES
 ('linen-overshirt', 'Linen Overshirt', 'apparel', 'A relaxed, button-up overshirt with two chest pockets. Wear it open over a tee or buttoned up on its own.', 179900, 12, '/products/linen-overshirt.svg', now() - interval '0 minutes'),
 ('crewneck-sweatshirt', 'Crewneck Sweatshirt', 'apparel', 'A midweight crewneck with ribbed cuffs and hem. Plain on purpose, so it goes with everything.', 129900, 40, '/products/crewneck-sweatshirt.svg', now() - interval '1 minutes'),
 ('classic-tee', 'Classic Cotton Tee', 'apparel', 'Soft 100% cotton t-shirt with a regular fit and a clean crew neck.', 49900, 100, '/products/classic-tee.svg', now() - interval '2 minutes'),
 ('laptop-sleeve', 'Laptop Sleeve', 'bags', 'A slim zip sleeve with a soft lining. Slides into a backpack or tote without adding bulk.', 89900, 35, '/products/laptop-sleeve.svg', now() - interval '3 minutes'),
 ('everyday-tote', 'Everyday Tote', 'bags', 'A roomy canvas tote with two long handles. Fits a laptop, a book and lunch.', 69900, 80, '/products/everyday-tote.svg', now() - interval '4 minutes'),
 ('canvas-backpack', 'Canvas Backpack', 'bags', 'Durable 20L everyday backpack with a zip front pocket and a padded back.', 129900, 50, '/products/canvas-backpack.svg', now() - interval '5 minutes'),
 ('ceramic-planter', 'Ceramic Planter', 'home-desk', 'A small glazed planter for a desk or windowsill. Drainage hole not included; use it as a cover pot.', 54900, 0, '/products/ceramic-planter.svg', now() - interval '6 minutes'),
 ('desk-mat', 'Felt Desk Mat', 'home-desk', 'A large felt mat that covers your keyboard and mouse area and keeps the desk quiet.', 99900, 60, '/products/desk-mat.svg', now() - interval '7 minutes'),
 ('desk-lamp', 'LED Desk Lamp', 'home-desk', 'Dimmable LED lamp with a pivoting arm and USB charging port.', 149900, 4, '/products/desk-lamp.svg', now() - interval '8 minutes'),
 ('insulated-tumbler', 'Insulated Tumbler', 'drinkware', 'A double-wall tumbler with a lid and straw, sized to fit most car cup holders.', 109900, 25, '/products/insulated-tumbler.svg', now() - interval '9 minutes'),
 ('ceramic-mug', 'Ceramic Mug', 'drinkware', 'A sturdy 350ml stoneware mug with a comfortable handle.', 39900, 120, '/products/ceramic-mug.svg', now() - interval '10 minutes'),
 ('steel-bottle', 'Steel Water Bottle', 'drinkware', 'Insulated 750ml stainless steel bottle with a screw cap.', 79900, 75, '/products/steel-bottle.svg', now() - interval '11 minutes');
