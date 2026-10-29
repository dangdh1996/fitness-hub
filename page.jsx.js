'use client';
import { useState } from 'react';

export default function FitnessAffiliateHub() {
  const [weight, setWeight] = useState(70);
  const [category, setCategory] = useState('creatine');

  // Dữ liệu mẫu minh họa sản phẩm (Sau này sẽ được bot tự động đồng bộ từ Supabase)
  const productDatabase = {
    creatine: [
      { name: "Ostrovit Micronized Creatine 500g", price: 450000, servings: 100, active_g: 5, cost_per_gram: 900, badge: "🥇 Rẻ nhất", url: "https://s.shopee.vn/sub_id=creatine_ostrovit" },
      { name: "Rule 1 Creatine Monohydrate 435g", price: 520000, servings: 75, active_g: 5.8, cost_per_gram: 1195, badge: "🥈 Bán chạy", url: "https://s.shopee.vn/sub_id=creatine_rule1" },
      { name: "NutraBio Pure Creatine 300g", price: 410000, servings: 60, active_g: 5, cost_per_gram: 1366, badge: "🥉 Cao cấp", url: "https://s.shopee.vn/sub_id=creatine_nutrabio" }
    ],
    whey: [
      { name: "Whey Protein Isolate Avacore 2kg", price: 1650000, servings: 66, active_g: 27, cost_per_gram: 925, badge: "🥇 Tối ưu nhất", url: "https://s.shopee.vn/sub_id=whey_avacore" },
      { name: "Rule 1 Proteins Isolate 5lbs", price: 1850000, servings: 77, active_g: 25, cost_per_gram: 961, badge: "🥈 Phổ biến", url: "https://s.shopee.vn/sub_id=whey_rule1" }
    ]
  };

  const currentProducts = productDatabase[category] || [];
  const recommendedCreatine = Math.round(weight * 0.07 * 10) / 10; // Công thức ước tính nhanh

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-2 py-4 border-b border-gray-800">
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
            ⚡ Trạm Định lượng Tự động Realtime
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
            So sánh Giá & Tối ưu Chi phí Thực phẩm Bổ sung
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Không mua hàng bằng cảm tính. Hệ thống tự động tính toán chi phí thực tế trên từng gram hoạt chất nguyên chất.
          </p>
        </header>

        {/* Khung tương tác: Máy tính nhu cầu */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            🧮 Máy tính nhu cầu cá nhân
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-medium">Cân nặng hiện tại của bạn (kg):</label>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 text-white font-semibold" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-medium">Danh mục sản phẩm:</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 text-white font-semibold"
              >
                <option value="creatine">Creatine Monohydrate</option>
                <option value="whey">Whey Protein Isolate</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 text-xs sm:text-sm text-emerald-300 flex items-start gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <strong className="block text-emerald-200 mb-0.5">Khuyến nghị từ hệ thống định lượng:</strong>
              Với trọng lượng <span className="underline font-bold">{weight} kg</span>, mức khuyến nghị tối ưu khoảng <span className="font-bold text-white">{recommendedCreatine}g hoạt chất/ngày</span>. Hãy chọn sản phẩm có chi phí trên mỗi gram rẻ nhất bên dưới để tối ưu ví tiền của bạn.
            </div>
          </div>
        </div>

        {/* Bảng xếp hạng giá Affiliate */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              📊 Bảng xếp hạng giá tốt nhất hôm nay
            </h2>
            <span className="text-xs text-gray-500">Cập nhật tự động</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <tr>
                  <th className="pb-3 font-semibold">Xếp hạng & Sản phẩm</th>
                  <th className="pb-3 font-semibold">Giá niêm yết</th>
                  <th className="pb-3 font-semibold">Chi phí / gram</th>
                  <th className="pb-3 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {currentProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-850/40 transition">
                    <td className="py-4 pr-3">
                      <div className="font-medium text-gray-200 flex items-center gap-2">
                        <span>{p.name}</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] bg-gray-800 text-emerald-400 px-2 py-0.5 rounded-md font-medium border border-gray-700">
                        {p.badge}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300 font-semibold whitespace-nowrap">
                      {p.price.toLocaleString()}đ
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        {p.cost_per_gram}đ / g
                      </span>
                    </td>
                    <td className="py-4 text-right whitespace-nowrap">
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition shadow-lg shadow-emerald-950/50"
                      >
                        Mua trên Shopee ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-500 text-center pt-2">
            * Hệ thống tự động lọc và sắp xếp theo giá trị thực tế trên từng gram hoạt chất để bảo vệ quyền lợi người tiêu dùng.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 py-4">
          © 2026 Trạm Định lượng Thể hình. Vận hành bởi Hệ thống Tự động hóa Zero-Touch.
        </footer>

      </div>
    </main>
  );
}