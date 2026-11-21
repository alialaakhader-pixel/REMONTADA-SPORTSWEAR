import { IMG } from "../lib/img";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  Package,
  Truck,
  RotateCcw,
  Heart,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import { useStore } from "../lib/store";
import { ARTICLES, FAQS, PRODUCTS } from "../lib/data";
import { Btn, Micro, Reveal, ProductCard, Stars, SectionHead } from "../components/ui";
import { LogoPlate } from "../components/Logo";

/* ================= ABOUT ================= */
export function About() {
  const { go, products } = useStore();
  return (
    <div>
      <section className="mx-auto max-w-[1440px] px-4 pt-32 sm:px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <Micro>قصة العلامة</Micro>
            <h1 className="display mt-6 text-[clamp(2.4rem,7vw,5.4rem)] text-paper">
              المونتادا
              <br />
              <span className="text-fire glow-fire">ليست رمزاً —</span>
              <br />
              إنها عادة.
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-[2] text-mute">
              في كرة القدم تعني «مونتادا» اللحظة التي يعود فيها الفريق من خلفية النتيجة
              ليقلب المباراة. اختارنا الاسم لأن كل رياضي يعرف تلك اللحظة: اليوم الذي
              قررت فيه ألا تتوقف. من هذه الفكرة وُلدت REMONTADA — علامة رياضية تصنع
              قطعاً ترافق العودة، لا الاستسلام.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Btn size="lg" onClick={() => go("/shop")}>
                تسوّق المجموعة <ArrowLeft size={17} />
              </Btn>
              <Btn size="lg" variant="ghost" onClick={() => go("/contact")}>
                تواصل معنا
              </Btn>
            </div>
          </div>
          <Reveal>
            <LogoPlate />
          </Reveal>
        </div>
      </section>

      {/* stats band */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["2021", "سنة التأسيس"],
            ["128K", "عميل في المملكة"],
            ["4.9", "متوسط التقييم"],
            ["7", "رياضات مدعومة"],
          ].map(([n, l], i) => (
            <Reveal key={l} delay={i * 0.07}>
              <div className="bg-[#0A0B0E] px-6 py-9">
                <div className="tech tnum text-4xl font-bold text-paper">{n}</div>
                <div className="mt-2 text-[13px] text-mute">{l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* story */}
      <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-3">
          {[
            {
              t: "الرؤية",
              d: "أن تكون أول عربية يفكّر بها الرياضي حين يبحث عن معدّاته — بجودة عالمية وهوية لا تُشبّه بأحد.",
            },
            {
              t: "الاسم",
              d: "مأخوذ من كلمة «العودة» في كرة القدم: النتيجة لا تُحسم حتى الدقيقة الأخيرة. من هنا جاءت شغفنا بالتفاصيل الصغيرة.",
            },
            {
              t: "الوعد",
              d: "قطعة واحدة تُصمَّم لتدوم موسمين كاملين، وإن لم تُقنعك، نستبدلها خلال 14 يوماً بلا أسئلة.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.09}>
              <article className="border-t-2 border-fire pt-6">
                <span className="tech tnum text-sm text-fire">0{i + 1}</span>
                <h3 className="display mt-3 text-2xl text-paper">{c.t}</h3>
                <p className="mt-4 text-[15px] leading-[1.95] text-mute">{c.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* values strip */}
      <section className="relative overflow-hidden border-y border-hair">
        <img src={IMG.running} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/85" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10">
          <blockquote className="display mx-auto max-w-4xl text-center text-[clamp(1.7rem,4.6vw,3.2rem)] leading-[1.35] text-paper">
            «لا نقيس نجاحنا بعدد القطع المباعة،
            <br />
            بل بعدد المرات التي{" "}
            <span className="text-fire">لم تتوقف فيها</span>»
          </blockquote>
          <p className="mt-6 text-center text-[13px] tracking-widest text-mute">
            — فريق تصميم REMONTADA، الرياض
          </p>
        </div>
      </section>

      <CTAInline />
    </div>
  );
}

/* ================= JOURNAL ================= */
export function Journal({ id }: { id?: string }) {
  const { go } = useStore();
  const article = ARTICLES.find((a) => a.id === id);

  if (article)
    return (
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6">
        <button onClick={() => go("/journal")} className="flex items-center gap-2 text-sm text-mute hover:text-fire">
          <ArrowLeft size={15} className="rotate-180" /> كل المقالات
        </button>
        <Micro className="mt-8">{article.tag}</Micro>
        <h1 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] text-paper">{article.title}</h1>
        <div className="tech mt-5 flex gap-5 text-[12.5px] tracking-widest text-mute">
          <span>{article.date}</span>
          <span>{article.read}</span>
        </div>
        <img src={article.img} alt="" className="mt-8 aspect-[16/9] w-full border border-hair object-cover" />
        <div className="mt-8 space-y-6 text-[16.5px] leading-[2.1] text-paper/85">
          <p>
            البداية دائماً تكون بإحساس واحد: خطوة أولى أثقل من المعتاد. في هذا المقال نمرّ
            على ما تعلّمناه من مدربين محترفين ورياضيين يتدربون خمسة أيام أسبوعياً — وكيف
            تُترجم تلك التجربة إلى قرارات شراء وتدريب أدق.
          </p>
          <h2 className="display pt-2 text-2xl text-paper">القاعدة الذهبية: لا تزيد أكثر من 10%</h2>
          <p>
            زيادة الحمل الأسبوعية بأكثر من 10% هي السبب الأول للإصابات المتكررة. إذا كنت
            تجري 30 كيلومتراً هذا الأسبوع، فلا تتجاوز 33 في التالي — مهما كان الحماس.
            الحماس يبني الفكرة، والانضباط يبني الأداء.
          </p>
          <blockquote className="border-r-2 border-fire bg-panel p-6 text-[16px] text-paper">
            «العودة لا تحدث في مباراة واحدة، بل في كل تمرين قررت فيه ألا تغيب.»
          </blockquote>
          <p>
            وبخصوص المعدات: القاعدة الوحيدة أن تجرّب قبل أن تشتري. اقرأ جدول المقاسات،
            قِس قدمك في نهاية اليوم حين تكون متوهجة قليلاً، ولا تنسَ أن الحذاء الجيد لا
            يُشعرك به — يُشعرك غيابه حين تتوقف.
          </p>
        </div>

        <div className="mt-14 border-t border-hair pt-10">
          <h3 className="display text-2xl text-paper">اقرأ أيضاً</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.id !== article.id).map((a) => (
              <button
                key={a.id}
                onClick={() => go(`/journal/${a.id}`)}
                className="group border border-hair p-5 text-right transition-colors hover:border-fire"
              >
                <span className="micro text-fire">{a.tag}</span>
                <span className="mt-3 block font-bold text-paper group-hover:text-fire">{a.title}</span>
                <span className="mt-2 block text-[13px] text-mute">{a.read}</span>
              </button>
            ))}
          </div>
        </div>
      </article>
    );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-32 sm:px-6 lg:px-10">
      <Micro>المدونة</Micro>
      <h1 className="display mt-5 max-w-3xl text-[clamp(2.4rem,7vw,5rem)] text-paper">
        ميدان المعرفة: تدريب، معدّات، <span className="text-fire">وعودات.</span>
      </h1>

      <Reveal>
        <button
          onClick={() => go(`/journal/${ARTICLES[0].id}`)}
          className="group mt-12 grid w-full gap-0 border border-hair text-right lg:grid-cols-2"
        >
          <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[400px]">
            <img
              src={ARTICLES[0].img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-ink/70 to-transparent" />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <span className="micro text-neon">{ARTICLES[0].tag} · مقال مميّز</span>
            <h2 className="display mt-4 text-[clamp(1.5rem,3.4vw,2.6rem)] text-paper group-hover:text-fire">
              {ARTICLES[0].title}
            </h2>
            <p className="mt-4 text-[15px] leading-[1.95] text-mute">{ARTICLES[0].excerpt}</p>
            <span className="tech mt-6 text-[12px] tracking-widest text-mute">
              {ARTICLES[0].date} · {ARTICLES[0].read}
            </span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-fire">
              اقرأ المقال <ArrowLeft size={15} />
            </span>
          </div>
        </button>
      </Reveal>

      <div className="mt-14 grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.slice(1).map((a, i) => (
          <Reveal key={a.id} delay={i * 0.08}>
            <button
              onClick={() => go(`/journal/${a.id}`)}
              className="group flex h-full w-full flex-col border border-hair text-right transition-all duration-[400ms] hover:border-fire"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={a.img}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="micro text-fire">{a.tag}</span>
                <h3 className="mt-3 flex-1 text-lg font-bold leading-snug text-paper group-hover:text-fire">
                  {a.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-mute">{a.excerpt}</p>
                <span className="tech mt-5 text-[11.5px] tracking-widest text-mute">
                  {a.date} · {a.read}
                </span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ================= CONTACT ================= */
export function Contact() {
  const { toast } = useStore();
  const [f, setF] = useState({ n: "", e: "", m: "" });

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-32 sm:px-6 lg:px-10">
      <Micro>تواصل معنا</Micro>
      <h1 className="display mt-5 max-w-3xl text-[clamp(2.4rem,7vw,5rem)] text-paper">
        فريقنا يرد <span className="text-fire">خلال دقائق.</span>
      </h1>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_420px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.n || !f.e.includes("@") || !f.m) {
              toast("أكمل الحقول", "الاسم والبريد والرسالة مطلوبة");
              return;
            }
            toast("أُرسلت رسالتك", "سنرد عليك خلال ساعات العمل");
            setF({ n: "", e: "", m: "" });
          }}
          className="border border-hair bg-panel p-7 sm:p-9"
        >
          <h2 className="text-xl font-bold text-paper">أرسل رسالة</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <span className="micro mb-2 block text-mute">الاسم</span>
              <input
                value={f.n}
                onChange={(e) => setF({ ...f, n: e.target.value })}
                placeholder="اسمك الكامل"
                className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
              />
            </div>
            <div>
              <span className="micro mb-2 block text-mute">البريد الإلكتروني</span>
              <input
                dir="ltr"
                value={f.e}
                onChange={(e) => setF({ ...f, e: e.target.value })}
                placeholder="name@mail.com"
                className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-5">
            <span className="micro mb-2 block text-mute">الموضوع</span>
            <select className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper focus:border-fire focus:outline-none">
              <option>استفسار عن منتج</option>
              <option>طلب أو إرجاع</option>
              <option>تعاون تجاري / جملة</option>
              <option>شيء آخر</option>
            </select>
          </div>
          <div className="mt-5">
            <span className="micro mb-2 block text-mute">الرسالة</span>
            <textarea
              rows={6}
              value={f.m}
              onChange={(e) => setF({ ...f, m: e.target.value })}
              placeholder="اكتب تفاصيل طلبك أو استفسارك هنا…"
              className="w-full resize-none border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
            />
          </div>
          <Btn type="submit" size="lg" className="mt-6">إرسال الرسالة</Btn>
        </form>

        <aside className="space-y-4">
          {[
            { I: MessageCircle, t: "واتساب", v: "+966 50 000 0000", d: "الأسرع — من 9ص حتى 11م" },
            { I: Phone, t: "هاتف", v: "+966 11 000 0000", d: "خدمة العملاء يومياً" },
            { I: Mail, t: "البريد", v: "care@remontada.sa", d: "نرد خلال 12 ساعة" },
            { I: MapPin, t: "المقر", v: "حي الملقا، الرياض", d: "ال المملكة العربية السعودية" },
            { I: Clock, t: "أوقات العمل", v: "السبت – الخميس", d: "9:00 ص – 11:00 م" },
          ].map((c) => (
            <Reveal key={c.t}>
              <div className="flex items-start gap-4 border border-hair bg-panel p-5 transition-colors hover:border-fire/60">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-fire/40 text-fire">
                  <c.I size={18} />
                </span>
                <span>
                  <span className="micro block text-mute">{c.t}</span>
                  <span className="tech mt-1 block text-[15px] font-bold text-paper" dir="ltr">
                    {c.v}
                  </span>
                  <span className="mt-1 block text-[12.5px] text-mute">{c.d}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </aside>
      </div>

      {/* stylised map */}
      <Reveal>
        <div className="relative mt-12 overflow-hidden border border-hair bg-[#0A0B0E]">
          <svg viewBox="0 0 800 320" className="h-[300px] w-full" role="img" aria-label="خريطة موقع المقر في الرياض">
            <rect width="800" height="320" fill="#0A0B0E" />
            <g stroke="#1E2126" strokeWidth="1">
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="320" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 45} x2="800" y2={i * 45} />
              ))}
            </g>
            <g stroke="#2A2F37" strokeWidth="7" strokeLinecap="round" fill="none">
              <path d="M0 210 L340 210 L470 120 L800 120" />
              <path d="M240 320 L240 90 L520 90 L520 0" />
              <path d="M0 60 L200 60 L340 210 L470 320" />
            </g>
            <g stroke="#35C8FF" strokeWidth="2" fill="none" opacity="0.45">
              <path d="M0 285 L800 285" />
            </g>
            <g fill="#141821">
              <rect x="60" y="110" width="120" height="70" />
              <rect x="580" y="170" width="150" height="90" />
              <rect x="300" y="240" width="90" height="55" />
            </g>
            <g transform="translate(400,150)">
              <circle r="34" fill="#E6392B" opacity="0.14" className="beacon" />
              <circle r="7" fill="#E6392B" />
              <circle r="13" fill="none" stroke="#E6392B" strokeWidth="2" />
              <line y1="-30" y2="-16" stroke="#E6392B" strokeWidth="2" />
              <line y1="16" y2="30" stroke="#E6392B" strokeWidth="2" />
              <line x1="-30" x2="-16" stroke="#E6392B" strokeWidth="2" />
              <line x1="16" x2="30" stroke="#E6392B" strokeWidth="2" />
            </g>
            <text x="430" y="146" fill="#F5F6F7" fontSize="13" fontFamily="Cairo, sans-serif">
              مقر REMONTADA — الملقا
            </text>
          </svg>
          <div className="absolute bottom-4 right-4 border border-hair bg-ink/90 px-4 py-2 text-[12.5px] text-mute backdrop-blur">
            إحداثيات الموقع تقريبية · للزيارة يُرجى الحجز مسبقاً
          </div>
        </div>
      </Reveal>
      <div className="h-24" />
    </div>
  );
}

