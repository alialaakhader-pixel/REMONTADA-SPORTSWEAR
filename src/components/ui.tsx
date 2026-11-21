import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Star, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import { money, type Product } from "../lib/data";

/* ---------------- scroll reveal ---------------- */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : `translateY(${y}px)`,
        transition: `opacity .75s cubic-bezier(.16,1,.3,1) ${delay}s, transform .75s cubic-bezier(.16,1,.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- micro label with slashed rule ---------------- */
export function Micro({
  children,
  tone = "fire",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "fire" | "neon" | "mute";
  className?: string;
}) {
  const c =
    tone === "fire" ? "text-fire" : tone === "neon" ? "text-neon" : "text-mute";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="h-px w-8 bg-current opacity-70" />
      <span className={`micro ${c}`}>{children}</span>
    </span>
  );
}

export function SectionHead({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Micro>{kicker}</Micro>
        <h2 className="display mt-5 text-[clamp(2rem,5.2vw,3.6rem)] text-paper">
          {title}
        </h2>
        {sub && <p className="mt-4 text-[15px] leading-relaxed text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- buttons ---------------- */
type BtnProps = {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: "fire" | "ghost" | "neon" | "solid";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
};

export function Btn({
  children,
  onClick,
  variant = "fire",
  size = "md",
  className = "",
  type = "button",
  disabled,
  full,
}: BtnProps) {
  const sizes = {
    sm: "px-4 py-2 text-[13px]",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-[15px]",
  }[size];
  const variants = {
    fire:
      "bg-fire text-white hover:bg-flame shadow-[0_0_0_0_rgba(230,57,43,0)] hover:shadow-[0_10px_34px_-12px_rgba(230,57,43,.9)]",
    solid: "bg-paper text-ink hover:bg-white",
    ghost:
      "border border-hair bg-white/[0.02] text-paper hover:border-fire hover:text-fire hover:bg-fire/5",
    neon: "border border-neon/50 text-neon hover:bg-neon hover:text-ink",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[3px] font-bold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${sizes} ${variants} ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <span className="pointer-events-none absolute inset-y-0 -right-full w-1/2 skew-x-[-18deg] bg-white/20 transition-all duration-700 group-hover:right-[130%]" />
    </button>
  );
}

/* ---------------- rating ---------------- */
export function Stars({
  value,
  size = 13,
  showNum,
  reviews,
}: {
  value: number;
  size?: number;
  showNum?: boolean;
  reviews?: number;
}) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`التقييم ${value} من 5`}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= Math.round(value)
                ? "fill-gold text-gold"
                : "fill-hair text-hair"
            }
          />
        ))}
      </span>
      {showNum && (
        <span className="tech tnum text-[12px] text-mute">
          {value.toFixed(1)}
          {typeof reviews === "number" && ` (${reviews})`}
        </span>
      )}
    </span>
  );
}

/* ---------------- product badges ---------------- */
export function Badge({ label }: { label: string }) {
  const tone =
    label === "خصم 30%"
      ? "bg-fire text-white"
      : label === "جديد"
      ? "bg-neon text-ink"
      : label === "محدود الكمية"
      ? "bg-gold text-ink"
      : "bg-paper text-ink";
  return (
    <span
      className={`tech inline-block px-2.5 py-1 text-[11px] font-bold tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

