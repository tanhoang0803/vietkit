const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"] as const;
const GROUP_UNITS = ["", "nghìn", "triệu"] as const;

export interface NumberToWordsOptions {
  /** Word for a zero tens digit: 105 -> "một trăm linh năm" or "một trăm lẻ năm". Default "linh". */
  zeroTens?: "linh" | "lẻ";
  /** Word for 1 000: "nghìn" (standard, northern) or "ngàn" (southern). Default "nghìn". */
  thousand?: "nghìn" | "ngàn";
  /** Read a trailing 4 as "tư" after twenty (24 -> "hai mươi tư"). Default true. */
  useTu?: boolean;
}

function toBigInt(value: number | bigint | string): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new RangeError("vietkit: numberToWords expects an integer");
    }
    if (!Number.isSafeInteger(value)) {
      throw new RangeError("vietkit: number is not a safe integer; pass a bigint or a string instead");
    }
    return BigInt(value);
  }
  const cleaned = value.trim().replace(/[.,_\s]/g, "");
  if (!/^-?\d+$/.test(cleaned)) {
    throw new RangeError(`vietkit: "${value}" is not an integer`);
  }
  return BigInt(cleaned);
}

/** Read a 0..999 group. `full` forces "không trăm" / "linh" padding for non-leading groups. */
function readTriple(n: number, full: boolean, opts: Required<NumberToWordsOptions>): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  const parts: string[] = [];

  if (hundreds > 0 || full) parts.push(DIGITS[hundreds]!, "trăm");

  if (tens === 0) {
    if (ones > 0) {
      if (parts.length > 0) parts.push(opts.zeroTens);
      parts.push(DIGITS[ones]!);
    }
  } else {
    parts.push(tens === 1 ? "mười" : `${DIGITS[tens]!} mươi`);
    if (ones === 1) parts.push(tens === 1 ? "một" : "mốt");
    else if (ones === 4) parts.push(tens >= 2 && opts.useTu ? "tư" : "bốn");
    else if (ones === 5) parts.push("lăm");
    else if (ones > 0) parts.push(DIGITS[ones]!);
  }
  return parts.join(" ");
}

/**
 * Read an integer in Vietnamese.
 *
 * numberToWords(1250000) -> "một triệu hai trăm năm mươi nghìn"
 * numberToWords(105)     -> "một trăm linh năm"
 *
 * Accepts numbers (safe integers), bigints, and digit strings ("1.250.000" is fine).
 */
export function numberToWords(value: number | bigint | string, options: NumberToWordsOptions = {}): string {
  const opts: Required<NumberToWordsOptions> = {
    zeroTens: options.zeroTens ?? "linh",
    thousand: options.thousand ?? "nghìn",
    useTu: options.useTu ?? true,
  };

  let n = toBigInt(value);
  if (n === 0n) return DIGITS[0];
  const negative = n < 0n;
  if (negative) n = -n;

  // Split into 3-digit groups, least significant first.
  const groups: number[] = [];
  while (n > 0n) {
    groups.push(Number(n % 1000n));
    n /= 1000n;
  }

  const parts: string[] = [];
  let started = false;
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    // Position inside a 10^9 block: 0 = units, 1 = nghìn, 2 = triệu.
    const pos = i % 3;
    const billions = Math.floor(i / 3);

    if (group > 0) {
      parts.push(readTriple(group, started, opts));
      const unit = pos === 1 ? opts.thousand : GROUP_UNITS[pos]!;
      if (unit) parts.push(unit);
      started = true;
    }
    // Close each 10^9 block with one "tỷ" per level once something has been read.
    if (pos === 0 && billions > 0 && started) {
      const blockHasValue = (groups[i] ?? 0) + (groups[i + 1] ?? 0) + (groups[i + 2] ?? 0) > 0;
      if (blockHasValue) parts.push(Array(billions).fill("tỷ").join(" "));
    }
  }

  const words = parts.join(" ");
  return negative ? `âm ${words}` : words;
}

export interface MoneyToWordsOptions extends NumberToWordsOptions {
  /** Currency word appended at the end. Default "đồng". */
  currency?: string;
  /** Uppercase the first letter, as on invoices. Default true. */
  capitalize?: boolean;
  /** Append "chẵn" (the "only" marker used on Vietnamese invoices). Default false. */
  chan?: boolean;
}

/**
 * Amount in words for invoices and contracts.
 *
 * moneyToWords(1250000) -> "Một triệu hai trăm năm mươi nghìn đồng"
 */
export function moneyToWords(value: number | bigint | string, options: MoneyToWordsOptions = {}): string {
  const { currency = "đồng", capitalize = true, chan = false, ...rest } = options;
  let out = `${numberToWords(value, rest)} ${currency}`.trim();
  if (chan) out += " chẵn";
  if (capitalize) out = out.charAt(0).toLocaleUpperCase("vi") + out.slice(1);
  return out;
}

export interface FormatVNDOptions {
  /** Symbol or code to append. Default "₫". Pass "" for none. */
  symbol?: string;
  /** Thousands separator. Default ".". */
  separator?: string;
}

/**
 * Format an amount of đồng: formatVND(1250000) -> "1.250.000 ₫".
 * Does not depend on the ICU data of the runtime, so output is identical everywhere.
 */
export function formatVND(value: number | bigint | string, options: FormatVNDOptions = {}): string {
  const { symbol = "₫", separator = "." } = options;
  const n = typeof value === "number" ? BigInt(Math.round(value)) : toBigInt(value);
  const negative = n < 0n;
  const digits = (negative ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return `${negative ? "-" : ""}${digits}${symbol ? ` ${symbol}` : ""}`;
}

/**
 * Parse a Vietnamese-formatted amount: "1.250.000 ₫" -> 1250000, "1,5 triệu" is NOT supported.
 * Returns null when the input has no digits.
 */
export function parseVND(input: string): number | null {
  const negative = /^\s*-/.test(input);
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return negative ? -n : n;
}
