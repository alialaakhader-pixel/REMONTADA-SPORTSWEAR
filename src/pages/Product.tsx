import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Check,
  Star,
} from "lucide-react";
import { useStore, findProduct } from "../lib/store";
import { Btn, Price, Stars, Badge, ProductCard, Micro, Reveal } from "../components/ui";

const SIZE_TABLE = [
  ["S", "88–94", "72–78", "92–98"],
  ["M", "96–102", "80–86", "100–106"],
  ["L", "104–110", "88–94", "108–114"],
  ["XL", "112–118", "96–102", "116–122"],
  ["XXL", "120–126", "104–110", "124–130"],
];

export default function ProductPage({ id }: { id: string }) {
  const { add, go, wish, toggleWish, toast, products } = useStore();
  const p = findProduct(id);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [tab, setTab] = useState<"desc" | "size" | "rev">("desc");
  const [sizeGuide, setSizeGuide] = useState(false);
  const [revs, setRevs] = useState([
    { n: "فهد الدوسري", r: 5, t: "الخامة ممتازة والمقاس مضبوط تماماً حسب الجدول. وصلني خلال يوم واحد.", d: "قبل 6 أيام" },
    { n: "نورة السبيعي", r: 5, t: "ثاني طلب لي من المتجر. الجودة ثابتة والتبديل كان سريعاً بدون أي تعقيد.", d: "قبل 3 أسابيع" },
    { n: "ماجد العنزي", r: 4, t: "مريح جداً في التدريب، تمنيت فقط لو توفر بلون ثالث.", d: "قبل شهر" },
  ]);
  const [form, setForm] = useState({ n: "", r: 5, t: "" });

  const galleryRef = useRef<HTMLDivElement>(null);

  const related = useMemo(
    () => products.filter((x) => x.id !== id && x.sport === p?.sport).slice(0, 4),
    [id, p]
  );
  const alsoBought = useMemo(
    () => products.filter((x) => x.id !== id && x.type !== p?.type).slice(0, 4),
    [id, p]
  );

  if (!p)
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-6 pt-32 pb-24 text-center">
        <div>
          <h1 className="display text-4xl text-paper">المنتج غير موجود</h1>
          <p className="mt-4 text-mute">ربما حُذف أو تغيّر رابطه.</p>
          <Btn className="mt-7" onClick={() => go("/shop")}>
            العودة إلى المتجر
          </Btn>
        </div>
      </div>
    );

  const liked = wish.includes(p.id);
  const activeColor = color ?? p.colors[0].name;

  const galleryImages = p.images?.length ? p.images : [p.img];
  const shots = galleryImages.map((src, i) => ({ src, pos: "center", zoom: i === 0 ? 1 : 1.1 }));

  const handleAdd = () => {
    if (!size && p.type !== "إكسسوارات" && p.sizes.length > 1) {
      toast("اختر المقاس أولاً", "اضغط على المقاس المناسب لقياسك");
      return;
    }
    add(p, size ?? p.sizes[0], activeColor, qty);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-28 sm:px-6 lg:px-10">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 border-b border-hair pb-5 text-[13px] text-mute">
        <button onClick={() => go("/")} className="hover:text-fire">الرئيسية</button>
        <span className="text-hair">/</span>
        <button onClick={() => go("/shop")} className="hover:text-fire">المتجر</button>
        <span className="text-hair">/</span>
        <button onClick={() => go(`/shop?s=${encodeURIComponent(p.sport)}`)} className="hover:text-fire">
          {p.sport}
        </button>
        <span className="text-hair">/</span>
        <span className="text-paper">{p.name}</span>
      </nav>

      <div className="grid gap-10 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ---------- gallery ---------- */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row-reverse">
          <div className="flex gap-3 sm:w-24 sm:flex-col">
            {shots.map((s, i) => (
              <button
                key={i}
                onMouseEnter={() => setShot(i)}
                onClick={() => setShot(i)}
                aria-label={`صورة ${i + 1}`}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden border transition-all sm:w-full ${
                  shot === i ? "border-fire" : "border-hair opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={s.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: s.pos, transform: `scale(${1 + (s.zoom - 1) * 0.4})` }}
                />
              </button>
            ))}
          </div>

          <div
            ref={galleryRef}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              });
            }}
            onMouseLeave={() => setZoom(null)}
            className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden border border-hair bg-[#0C0E11]"
          >
            <motion.img
              key={shot}
              initial={{ opacity: 0.3, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={shots[shot]?.src ?? p.img}
              alt={p.name}
              className="h-full w-full object-cover"
              style={{
                objectPosition: shots[shot].pos,
                transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center",
                transform: zoom ? `scale(${shots[shot].zoom * 1.6})` : `scale(1)`,
                transition: "transform .35s ease-out",
              }}
            />
            {p.badge && (
              <div className="absolute right-4 top-4">
                <Badge label={p.badge} />
              </div>
            )}
            <span className="micro pointer-events-none absolute bottom-4 left-4 bg-ink/70 px-3 py-1.5 text-mute backdrop-blur">
              مرّر للتكبير
            </span>
          </div>
        </div>

        {/* ---------- info ---------- */}
        <div>
          <Micro tone="neon">{p.sub}</Micro>
          <h1 className="display mt-4 text-[clamp(1.9rem,4.6vw,3.2rem)] text-paper">{p.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Stars value={p.rating} size={15} showNum reviews={p.reviews} />
            <span className="tech tnum text-[12px] text-mute">{p.sold}+ مبيعات</span>
            <span className="tech border border-hair px-2 py-1 text-[11px] tracking-widest text-mute">
              {p.brand}
            </span>
          </div>

          <div className="mt-6 flex items-end gap-4 border-b border-hair pb-6">
            <Price p={p} big />
            {p.old && (
              <span className="tech tnum mb-1 bg-fire px-2.5 py-1 text-[12px] font-bold text-white">
                وفّر {Math.round(((p.old - p.price) / p.old) * 100)}%
              </span>
            )}
          </div>

          <p className="mt-6 text-[15px] leading-[1.95] text-mute">{p.desc}</p>

          {/* colors */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="micro text-paper">اللون</span>
              <span className="text-[13px] text-mute">{activeColor}</span>
            </div>
            <div className="flex gap-3">
              {p.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  aria-label={c.name}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    activeColor === c.name
                      ? "border-fire scale-110 shadow-[0_0_0_3px_rgba(0,180,255,.25)]"
                      : "border-white/25 hover:scale-105"
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* sizes */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="micro text-paper">المقاس</span>
              <button
                onClick={() => setSizeGuide((s) => !s)}
                className="flex items-center gap-1.5 text-[13px] text-neon hover:text-fire"
              >
                جدول المقاسات <ChevronDown size={14} className={sizeGuide ? "rotate-180" : ""} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {p.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`tech min-w-12 border px-3 py-2.5 text-[13px] font-semibold transition-all ${
                    size === s
                      ? "border-fire bg-fire text-white"
                      : "border-hair text-mute hover:border-neon hover:text-neon"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {sizeGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 overflow-x-auto border border-hair">
                    <table className="w-full text-right text-[13px]">
                      <thead className="bg-panel text-mute">
                        <tr>
                          {["المقاس", "الصدر", "الخصر", "الطول"].map((h) => (
                            <th key={h} className="micro px-4 py-3 font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="tech tnum divide-y divide-hair text-paper">
                        {SIZE_TABLE.map((row) => (
                          <tr key={row[0]}>
                            {row.map((c, i) => (
                              <td key={i} className={`px-4 py-2.5 ${i === 0 ? "text-fire font-bold" : ""}`}>
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[12px] text-mute">الأبعاد بالسنتيمتر · قِس فوق ملابس قطنية رقيقة.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* qty + actions */}
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border border-hair">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="إنقاص"
                className="h-12 w-11 text-lg text-mute hover:text-fire"
              >
                −
              </button>
              <span className="tech tnum w-10 text-center font-bold text-paper">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                aria-label="زيادة"
                className="h-12 w-11 text-lg text-mute hover:text-fire"
              >
                +
              </button>
            </div>
            <Btn size="lg" className="flex-1" onClick={handleAdd}>
              <ShoppingBag size={17} /> أضف إلى السلة
            </Btn>
            <Btn
              size="lg"
              variant="solid"
              onClick={() => {
                if (!size && p.sizes.length > 1 && p.type !== "إكسسوارات") {
                  toast("اختر المقاس أولاً");
                  return;
                }
                add(p, size ?? p.sizes[0], activeColor, qty);
                go("/cart");
              }}
            >
              اشترِ الآن
            </Btn>
            <button
              onClick={() => toggleWish(p.id)}
              aria-label="المفضلة"
              className={`grid h-12 w-12 place-items-center border transition-colors ${
                liked ? "border-fire bg-fire text-white" : "border-hair text-mute hover:border-fire hover:text-fire"
              }`}
            >
              <Heart size={18} className={liked ? "fill-white" : ""} />
            </button>
          </div>

          {/* trust row */}
          <div className="mt-7 grid grid-cols-1 gap-px border border-hair bg-hair sm:grid-cols-3">
            {[
              [Truck, "شحن سريع", "الرياض 24 ساعة"],
              [RotateCcw, "إرجاع مجاني", "خلال 14 يوماً"],
              [ShieldCheck, "ضمان أصلي", "12 شهراً"],
            ].map(([I, t, d]: any) => (
              <div key={t} className="flex items-center gap-3 bg-[#0A0B0E] px-4 py-4">
                <I size={17} className="text-neon" />
                <span>
                  <span className="block text-[13px] font-bold text-paper">{t}</span>
                  <span className="block text-[11.5px] text-mute">{d}</span>
                </span>
              </div>
            ))}
          </div>

          {/* features */}
          <ul className="mt-7 space-y-3">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[14.5px] text-paper/85">
                <Check size={16} className="mt-1 shrink-0 text-fire" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- tabs ---------- */}
      <div className="mt-20 border-t border-hair pt-10">
        <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-hair px-4 sm:mx-0 sm:px-0">
          {(
            [
              ["desc", "الوصف التفصيلي"],
              ["size", "جدول المقاسات"],
              ["rev", `التقييمات (${revs.length})`],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`relative px-5 py-4 text-[14px] font-bold transition-colors ${
                tab === k ? "text-fire" : "text-mute hover:text-paper"
              }`}
            >
              {l}
              {tab === k && (
                <motion.span layoutId="ptab" className="absolute inset-x-0 -bottom-px h-0.5 bg-fire" />
              )}
            </button>
          ))}
        </div>

        <div className="py-9">
          {tab === "desc" && (
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <p className="text-[16px] leading-[2] text-paper/85">{p.desc}</p>
                <p className="mt-5 text-[15px] leading-[2] text-mute">
                  صُمم {p.name} ضمن مجموعة {p.sport} لتحمل أحمال التدريب اليومية المتكررة،
                  مع اختبارات مقاومة للتمزق وغسيل داخلي في مختبرنا قبل اعتماد الإنتاج.
                </p>
              </div>
              <ul className="space-y-4 border-r border-hair pr-6">
                {p.features.map((f, i) => (
                  <li key={f} className="flex gap-4">
                    <span className="tech tnum text-sm text-fire">0{i + 1}</span>
                    <span className="text-[15px] text-paper/85">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "size" && (
            <div className="max-w-3xl overflow-x-auto border border-hair">
              <table className="w-full text-right text-[14px]">
                <thead className="bg-panel">
                  <tr>
                    {["المقاس", "الصدر (سم)", "الخصر (سم)", "الطول (سم)"].map((h) => (
                      <th key={h} className="micro px-5 py-4 font-normal text-mute">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tech tnum divide-y divide-hair">
                  {SIZE_TABLE.map((r) => (
                    <tr key={r[0]} className="hover:bg-white/[0.03]">
                      {r.map((c, i) => (
                        <td key={i} className={`px-5 py-3.5 ${i === 0 ? "font-bold text-fire" : "text-paper"}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "rev" && (
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                {revs.map((r, i) => (
                  <Reveal key={i} delay={i * 0.06}>
                    <article className="border border-hair bg-panel p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span className="tech grid h-10 w-10 place-items-center rounded-full bg-fire/15 font-bold text-fire">
                            {r.n.slice(0, 1)}
                          </span>
                          <span>
                            <span className="block font-bold text-paper">{r.n}</span>
                            <span className="block text-[12px] text-mute">{r.d}</span>
                          </span>
                        </span>
                        <Stars value={r.r} />
                      </div>
                      <p className="mt-4 text-[15px] leading-relaxed text-paper/85">{r.t}</p>
                    </article>
                  </Reveal>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.n.trim() || !form.t.trim()) {
                    toast("أكمل الحقول", "الاسم والتعليق مطلوبان");
                    return;
                  }
                  setRevs((v) => [{ ...form, d: "الآن" }, ...v]);
                  setForm({ n: "", r: 5, t: "" });
                  toast("شكراً لك", "نُشر تقييمك بنجاح");
                }}
                className="h-fit border border-hair bg-panel p-6"
              >
                <h3 className="text-lg font-bold text-paper">أضف تقييمك</h3>
                <div className="mt-4 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, r: n }))}
                      aria-label={`${n} نجوم`}
                    >
                      <Star
                        size={22}
                        className={n <= form.r ? "fill-gold text-gold" : "fill-hair text-hair"}
                      />
                    </button>
                  ))}
                </div>
                <input
                  value={form.n}
                  onChange={(e) => setForm((f) => ({ ...f, n: e.target.value }))}
                  placeholder="اسمك"
                  className="mt-4 w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
                />
                <textarea
                  value={form.t}
                  onChange={(e) => setForm((f) => ({ ...f, t: e.target.value }))}
                  placeholder="رأيك في المنتج…"
                  rows={4}
                  className="mt-3 w-full resize-none border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
                />
                <Btn type="submit" full className="mt-4">
                  نشر التقييم
                </Btn>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ---------- related ---------- */}
      {related.length > 0 && (
        <section className="mt-10 border-t border-hair pt-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Micro>منتجات مشابهة</Micro>
              <h2 className="display mt-4 text-[clamp(1.6rem,4vw,2.6rem)] text-paper">
                من نفس {p.sport}
              </h2>
            </div>
            <Btn variant="ghost" onClick={() => go(`/shop?s=${encodeURIComponent(p.sport)}`)}>
              عرض الكل
            </Btn>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((x, i) => (
              <ProductCard key={x.id} p={x} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 border-t border-hair pt-14">
        <div className="mb-8">
          <Micro tone="neon">اشترى معه أيضاً</Micro>
          <h2 className="display mt-4 text-[clamp(1.6rem,4vw,2.6rem)] text-paper">
            يُكمل طقمك
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {alsoBought.map((x, i) => (
            <ProductCard key={x.id} p={x} index={i} />
          ))}
        </div>
      </section>

      {/* sticky mobile buy bar */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-12 flex items-center gap-3 border-t border-hair bg-ink/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-paper">{p.name}</div>
          <Price p={p} />
        </div>
        <Btn onClick={handleAdd}>
          <Zap size={15} /> أضف للسلة
        </Btn>
      </div>
    </div>
  );
}
