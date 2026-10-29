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

Dữ liệu sản phẩm và đường dẫn affiliate hiện là dữ liệu mẫu; chưa tích hợp Supabase.
