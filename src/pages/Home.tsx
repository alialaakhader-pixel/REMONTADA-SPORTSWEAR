import { IMG } from "../lib/img";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Tag,
  Check,
  ChevronDown,
  Quote,
  Zap,
} from "lucide-react";
import { useStore } from "../lib/store";
import { PRODUCTS, SPORTS, TESTIMONIALS, FAQS, CLUB, money } from "../lib/data";
import {
  Reveal,
  Micro,
  SectionHead,
  Btn,
  ProductCard,
  SportIcon,
  Stars,
} from "../components/ui";

export default function Home() {
  const { go, products } = useStore();
  const [tab, setTab] = useState<"new" | "offers">("new");
  const [faq, setFaq] = useState<number | null>(0);
  const [heroTitle] = useState(() => localStorage.getItem("remontada:hero-title") || "العودة قرار.");
  const [heroImage] = useState(() => localStorage.getItem("remontada:hero-image") || IMG.hero);
  const [visibleSports] = useState<string[]>(() => { try { const cfg = JSON.parse(localStorage.getItem("remontada:sports") || "{}"); return SPORTS.filter(s => cfg[s] !== false); } catch { return [...SPORTS]; } });

  const newest = products.filter((p) => p.badge === "جديد" || p.badge === "الأكثر مبيعاً").slice(0, 4);
  const offers = products.filter((p) => p.old).slice(0, 4);
  const shown = tab === "new" ? newest : offers;

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="رياضي في حالة انطلاق داخل ملعب ليلي"
            className="h-full w-full object-cover object-[28%_center]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to left, #05050F 0%, rgba(5,5,15,.94) 34%, rgba(5,5,15,.45) 66%, rgba(5,5,15,.82) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #05050F 2%, transparent 42%)",
            }}
          />
          {/* diagonal red beacon */}
          <div
            className="absolute inset-y-0 right-[36%] w-[14%] opacity-[0.16]"
            style={{
              background:
                "linear-gradient(to bottom, transparent, #00B4FF 45%, transparent)",
              transform: "skewX(-11deg)",
            }}
          />
          <div className="absolute inset-0 grid-lines opacity-[0.35]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] items-center px-4 pb-24 pt-32 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-4">
              <span className="beacon h-2.5 w-2.5 rotate-45 bg-fire" />
              <span className="micro text-fire">موسم 2026 — الإصدار الثاني</span>
            </div>

            <h1 className="display mt-6 text-[clamp(2.9rem,8.4vw,6.6rem)] text-paper">
              ارتقِ إلى
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 glow-fire">{heroTitle}</span>
                <span className="absolute inset-x-0 bottom-[0.12em] z-0 h-[0.22em] bg-fire/85" />
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[16px] leading-[1.9] text-mute sm:text-[17px]">
              ملابس، أحذية، ومعدات مصنوعة للرياضيين الذين يرفضون الاستسلام. هندسة دقيقة،
              أقمشة تنفّس، وتصميم أسود وأزرق كهربائي لا يُنسى من الملعب.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Btn size="lg" onClick={() => go("/shop")}>
                تسوّق الآن <ArrowLeft size={17} />
              </Btn>
              <Btn size="lg" variant="ghost" onClick={() => go("/shop?sort=new")}>
                اكتشف المجموعات الجديدة
              </Btn>
            </div>

          </motion.div>
        </div>

        {/* giant latin wordmark, cropped */}
        <div
          className="tech pointer-events-none absolute bottom-[-0.22em] left-0 hidden w-full select-none overflow-hidden text-center font-bold leading-none text-transparent lg:block"
          style={{
            fontSize: "clamp(5rem,13vw,12rem)",
            letterSpacing: "0.02em",
            WebkitTextStroke: "1px rgba(154,161,171,.22)",
          }}
          aria-hidden
        >
          REMONTADA
        </div>

        <div className="absolute bottom-6 right-4 z-10 hidden items-center gap-3 sm:right-10 lg:flex">
          <span className="micro text-mute">مرّر</span>
          <span className="h-10 w-px bg-gradient-to-b from-fire to-transparent" />
        </div>
      </section>

      {/* Verified store benefits will be configured from the admin dashboard. */}
      {/* ============ FEATURED COLLECTIONS ============ */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHead
          kicker="المجموعات المميزة"
          title={
            <>
              ثلاث ملاعب.
              <br />
              <span className="text-fire">هوية واحدة.</span>
            </>
          }
          sub="مجموعات مبنية حول طبيعة كل رياضة — من عشب الملعب إلى أسفلت الطريق وحديد الصالة."
          action={
            <Btn variant="ghost" onClick={() => go("/shop")}>
              كل المجموعات <ArrowLeft size={16} />
            </Btn>
          }
        />

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              t: "كرة القدم",
              s: "اكتشف المجموعة",
              img: IMG.football,
              d: "أطقم مبارات، سترات تدريب، وأحذية عشب.",
            },
            {
              t: "الجري",
              s: "اكتشف المجموعة",
              img: IMG.running,
              d: "أحذية طريق، طبقات ليلية، وقطع عاكسة.",
            },
            {
              t: "الجيم",
              s: "اكتشف المجموعة",
              img: IMG.gym,
              d: "ملابس حديد، قفازات، ومعدات صلبة.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.09}>
              <button
                onClick={() => go(`/shop?s=${encodeURIComponent(c.t)}`)}
                className="group relative block h-[440px] w-full overflow-hidden border border-hair text-right sm:h-[520px]"
              >
                <img
                  src={c.img}
                  alt={c.t}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                <div
                  className="absolute inset-0 bg-fire/0 transition-colors duration-500 group-hover:bg-fire/10"
                  style={{
                    clipPath: "polygon(100% 0, 100% 46%, 62% 0)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="micro text-neon">{c.s}</span>
                  <h3 className="display mt-3 text-3xl text-paper">{c.t}</h3>
                  <p className="mt-2 text-[13.5px] text-mute">{c.d}</p>
                  <span className="mt-4 inline-flex items-center gap-2 border-b border-fire pb-1 text-sm font-bold text-paper transition-colors group-hover:text-fire">
                    استكشف المجموعة <ArrowLeft size={15} />
                  </span>
                </div>
                <span className="absolute left-0 top-0 h-16 w-16 bg-fire" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ NEW ARRIVALS / WEEKLY OFFERS ============ */}
      <section className="border-y border-hair bg-[#0A0B0E]">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Micro tone="neon">PRODUITS</Micro>
              <h2 className="display mt-5 text-[clamp(2rem,5vw,3.4rem)] text-paper">
                {tab === "new" ? "أحدث الوصولات" : "عروض الأسبوع"}
              </h2>
            </div>
            <div className="flex border border-hair">
              {(
                [
                  ["new", "أحدث الوصولات"],
                  ["offers", "عروض الأسبوع"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`relative px-5 py-3 text-[13px] font-bold transition-colors ${
                    tab === k ? "text-ink" : "text-mute hover:text-paper"
                  }`}
                >
                  {tab === k && (
                    <motion.span
                      layoutId="tabpill"
                      className="absolute inset-0 bg-fire"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY REMONTADA ============ */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Micro>لماذا REMONTADA؟</Micro>
            <h2 className="display mt-5 text-[clamp(2rem,5vw,3.4rem)] text-paper">
              لا نبيع
              <br />
              وعوداً —
              <br />
              <span className="text-fire">نبيع فرقاً.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.95] text-mute">
              كل قطعة تمر بأربع نقاط فحص قبل أن تصل إليك. إن لم تُقنعك في أول تمرين،
              نستبدلها — بلا أسئلة.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-hair px-5 py-3">
              <Zap size={16} className="text-gold" />
              <span className="text-[13px] text-mute">
                معدّل رضا العملاء هذا الشهر:{" "}
                <span className="tech tnum font-bold text-paper">97.4%</span>
              </span>
            </div>
          </div>

          <ul className="divide-y divide-hair border-y border-hair">
            {[
              {
                I: ShieldCheck,
                t: "جودة عالية وضمان أصلي",
                d: "قطع موثّقة من موزّعين رسميين مع ضمان حسب سياسة المتجر على عيوب التصنيع.",
              },
              {
                I: Truck,
                t: "توصيل سريع لكل المملكة",
                d: "الرياض خلال 24 ساعة، وباقي المدن خلال 48–72 ساعة مع تتبّع لحظي.",
              },
              {
                I: RotateCcw,
                t: "إرجاع واستبدال بلا تعقيد",
                d: "14 يوماً لإرجاع أي قطعة، واستبدال المقاس مجاناً في أول طلب.",
              },
              {
                I: Tag,
                t: "أسعار تنافسية وعدسة خصم",
                d: "عروض أسبوعية حقيقية لا تُلغى بعد يوم، ونقاط تُجمع مع كل عملية شراء.",
              },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <li className="group flex gap-6 py-8 transition-colors hover:bg-white/[0.02]">
                  <span className="tech tnum text-sm text-fire">0{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <f.I size={20} className="text-neon transition-colors group-hover:text-fire" />
                      <h3 className="text-lg font-bold text-paper">{f.t}</h3>
                    </div>
                    <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-mute">{f.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ SPORTS ============ */}
      <section className="relative overflow-hidden border-y border-hair bg-[#0A0B0E]">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
          <SectionHead
            kicker="الرياضات التي نغطيها"
            title="سبع ملاعب تحت سقف واحد"
            sub="اختر رياضتك وسنوجّهك مباشرة إلى المجموعة المناسبة."
          />
          <div className="grid grid-cols-2 gap-px bg-hair sm:grid-cols-3 lg:grid-cols-7">
            {visibleSports.map((s, i) => (
              <Reveal key={s} delay={i * 0.05}>
                <button
                  onClick={() => go(`/shop?s=${encodeURIComponent(s)}`)}
                  className="group flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0A0B0E] px-3 py-9 text-center transition-all duration-[400ms] hover:bg-fire"
                >
                  <span className="text-neon transition-all duration-[400ms] group-hover:text-white group-hover:-translate-y-1">
                    <SportIcon name={s} size={38} />
                  </span>
                  <span className="text-[13.5px] font-bold text-paper transition-colors group-hover:text-white">
                    {s}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Membership plans are hidden until configured by the store owner. */}
      {/* Customer testimonials will appear after verified reviews are collected. */}
      {/* ============ FAQ ============ */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Micro>الأسئلة الشائعة</Micro>
            <h2 className="display mt-5 text-[clamp(2rem,5vw,3.2rem)] text-paper">
              كل ما تحتاج
              <br />
              معرفته قبل الطلب
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-mute">
              لم تجد إجابتك؟ فريق خدمة العملاء يرد خلال دقائق على واتساب.
            </p>
            <Btn className="mt-6" variant="ghost" onClick={() => go("/faq")}>
              كل الأسئلة <ArrowLeft size={15} />
            </Btn>
          </div>

          <div className="divide-y divide-hair border-y border-hair">
            {FAQS.slice(0, 5).map((f, i) => {
              const open = faq === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-5 py-6 text-right"
                  >
                    <span
                      className={`text-[16px] font-bold transition-colors ${
                        open ? "text-fire" : "text-paper hover:text-fire"
                      }`}
                    >
                      {f.q}
                    </span>
                    <ChevronDown
                      size={19}
                      className={`shrink-0 text-mute transition-transform duration-[400ms] ${
                        open ? "rotate-180 text-fire" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pl-8 text-[14.5px] leading-[1.95] text-mute">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative isolate overflow-hidden">
        <img
          src={IMG.cta}
          alt="رياضي يستعد للخروج إلى الملعب"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(5,5,15,.96) 12%, rgba(5,5,15,.78) 55%, rgba(0,180,255,.28) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="max-w-2xl">
            <Micro tone="neon">ابدأ اليوم</Micro>
            <h2 className="display mt-6 text-[clamp(2.2rem,6vw,4.6rem)] text-paper">
              الخسارة اختيار.
              <br />
              <span className="text-fire glow-fire">العودة قرار.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-[1.9] text-paper/75">
              اطلب اليوم واستلم خلال 24 ساعة داخل الرياض. سياسة إرجاع واضحة، واستبدال مقاس
              بدون رسوم في أول طلب.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Btn size="lg" onClick={() => go("/shop")}>
                تسوّق الآن <ArrowLeft size={17} />
              </Btn>
              <Btn size="lg" variant="neon" onClick={() => go("/about")}>
                قصة REMONTADA
              </Btn>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-mute">
              {["توصيل مدفوع حسب المحافظة", "ضمان أصلي 12 شهراً", "دفع عند الاستلام"].map((x) => (
                <span key={x} className="flex items-center gap-2">
                  <Check size={14} className="text-fire" /> {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ OFFER STRIP ============ */}
      <section className="border-y border-hair bg-fire">
        <div className="marquee-track py-3">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={`${k}-${i}`}
                  className="tech flex items-center gap-6 whitespace-nowrap px-6 text-[13px] font-bold tracking-[0.2em] text-white"
                >
                  خصم 30% على مجموعة الجري
                  <span className="h-2 w-2 rotate-45 bg-ink/70" />
                  {money(400)} ر.س للشحن المجاني
                  <span className="h-2 w-2 rotate-45 bg-ink/70" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