/* ---------------- product card ---------------- */
export function ProductCard({
  p,
  view = "grid",
  index = 0,
}: {
  p: Product;
  view?: "grid" | "list";
  index?: number;
}) {
  const { add, go, wish, toggleWish } = useStore();
  const liked = wish.includes(p.id);

  if (view === "list")
    return (
      <Reveal delay={Math.min(index * 0.04, 0.2)}>
        <article className="group flex flex-col gap-5 border-b border-hair py-6 sm:flex-row sm:items-center">
          <button
            onClick={() => go(`/product/${p.id}`)}
            className="relative h-40 w-full shrink-0 overflow-hidden bg-panel sm:h-28 sm:w-40"
          >
            <img
              src={p.img}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="micro text-mute">{p.sub}</div>
            <button
              onClick={() => go(`/product/${p.id}`)}
              className="mt-1.5 block text-right text-lg font-bold text-paper hover:text-fire"
            >
              {p.name}
            </button>
            <p className="mt-1 line-clamp-2 text-[13px] text-mute">{p.desc}</p>
            <div className="mt-3 flex items-center gap-4">
              <Stars value={p.rating} showNum reviews={p.reviews} />
              <span className="micro text-mute">{p.sport}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Price p={p} />
            <Btn size="sm" onClick={() => add(p)}>
              <Plus size={14} /> أضف للسلة
            </Btn>
          </div>
        </article>
      </Reveal>
    );

  return (
    <Reveal delay={Math.min(index * 0.05, 0.25)} className="h-full">
      <article
        onClick={() => go(`/product/${p.id}`)}
        className="group relative flex h-full cursor-pointer flex-col border border-hair bg-panel transition-colors duration-300 hover:border-fire/60"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#0C0E11]">
          <img
            src={p.img}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent opacity-70" />

          {p.badge && (
            <div className="absolute right-3 top-3">
              <Badge label={p.badge} />
            </div>
          )}

          <button
            aria-label="المفضلة"
            onClick={(e) => {
              e.stopPropagation();
              toggleWish(p.id);
            }}
            className={`absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full border transition-all duration-300 ${
              liked
                ? "border-fire bg-fire text-white"
                : "border-hair bg-ink/70 text-mute backdrop-blur hover:border-fire hover:text-fire"
            }`}
          >
            <Heart size={15} className={liked ? "fill-white" : ""} />
          </button>

          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-[400ms] group-hover:translate-y-0 group-hover:opacity-100">
            <Btn
              full
              size="sm"
              onClick={(e) => {
                e?.stopPropagation();
                add(p);
              }}
            >
              <Plus size={14} /> أضف إلى السلة
            </Btn>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="micro truncate text-mute">{p.sub}</div>
              <h3 className="mt-1.5 truncate text-[15px] font-bold text-paper transition-colors group-hover:text-fire">
                {p.name}
              </h3>
            </div>
            <div className="flex shrink-0 gap-1 pt-1">
              {p.colors.slice(0, 3).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3 w-3 rounded-full border border-white/25"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Stars value={p.rating} showNum reviews={p.reviews} />
            <Price p={p} />
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Price({ p, big }: { p: Product; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`tech tnum font-bold text-paper ${big ? "text-3xl" : "text-lg"}`}
      >
        {money(p.price)}
        <span className="mr-1 text-[0.62em] font-medium text-mute">ر.س</span>
      </span>
      {p.old && (
        <span className="tech tnum text-[13px] text-mute line-through decoration-fire">
          {money(p.old)}
        </span>
      )}
    </div>
  );
}

/* ---------------- custom sport icons (hand-drawn) ---------------- */
export function SportIcon({ name, size = 34 }: { name: string; size?: number }) {
  const c = "stroke-current";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: c,
  };
  switch (name) {
    case "كرة القدم":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="17" />
          <path d="M24 12.5l7.5 5.4-2.9 8.8h-9.2l-2.9-8.8z" />
          <path d="M24 7.2v5.3M37.6 19.4l-6.1 4.5M31.9 33.4l-4.1-6.7M16.1 33.4l4.1-6.7M10.4 19.4l6.1 4.5" />
        </svg>
      );
    case "الجري":
      return (
        <svg {...common}>
          <circle cx="31" cy="10.5" r="4" />
          <path d="M28 18l-7.5 5.5 5.5 5-3 9.5" />
          <path d="M26 28.5L14 26l-4.5 6" />
          <path d="M20.5 23.5L30 22l5 4.5 6-1.5" />
          <path d="M6 40h12M6 34h6" opacity=".55" />
        </svg>
      );
    case "الجيم":
      return (
        <svg {...common}>
          <rect x="5" y="18" width="5.5" height="12" rx="1.2" />
          <rect x="37.5" y="18" width="5.5" height="12" rx="1.2" />
          <rect x="12" y="21" width="4" height="6" rx="1" />
          <rect x="32" y="21" width="4" height="6" rx="1" />
          <path d="M16 24h16" />
          <path d="M10 14v-4M38 14v-4M10 34v4M38 34v4" opacity=".55" />
        </svg>
      );
    case "كرة السلة":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="17" />
          <path d="M7 24h34M24 7v34" />
          <path d="M12 12c7 5.5 7 18.5 0 24M36 12c-7 5.5-7 18.5 0 24" />
        </svg>
      );
    case "التنس":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="18" rx="11" ry="13.5" transform="rotate(-24 20 18)" />
          <path d="M14.5 24.5L31 41" />
          <path d="M27.5 37.5l5 5" />
          <path
            d="M13 12.5c4.5 3 9 7.5 11.5 13M17 8.5c3.5 4 6 9.5 7 15"
            opacity=".6"
          />
        </svg>
      );
    case "السباحة":
      return (
        <svg {...common}>
          <circle cx="33" cy="13" r="4" />
          <path d="M8 22l9-4 8 5 7-3" />
          <path d="M4 33c3.5-3 6.5-3 10 0s6.5 3 10 0 6.5-3 10 0 6.5 3 10 0" />
          <path d="M4 41c3.5-3 6.5-3 10 0s6.5 3 10 0 6.5-3 10 0 6.5 3 10 0" opacity=".55" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M5 38l11-20 7 11 6-9 14 18z" />
          <path d="M31 12.5a4.5 4.5 0 100-1" />
          <circle cx="33" cy="12" r="4.5" />
          <path d="M4 42h40" opacity=".55" />
        </svg>
      );
  }
}

/* ---------------- reveal-on-scroll wrapper for framer sections ---------------- */
export function Fade({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
