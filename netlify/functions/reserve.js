import { getDatabase } from "@netlify/database";

const db = getDatabase();

export default async (req) => {
  if (req.method === "POST") {
    const body = await req.json();
    const { item_id, guest_name, guest_email, message } = body;

    if (!item_id || !guest_name || !guest_name.trim()) {
      return new Response(JSON.stringify({ error: "item_id and guest_name are required" }), {
        status: 400,
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
      VALUES (${item_id}, ${guest_name}, ${guest_email || null}, ${message || null})
      RETURNING *
    `;

    return new Response(JSON.stringify(reservation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const item_id = url.searchParams.get("item_id");
    if (!item_id) {
      return new Response(JSON.stringify({ error: "item_id is required" }), {
        status: 400,
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

export const config = { path: "/api/reserve" };
