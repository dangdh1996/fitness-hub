# Fitness Hub

Ứng dụng React/Vite với Tailwind CSS. Yêu cầu Node.js 24.

```sh
npm ci
npm run dev
```

Build production và kiểm tra bản build:

```sh
npm run build
npm run preview
```

## Vercel

Kết nối repository này, chọn nhánh `main`, Root Directory là thư mục gốc
repository. `vercel.json` khai báo framework Vite, lệnh cài `npm ci`, lệnh build
`npm run build` và Output Directory `dist`. Không cần biến môi trường cho dữ liệu
mẫu hiện tại. Mỗi lần đẩy thay đổi lên nhánh production, Vercel sẽ triển khai lại.

Dữ liệu và đường dẫn affiliate trong `src/data/fallbackProducts.js` là dữ liệu mẫu.
Frontend đã sẵn sàng đọc dữ liệu thật từ Supabase khi có cấu hình.

## Supabase

1. Tạo một project Supabase.
2. Chạy `supabase/migrations/202610300001_create_products.sql` trong SQL Editor.
3. Chạy `supabase/seed.sql` để nạp 30 bản ghi mẫu.
4. Sao chép `.env.example` thành `.env.local`, sau đó điền Project URL và public anon key.
5. Trên Vercel, thêm cùng hai biến `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, rồi redeploy.

Website chỉ được cấp quyền đọc các sản phẩm đang hoạt động qua Row Level Security.
Các thao tác ghi dữ liệu phải chạy ở backend hoặc GitHub Actions bằng service-role secret;
không đưa service-role key vào biến `VITE_*` hay mã frontend. Nếu chưa cấu hình Supabase,
website tự dùng bộ dữ liệu mẫu 30 sản phẩm để luôn hoạt động.
