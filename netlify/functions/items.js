import { getDatabase } from "@netlify/database";

const db = getDatabase();

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST") {
    const body = await req.json();
    const { slug, title, store, item_url, price, image_url, priority, notes } = body;

    if (!slug || !title) {
      return new Response(JSON.stringify({ error: "slug and title are required" }), {
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

    const [item] = await db.sql`
      INSERT INTO items (registry_id, title, store, url, price, image_url, priority, notes)
      VALUES (${registry.id}, ${title}, ${store || null}, ${item_url || null}, ${price || null}, ${image_url || null}, ${priority || "nice-to-have"}, ${notes || null})
      RETURNING *
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

export const config = { path: "/api/items" };
