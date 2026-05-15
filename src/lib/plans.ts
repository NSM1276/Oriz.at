// AI caption monthly credit allowance per plan.
// Counter resets on the 1st of each month (handled in increment_ai_credits SQL fn).
export const AI_CREDIT_LIMITS = {
  trial:   5,
  starter: 20,
  pro:     50,
} as const;

export type Plan = keyof typeof AI_CREDIT_LIMITS;

export function limitForPlan(plan: string | null | undefined): number {
  if (plan && plan in AI_CREDIT_LIMITS) {
    return AI_CREDIT_LIMITS[plan as Plan];
  }
  return AI_CREDIT_LIMITS.trial;
}
