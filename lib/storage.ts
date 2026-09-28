import { supabase } from "@/lib/supabase";

export async function listRecords<T>(table: string, key: string): Promise<T[]> {
  if (supabase) {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as T[];
  }
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

export async function saveRecord<T extends Record<string, unknown>>(table: string, key: string, value: T): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(table).insert(value);
    if (error) throw error;
    return;
  }
  const records = await listRecords<T>(table, key);
  localStorage.setItem(key, JSON.stringify([{ ...value, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...records]));
}

export async function deleteRecord(table: string, key: string, id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const records = await listRecords<Record<string, unknown> & { id: string }>(table, key);
  localStorage.setItem(key, JSON.stringify(records.filter((record) => record.id !== id)));
}