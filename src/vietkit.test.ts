import { describe, expect, it } from "vitest";
import {
  canChiYear,
  capitalizeName,
  formatPhone,
  formatVND,
  getCarrier,
  includesIgnoringDiacritics,
  isValidPhone,
  isValidTaxCode,
  lunarToSolar,
  moneyToWords,
  normalizePhone,
  numberToWords,
  parseTaxCode,
  parseVND,
  removeDiacritics,
  slugify,
  solarToLunar,
  sortVietnamese,
  taxCodeCheckDigit,
  tetDate,
  toE164,
  zodiacAnimal,
} from "./index";

describe("text", () => {
  it("removes diacritics", () => {
    expect(removeDiacritics("Tiếng Việt có dấu")).toBe("Tieng Viet co dau");
    expect(removeDiacritics("Đường đi ĐẾN Đà Nẵng")).toBe("Duong di DEN Da Nang");
    expect(removeDiacritics("Tiếng Việt".normalize("NFD"))).toBe("Tieng Viet");
    expect(removeDiacritics("ăâêôơư ĂÂÊÔƠƯ")).toBe("aaeoou AAEOOU");
  });

  it("slugifies", () => {
    expect(slugify("Phở bò Hà Nội!")).toBe("pho-bo-ha-noi");
    expect(slugify("  Bánh mì -- Sài Gòn  ")).toBe("banh-mi-sai-gon");
    expect(slugify("Đặc sản 3 miền", { separator: "_" })).toBe("dac_san_3_mien");
    expect(slugify("!!!")).toBe("");
  });

  it("searches ignoring diacritics", () => {
    expect(includesIgnoringDiacritics("Nguyễn Văn An", "nguyen van")).toBe(true);
    expect(includesIgnoringDiacritics("Nguyễn Văn An", "tran")).toBe(false);
  });

  it("sorts in Vietnamese order", () => {
    expect(sortVietnamese(["Đông", "Dung", "An", "Ân", "Ăn"])).toEqual(["An", "Ăn", "Ân", "Dung", "Đông"]);
    expect(sortVietnamese([{ n: "Út" }, { n: "Ba" }], (x) => x.n).map((x) => x.n)).toEqual(["Ba", "Út"]);
  });

  it("capitalises names", () => {
    expect(capitalizeName("  nguyễn  văn AN ")).toBe("Nguyễn Văn An");
    expect(capitalizeName("đỗ thị ánh")).toBe("Đỗ Thị Ánh");
  });
});

describe("numberToWords", () => {
  const cases: [number | bigint | string, string][] = [
    [0, "không"],
    [1, "một"],
    [5, "năm"],
    [10, "mười"],
    [11, "mười một"],
    [14, "mười bốn"],
    [15, "mười lăm"],
    [20, "hai mươi"],
    [21, "hai mươi mốt"],
    [24, "hai mươi tư"],
    [25, "hai mươi lăm"],
    [99, "chín mươi chín"],
    [100, "một trăm"],
    [101, "một trăm linh một"],
    [105, "một trăm linh năm"],
    [110, "một trăm mười"],
    [115, "một trăm mười lăm"],
    [121, "một trăm hai mươi mốt"],
    [1000, "một nghìn"],
    [1001, "một nghìn không trăm linh một"],
    [1050, "một nghìn không trăm năm mươi"],
    [2024, "hai nghìn không trăm hai mươi tư"],
    [10000, "mười nghìn"],
    [15500, "mười lăm nghìn năm trăm"],
    [100000, "một trăm nghìn"],
    [1000000, "một triệu"],
    [1000005, "một triệu không trăm linh năm"],
    [1250000, "một triệu hai trăm năm mươi nghìn"],
    [21000000, "hai mươi mốt triệu"],
    [1000000000, "một tỷ"],
    [1000000005, "một tỷ không trăm linh năm"],
    [1000005000, "một tỷ không trăm linh năm nghìn"],
    [2500000000, "hai tỷ năm trăm triệu"],
    [1000000000000, "một nghìn tỷ"],
    [1234567890123n, "một nghìn hai trăm ba mươi tư tỷ năm trăm sáu mươi bảy triệu tám trăm chín mươi nghìn một trăm hai mươi ba"],
    [10n ** 18n, "một tỷ tỷ"],
    [-42, "âm bốn mươi hai"],
    ["1.250.000", "một triệu hai trăm năm mươi nghìn"],
  ];
  it.each(cases)("%s", (input, expected) => {
    expect(numberToWords(input)).toBe(expected);
  });

  it("supports regional options", () => {
    expect(numberToWords(1005, { zeroTens: "lẻ", thousand: "ngàn" })).toBe("một ngàn không trăm lẻ năm");
    expect(numberToWords(24, { useTu: false })).toBe("hai mươi bốn");
  });

  it("rejects non-integers", () => {
    expect(() => numberToWords(1.5)).toThrow(RangeError);
    expect(() => numberToWords("abc")).toThrow(RangeError);
    expect(() => numberToWords(2 ** 60)).toThrow(RangeError);
  });
});

describe("money", () => {
  it("writes amounts in words", () => {
    expect(moneyToWords(1250000)).toBe("Một triệu hai trăm năm mươi nghìn đồng");
    expect(moneyToWords(500000, { chan: true })).toBe("Năm trăm nghìn đồng chẵn");
    expect(moneyToWords(99, { capitalize: false, currency: "đô la" })).toBe("chín mươi chín đô la");
  });

  it("formats and parses VND", () => {
    expect(formatVND(1250000)).toBe("1.250.000 ₫");
    expect(formatVND(999)).toBe("999 ₫");
    expect(formatVND(-1000, { symbol: "VND" })).toBe("-1.000 VND");
    expect(formatVND(1000000, { symbol: "", separator: "," })).toBe("1,000,000");
    expect(parseVND("1.250.000 ₫")).toBe(1250000);
    expect(parseVND("-5.000đ")).toBe(-5000);
    expect(parseVND("miễn phí")).toBeNull();
  });
});

