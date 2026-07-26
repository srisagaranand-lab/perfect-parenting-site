import { getDatabase } from "@netlify/database";

const db = getDatabase();

function slugify(name) {
  const base = (name || "family")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  // 10 random bytes as base36 gives a slug suffix that isn't practically guessable/brute-forceable
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const suffix = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
  return `${base}-${suffix}`;
}

function generateOwnerToken() {
  return crypto.randomUUID();
}

// Basic per-field length guards so a single request can't stuff huge payloads into the DB
function clampText(value, max) {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max) || null;
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST") {
    const body = await req.json();
    const parent_name = clampText(body.parent_name, 80);
    const partner_name = clampText(body.partner_name, 80);
    const baby_name = clampText(body.baby_name, 80);
    const city = clampText(body.city, 80);
    const cover_note = clampText(body.cover_note, 1000);
    // due_date only accepted if it parses as a real date, to avoid junk being stored
    const due_date = body.due_date && !isNaN(Date.parse(body.due_date)) ? body.due_date : null;

    if (!parent_name) {
      return new Response(JSON.stringify({ error: "parent_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = slugify(parent_name);
    const owner_token = generateOwnerToken();

    const [registry] = await db.sql`
      INSERT INTO registries (slug, owner_token, parent_name, partner_name, baby_name, due_date, city, cover_note)
      VALUES (${slug}, ${owner_token}, ${parent_name}, ${partner_name}, ${baby_name}, ${due_date}, ${city}, ${cover_note})
      RETURNING id, slug, parent_name, partner_name, baby_name, due_date, city, cover_note, created_at
    `;

    // owner_token is only ever returned here, at creation time — the client must store it
    // (e.g. localStorage) to prove ownership on future writes. It is never included in
    // any GET response, so it can't be scraped by guests browsing a wishlist link.
    return new Response(JSON.stringify({ ...registry, owner_token }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const slug = url.searchParams.get("slug");
    const q = url.searchParams.get("q");

    if (slug) {
      const [registry] = await db.sql`
        SELECT id, slug, parent_name, partner_name, baby_name, due_date, city, cover_note, created_at
        FROM registries WHERE slug = ${slug}
      `;
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

export const config = {
  path: "/api/registries",
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
