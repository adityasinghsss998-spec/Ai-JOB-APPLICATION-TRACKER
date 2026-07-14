export const PLAN_LIMITS = {
  Free: 0,
  Pro: 50,
  Unlimited: 9999,
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimit(planName: string | null | undefined): number {
  if (!planName) return PLAN_LIMITS.Free;
  
  // Normalize key casing (e.g., "pro" -> "Pro")
  const normalized = planName.trim();
  const formatted = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  
  return PLAN_LIMITS[formatted as PlanType] ?? PLAN_LIMITS.Free;
}
