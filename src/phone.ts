export type Carrier =
  | "Viettel"
  | "MobiFone"
  | "VinaPhone"
  | "Vietnamobile"
  | "Gmobile"
  | "iTel"
  | "Wintel";

/**
 * Mobile prefixes as originally allocated to each network.
 * Because of mobile number portability a subscriber may have moved networks,
 * so treat the result as "original carrier", not a guarantee.
 */
export const CARRIER_PREFIXES: Readonly<Record<Carrier, readonly string[]>> = {
  Viettel: ["086", "096", "097", "098", "032", "033", "034", "035", "036", "037", "038", "039"],
  MobiFone: ["089", "090", "093", "070", "076", "077", "078", "079"],
  VinaPhone: ["088", "091", "094", "081", "082", "083", "084", "085"],
  Vietnamobile: ["092", "052", "056", "058"],
  Gmobile: ["099", "059"],
  iTel: ["087"],
  Wintel: ["055"],
};

const PREFIX_TO_CARRIER = new Map<string, Carrier>();
for (const [carrier, prefixes] of Object.entries(CARRIER_PREFIXES) as [Carrier, readonly string[]][]) {
  for (const p of prefixes) PREFIX_TO_CARRIER.set(p, carrier);
}

/**
 * Normalise a Vietnamese mobile number to national format "0xxxxxxxxx".
 * Accepts "+84 912 345 678", "84912345678", "0084...", "0912.345.678", "0912-345-678".
 * Returns null if it is not a 10-digit Vietnamese mobile number with a known prefix.
 */
export function normalizePhone(input: string): string | null {
  let s = input.trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("+84")) s = "0" + s.slice(3);
  else if (s.startsWith("0084")) s = "0" + s.slice(4);
  else if (s.startsWith("84") && s.length === 11) s = "0" + s.slice(2);
  if (!/^0\d{9}$/.test(s)) return null;
  return PREFIX_TO_CARRIER.has(s.slice(0, 3)) ? s : null;
}

/** True when the input is a valid Vietnamese mobile number. */
export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** Original carrier for the number, or null when the number is not valid. */
export function getCarrier(input: string): Carrier | null {
  const n = normalizePhone(input);
  return n ? PREFIX_TO_CARRIER.get(n.slice(0, 3)) ?? null : null;
}

/** Convert to E.164: "0912345678" -> "+84912345678". Null when not valid. */
export function toE164(input: string): string | null {
  const n = normalizePhone(input);
  return n ? `+84${n.slice(1)}` : null;
}

/** Pretty-print: "0912345678" -> "0912 345 678". Null when not valid. */
export function formatPhone(input: string, separator = " "): string | null {
  const n = normalizePhone(input);
  return n ? [n.slice(0, 4), n.slice(4, 7), n.slice(7)].join(separator) : null;
}