/* ================= FAQ ================= */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const list = FAQS.filter((f) => f.q.includes(q) || f.a.includes(q));

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 sm:px-6">
      <Micro>الأسئلة الشائعة</Micro>
      <h1 className="display mt-5 text-[clamp(2.4rem,7vw,4.6rem)] text-paper">
        كل ما تتساءل عنه <span className="text-fire">قبل الطلب.</span>
      </h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث في الأسئلة…"
        className="mt-9 w-full border border-hair bg-panel px-5 py-4 text-paper placeholder:text-mute focus:border-fire focus:outline-none"
      />

      <div className="mt-8 divide-y divide-hair border-y border-hair">
        {list.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 py-6 text-right"
              >
                <span className="flex items-start gap-4">
                  <span className="tech tnum pt-1 text-[12px] text-fire">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[16.5px] font-bold ${isOpen ? "text-fire" : "text-paper"}`}>
                    {f.q}
                  </span>
                </span>
                <ChevronDown
                  size={19}
                  className={`shrink-0 transition-transform duration-[400ms] ${
                    isOpen ? "rotate-180 text-fire" : "text-mute"
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-7 pr-9 text-[15px] leading-[2] text-mute">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="py-10 text-center text-mute">لا نتائج — جرّب كلمة أبسط مثل «شحن» أو «إرجاع».</p>
        )}
      </div>

      <div className="my-16 border border-hair bg-panel p-8 text-center">
        <h2 className="display text-2xl text-paper">لم تجد إجابتك؟</h2>
        <p className="mt-3 text-mute">فريق خدمة العملاء متاح يومياً من 9 صباحاً حتى 11 مساءً.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Btn onClick={() => (window.location.hash = "/contact")}>تواصل معنا</Btn>
          <Btn variant="ghost" onClick={() => (window.location.hash = "/contact")}>
            واتساب مباشر
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ================= RETURNS & SHIPPING ================= */
export function Returns() {
  const sections = [
    {
      I: Truck,
      t: "الشحن والتوصيل",
      rows: [
        ["الرياض", "24 ساعة — مجاني فوق 400 ر.س"],
        ["جدة والدمام ومكة", "48 ساعة — 15 ر.س"],
        ["باقي مدن المملكة", "48–72 ساعة — 20 إلى 25 ر.س"],
        ["دول الخليج", "3–6 أيام عمل — يُحسب عند الدفع"],
      ],
    },
    {
      I: RotateCcw,
      t: "الإرجاع والاستبدال",
      rows: [
        ["مدة الإرجاع", "14 يوماً من تاريخ الاستلام"],
        ["شرط الإرجاع", "القطعة بحالتها الأصلية مع العلبة والبطاقة"],
        ["رسوم الإرجاع", "مجاني في أول طلب داخل المملكة"],
        ["استبدال المقاس", "مجاني مرة واحدة لكل طلب"],
        ["استرداد المبلغ", "3–7 أيام عمل لنفس وسيلة الدفع"],
      ],
    },
    {
      I: Package,
      t: "الضمان والأصالة",
      rows: [
        ["ضمان الجودة", "12 شهراً على عيوب التصنيع"],
        ["الأصالة", "فحص من الموزّع الرسمي قبل الشحن"],
        ["الاستثناءات", "ملابس السباحة والملابس الداخلية لأسباب صحية"],
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 sm:px-6">
      <Micro>السياسات</Micro>
      <h1 className="display mt-5 text-[clamp(2.4rem,7vw,4.6rem)] text-paper">
        الشحن، الإرجاع، <span className="text-fire">والضمان.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-[16px] leading-[2] text-mute">
        قواعد واضحة بلا بنود مخفية. هذه السياسة سارية اعتباراً من فبراير 2026 وتسري على
        جميع الطلبات داخل المملكة العربية السعودية ودول مجلس التعاون.
      </p>

      <div className="mt-14 space-y-6">
        {sections.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.08}>
            <section className="border border-hair bg-panel">
              <header className="flex items-center gap-3 border-b border-hair px-6 py-5">
                <s.I size={19} className="text-fire" />
                <h2 className="text-lg font-bold text-paper">{s.t}</h2>
                <span className="tech tnum mr-auto text-[12px] text-mute">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </header>
              <dl className="divide-y divide-hair">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-6 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
                    <dt className="text-[14px] font-bold text-paper">{k}</dt>
                    <dd className="text-[14.5px] leading-relaxed text-mute">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border border-fire/40 bg-fire/5 p-6">
        <Check size={18} className="mt-0.5 shrink-0 text-fire" />
        <p className="text-[14.5px] leading-relaxed text-paper/85">
          لبدء إرجاع: افتح «طلباتي» في حسابك، اختر الطلب، ثم «طلب إرجاع» — ستصلك بطاقة
          شحن جاهزة خلال دقائق، ويُستبدل المنتج أو يُعاد المبلغ خلال 3 أيام عمل من استلامه.
        </p>
      </div>
      <div className="h-24" />
    </div>
  );
}

/* ================= ACCOUNT ================= */
const ORDERS = [
  { id: "RM-84120", date: "18 فبراير 2026", status: "تم التوصيل", total: 1278, items: 3 },
  { id: "RM-83766", date: "2 فبراير 2026", status: "قيد الشحن", total: 529, items: 1 },
  { id: "RM-83011", date: "11 يناير 2026", status: "تم التوصيل", total: 648, items: 2 },
];

export function Account() {
  const { toast, go, wish } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<"orders" | "data">("orders");

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-32 sm:px-6 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
        <aside>
          <Micro>حسابي</Micro>
          <h1 className="display mt-5 text-[clamp(2rem,5vw,3.2rem)] text-paper">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </h1>

          <div className="mt-7 border border-hair bg-panel p-6">
            <div className="mb-6 flex border border-hair">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-[13.5px] font-bold transition-colors ${
                    mode === m ? "bg-fire text-white" : "text-mute hover:text-paper"
                  }`}
                >
                  {m === "login" ? "دخول" : "حساب جديد"}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast(
                  mode === "login" ? "أهلاً بعودتك" : "تم إنشاء الحساب",
                  "يمكنك الآن متابعة طلباتك ومفضلتك"
                );
              }}
              className="space-y-4"
            >
              {mode === "register" && (
                <input
                  placeholder="الاسم الكامل"
                  className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
                />
              )}
              <input
                dir="ltr"
                type="email"
                placeholder="name@mail.com"
                className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
              />
              <input
                dir="ltr"
                type="password"
                placeholder="••••••••"
                className="w-full border border-hair bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
              />
              {mode === "register" && (
                <label className="flex items-start gap-3 text-[13px] text-mute">
                  <input type="checkbox" defaultChecked className="mt-1 accent-[#E6392B]" />
                  أريد الاشتراك في نشرة REMONTADA والعروض الأسبوعية.
                </label>
              )}
              <Btn type="submit" full size="lg">
                {mode === "login" ? "دخول" : "إنشاء الحساب"}
              </Btn>
            </form>
            <p className="mt-4 text-center text-[12.5px] text-mute">
              بالمتابعة أنت توافق على شروط الاستخدام وسياسة الخصوصية.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => go("/wishlist")}
              className="flex items-center justify-center gap-2 border border-hair py-3.5 text-[13.5px] font-bold text-mute transition-colors hover:border-fire hover:text-fire"
            >
              <Heart size={15} /> المفضلة ({wish.length})
            </button>
            <button
              onClick={() => go("/cart")}
              className="flex items-center justify-center gap-2 border border-hair py-3.5 text-[13.5px] font-bold text-mute transition-colors hover:border-fire hover:text-fire"
            >
              <ShoppingBag size={15} /> السلة
            </button>
          </div>
        </aside>

        <section>
          <div className="flex gap-1 border-b border-hair">
            {(
              [
                ["orders", "طلباتي"],
                ["data", "بياناتي"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative px-6 py-4 text-[14.5px] font-bold transition-colors ${
                  tab === k ? "text-fire" : "text-mute hover:text-paper"
                }`}
              >
                {l}
                {tab === k && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-fire" />}
              </button>
            ))}
          </div>

          {tab === "orders" ? (
            <div className="mt-6 space-y-4">
              {ORDERS.map((o, i) => (
                <Reveal key={o.id} delay={i * 0.07}>
                  <article className="flex flex-wrap items-center gap-5 border border-hair bg-panel p-5">
                    <span className="tech grid h-14 w-14 shrink-0 place-items-center border border-hair text-[11px] text-mute">
                      #{o.id.slice(-4)}
                    </span>
                    <span className="min-w-[160px] flex-1">
                      <span className="tech block text-sm font-bold text-paper">{o.id}</span>
                      <span className="block text-[12.5px] text-mute">{o.date} · {o.items} قطعة</span>
                    </span>
                    <span
                      className={`tech px-3 py-1.5 text-[11.5px] font-bold ${
                        o.status === "تم التوصيل"
                          ? "bg-neon/15 text-neon"
                          : "bg-fire/15 text-fire"
                      }`}
                    >
                      {o.status}
                    </span>
                    <span className="tech tnum text-lg font-bold text-paper">{moneyS(o.total)} ر.س</span>
                    <Btn size="sm" variant="ghost" onClick={() => go("/shop")}>
                      إعادة الطلب
                    </Btn>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 border border-hair bg-panel p-6 sm:grid-cols-2">
              {[
                ["الاسم", "سلمان العتيبي"],
                ["البريد", "salman@mail.com"],
                ["الجوال", "+966 55 000 0000"],
                ["المدينة", "الرياض — الملقا"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="micro block text-mute">{k}</span>
                  <input
                    defaultValue={v}
                    dir={k === "الاسم" ? "rtl" : "ltr"}
                    className="mt-2 w-full border border-hair bg-ink px-4 py-3 text-sm text-paper focus:border-fire focus:outline-none"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Btn onClick={() => toast("حُفظت البيانات")}>حفظ التعديلات</Btn>
              </div>
            </div>
          )}
        </section>
      </div>
      <div className="h-24" />
    </div>
  );
}

const moneyS = (n: number) => n.toLocaleString("en-US");

/* ================= WISHLIST ================= */
export function Wishlist() {
  const { wish, go } = useStore();
  const items = products.filter((p) => wish.includes(p.id));

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <Micro>المفضلة</Micro>
      <h1 className="display mt-5 text-[clamp(2.2rem,6vw,4rem)] text-paper">
        قطعك المحفوظة <span className="text-fire">({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div className="mt-14 grid place-items-center border border-dashed border-hair py-24 text-center">
          <div>
            <Heart size={46} className="mx-auto text-hair" />
            <h2 className="display mt-5 text-2xl text-paper">لا توجد قطع محفوظة بعد</h2>
            <p className="mt-3 text-mute">اضغط على القلب في أي منتج لتحفظه هنا للشراء لاحقاً.</p>
            <Btn className="mt-6" onClick={() => go("/shop")}>تصفح المنتجات</Btn>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= shared CTA ================= */
export function CTAInline() {
  const { go } = useStore();
  return (
    <section className="border-t border-hair bg-[#0A0B0E]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <Micro tone="neon">جاهز للانطلاق؟</Micro>
          <h2 className="display mt-5 max-w-2xl text-[clamp(1.9rem,5vw,3.4rem)] text-paper">
            اختر رياضتك، ونحن نتكفّل بالباقي.
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn size="lg" onClick={() => go("/shop")}>
            تسوّق الآن <ArrowLeft size={17} />
          </Btn>
          <Btn size="lg" variant="ghost" onClick={() => go("/contact")}>
            تواصل معنا
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* small helper for product stars reuse */
export { Stars, SectionHead };
