import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowLeft, ArrowRight, Check, ShieldCheck, Truck, Package } from "lucide-react";
import { useStore, findProduct } from "../lib/store";
import { CITIES, money } from "../lib/data";
import { Btn, Micro, Price, Reveal } from "../components/ui";

const TAX = 0.15;
const FREE_SHIP = 400;

function useTotals() {
  const { subtotal, cart } = useStore();
  const [city, setCity] = useState(CITIES[0]);
  const ship = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : city.ship;
  const tax = Math.round(subtotal * TAX);
  return { subtotal, cart, city, setCity, ship, tax, total: subtotal + ship + tax };
}

/* ================= CART ================= */
export function Cart() {
  const { cart, setQty, remove, go, subtotal } = useStore();
  const { ship, tax, total, city } = useTotals();

  if (cart.length === 0)
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 pt-32 pb-24 text-center">
        <Reveal>
          <div>
            <Package size={54} className="mx-auto text-hair" />
            <h1 className="display mt-6 text-4xl text-paper">سلتك فارغة</h1>
            <p className="mt-4 leading-relaxed text-mute">
              لم تضف أي قطعة بعد. ابدأ من أحدث الوصولات — هناك عرض خصم 30% هذا الأسبوع.
            </p>
            <Btn className="mt-7" size="lg" onClick={() => go("/shop")}>
              تصفح المتجر <ArrowLeft size={17} />
            </Btn>
          </div>
        </Reveal>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <Micro>سلة التسوق</Micro>
      <h1 className="display mt-5 text-[clamp(2.2rem,6vw,4rem)] text-paper">
        سلتك <span className="text-fire">({cart.length})</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="border-t border-hair">
          {cart.map((l, i) => {
            const p = findProduct(l.id);
            if (!p) return null;
            return (
              <Reveal key={`${l.id}-${l.size}-${l.color}`} delay={i * 0.05}>
                <article className="flex gap-4 border-b border-hair py-6 sm:gap-6">
                  <button
                    onClick={() => go(`/product/${p.id}`)}
                    className="h-28 w-24 shrink-0 overflow-hidden border border-hair sm:h-36 sm:w-32"
                  >
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  </button>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="micro text-mute">{p.sub}</span>
                        <button
                          onClick={() => go(`/product/${p.id}`)}
                          className="mt-1 block truncate text-right text-base font-bold text-paper hover:text-fire sm:text-lg"
                        >
                          {p.name}
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i)}
                        aria-label="حذف"
                        className="grid h-9 w-9 shrink-0 place-items-center border border-hair text-mute transition-colors hover:border-fire hover:text-fire"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-mute">
                      <span>
                        المقاس: <span className="tech text-paper">{l.size}</span>
                      </span>
                      <span>
                        اللون: <span className="text-paper">{l.color}</span>
                      </span>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                      <div className="flex items-center border border-hair">
                        <button
                          onClick={() => setQty(i, l.qty - 1)}
                          className="h-10 w-10 text-mute hover:text-fire"
                          aria-label="إنقاص"
                        >
                          −
                        </button>
                        <span className="tech tnum w-9 text-center text-sm font-bold text-paper">{l.qty}</span>
                        <button
                          onClick={() => setQty(i, l.qty + 1)}
                          className="h-10 w-10 text-mute hover:text-fire"
                          aria-label="زيادة"
                        >
                          +
                        </button>
                      </div>
                      <Price p={{ ...p, price: p.price * l.qty, old: undefined }} />
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}

          <button
            onClick={() => go("/shop")}
            className="mt-6 flex items-center gap-2 text-sm font-bold text-mute hover:text-fire"
          >
            <ArrowRight size={16} /> متابعة التسوق
          </button>
        </div>

        {/* summary */}
        <aside className="h-fit border border-hair bg-panel p-6 lg:sticky lg:top-28">
          <h2 className="micro text-fire">ملخص الطلب</h2>

          <div className="mt-5 space-y-3 text-sm">
            <Row label="المجموع الفرعي" value={`${money(subtotal)} ر.س`} />
            <Row label={`الشحن — ${city.name}`} value={ship === 0 ? "مجاني" : `${money(ship)} ر.س`} tone={ship === 0 ? "neon" : undefined} />
            <Row label="ضريبة القيمة المضافة 15%" value={`${money(tax)} ر.س`} />
          </div>

          {subtotal < FREE_SHIP && (
            <div className="mt-5 border border-fire/40 bg-fire/5 p-3">
              <p className="text-[13px] leading-relaxed text-paper/85">
                أضف بقيمة{" "}
                <span className="tech tnum font-bold text-fire">{money(FREE_SHIP - subtotal)} ر.س</span>{" "}
                للحصول على شحن مجاني.
              </p>
              <div className="mt-2 h-1 w-full bg-hair">
                <div
                  className="h-full bg-fire transition-all duration-700"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-hair pt-5">
            <span className="text-sm font-bold text-mute">الإجمالي</span>
            <span className="tech tnum text-3xl font-bold text-paper">
              {money(total)}
              <span className="mr-1 text-sm font-medium text-mute">ر.س</span>
            </span>
          </div>

          <Btn full size="lg" className="mt-5" onClick={() => go("/checkout")}>
            إتمام الطلب <ArrowLeft size={17} />
          </Btn>

          <div className="mt-5 flex items-center justify-center gap-4 text-[11.5px] text-mute">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-neon" /> دفع آمن</span>
            <span className="flex items-center gap-1.5"><Truck size={13} className="text-neon" /> توصيل لكل المملكة</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "neon" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mute">{label}</span>
      <span className={`tech tnum font-semibold ${tone === "neon" ? "text-neon" : "text-paper"}`}>
        {value}
      </span>
    </div>
  );
}

/* ================= CHECKOUT ================= */
const STEPS = ["معلومات الشحن", "طريقة الدفع", "المراجعة والتأكيد"];
const PAYMENTS = [
  { k: "card", t: "بطاقة ائتمانية / مدى", d: "فيزا · ماستركارد · مدى · أبل باي" },
  { k: "wallet", t: "محفظة إلكترونية", d: "STC Pay · تابي · تمارا" },
  { k: "cod", t: "الدفع عند الاستلام", d: "رسوم إضافية 15 ر.س" },
];

export function Checkout() {
  const { cart, go, clear, toast } = useStore();
  const { subtotal, city, setCity, ship, tax, total } = useTotals();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState("card");
  const [done, setDone] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    card: "",
    exp: "",
    cvc: "",
  });

  const codFee = pay === "cod" ? 15 : 0;
  const grand = total + codFee;

  if (done)
    return (
      <div className="mx-auto grid min-h-[80vh] max-w-2xl place-items-center px-6 pt-32 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-fire bg-fire/10">
            <Check size={38} className="text-fire" />
          </span>
          <h1 className="display mt-7 text-[clamp(2rem,6vw,3.4rem)] text-paper">
            تم استلام طلبك
          </h1>
          <p className="mt-4 leading-relaxed text-mute">
            رقم الطلب{" "}
            <span className="tech tnum font-bold text-fire">#{done}</span> — سنرسل لك رسالة
            تتبّع على {f.phone || "رقمك المسجّل"} خلال دقائق.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Btn size="lg" onClick={() => go("/account")}>
              تتبع الطلب
            </Btn>
            <Btn size="lg" variant="ghost" onClick={() => go("/shop")}>
              متابعة التسوق
            </Btn>
          </div>
        </motion.div>
      </div>
    );

  if (cart.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 pt-32 pb-24 text-center">
        <div>
          <h1 className="display text-4xl text-paper">لا يمكن إتمام الدفع</h1>
          <p className="mt-4 text-mute">سلتك فارغة — أضف منتجات أولاً.</p>
          <Btn className="mt-7" onClick={() => go("/shop")}>إلى المتجر</Btn>
        </div>
      </div>
    );
  }

  const validate = () => {
    if (step === 0) {
      if (!f.name.trim() || f.phone.trim().length < 9 || !f.address.trim()) {
        toast("أكمل معلومات الشحن", "الاسم، رقم الجوال (9 أرقام على الأقل، والعنوان مطلوبة");
        return false;
      }
    }
    if (step === 1 && pay === "card" && f.card.replace(/\s/g, "").length < 12) {
      toast("رقم البطاقة غير مكتمل", "أدخل 16 رقماً للمتابعة");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step < 2) setStep(step + 1);
    else {
      setDone(String(Math.floor(100000 + Math.random() * 899999)));
      clear();
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <Micro>الدفع الآمن</Micro>
      <h1 className="display mt-5 text-[clamp(2.2rem,6vw,4rem)] text-paper">إتمام الطلب</h1>

      {/* stepper */}
      <ol className="mt-10 grid gap-px border border-hair bg-hair sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-3 px-5 py-4 transition-colors ${
              i === step ? "bg-fire/10" : "bg-[#0A0B0E]"
            }`}
          >
            <span
              className={`tech grid h-8 w-8 shrink-0 place-items-center text-[13px] font-bold ${
                i < step ? "bg-fire text-white" : i === step ? "bg-fire text-white" : "border border-hair text-mute"
              }`}
            >
              {i < step ? <Check size={15} /> : i + 1}
            </span>
            <span className={`text-[14px] font-bold ${i <= step ? "text-paper" : "text-mute"}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="border border-hair bg-panel p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-paper">معلومات الشحن</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="الاسم الكامل"
                      value={f.name}
                      onChange={(v) => setF({ ...f, name: v })}
                      placeholder="مثال: سلمان العتيبي"
                    />
                    <Field
                      label="رقم الجوال"
                      value={f.phone}
                      onChange={(v) => setF({ ...f, phone: v })}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                    <div>
                      <Label>المدينة</Label>
                      <select
                        value={city.name}
                        onChange={(e) =>
                          setCity(CITIES.find((c) => c.name === e.target.value) ?? CITIES[0])
                        }
                        className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper focus:border-fire focus:outline-none"
                      >
                        {CITIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} — {c.ship === 0 ? "شحن مجاني" : `${c.ship} ر.س`}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-[12px] text-mute">
                        التوصيل المتوقع: <span className="text-neon">{city.eta}</span>
                      </p>
                    </div>
                    <Field
                      label="الحي"
                      value={f.note}
                      onChange={(v) => setF({ ...f, note: v })}
                      placeholder="الملقا"
                    />
                  </div>
                  <div>
                    <Label>العنوان بالتفصيل</Label>
                    <textarea
                      rows={3}
                      value={f.address}
                      onChange={(e) => setF({ ...f, address: e.target.value })}
                      placeholder="الشارع، رقم المبنى، الرمز البريدي…"
                      className="w-full resize-none border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-paper">طريقة الدفع</h2>
                  <div className="space-y-3">
                    {PAYMENTS.map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setPay(m.k)}
                        className={`flex w-full items-center gap-4 border p-4 text-right transition-colors ${
                          pay === m.k ? "border-fire bg-fire/5" : "border-hair hover:border-neon/60"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            pay === m.k ? "border-fire" : "border-hair"
                          }`}
                        >
                          {pay === m.k && <span className="h-2.5 w-2.5 rounded-full bg-fire" />}
                        </span>
                        <span className="flex-1">
                          <span className="block text-[15px] font-bold text-paper">{m.t}</span>
                          <span className="block text-[12.5px] text-mute">{m.d}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {pay === "card" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-4 pt-2 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label>رقم البطاقة</Label>
                            <input
                              dir="ltr"
                              inputMode="numeric"
                              value={f.card}
                              onChange={(e) =>
                                setF({
                                  ...f,
                                  card: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 16)
                                    .replace(/(.{4})/g, "$1 ")
                                    .trim(),
                                })
                              }
                              placeholder="4242 4242 4242 4242"
                              className="tech tnum w-full border border-hair bg-ink px-4 py-3 text-sm tracking-widest text-paper placeholder:text-mute/70 focus:border-fire focus:outline-none"
                            />
                          </div>
                          <Field label="تاريخ الانتهاء" value={f.exp} onChange={(v) => setF({ ...f, exp: v })} placeholder="MM/YY" dir="ltr" />
                          <Field label="CVC" value={f.cvc} onChange={(v) => setF({ ...f, cvc: v.slice(0, 4) })} placeholder="123" dir="ltr" />
                        </div>
                        <p className="mt-4 flex items-center gap-2 text-[12.5px] text-mute">
                          <ShieldCheck size={14} className="text-neon" /> تشفير SSL 256-بت — لا نخزّن بيانات بطاقتك.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-paper">المراجعة النهائية</h2>

                  <div className="grid gap-5 border border-hair p-5 sm:grid-cols-2">
                    <div>
                      <span className="micro text-mute">الشحن إلى</span>
                      <p className="mt-2 text-sm leading-relaxed text-paper">
                        {f.name}
                        <br />
                        {f.address}
                        <br />
                        {city.name} — {f.phone}
                      </p>
                    </div>
                    <div>
                      <span className="micro text-mute">طريقة الدفع</span>
                      <p className="mt-2 text-sm text-paper">
                        {PAYMENTS.find((m) => m.k === pay)?.t}
                        {pay === "card" && f.card && (
                          <span className="tech tnum block text-mute" dir="ltr">
                            •••• {f.card.slice(-4)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-hair border border-hair">
                    {cart.map((l) => {
                      const p = findProduct(l.id);
                      if (!p) return null;
                      return (
                        <div key={`${l.id}${l.size}`} className="flex items-center gap-4 p-4">
                          <img src={p.img} alt="" className="h-16 w-14 object-cover" loading="lazy" />
                          <span className="flex-1">
                            <span className="block text-sm font-bold text-paper">{p.name}</span>
                            <span className="tech block text-[12px] text-mute">
                              {l.size} · {l.color} · ×{l.qty}
                            </span>
                          </span>
                          <span className="tech tnum text-sm font-bold text-paper">
                            {money(p.price * l.qty)} ر.س
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-hair pt-6">
            <button
              onClick={() => (step === 0 ? go("/cart") : setStep(step - 1))}
              className="flex items-center gap-2 text-sm font-bold text-mute hover:text-paper"
            >
              <ArrowRight size={16} /> {step === 0 ? "العودة للسلة" : "رجوع"}
            </button>
            <Btn size="lg" onClick={next}>
              {step === 2 ? `ادفع ${money(grand)} ر.س` : "متابعة"} <ArrowLeft size={17} />
            </Btn>
          </div>
        </div>

        {/* order summary */}
        <aside className="h-fit border border-hair bg-[#0A0B0E] p-6 lg:sticky lg:top-28">
          <h2 className="micro text-fire">ملخص الطلب</h2>
          <div className="mt-5 space-y-3 text-sm">
            <Row label={`المنتجات (${cart.length})`} value={`${money(subtotal)} ر.س`} />
            <Row label={`الشحن — ${city.name}`} value={ship === 0 ? "مجاني" : `${money(ship)} ر.س`} tone={ship === 0 ? "neon" : undefined} />
            <Row label="ضريبة 15%" value={`${money(tax)} ر.س`} />
            {codFee > 0 && <Row label="رسوم الدفع عند الاستلام" value={`${money(codFee)} ر.س`} />}
          </div>
          <div className="mt-5 flex items-baseline justify-between border-t border-hair pt-5">
            <span className="text-sm font-bold text-mute">الإجمالي</span>
            <span className="tech tnum text-3xl font-bold text-paper">
              {money(grand)}<span className="mr-1 text-sm font-medium text-mute">ر.س</span>
            </span>
          </div>
          <div className="mt-5 space-y-2.5 border-t border-hair pt-5 text-[12.5px] text-mute">
            <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-neon" /> ضمان أصلي 12 شهراً</p>
            <p className="flex items-center gap-2"><Truck size={14} className="text-neon" /> {city.eta}</p>
            <p className="flex items-center gap-2"><Package size={14} className="text-neon" /> إرجاع مجاني خلال 14 يوماً</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="micro mb-2 block text-mute">{children}</span>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
      />
    </div>
  );
}
