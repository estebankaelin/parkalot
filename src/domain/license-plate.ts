/** Schweizer Kontrollschild, z.B. "SZ 12345". Gibt die normalisierte Form oder null zurück. */
export function normalizeSwissPlate(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s.\-]/g, '');
  const match = /^([A-Z]{2})(\d{1,6})$/.exec(compact);
  return match ? `${match[1]} ${match[2]}` : null;
}
