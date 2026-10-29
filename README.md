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
2. Chạy lần lượt các file trong `supabase/migrations/` theo thứ tự tên trong SQL Editor.
   Project đã chạy migration đầu tiên chỉ cần chạy file mới `202610300002_separate_sample_products.sql`.
3. Có thể chạy `supabase/seed.sql` để nạp 30 bản ghi mẫu phục vụ phát triển.
   Mẫu không có link mua hoặc ngày kiểm tra giả, bị ẩn qua public API và không ghi đè dữ liệu thật.
4. Sao chép `.env.example` thành `.env.local`, sau đó điền Project URL và public anon key.
5. Trên Vercel, thêm cùng hai biến `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, rồi redeploy.

Website chỉ được cấp quyền đọc các sản phẩm đang hoạt động, đã được đánh dấu dữ liệu thật qua Row Level Security.
Các thao tác ghi dữ liệu phải chạy ở backend hoặc GitHub Actions bằng service-role secret;
không đưa service-role key vào biến `VITE_*` hay mã frontend. Nếu chưa cấu hình Supabase,
website tự dùng bộ dữ liệu mẫu 30 sản phẩm để luôn hoạt động.

## Cập nhật giá và affiliate

Xem [hướng dẫn vận hành](docs/automation.md) cho định dạng dữ liệu, Secrets và lịch
02:00 giờ Việt Nam. Importer chỉ nhận dữ liệu có nguồn và thời điểm quan sát;
link affiliate phải lấy từ tài khoản Shopee Affiliate hoặc API được cấp quyền.
Việc thêm `Sub_ID` vào URL bất kỳ không tự tạo quyền ghi nhận hoa hồng.

```sh
npm test
npm run prices:check -- --file data/product-feed.json
```

Chưa có cấu hình Supabase và nguồn giá thật thì lịch tự động sẽ báo chưa đủ điều kiện;
không có cập nhật giá thật nào được ngầm giả lập. Frontend chỉ hiển thị nút mua cho
dữ liệu thật có link HTTPS hợp lệ và quan sát trong 48 giờ gần nhất.
