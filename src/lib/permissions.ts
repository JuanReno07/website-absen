/**
 * Helper to determine if a given user is "ASE Juan" (exclusive privilege).
 */
export function isJuanUser(user: { id?: string; username?: string; discord_name?: string } | null | undefined): boolean {
  if (!user) return false;
  const dName = (user.discord_name || '').toLowerCase().replace(/[\s\-_]/g, '');
  const uName = (user.username || '').toLowerCase();
  
  return (
    user.id === 'cmrx0bhj0000b6rhazm2sfmvz' ||
    dName === 'asejuan' ||
    dName.includes('asejuan') ||
    (uName === 'admin' && dName.includes('juan')) ||
    (user.discord_name || '').toLowerCase().includes('juan')
  );
}
