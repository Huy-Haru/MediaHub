export const transitions: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["QUOTATION_SENT", "CANCELLED"],
  QUOTATION_SENT: ["QUOTATION_ACCEPTED", "CANCELLED"],
  QUOTATION_ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_REVIEW"],
  WAITING_REVIEW: ["REVISION", "COMPLETED"],
  REVISION: ["WAITING_REVIEW"],
  COMPLETED: [],
  CANCELLED: [],
};
export function canAccess(
  role: string,
  customerId: string | null,
  owner: string,
) {
  return role === "ADMIN" || (role === "CUSTOMER" && customerId === owner);
}
export function canTransition(from: string, to: string) {
  return transitions[from]?.includes(to) ?? false;
}
