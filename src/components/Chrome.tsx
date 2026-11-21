import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Truck,
  Phone,
} from "lucide-react";
import { useStore } from "../lib/store";
import { PRODUCTS } from "../lib/data";
import { Wordmark, IbexMark } from "./Logo";
import { Btn } from "./ui";

const NAV = [
  { label: "الرئيسية", to: "/" },
  { label: "المتجر", to: "/shop" },
  { label: "المدونة", to: "/journal" },
  { label: "من نحن", to: "/about" },
  { label: "تواصل معنا", to: "/contact" },
];

const TICKER = [
  "التوصيل مدفوع ويُحسب حسب المحافظة",
  "سياسة الاستبدال والاسترجاع واضحة",
  "اكتشف المجموعات الرياضية",
  "رسوم التوصيل تظهر قبل تأكيد الطلب",
  "طرق الدفع تُعلن عند تفعيلها",
];

export function Ticker() {
  return (
    <div className="relative z-40 overflow-hidden border-b border-hair bg-panel">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {TICKER.map((t, i) => (
              <span
                key={`${k}-${i}`}
                className="flex items-center gap-3 whitespace-nowrap px-6 py-2 text-[12px] font-semibold text-mute"
              >
                <span className="h-1.5 w-1.5 rotate-45 bg-fire" />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { go, route, count, wish, setSearchOpen, searchOpen } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-hair bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-ink/90 to-transparent"
        }`}
      >
        <Ticker />
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          {/* logo */}
          <button
            onClick={() => go("/")}
            className="shrink-0 transition-transform duration-300 hover:-translate-y-0.5"
            aria-label="REMONTADA الصفحة الرئيسية"
          >
            <Wordmark compact />
          </button>

          {/* desktop nav */}
          <nav className="mr-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = route === n.to;
              return (
                <button
                  key={n.to}
                  onClick={() => go(n.to)}
                  className={`relative px-3.5 py-2 text-[14px] font-bold transition-colors duration-300 ${
                    active ? "text-fire" : "text-paper/85 hover:text-paper"
                  }`}
                >
                  {n.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-px origin-right bg-fire transition-transform duration-[400ms] ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="mr-auto flex items-center gap-1 sm:gap-2">
            <IconBtn label="بحث" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </IconBtn>
            <IconBtn label="المفضلة" onClick={() => go("/wishlist")} badge={wish.length}>
              <Heart size={18} />
            </IconBtn>
            <IconBtn label="الحساب" onClick={() => go("/account")} className="hidden sm:grid">
              <User size={18} />
            </IconBtn>
            <IconBtn label="السلة" onClick={() => go("/cart")} badge={count}>
              <ShoppingBag size={18} />
            </IconBtn>
            <button
              onClick={() => setOpen(true)}
              aria-label="القائمة"
              className="grid h-10 w-10 place-items-center rounded-[3px] border border-hair text-paper transition-colors hover:border-fire hover:text-fire lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
        <div
          className={`h-px w-full bg-gradient-to-l from-transparent via-fire/70 to-transparent transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </header>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-ink/97 backdrop-blur-lg lg:hidden"
          >
            <div className="flex h-[68px] items-center justify-between px-5">
              <Wordmark compact />
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-10 w-10 place-items-center border border-hair text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 flex flex-col px-5">
              {NAV.map((n, i) => (
                <motion.button
                  key={n.to}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  onClick={() => {
                    go(n.to);
                    setOpen(false);
                  }}
                  className="flex items-baseline gap-4 border-b border-hair py-5 text-right"
                >
                  <span className="tech text-[11px] text-fire">
                    0{i + 1}
                  </span>
                  <span className="display text-3xl text-paper">{n.label}</span>
                </motion.button>
              ))}
            </nav>
            <div className="mt-8 px-5">
              <Btn full size="lg" onClick={() => { go("/shop"); setOpen(false); }}>
                تسوّق الآن
              </Btn>
              <a
                href="https://wa.me/966500000000"
                className="mt-4 flex items-center justify-center gap-2 border border-hair py-3 text-sm font-bold text-mute"
              >
                <Phone size={15} /> واتساب: 966500000000+
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  badge,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative grid h-10 w-10 place-items-center rounded-[3px] border border-transparent text-paper transition-all duration-300 hover:border-fire hover:text-fire ${className}`}
    >
      {children}
      {badge ? (
        <span className="tech tnum absolute -left-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-fire px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------- instant search ---------------- */
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { go, setSearch, search, products } = useStore();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const results = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.includes(q) ||
        p.sport.includes(q) ||
        p.brand.toLowerCase().includes(q.toLowerCase()) ||
        p.sub.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5);
  }, [search]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-ink/95 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-24 max-w-3xl px-5"
          >
            <div className="flex items-center gap-4 border-b-2 border-fire bg-transparent pb-4">
              <Search size={22} className="text-fire" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن حذاء، قميص، رياضة…"
                className="w-full bg-transparent text-xl font-bold text-paper placeholder:text-mute/70 focus:outline-none"
              />
              <button onClick={onClose} aria-label="إغلاق البحث" className="text-mute hover:text-paper">
                <X size={22} />
              </button>
            </div>

            <div className="mt-6 max-h-[55vh] overflow-y-auto">
              {!search && (
                <div className="flex flex-wrap gap-2">
                  {["حذاء جري", "كرة القدم", "جيم", "REMONTADA", "إكسسوارات"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSearch(s)}
                      className="border border-hair px-4 py-2 text-[13px] text-mute transition-colors hover:border-neon hover:text-neon"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {search && results.length === 0 && (
                <p className="py-6 text-center text-mute">
                  لا نتائج لـ «{search}» — جرّب كلمة أخرى مثل «جري» أو «سلة».
                </p>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    go(`/product/${p.id}`);
                    setSearch("");
                    onClose();
                  }}
                  className="group flex w-full items-center gap-4 border-b border-hair py-3 text-right transition-colors hover:bg-white/[0.03]"
                >
                  <img src={p.img} alt="" className="h-14 w-14 object-cover" loading="lazy" />
                  <span className="flex-1">
                    <span className="block font-bold text-paper group-hover:text-fire">{p.name}</span>
                    <span className="tech block text-[11px] tracking-widest text-mute">{p.sub}</span>
                  </span>
                  <span className="tech tnum font-bold text-paper">{p.price} ج.م</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- fixed vertical rail (xl+) ---------------- */
export function SideRail() {
  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-11 flex-col items-center justify-between border-r border-hair bg-ink/60 pb-8 pt-36 2xl:flex">
      <IbexMark size={20} glow={false} idPrefix="rail" />
      <div
        className="micro whitespace-nowrap text-mute"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        ARRIÈRE-GARDE · ارتقِ إلى مستواك التالي · REMONTADA 2026
      </div>
      <span className="beacon h-2 w-2 rotate-45 bg-fire" />
    </div>
  );
}

/* ---------------- footer ---------------- */
export function Footer() {
  const { go, toast } = useStore();
  const [email, setEmail] = useState("");

  const cols = [
    {
      t: "تسوّق",
      links: [
        ["كل المنتجات", "/shop"],
        ["كرة القدم", "/shop?s=كرة القدم"],
        ["الجري", "/shop?s=الجري"],
        ["الجيم", "/shop?s=الجيم"],
        ["أحدث الوصولات", "/shop?sort=new"],
      ],
    },
    {
      t: "المساعدة",
      links: [
        ["الأسئلة الشائعة", "/faq"],
        ["الإرجاع والاستبدال", "/returns"],
        ["دليل المقاسات", "/faq"],
        ["تتبع الطلب", "/account"],
        ["الشحن والتوصيل", "/returns"],
      ],
    },
    {
      t: "الشركة",
      links: [
        ["من نحن", "/about"],
        ["المدونة", "/journal"],
        ["تواصل معنا", "/contact"],
        ["حسابي", "/account"],
        ["المفضلة", "/wishlist"],
      ],
    },
  ];

  return (
    <footer className="relative border-t border-hair bg-[#06070A]">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 lg:px-10">
        {/* newsletter */}
        <div className="flex flex-col gap-8 border-b border-hair pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <span className="micro text-fire">NEWSLETTER</span>
            <h3 className="display mt-4 text-[clamp(1.6rem,4vw,2.6rem)] text-paper">
              انضم إلى قائمة REMONTADA
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              عروض الأسبوع، إصدارات محدودة، ونصائح تدريب — رسالة واحدة كل أسبوع، بلا إزعاج.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) {
                toast("بريد غير صالح", "يرجى إدخال بريد إلكتروني صحيح");
                return;
              }
              toast("تم الاشتراك بنجاح", "أهلاً بك في قائمة REMONTADA");
              setEmail("");
            }}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              aria-label="البريد الإلكتروني"
              className="min-w-0 flex-1 border border-hair bg-panel px-4 py-3.5 text-sm text-paper placeholder:text-mute focus:border-fire focus:outline-none"
            />
            <Btn type="submit">اشترك</Btn>
          </form>
        </div>

        {/* links */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mute">
              متجر رياضي فاخر يصنع قطعاً ترافقك من أول تمرين إلى آخر دقيقة. أسود، أحمر، ولا
              أعذار.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                {
                  l: "إنستغرام",
                  href: "https://instagram.com",
                  d: "M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm6.2-1.2a1.05 1.05 0 101.05 1.05A1.05 1.05 0 0018.2 6.3z",
                },
                {
                  l: "فيسبوك",
                  href: "https://facebook.com",
                  d: "M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6A22 22 0 0014.3 4.4c-2.4 0-4 1.45-4 4.15v2.35H7.6V14h2.7v8z",
                },
              ].map(({ l, href, d }) => (
                <a
                  key={l}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={l}
                  className="grid h-10 w-10 place-items-center border border-hair text-mute transition-all duration-300 hover:border-fire hover:text-fire"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={d} />
                  </svg>
                </a>
              ))}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="تيك توك"
                className="grid h-10 w-10 place-items-center border border-hair text-mute transition-all duration-300 hover:border-fire hover:text-fire"
              >
                <span className="tech text-[13px] font-bold">TT</span>
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.t}>
              <h4 className="micro text-paper">{c.t}</h4>
              <ul className="mt-5 space-y-3">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <button
                      onClick={() => go(to)}
                      className="group flex items-center gap-2 text-sm text-mute transition-colors hover:text-paper"
                    >
                      <span className="h-px w-0 bg-fire transition-all duration-300 group-hover:w-4" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="flex flex-col gap-5 border-t border-hair py-7 md:flex-row md:items-center md:justify-between">
          <p className="tech text-[11px] tracking-[0.18em] text-mute">
            © 2026 REMONTADA SPORTSWEAR — جميع الحقوق محفوظة
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="micro text-mute">الدفع الآمن</span>
            {["مدى", "VISA", "MASTERCARD", "APPLE PAY", "STC PAY", "COD"].map((m) => (
              <span
                key={m}
                className="tech border border-hair px-2.5 py-1 text-[10px] tracking-widest text-mute"
              >
                {m}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-mute">
            <Truck size={15} className="text-neon" />
            توصيل مدفوع حسب المحافظة
          </div>
        </div>
      </div>
    </footer>
  );
}
