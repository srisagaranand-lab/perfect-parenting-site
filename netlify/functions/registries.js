import { getDatabase } from "@netlify/database";

const db = getDatabase();

function slugify(name) {
  const base = (name || "family")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST") {
    const body = await req.json();
    const {
      parent_name,
      partner_name,
      baby_name,
      due_date,
      city,
      cover_note,
    } = body;

    if (!parent_name || !parent_name.trim()) {
      return new Response(JSON.stringify({ error: "parent_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = slugify(parent_name);

    const [registry] = await db.sql`
      INSERT INTO registries (slug, parent_name, partner_name, baby_name, due_date, city, cover_note)
      VALUES (${slug}, ${parent_name}, ${partner_name || null}, ${baby_name || null}, ${due_date || null}, ${city || null}, ${cover_note || null})
      RETURNING *
    `;

    return new Response(JSON.stringify(registry), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const slug = url.searchParams.get("slug");
    const q = url.searchParams.get("q");

    if (slug) {
      const [registry] = await db.sql`SELECT * FROM registries WHERE slug = ${slug}`;
      if (!registry) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(registry), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (q) {
      const results = await db.sql`
        SELECT slug, parent_name, partner_name, baby_name, due_date, city
        FROM registries
        WHERE parent_name ILIKE ${"%" + q + "%"} OR partner_name ILIKE ${"%" + q + "%"}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Provide slug or q" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = { path: "/api/registries" };
