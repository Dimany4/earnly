import { NextResponse, type NextRequest } from "next/server";
import { cleanText } from "@/lib/auth";
import { db, databaseConfigured } from "@/lib/db";
import { getSession } from "@/lib/session";
import { COUNTRIES, searchUniversities, type University } from "@/lib/universities";
import { assertSameOrigin, CsrfError } from "@/lib/csrf";

export const dynamic = "force-dynamic";

async function customUniversities(): Promise<University[]> {
  if (!databaseConfigured) return [];
  try {
    const rows = (await db()`
      select id, name, country, city from custom_universities order by name limit 500
    `) as { id: string; name: string; country: string; city: string | null }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      city: r.city ?? "",
      region: "Africa" as University["region"],
    }));
  } catch (error) {
    console.error("[earnly] custom university lookup failed", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const customs = await customUniversities();
  return NextResponse.json({
    results: searchUniversities(q, customs),
    countries: COUNTRIES,
    custom: customs,
  });
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch (e) {
    if (e instanceof CsrfError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  if (!databaseConfigured) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to add a university." }, { status: 401 });

  let body: { name?: unknown; country?: unknown; city?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const name = cleanText(body.name, 160);
  const country = cleanText(body.country, 80);
  const city = cleanText(body.city, 80) ?? null;
  if (!name || name.length < 3) {
    return NextResponse.json({ error: "Enter the full name of your university." }, { status: 400 });
  }
  if (!country) {
    return NextResponse.json({ error: "Select the country your university is in." }, { status: 400 });
  }

  const id = `c-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;
  try {
    const rows = (await db()`
      insert into custom_universities (id, name, country, city, created_by)
      values (${id}, ${name}, ${country}, ${city}, ${session.id})
      on conflict (id) do update set name = excluded.name
      returning id, name, country, city
    `) as { id: string; name: string; country: string; city: string | null }[];
    const row = rows[0];
    return NextResponse.json({
      university: { id: row.id, name: row.name, country: row.country, city: row.city ?? "", region: "Africa" },
    });
  } catch (error) {
    console.error("[earnly] custom university insert failed", error);
    return NextResponse.json({ error: "We could not save that university." }, { status: 500 });
  }
}
