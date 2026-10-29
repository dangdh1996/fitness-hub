import { useMemo, useState } from 'react';
import { useProducts } from './src/hooks/useProducts';
import { priceIsFresh } from './src/lib/catalog';

const activityLevels = [
  { value: 1.2, label: 'Ít vận động' },
  { value: 1.375, label: 'Tập nhẹ 1–3 buổi/tuần' },
  { value: 1.55, label: 'Tập vừa 3–5 buổi/tuần' },
  { value: 1.725, label: 'Tập nặng 6–7 buổi/tuần' },
  { value: 1.9, label: 'Vận động viên / lao động nặng' },
];

const goals = {
  cut: { label: 'Giảm mỡ', adjustment: -400 },
  maintain: { label: 'Giữ cân', adjustment: 0 },
  gain: { label: 'Tăng cơ', adjustment: 300 },
};

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value);
const formatCheckedAt = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));

function ProductCard({ product }) {
  const fresh = !product.isSample && priceIsFresh(product.lastCheckedAt);
  return (
    <article className="grid gap-4 rounded-xl border border-gray-800 bg-gray-950/50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-100">{product.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{product.brand}</p>
        <p className="mt-1.5 text-xs text-gray-400">
          {product.isSample ? 'Dữ liệu minh họa' : `${fresh ? 'Ghi nhận' : 'Giá cần cập nhật'}: ${formatCheckedAt(product.lastCheckedAt)} (giờ Việt Nam)`}
        </p>
      </div>
      <div className="flex items-end justify-between gap-6 sm:block sm:text-right">
        <div><p className="text-xs text-gray-500">{product.isSample ? 'Giá minh họa' : 'Giá ghi nhận'}</p><p className="font-bold text-gray-200">{formatNumber(product.price)}đ</p></div>
        <p className="text-xs font-semibold text-emerald-400">{formatNumber(product.costPerGram)}đ / g</p>
      </div>
      {!product.isSample && fresh && product.url ? (
        <a href={product.url} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400">Xem trên Shopee ↗</a>
      ) : <span className="rounded-xl border border-gray-800 px-4 py-2.5 text-center text-xs text-gray-500">{product.isSample ? 'Chưa có link bán hàng' : fresh ? 'Chưa có link affiliate' : 'Chờ cập nhật giá'}</span>}
    </article>
  );
}

function NumberField({ id, label, value, min, max, onChange, suffix }) {
  return (
    <label htmlFor={id} className="space-y-1.5">
      <span className="block text-xs font-medium text-gray-400">{label}</span>
      <div className="relative">
        <input id={id} type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 pr-10 text-sm font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" />
        <span className="pointer-events-none absolute right-3 top-3 text-xs text-gray-600">{suffix}</span>
      </div>
    </label>
  );
}

export default function FitnessAffiliateHub() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [age, setAge] = useState('28');
  const [sex, setSex] = useState('male');
  const [activity, setActivity] = useState('1.55');
  const [goal, setGoal] = useState('maintain');
  const [category, setCategory] = useState('creatine');
  const { products, source, loading, reason } = useProducts(category);

  const metrics = useMemo(() => {
    const safeWeight = Math.min(300, Math.max(30, Number(weight) || 0));
    const safeHeight = Math.min(250, Math.max(120, Number(height) || 0));
    const safeAge = Math.min(100, Math.max(14, Number(age) || 0));
    const bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + (sex === 'male' ? 5 : -161);
    const tdee = Math.round(bmr * Number(activity));
    return {
      weight: safeWeight,
      bmr: Math.round(bmr),
      tdee,
      calorieTarget: Math.max(1200, tdee + goals[goal].adjustment),
      proteinMin: Math.round(safeWeight * 1.6),
      proteinMax: Math.round(safeWeight * 2.2),
      creatine: Math.min(5, Math.max(3, Math.round(safeWeight * 0.07 * 10) / 10)),
    };
  }, [activity, age, goal, height, sex, weight]);

  const recommendation = category === 'creatine'
    ? `${metrics.creatine}g creatine/ngày`
    : `${metrics.proteinMin}–${metrics.proteinMax}g protein/ngày`;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-6 font-sans text-gray-100 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-3 border-b border-gray-800 pb-6 text-center">
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">⚡ Trạm định lượng thể hình</span>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Ăn đúng lượng. Mua đúng giá.</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">Tính TDEE, mục tiêu calories và nhu cầu bổ sung theo thể trạng; sau đó so sánh chi phí thật trên mỗi gram hoạt chất.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Máy tính TDEE</p>
              <h2 className="mt-1 text-xl font-bold text-white">Chỉ số cơ thể của bạn</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <NumberField id="weight" label="Cân nặng" value={weight} min="30" max="300" suffix="kg" onChange={setWeight} />
              <NumberField id="height" label="Chiều cao" value={height} min="120" max="250" suffix="cm" onChange={setHeight} />
              <NumberField id="age" label="Tuổi" value={age} min="14" max="100" suffix="tuổi" onChange={setAge} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="sex" className="space-y-1.5">
                <span className="block text-xs font-medium text-gray-400">Giới tính sinh học</span>
                <select id="sex" value={sex} onChange={(event) => setSex(event.target.value)} className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm font-semibold text-white outline-none focus:border-emerald-500"><option value="male">Nam</option><option value="female">Nữ</option></select>
              </label>
              <label htmlFor="activity" className="space-y-1.5">
                <span className="block text-xs font-medium text-gray-400">Mức vận động</span>
                <select id="activity" value={activity} onChange={(event) => setActivity(event.target.value)} className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm font-semibold text-white outline-none focus:border-emerald-500">{activityLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select>
              </label>
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-gray-400">Mục tiêu</legend>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(goals).map(([key, item]) => <button key={key} type="button" aria-pressed={goal === key} onClick={() => setGoal(key)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${goal === key ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'}`}>{item.label}</button>)}
              </div>
            </fieldset>
          </div>

          <aside className="rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-emerald-950/50 to-gray-900 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Kết quả ước tính</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-800/80 bg-gray-950/60 p-4"><p className="text-xs text-gray-500">BMR</p><p className="mt-1 text-xl font-black text-white">{formatNumber(metrics.bmr)}</p><p className="text-[11px] text-gray-600">kcal/ngày</p></div>
              <div className="rounded-xl border border-gray-800/80 bg-gray-950/60 p-4"><p className="text-xs text-gray-500">TDEE</p><p className="mt-1 text-xl font-black text-white">{formatNumber(metrics.tdee)}</p><p className="text-[11px] text-gray-600">kcal/ngày</p></div>
            </div>
            <div className="mt-3 rounded-xl border border-emerald-800/60 bg-emerald-500/10 p-4"><p className="text-xs text-emerald-400">Mục tiêu {goals[goal].label.toLowerCase()}</p><p className="mt-1 text-3xl font-black text-white">{formatNumber(metrics.calorieTarget)}</p><p className="text-xs text-emerald-300/70">kcal mỗi ngày</p></div>
            <div className="mt-5 space-y-2 text-sm text-gray-300"><p className="flex justify-between"><span>Protein</span><strong className="text-white">{metrics.proteinMin}–{metrics.proteinMax}g</strong></p><p className="flex justify-between"><span>Creatine</span><strong className="text-white">{metrics.creatine}g</strong></p></div>
            <p className="mt-5 text-[11px] leading-5 text-gray-500">Ước tính theo công thức Mifflin–St Jeor. Đây là công cụ tham khảo, không thay thế tư vấn y tế hoặc dinh dưỡng chuyên môn.</p>
          </aside>
        </section>

        <section className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">So sánh theo hoạt chất</p><h2 className="mt-1 text-xl font-bold text-white">Sản phẩm phù hợp nhu cầu</h2><p aria-live="polite" className="mt-1 text-xs text-gray-400">{loading ? 'Đang tải giá mới…' : source === 'verified' ? 'Giá từ dữ liệu đã ghi nhận, xếp theo chi phí mỗi gram' : reason === 'unavailable' ? 'Chưa tải được giá mới. Đang hiển thị dữ liệu minh họa.' : 'Đang dùng bộ dữ liệu mẫu 30 sản phẩm, chưa phải giá bán thực tế.'}</p></div>
            <label htmlFor="category" className="space-y-1.5 sm:min-w-64"><span className="block text-xs font-medium text-gray-400">Danh mục</span><select id="category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm font-semibold text-white outline-none focus:border-emerald-500"><option value="creatine">Creatine Monohydrate</option><option value="whey">Whey Protein Isolate</option></select></label>
          </div>
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">Khuyến nghị theo thể trạng: <strong className="text-white">{recommendation}</strong></div>
          <div className="grid gap-3">
            {products.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
          <p className="text-center text-xs text-gray-400">{source === 'sample' ? 'Thông số và giá minh họa chưa được xác minh; không dùng để quyết định mua hàng.' : 'Giá có thể thay đổi theo shop và ưu đãi. Kiểm tra giá tại nơi bán; website có thể nhận hoa hồng khi bạn mua qua liên kết.'}</p>
        </section>
        <footer className="pb-4 text-center text-xs text-gray-600">© 2026 Trạm Định lượng Thể hình</footer>
      </div>
    </main>
  );
}
