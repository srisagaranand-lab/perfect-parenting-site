import { getDatabase } from "@netlify/database";

const db = getDatabase();

const ALLOWED_PRIORITIES = new Set(["must-have", "nice-to-have", "splurge"]);

function clampText(value, max) {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max) || null;
}

function parsePrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000000) return null;
  return n;
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST") {
    const body = await req.json();
    const slug = clampText(body.slug, 100);
    const title = clampText(body.title, 200);
    const owner_token = clampText(body.owner_token, 100);

    if (!slug || !title) {
      return new Response(JSON.stringify({ error: "slug and title are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [registry] = await db.sql`SELECT id, owner_token FROM registries WHERE slug = ${slug}`;
    if (!registry) {
      return new Response(JSON.stringify({ error: "Registry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only the person who created this wishlist (proven by owner_token, issued once at
    // creation and stored client-side) can add items to it. Without this, anyone who
    // has the shareable link could add junk items to someone else's registry.
    if (owner_token !== registry.owner_token) {
      return new Response(JSON.stringify({ error: "Not authorized to edit this wishlist" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = clampText(body.store, 60);
    const item_url = clampText(body.item_url, 2000);
    const image_url = clampText(body.image_url, 2000);
    const notes = clampText(body.notes, 500);
    const price = body.price ? parsePrice(body.price) : null;
    const priority = ALLOWED_PRIORITIES.has(body.priority) ? body.priority : "nice-to-have";

    const [item] = await db.sql`
      INSERT INTO items (registry_id, title, store, url, price, image_url, priority, notes)
      VALUES (${registry.id}, ${title}, ${store}, ${item_url}, ${price}, ${image_url}, ${priority}, ${notes})
      RETURNING id, registry_id, title, store, url, price, image_url, priority, notes, created_at
    `;

    return new Response(JSON.stringify(item), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [registry] = await db.sql`SELECT id FROM registries WHERE slug = ${slug}`;
    if (!registry) {
      return new Response(JSON.stringify({ error: "Registry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const items = await db.sql`
      SELECT i.*, r.id AS reservation_id, r.guest_name
      FROM items i
      LEFT JOIN reservations r ON r.item_id = i.id
      WHERE i.registry_id = ${registry.id}
      ORDER BY i.created_at ASC
    `;

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = {
  path: "/api/items",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
