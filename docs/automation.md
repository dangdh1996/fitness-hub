# Đồng bộ giá từ nguồn đã xác minh

`scripts/sync-prices.mjs` nhận một bản xuất JSON đã xác minh, kiểm tra toàn bộ dữ liệu,
rồi mới ghi một lần vào bảng Supabase `products`. Công cụ không cào Shopee, không tự tạo
giá, và không biến URL thường thành affiliate bằng cách ghép `Sub_ID`.

## Nguồn dữ liệu cần có

Cần tài khoản Shopee Affiliate đang hoạt động và dữ liệu từ bản xuất chính thức, API
được cấp quyền, hoặc quan sát sản phẩm đã được người vận hành xác minh. Link affiliate
phải được tạo bởi công cụ/API của chương trình affiliate tương ứng. Bước chuyển đổi
link chỉ có thể tự động hóa sau khi có quyền API và định dạng chính thức của tài khoản.

Tạo `data/product-feed.json` theo cấu trúc sau. Ví dụ bên dưới minh họa định dạng,
không phải dữ liệu sản phẩm đã xác minh; không dùng giá/link ví dụ để ghi production.
`data/product-feed.example.json` cố ý đánh dấu mẫu và bị bộ kiểm tra từ chối.

```json
{
  "schema_version": 1,
  "is_sample": false,
  "source": {
    "kind": "affiliate_export",
    "reference": "Tên hoặc mã bản xuất thực tế"
  },
  "products": [
    {
      "slug": "unique-product-slug",
      "name": "Tên và quy cách sản phẩm đã xác minh",
      "brand": "Thương hiệu",
      "category": "creatine",
      "price_vnd": 450000,
      "active_total_g": 500,
      "source_url": "https://shopee.vn/product/123456/789012",
      "affiliate_url": "https://s.shopee.vn/REALCODE01",
      "observed_at": "2026-10-30T00:00:00+07:00"
    }
  ]
}
```

`source.kind` chấp nhận `affiliate_export`, `approved_api`, `manual_verified`.
Mỗi `slug` duy nhất trong feed, danh mục `creatine`/`whey`, giá là số nguyên VND dương,
`active_total_g` là tổng gram hoạt chất thật (protein, không phải trọng lượng cả hộp
whey), tối đa hai chữ số thập phân. Quan sát phải có múi giờ, không nằm trong tương lai
và không cũ quá 48 giờ khi chạy. Không có dữ liệu thì giữ nguyên bảng; không làm mới
thời gian kiểm tra để che giấu giá cũ. Bộ kiểm tra không thể xác minh tài khoản hoa hồng
hay sự chính xác của nhãn dinh dưỡng, nên người vận hành chịu trách nhiệm nguồn đầu vào.

URL nguồn phải là link sản phẩm `https://shopee.vn/product/<shop>/<item>` hoặc dạng
`-i.<shop>.<item>`. Link affiliate phải là short link HTTPS từ `s.shopee.vn`/`shope.ee`,
không kèm thông số tự chế. Không lưu mật khẩu/token trong feed. Mã affiliate công khai
và thông tin giá có thể được lưu trong Git nếu chính sách nguồn cho phép.

## Chạy và kiểm tra

```sh
node --test tests/price-sync.test.mjs
node scripts/sync-prices.mjs --file data/product-feed.json --dry-run
node scripts/sync-prices.mjs --file data/product-feed.json --apply
```

Không ghi database mặc định. `--apply` yêu cầu `SUPABASE_URL` (project origin dạng
`https://<ref>.supabase.co`) và `SUPABASE_SERVICE_ROLE_KEY` ở môi trường backend.
Không đưa khóa service-role vào biến `VITE_*` hoặc frontend. Khóa có thể là service-role
JWT cũ hoặc Supabase secret API key mới. Công cụ giữ TLS verification và không log khóa
hay nội dung response lỗi. Upsert dùng `slug` để chạy lại không tạo sản phẩm trùng;
`cost_per_active_gram` do database tính. Nó lưu `last_checked_at` từ `observed_at`,
đặt `is_sample=false`, `is_active=true`, xóa badge mẫu cũ.

Chạy các migration Supabase trong repository trước khi áp dụng feed. Một lần upsert
được thực hiện trong transaction của PostgREST; dữ liệu không hợp lệ làm dừng cả đợt.
Lỗi kết nối sau khi gửi không chứng minh rollback: kiểm tra dữ liệu trước khi chạy lại.

## GitHub Actions lúc 02:00

Workflow `.github/workflows/sync-prices.yml` chạy mỗi ngày lúc `19:00 UTC`, tức `02:00`
sáng ngày kế tiếp tại Việt Nam. GitHub có thể chạy trễ lịch. Thêm repository Actions
secrets `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` trong GitHub Settings → Secrets
and variables → Actions. Vercel chỉ cần public URL/key để đọc; không cần khóa ghi.

Workflow chỉ kiểm tra khô khi chạy thủ công, trừ khi bật `apply`. Khi thiếu feed thật
hoặc secrets cho một lần ghi, workflow ghi rõ **skipped / không cập nhật giá** trong
Step Summary; không báo đã đồng bộ. Feed cũ hoặc không hợp lệ gây lỗi và không ghi.

Hiện chưa có nguồn cung cấp bản xuất mới hằng ngày: đây là đường nhận dữ liệu, chưa
phải bot tự lấy giá hoàn toàn tự động. Để đạt zero-touch cần nối nguồn API/nguồn xuất
được phép vào bước tạo feed, rồi xác minh một lần ghi thật khi đã có Supabase.
