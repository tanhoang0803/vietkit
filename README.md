# vietkit

**English** | [Tiếng Việt](./README.vi.md)

**Zero-dependency TypeScript toolkit for Vietnamese apps.**
Bộ công cụ TypeScript không phụ thuộc cho các ứng dụng Việt Nam: đọc số thành chữ, định dạng tiền, bỏ dấu, số điện thoại, mã số thuế, âm lịch.

[![CI](https://github.com/tanhoang0803/vietkit/actions/workflows/ci.yml/badge.svg)](https://github.com/tanhoang0803/vietkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Every Vietnamese project ends up rewriting the same helpers: the amount in words on an invoice, a slug without diacritics, a phone number check, the lunar date for Tết. `vietkit` puts them in one small, typed, tested package.

```ts
import { moneyToWords, formatVND, slugify, getCarrier, isValidTaxCode, solarToLunar } from "vietkit";

moneyToWords(1250000);          // "Một triệu hai trăm năm mươi nghìn đồng"
formatVND(1250000);             // "1.250.000 ₫"
slugify("Phở bò Hà Nội!");      // "pho-bo-ha-noi"
getCarrier("+84 981 234 567");  // "Viettel"
isValidTaxCode("0300588569");   // true
solarToLunar(17, 2, 2026);      // { day: 1, month: 1, year: 2026, leap: false }  -> Tết Bính Ngọ
```

- No dependencies, tree-shakeable, ESM and CommonJS builds
- Written in strict TypeScript, types included
- Works in Node 18+, browsers, Bun, Deno and edge runtimes
- Tested, including a day-by-day lunar calendar round trip from 1950 to 2100

## Install

```bash
npm install github:tanhoang0803/vietkit
```

## API

### Numbers and money

| Function | Example | Result |
| --- | --- | --- |
| `numberToWords(n, options?)` | `numberToWords(1005)` | `"một nghìn không trăm linh năm"` |
| `moneyToWords(n, options?)` | `moneyToWords(500000, { chan: true })` | `"Năm trăm nghìn đồng chẵn"` |
| `formatVND(n, options?)` | `formatVND(-1000, { symbol: "VND" })` | `"-1.000 VND"` |
| `parseVND(text)` | `parseVND("1.250.000 ₫")` | `1250000` |

`numberToWords` accepts a number, a `bigint`, or a digit string, so very large values are read correctly:

```ts
numberToWords(21);                    // "hai mươi mốt"
numberToWords(1000000005);            // "một tỷ không trăm linh năm"
numberToWords(10n ** 18n);            // "một tỷ tỷ"
numberToWords(1005, { zeroTens: "lẻ", thousand: "ngàn" }); // "một ngàn không trăm lẻ năm"  (miền Nam)
numberToWords(24, { useTu: false });  // "hai mươi bốn"
```

Options: `zeroTens` (`"linh"` or `"lẻ"`), `thousand` (`"nghìn"` or `"ngàn"`), `useTu` (default `true`). `moneyToWords` adds `currency` (default `"đồng"`), `capitalize` (default `true`) and `chan` (append "chẵn").

### Text

| Function | Example | Result |
| --- | --- | --- |
| `removeDiacritics(text)` | `removeDiacritics("Đà Nẵng")` | `"Da Nang"` |
| `slugify(text, options?)` | `slugify("Đặc sản 3 miền")` | `"dac-san-3-mien"` |
| `includesIgnoringDiacritics(a, b)` | `includesIgnoringDiacritics("Nguyễn Văn An", "nguyen van")` | `true` |
| `sortVietnamese(items, key?)` | `sortVietnamese(["Đông", "Dung", "Ăn", "An"])` | `["An", "Ăn", "Dung", "Đông"]` |
| `compareVietnamese(a, b)` | for use with `Array.prototype.sort` | `number` |
| `capitalizeName(text)` | `capitalizeName("nguyễn  văn AN")` | `"Nguyễn Văn An"` |

### Phone numbers

| Function | Example | Result |
| --- | --- | --- |
| `normalizePhone(text)` | `normalizePhone("+84 912 345 678")` | `"0912345678"` |
| `isValidPhone(text)` | `isValidPhone("0112345678")` | `false` |
| `getCarrier(text)` | `getCarrier("0901234567")` | `"MobiFone"` |
| `toE164(text)` | `toE164("0912.345.678")` | `"+84912345678"` |
| `formatPhone(text, sep?)` | `formatPhone("+84912345678")` | `"0912 345 678"` |

Mobile numbers only. `getCarrier` reports the network the prefix was originally allocated to; because of number portability the subscriber may have switched since. The prefix table is exported as `CARRIER_PREFIXES`. If a prefix is missing or out of date, please open an issue.

### Tax code (mã số thuế)

```ts
isValidTaxCode("0300588569");      // true  (10 digits, check digit verified)
isValidTaxCode("0300588569-001");  // true  (13-digit branch code)
parseTaxCode("0300588569-001");    // { code: "0300588569", branch: "001" }
taxCodeCheckDigit("030058856");    // 9
```

This checks the format and the mod-11 check digit. It does not confirm that the code has been issued; only the tax authority can do that. A 12-digit personal identification number used as an individual's tax code has no check digit and is out of scope.

### Lunar calendar (âm lịch)

```ts
solarToLunar(25, 7, 2025);     // { day: 1, month: 6, year: 2025, leap: true }  (tháng 6 nhuận)
lunarToSolar(15, 8, 2026);     // { day: 25, month: 9, year: 2026 }             (Trung thu)
tetDate(2027);                 // { day: 6, month: 2, year: 2027 }
canChiYear(2026);              // "Bính Ngọ"
zodiacAnimal(2023);            // "Mèo"
```

Dates are computed for UTC+7, so results follow the Vietnamese calendar where it differs from the Chinese one (for example Tết 1985). `lunarToSolar` returns `null` for a lunar date that does not exist. The conversion follows the algorithm published by Hồ Ngọc Đức, based on Jean Meeus's *Astronomical Algorithms*.

## Development

```bash
npm install
npm test
npm run build
```

## Contributing

Issues and pull requests are welcome, especially corrections to the carrier prefix table and new helpers that Vietnamese projects keep rewriting. Please add a test with each change.

## License

[MIT](./LICENSE) © TanQHoang
