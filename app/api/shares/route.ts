import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const admin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
};
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function getOwner(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export async function POST(request: NextRequest) {
  const user = await getOwner(request);
  const client = admin();
  if (!user) return NextResponse.json({ error: "Sign in to start a private location share." }, { status: 401 });
  if (!client) return NextResponse.json({ error: "Server-side sharing is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const location = body?.location;
  if (!Array.isArray(location) || location.length !== 2 || !location.every((n: unknown) => typeof n === "number" && Number.isFinite(n))) return NextResponse.json({ error: "A valid current location is required." }, { status: 400 });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { error } = await client.from("location_sharing_sessions").insert({ owner_id: user.id, token_hash: digest(token), latitude: location[0], longitude: location[1], expires_at: expiresAt });
  if (error) return NextResponse.json({ error: "Could not create sharing session. Check the database schema." }, { status: 500 });
  return NextResponse.json({ token, expiresAt }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const user = await getOwner(request);
  const client = admin();
  if (!user) return NextResponse.json({ error: "Sign in to update this session." }, { status: 401 });
  if (!client) return NextResponse.json({ error: "Server-side sharing is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const location = body?.location;
  if (typeof body?.token !== "string" || !Array.isArray(location) || location.length !== 2 || !location.every((n: unknown) => typeof n === "number" && Number.isFinite(n))) return NextResponse.json({ error: "Invalid session update." }, { status: 400 });
  const { error } = await client.from("location_sharing_sessions").update({ latitude: location[0], longitude: location[1], updated_at: new Date().toISOString() }).eq("owner_id", user.id).eq("token_hash", digest(body.token)).gt("expires_at", new Date().toISOString());
  if (error) return NextResponse.json({ error: "Could not update location." }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  const user = await getOwner(request);
  const client = admin();
  if (!user) return NextResponse.json({ error: "Sign in to stop this session." }, { status: 401 });
  if (!client) return NextResponse.json({ error: "Server-side sharing is not configured." }, { status: 503 });
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  const { error } = await client.from("location_sharing_sessions").delete().eq("owner_id", user.id).eq("token_hash", digest(token));
  if (error) return NextResponse.json({ error: "Could not stop session." }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}