import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Protected sharing is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const { token } = await params;
  if (token.length < 40 || token.length > 100) return NextResponse.json({ error: "Invalid sharing link." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from("location_sharing_sessions").select("latitude,longitude,expires_at").eq("token_hash", tokenHash).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "This sharing session has expired or been stopped." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ lat: data.latitude, lon: data.longitude, expires_at: data.expires_at }, { headers: { "Cache-Control": "no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}