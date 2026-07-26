CREATE TABLE IF NOT EXISTS registries (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  parent_name TEXT NOT NULL,
  partner_name TEXT,
  baby_name TEXT,
  due_date DATE,
  city TEXT,
  cover_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  registry_id INTEGER NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  store TEXT,
  url TEXT,
  price NUMERIC,
  image_url TEXT,
  priority TEXT DEFAULT 'nice-to-have',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_registry ON items(registry_id);
CREATE INDEX IF NOT EXISTS idx_reservations_item ON reservations(item_id);
