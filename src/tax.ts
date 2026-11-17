const WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3] as const;

/**
 * Check digit for the first nine digits of a Vietnamese tax code (mã số thuế).
 * Returns null when no valid check digit exists for those nine digits.
 */
export function taxCodeCheckDigit(firstNine: string): number | null {
  if (!/^\d{9}$/.test(firstNine)) return null;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(firstNine[i]) * WEIGHTS[i]!;
  const check = 10 - (sum % 11);
  return check >= 0 && check <= 9 ? check : null;
}

export interface TaxCodeInfo {
  /** The 10-digit enterprise / taxpayer code. */
  code: string;
  /** The 3-digit branch suffix, when the input was a 13-digit code ("0300588569-001"). */
  branch: string | null;
}

/**
 * Parse and validate a 10-digit tax code or a 13-digit branch code (10 digits + "-" + 3 digits).
 * Validates the mod-11 check digit. Returns null when invalid.
 *
 * Note: individuals may now use their 12-digit personal identification number as a tax code;
 * that number has no check digit, so it is outside the scope of this function.
 */
export function parseTaxCode(input: string): TaxCodeInfo | null {
  const s = input.trim().replace(/\s/g, "");
  const m = /^(\d{10})(?:-?(\d{3}))?$/.exec(s);
  if (!m) return null;
  const code = m[1]!;
  if (taxCodeCheckDigit(code.slice(0, 9)) !== Number(code[9])) return null;
  return { code, branch: m[2] ?? null };
}

/** True for a well-formed 10- or 13-digit tax code with a correct check digit. */
export function isValidTaxCode(input: string): boolean {
  return parseTaxCode(input) !== null;
}
