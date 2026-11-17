/**
 * Vietnamese lunar calendar (âm lịch) conversion.
 *
 * Based on the algorithm published by Hồ Ngọc Đức, which follows
 * Jean Meeus, "Astronomical Algorithms". Calculations use UTC+7 by default,
 * which is what distinguishes the Vietnamese calendar from the Chinese one.
 */

const PI = Math.PI;
const SYNODIC_MONTH = 29.530588853;

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  /** True when the month is a leap month (tháng nhuận). */
  leap: boolean;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return (
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdToDate(jd: number): SolarDate {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((b * 146097) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltat;
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * Math.floor(L / (PI * 2));
  return L;
}

function getNewMoonDay(k: number, tz: number): number {
  return Math.floor(newMoon(k) + 0.5 + tz / 24);
}

function getSunLongitude(dayNumber: number, tz: number): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - tz / 24) / PI) * 6);
}

function getLunarMonth11(yy: number, tz: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / SYNODIC_MONTH);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

function assertSolar(day: number, month: number, year: number): void {
  const ok =
    Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year) &&
    month >= 1 && month <= 12 && day >= 1 && day <= 31;
  if (!ok) throw new RangeError("vietkit: invalid date");
  const back = jdToDate(jdFromDate(day, month, year));
  if (back.day !== day || back.month !== month) throw new RangeError("vietkit: invalid date");
}

/**
 * Convert a solar (Gregorian) date to the Vietnamese lunar date.
 *
 * solarToLunar(17, 2, 2026) -> { day: 1, month: 1, year: 2026, leap: false }   // Tết Bính Ngọ
 */
export function solarToLunar(day: number, month: number, year: number, timeZone = 7): LunarDate {
  assertSolar(day, month, year);
  const dayNumber = jdFromDate(day, month, year);
  // The mean-lunation estimate can be off by one near a new moon, so search around it.
  let k = Math.floor((dayNumber - 2415021.076998695) / SYNODIC_MONTH) + 1;
  let monthStart = getNewMoonDay(k, timeZone);
  while (monthStart > dayNumber) monthStart = getNewMoonDay(--k, timeZone);

  let a11 = getLunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

/**
 * Convert a Vietnamese lunar date to the solar (Gregorian) date.
 * Returns null when the lunar date does not exist (for example a leap month that
 * the year does not have, or day 30 of a 29-day month).
 */
export function lunarToSolar(
  day: number,
  month: number,
  year: number,
  leap = false,
  timeZone = 7,
): SolarDate | null {
  if (![day, month, year].every(Number.isInteger) || month < 1 || month > 12 || day < 1 || day > 30) {
    return null;
  }
  let a11: number;
  let b11: number;
  if (month < 11) {
    a11 = getLunarMonth11(year - 1, timeZone);
    b11 = getLunarMonth11(year, timeZone);
  } else {
    a11 = getLunarMonth11(year, timeZone);
    b11 = getLunarMonth11(year + 1, timeZone);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / SYNODIC_MONTH);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null;
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  const solar = jdToDate(monthStart + day - 1);
  // Reject day 30 of a 29-day month by checking the round trip.
  const back = solarToLunar(solar.day, solar.month, solar.year, timeZone);
  if (back.day !== day || back.month !== month || back.year !== year || back.leap !== leap) return null;
  return solar;
}

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const ZODIAC = ["Chuột", "Trâu", "Hổ", "Mèo", "Rồng", "Rắn", "Ngựa", "Dê", "Khỉ", "Gà", "Chó", "Lợn"] as const;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Can Chi name of a lunar year: canChiYear(2026) -> "Bính Ngọ". */
export function canChiYear(lunarYear: number): string {
  return `${CAN[mod(lunarYear + 6, 10)]!} ${CHI[mod(lunarYear + 8, 12)]!}`;
}

/** Zodiac animal of a lunar year (Vietnamese zodiac, with Mèo/Cat): zodiacAnimal(2023) -> "Mèo". */
export function zodiacAnimal(lunarYear: number): string {
  return ZODIAC[mod(lunarYear + 8, 12)]!;
}

/** Solar date of Tết Nguyên Đán (lunar new year) for a lunar year. */
export function tetDate(lunarYear: number): SolarDate {
  const d = lunarToSolar(1, 1, lunarYear);
  if (!d) throw new RangeError("vietkit: year out of range");
  return d;
}