describe("phone", () => {
  it("normalises common formats", () => {
    for (const s of ["0912345678", "+84 912 345 678", "84912345678", "0084912345678", "0912.345.678", "(091) 234-5678"]) {
      expect(normalizePhone(s)).toBe("0912345678");
    }
  });

  it("rejects invalid numbers", () => {
    for (const s of ["012345678", "09123456789", "0112345678", "abc", "", "+1 912 345 678"]) {
      expect(isValidPhone(s)).toBe(false);
    }
  });

  it("detects carriers and formats", () => {
    expect(getCarrier("0981234567")).toBe("Viettel");
    expect(getCarrier("0351234567")).toBe("Viettel");
    expect(getCarrier("0901234567")).toBe("MobiFone");
    expect(getCarrier("0911234567")).toBe("VinaPhone");
    expect(getCarrier("0921234567")).toBe("Vietnamobile");
    expect(getCarrier("123")).toBeNull();
    expect(toE164("0912 345 678")).toBe("+84912345678");
    expect(formatPhone("+84912345678")).toBe("0912 345 678");
  });
});

describe("tax code", () => {
  it("computes the check digit", () => {
    expect(taxCodeCheckDigit("030058856")).toBe(9);
    expect(taxCodeCheckDigit("12345")).toBeNull();
  });

  it("validates codes", () => {
    expect(isValidTaxCode("0300588569")).toBe(true);
    expect(isValidTaxCode("0300588569-001")).toBe(true);
    expect(parseTaxCode("0300588569-001")).toEqual({ code: "0300588569", branch: "001" });
    expect(parseTaxCode(" 0300588569 ")).toEqual({ code: "0300588569", branch: null });
    expect(isValidTaxCode("0300588568")).toBe(false);
    expect(isValidTaxCode("030058856")).toBe(false);
    expect(isValidTaxCode("0300588569-01")).toBe(false);
  });

  it("accepts exactly one check digit per valid prefix", () => {
    const prefix = "010010911";
    const valid = Array.from({ length: 10 }, (_, d) => isValidTaxCode(prefix + d)).filter(Boolean);
    expect(valid.length).toBeLessThanOrEqual(1);
  });
});

describe("lunar calendar", () => {
  const tet: [number, number, number][] = [
    [2020, 25, 1],
    [2021, 12, 2],
    [2022, 1, 2],
    [2023, 22, 1],
    [2024, 10, 2],
    [2025, 29, 1],
    [2026, 17, 2],
    [2027, 6, 2],
    [2028, 26, 1],
  ];
  it.each(tet)("Tết %i falls on %i/%i", (year, day, month) => {
    expect(tetDate(year)).toEqual({ day, month, year });
    expect(solarToLunar(day, month, year)).toEqual({ day: 1, month: 1, year, leap: false });
  });

  it("differs from the Chinese calendar where it should (Tết 1985)", () => {
    // Vietnam celebrated Tết Ất Sửu on 21 Jan 1985, one month before China.
    expect(tetDate(1985)).toEqual({ day: 21, month: 1, year: 1985 });
  });

  it("handles leap months", () => {
    // 2023 has a leap 2nd month, 2025 a leap 6th month.
    expect(solarToLunar(22, 3, 2023)).toEqual({ day: 1, month: 2, year: 2023, leap: true });
    expect(solarToLunar(25, 7, 2025)).toEqual({ day: 1, month: 6, year: 2025, leap: true });
    expect(lunarToSolar(1, 6, 2025, true)).toEqual({ day: 25, month: 7, year: 2025 });
    expect(lunarToSolar(1, 6, 2024, true)).toBeNull();
  });

  it("handles days before Tết", () => {
    expect(solarToLunar(1, 1, 2026)).toEqual({ day: 13, month: 11, year: 2025, leap: false });
    expect(solarToLunar(16, 2, 2026).year).toBe(2025);
    expect(solarToLunar(16, 2, 2026).month).toBe(12);
  });

  it("round-trips every day from 1950 to 2100", () => {
    const start = Date.UTC(1950, 0, 1);
    const end = Date.UTC(2100, 11, 31);
    let prev: { day: number; month: number; leap: boolean } | null = null;
    for (let t = start; t <= end; t += 86400000) {
      const d = new Date(t);
      const s = { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
      const l = solarToLunar(s.day, s.month, s.year);
      expect(l.day).toBeGreaterThanOrEqual(1);
      expect(l.day).toBeLessThanOrEqual(30);
      // Days advance by one, or reset to 1 at a new month.
      if (prev) expect(l.day === prev.day + 1 || l.day === 1).toBe(true);
      prev = l;
      expect(lunarToSolar(l.day, l.month, l.year, l.leap)).toEqual(s);
    }
  });

  it("rejects impossible dates", () => {
    expect(() => solarToLunar(31, 2, 2026)).toThrow(RangeError);
    expect(lunarToSolar(31, 1, 2026)).toBeNull();
    expect(lunarToSolar(1, 13, 2026)).toBeNull();
  });

  it("names years", () => {
    expect(canChiYear(2024)).toBe("Giáp Thìn");
    expect(canChiYear(2025)).toBe("Ất Tỵ");
    expect(canChiYear(2026)).toBe("Bính Ngọ");
    expect(zodiacAnimal(2023)).toBe("Mèo");
    expect(zodiacAnimal(2026)).toBe("Ngựa");
  });
});
