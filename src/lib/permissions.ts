/**
 * Helper to determine if a given user is "ASE Juan" (exclusive privilege).
 * Uses immutable database ID and verified ADMIN role rather than user-editable discord_name substrings.
 */
export function isJuanUser(
  user: { id?: string; username?: string; discord_name?: string; role?: string } | null | undefined
): boolean {
  if (!user) return false;
  const uName = (user.username || '').toLowerCase();

  return (
    user.id === 'cmrx0bhj0000b6rhazm2sfmvz' ||
    (user.role === 'ADMIN' && uName === 'admin')
  );
}
