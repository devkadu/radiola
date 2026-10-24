export function isAdminUser(
  userId: string | null | undefined,
  adminUserId: string | undefined,
): boolean {
  return Boolean(userId && adminUserId?.trim() && userId === adminUserId);
}
