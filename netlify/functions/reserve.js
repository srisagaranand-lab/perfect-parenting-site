import { getDatabase } from "@netlify/database";

const db = getDatabase();

function clampText(value, max) {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max) || null;
}

export default async (req) => {
  if (req.method === "POST") {
    const body = await req.json();
    const item_id = Number.isInteger(body.item_id) ? body.item_id : parseInt(body.item_id, 10);
    const guest_name = clampText(body.guest_name, 100);
    const guest_email = clampText(body.guest_email, 200);
    const message = clampText(body.message, 500);

    if (!Number.isInteger(item_id) || !guest_name) {
      return new Response(JSON.stringify({ error: "item_id and guest_name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [item] = await db.sql`SELECT id FROM items WHERE id = ${item_id}`;
    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db.sql`SELECT id FROM reservations WHERE item_id = ${item_id}`;
    if (existing) {
      return new Response(JSON.stringify({ error: "This gift is already reserved by someone else." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [reservation] = await db.sql`
      INSERT INTO reservations (item_id, guest_name, guest_email, message)
      VALUES (${item_id}, ${guest_name}, ${guest_email}, ${message})
      RETURNING id, item_id, guest_name, created_at
    `;

    return new Response(JSON.stringify(reservation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const item_id = parseInt(url.searchParams.get("item_id"), 10);
    const owner_token = clampText(url.searchParams.get("owner_token"), 100);

    if (!Number.isInteger(item_id) || !owner_token) {
      return new Response(JSON.stringify({ error: "item_id and owner_token are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Un-reserving is a destructive action for whichever guest reserved it, so it's
    // restricted to the wishlist owner (proven by owner_token) rather than allowing
    // anyone holding the shareable link to clear other guests' reservations.
    const [row] = await db.sql`
      SELECT i.id FROM items i
      JOIN registries r ON r.id = i.registry_id
      WHERE i.id = ${item_id} AND r.owner_token = ${owner_token}
    `;
    if (!row) {
      return new Response(JSON.stringify({ error: "Not authorized to modify this reservation" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.sql`DELETE FROM reservations WHERE item_id = ${item_id}`;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = {
  path: "/api/reserve",
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
