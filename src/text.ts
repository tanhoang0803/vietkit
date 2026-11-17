/**
 * Remove Vietnamese diacritics: "Tiếng Việt" -> "Tieng Viet".
 * Handles both precomposed (NFC) and decomposed (NFD) input, and đ/Đ.
 */
export function removeDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export interface SlugifyOptions {
  /** Character placed between words. Default "-". */
  separator?: string;
  /** Lowercase the result. Default true. */
  lowercase?: boolean;
}

/**
 * Build a URL-safe slug: "Phở bò Hà Nội!" -> "pho-bo-ha-noi".
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const { separator = "-", lowercase = true } = options;
  let out = removeDiacritics(input).replace(/[^A-Za-z0-9]+/g, " ").trim();
  if (lowercase) out = out.toLowerCase();
  return out.split(" ").filter(Boolean).join(separator);
}

/**
 * Accent-insensitive, case-insensitive search:
 * includesIgnoringDiacritics("Nguyễn Văn An", "nguyen van") -> true
 */
export function includesIgnoringDiacritics(haystack: string, needle: string): boolean {
  const fold = (s: string) => removeDiacritics(s).toLowerCase();
  return fold(haystack).includes(fold(needle));
}

const collator = new Intl.Collator("vi", { sensitivity: "variant" });

/** Compare two strings in Vietnamese alphabetical order (a ă â b c d đ ...). */
export function compareVietnamese(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Return a new array sorted in Vietnamese alphabetical order. */
export function sortVietnamese<T>(items: readonly T[], key?: (item: T) => string): T[] {
  const get = key ?? ((item: T) => String(item));
  return [...items].sort((a, b) => collator.compare(get(a), get(b)));
}

/** Capitalise each word: "nguyễn văn an" -> "Nguyễn Văn An". */
export function capitalizeName(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("vi") + w.slice(1).toLocaleLowerCase("vi"))
    .join(" ");
}
