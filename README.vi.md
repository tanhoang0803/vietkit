# vietkit

[English](./README.md) | **Tiếng Việt**

**Bộ công cụ TypeScript không phụ thuộc cho các ứng dụng Việt Nam.**

Dự án Việt Nam nào rồi cũng phải viết lại mấy hàm quen thuộc: số tiền bằng chữ trên hóa đơn, slug không dấu, kiểm tra số điện thoại, đổi ngày âm lịch. `vietkit` gom tất cả vào một gói nhỏ, có kiểu dữ liệu đầy đủ và đã được kiểm thử.

```ts
import { moneyToWords, formatVND, slugify, getCarrier, isValidTaxCode, solarToLunar } from "vietkit";

moneyToWords(1250000);          // "Một triệu hai trăm năm mươi nghìn đồng"
formatVND(1250000);             // "1.250.000 ₫"
slugify("Phở bò Hà Nội!");      // "pho-bo-ha-noi"
getCarrier("+84 981 234 567");  // "Viettel"
isValidTaxCode("0300588569");   // true
solarToLunar(17, 2, 2026);      // { day: 1, month: 1, year: 2026, leap: false }  -> Tết Bính Ngọ
```

- Không phụ thuộc thư viện nào, hỗ trợ tree-shaking, có cả bản ESM và CommonJS
- Viết bằng TypeScript ở chế độ strict, kèm sẵn kiểu dữ liệu
- Chạy trên Node 18+, trình duyệt, Bun, Deno và các môi trường edge
- Có bộ kiểm thử, trong đó âm lịch được kiểm tra từng ngày từ năm 1950 đến 2100

## Cài đặt

```bash
npm install github:tanhoang0803/vietkit
```

## Các hàm

### Số và tiền

| Hàm | Ví dụ | Kết quả |
| --- | --- | --- |
| `numberToWords(n, options?)` | `numberToWords(1005)` | `"một nghìn không trăm linh năm"` |
| `moneyToWords(n, options?)` | `moneyToWords(500000, { chan: true })` | `"Năm trăm nghìn đồng chẵn"` |
| `formatVND(n, options?)` | `formatVND(-1000, { symbol: "VND" })` | `"-1.000 VND"` |
| `parseVND(text)` | `parseVND("1.250.000 ₫")` | `1250000` |

`numberToWords` nhận số, `bigint` hoặc chuỗi chữ số, nên đọc đúng cả những số rất lớn:

```ts
numberToWords(21);                    // "hai mươi mốt"
numberToWords(1000000005);            // "một tỷ không trăm linh năm"
numberToWords(10n ** 18n);            // "một tỷ tỷ"
numberToWords(1005, { zeroTens: "lẻ", thousand: "ngàn" }); // "một ngàn không trăm lẻ năm"  (miền Nam)
numberToWords(24, { useTu: false });  // "hai mươi bốn"
```

Tùy chọn: `zeroTens` (`"linh"` hoặc `"lẻ"`), `thousand` (`"nghìn"` hoặc `"ngàn"`), `useTu` (mặc định `true`). `moneyToWords` có thêm `currency` (mặc định `"đồng"`), `capitalize` (mặc định `true`) và `chan` (thêm chữ "chẵn").

### Văn bản

| Hàm | Ví dụ | Kết quả |
| --- | --- | --- |
| `removeDiacritics(text)` | `removeDiacritics("Đà Nẵng")` | `"Da Nang"` |
| `slugify(text, options?)` | `slugify("Đặc sản 3 miền")` | `"dac-san-3-mien"` |
| `includesIgnoringDiacritics(a, b)` | `includesIgnoringDiacritics("Nguyễn Văn An", "nguyen van")` | `true` |
| `sortVietnamese(items, key?)` | `sortVietnamese(["Đông", "Dung", "Ăn", "An"])` | `["An", "Ăn", "Dung", "Đông"]` |
| `compareVietnamese(a, b)` | dùng với `Array.prototype.sort` | `number` |
| `capitalizeName(text)` | `capitalizeName("nguyễn  văn AN")` | `"Nguyễn Văn An"` |

### Số điện thoại

| Hàm | Ví dụ | Kết quả |
| --- | --- | --- |
| `normalizePhone(text)` | `normalizePhone("+84 912 345 678")` | `"0912345678"` |
| `isValidPhone(text)` | `isValidPhone("0112345678")` | `false` |
| `getCarrier(text)` | `getCarrier("0901234567")` | `"MobiFone"` |
| `toE164(text)` | `toE164("0912.345.678")` | `"+84912345678"` |
| `formatPhone(text, sep?)` | `formatPhone("+84912345678")` | `"0912 345 678"` |

Chỉ hỗ trợ số di động. `getCarrier` trả về nhà mạng được cấp đầu số ban đầu; do có dịch vụ chuyển mạng giữ số nên thuê bao có thể đã chuyển sang mạng khác. Bảng đầu số được export dưới tên `CARRIER_PREFIXES`. Nếu thiếu hoặc sai đầu số, bạn mở issue giúp mình nhé.

### Mã số thuế

```ts
isValidTaxCode("0300588569");      // true  (10 số, đã kiểm tra số kiểm tra)
isValidTaxCode("0300588569-001");  // true  (mã chi nhánh 13 số)
parseTaxCode("0300588569-001");    // { code: "0300588569", branch: "001" }
taxCodeCheckDigit("030058856");    // 9
```

Hàm chỉ kiểm tra định dạng và số kiểm tra (mod 11), không xác nhận mã đã được cấp hay chưa; việc đó chỉ cơ quan thuế làm được. Số định danh cá nhân 12 số dùng làm mã số thuế cá nhân không có số kiểm tra nên nằm ngoài phạm vi.

### Âm lịch

```ts
solarToLunar(25, 7, 2025);     // { day: 1, month: 6, year: 2025, leap: true }  (tháng 6 nhuận)
lunarToSolar(15, 8, 2026);     // { day: 25, month: 9, year: 2026 }             (Trung thu)
tetDate(2027);                 // { day: 6, month: 2, year: 2027 }
canChiYear(2026);              // "Bính Ngọ"
zodiacAnimal(2023);            // "Mèo"
```

Ngày được tính theo múi giờ UTC+7, nên kết quả đúng với lịch Việt Nam ở những chỗ khác lịch Trung Quốc (ví dụ Tết 1985). `lunarToSolar` trả về `null` khi ngày âm lịch không tồn tại. Thuật toán dựa trên công trình của Hồ Ngọc Đức, theo cuốn *Astronomical Algorithms* của Jean Meeus.

## Phát triển

```bash
npm install
npm test
npm run build
```

## Đóng góp

Rất hoan nghênh issue và pull request, nhất là cập nhật bảng đầu số nhà mạng và những hàm mà dự án Việt Nam hay phải viết lại. Mỗi thay đổi xin kèm theo test.

## Giấy phép

[MIT](./LICENSE) © TanQHoang
