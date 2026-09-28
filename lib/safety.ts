export type Factor = { name: string; value: string; status: "available" | "unavailable"; detail: string };

export function summarizeSafety(factors: Factor[]) {
  const available = factors.filter((factor) => factor.status === "available");
  if (!available.length) return { score: null, label: "Limited data", available: 0, total: factors.length };
  const values = available.map((factor) => Number(factor.value)).filter(Number.isFinite);
  if (!values.length) return { score: null, label: "Limited data", available: available.length, total: factors.length };
  const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return { score, label: score >= 70 ? "Lower estimated risk" : score >= 40 ? "Moderate estimated risk" : "Higher estimated risk", available: available.length, total: factors.length };
}