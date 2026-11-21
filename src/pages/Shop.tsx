import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X, LayoutGrid, List, ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store";
import { PRODUCTS, SPORTS, BRANDS, type Product } from "../lib/data";
import { Btn, ProductCard, Micro, Stars } from "../components/ui";

const GENDERS = ["رجالي", "نسائي", "أطفال"];
const TYPES = ["ملابس", "أحذية", "إكسسوارات", "معدات"];

type Sort = "new" | "best" | "price-asc" | "price-desc" | "rating";

const SORTS: { k: Sort; l: string }[] = [
  { k: "new", l: "الأحدث" },
  { k: "best", l: "الأكثر مبيعاً" },
  { k: "price-asc", l: "السعر: من الأقل" },
  { k: "price-desc", l: "السعر: من الأعلى" },
  { k: "rating", l: "الأعلى تقييماً" },
];

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function Shop() {
  const { route, toast, products } = useStore();
  const availableSports = useMemo(() => { try { const cfg = JSON.parse(localStorage.getItem("remontada:sports") || "{}"); return SPORTS.filter((sport) => cfg[sport] !== false); } catch { return [...SPORTS]; } }, []);
  const qs = route.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);

  const [sports, setSports] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const ALL_SIZES = useMemo(() => Array.from(new Set(products.flatMap(p => p.sizes))), [products]);
  const ALL_COLORS = useMemo(() => Array.from(new Map(products.flatMap(p => p.colors).map(c => [c.name,c])).values()), [products]);
  const [maxPrice, setMaxPrice] = useState(900);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<Sort>("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openFilters, setOpenFilters] = useState(false);

  useEffect(() => {
    const s = params.get("s");
    if (s) setSports([s]);
    const so = params.get("sort");
    if (so === "new") setSort("new");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const clearAll = () => {
    setSports([]);
    setGenders([]);
    setTypes([]);
    setBrands([]);
    setSizes([]);
    setColors([]);
    setMaxPrice(900);
    setMinRating(0);
    toast("تم مسح الفلاتر");
  };

  const activeCount =
    sports.length +
    genders.length +
    types.length +
    brands.length +
    sizes.length +
    colors.length +
    (maxPrice < 900 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const results = useMemo(() => {
    let out: Product[] = products.filter((p) => {
      if (sports.length && !sports.includes(p.sport)) return false;
      if (genders.length && !genders.includes(p.gender)) return false;
      if (types.length && !types.includes(p.type)) return false;
      if (brands.length && !brands.includes(p.brand)) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (p.price > maxPrice) return false;
      if (p.rating < minRating) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "best":
          return b.sold - a.sold;
        default:
          return (b.badge === "جديد" ? 1 : 0) - (a.badge === "جديد" ? 1 : 0);
      }
    });
    return out;
  }, [products, sports, genders, types, brands, sizes, colors, maxPrice, minRating, sort]);

  const filters = (
    <div className="space-y-8">
      <FilterGroup title="الرياضة">
        {availableSports.map((s) => (
          <Check
            key={s}
            label={s}
            checked={sports.includes(s)}
            onChange={() => setSports((p) => toggle(p, s))}
            count={products.filter((p) => p.sport === s).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="الفئة">
        {GENDERS.map((g) => (
          <Check
            key={g}
            label={g}
            checked={genders.includes(g)}
            onChange={() => setGenders((p) => toggle(p, g))}
            count={products.filter((p) => p.gender === g).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="النوع">
        {TYPES.map((t) => (
          <Check
            key={t}
            label={t}
            checked={types.includes(t)}
            onChange={() => setTypes((p) => toggle(p, t))}
            count={products.filter((p) => p.type === t).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="العلامة التجارية">
        {BRANDS.map((b) => (
          <Check
            key={b}
            label={b}
            checked={brands.includes(b)}
            onChange={() => setBrands((p) => toggle(p, b))}
            count={products.filter((p) => p.brand === b).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="المقاس">
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSizes((p) => toggle(p, s))}
              className={`tech min-w-10 border px-2.5 py-1.5 text-[12px] font-semibold transition-all ${
                sizes.includes(s)
                  ? "border-fire bg-fire text-white"
                  : "border-hair text-mute hover:border-neon hover:text-neon"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="اللون">
        <div className="flex flex-wrap gap-2.5 pt-1">
          {ALL_COLORS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              aria-label={c.name}
              onClick={() => setColors((p) => toggle(p, c.name))}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                colors.includes(c.name)
                  ? "border-fire scale-110"
                  : "border-white/25 hover:scale-110"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={`السعر — حتى ${maxPrice} ج.م`}>
        <input
          type="range"
          min={100}
          max={900}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(+e.target.value)}
          className="w-full pt-2"
          aria-label="أعلى سعر"
        />
        <div className="tech tnum mt-1 flex justify-between text-[11px] text-mute">
          <span>100 ج.م</span>
          <span>900 ج.م</span>
        </div>
      </FilterGroup>

      <FilterGroup title="التقييم">
        <div className="flex flex-col gap-2 pt-1">
          {[0, 4.5, 4.7, 4.8].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`flex items-center justify-between border px-3 py-2 text-[13px] transition-colors ${
                minRating === r ? "border-fire text-paper" : "border-hair text-mute hover:text-paper"
              }`}
            >
              <span>{r === 0 ? "كل التقييمات" : `${r} فأعلى`}</span>
              <Stars value={r || 5} size={12} />
            </button>
          ))}
        </div>
      </FilterGroup>

      <Btn full variant="ghost" onClick={clearAll}>
        مسح كل الفلاتر {activeCount > 0 && `(${activeCount})`}
      </Btn>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      {/* page head */}
      <div className="border-b border-hair pb-8">
        <Micro>المتجر / {sports.length === 1 ? sports[0] : "كل المنتجات"}</Micro>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h1 className="display text-[clamp(2.2rem,6vw,4rem)] text-paper">
            {sports.length === 1 ? sports[0] : "كل المنتجات"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tech tnum text-[13px] text-mute">
              {results.length} نتيجة
            </span>
            <div className="flex max-w-full flex-wrap border border-hair">
              {SORTS.map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSort(s.k)}
                  className={`px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
                    sort === s.k ? "bg-fire text-white" : "text-mute hover:text-paper"
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
            <div className="flex border border-hair">
              <button
                onClick={() => setView("grid")}
                aria-label="عرض شبكي"
                className={`grid h-10 w-10 place-items-center transition-colors ${
                  view === "grid" ? "bg-paper text-ink" : "text-mute hover:text-paper"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="عرض قائمة"
                className={`grid h-10 w-10 place-items-center transition-colors ${
                  view === "list" ? "bg-paper text-ink" : "text-mute hover:text-paper"
                }`}
              >
                <List size={16} />
              </button>
            </div>
            <button
              onClick={() => setOpenFilters(true)}
              className="flex items-center gap-2 border border-hair px-4 py-2.5 text-[13px] font-bold text-paper lg:hidden"
            >
              <SlidersHorizontal size={15} /> الفلاتر
              {activeCount > 0 && (
                <span className="tech grid h-5 w-5 place-items-center rounded-full bg-fire text-[10px] text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 pt-8 lg:grid-cols-[270px_1fr]">
        {/* sticky filter rail — RTL leading edge */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-hair bg-panel p-5">
            <div className="mb-6 flex items-center justify-between border-b border-hair pb-4">
              <span className="micro text-fire">فلاتر</span>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-[12px] text-mute hover:text-fire">
                  مسح الكل
                </button>
              )}
            </div>
            {filters}
          </div>
        </aside>

        {/* results */}
        <div>
          {results.length === 0 ? (
            <div className="grid place-items-center border border-dashed border-hair py-28 text-center">
              <div>
                <h3 className="display text-2xl text-paper">لا توجد نتائج مطابقة</h3>
                <p className="mt-3 text-sm text-mute">
                  جرّب توسيع نطاق السعر أو إلغاء بعض الفلاتر.
                </p>
                <Btn className="mt-6" onClick={clearAll}>
                  إعادة ضبط الفلاتر
                </Btn>
              </div>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} p={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="border-t border-hair">
              {results.map((p, i) => (
                <ProductCard key={p.id} p={p} view="list" index={i} />
              ))}
            </div>
          )}

          <div className="mt-12 flex items-center justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`tech h-10 w-10 border text-sm transition-colors ${
                  n === 1
                    ? "border-fire bg-fire text-white"
                    : "border-hair text-mute hover:border-neon hover:text-neon"
                }`}
              >
                {n}
              </button>
            ))}
            <button className="flex h-10 items-center gap-2 border border-hair px-4 text-sm text-mute hover:text-paper">
              التالي <ArrowLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      {openFilters && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/85"
            onClick={() => setOpenFilters(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto border-r border-hair bg-[#0A0B0E] p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="micro text-fire">فلاتر</span>
              <button
                onClick={() => setOpenFilters(false)}
                aria-label="إغلاق الفلاتر"
                className="grid h-9 w-9 place-items-center border border-hair text-paper"
              >
                <X size={16} />
              </button>
            </div>
            {filters}
            <div className="mt-6">
              <Btn full size="lg" onClick={() => setOpenFilters(false)}>
                عرض {results.length} نتيجة
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="micro mb-3 text-paper">{title}</h3>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center gap-3 py-1.5 text-right transition-colors"
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center border transition-all ${
          checked ? "border-fire bg-fire" : "border-hair"
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5.2L4 7.6L8.5 2.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className={`flex-1 text-[13.5px] ${checked ? "text-paper" : "text-mute"}`}>
        {label}
      </span>
      <span className="tech tnum text-[11px] text-mute/70">{count}</span>
    </button>
  );
}


