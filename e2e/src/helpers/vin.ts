/**
 * Уникальный VIN на прогон (17 символов, буквы+цифры, без I/O/Q).
 * Не пересекается с seed-якорями.
 */
export function buildUniqueVin(tag = 'A'): string {
  const stamp = Date.now().toString(36).toUpperCase().replace(/[IOQ]/g, 'X');
  const raw = `E2E${stamp}${tag}0123456789ABCDEF`.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, 'X');
  return raw.slice(0, 17);
}
