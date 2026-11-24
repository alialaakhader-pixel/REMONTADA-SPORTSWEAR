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

const STATS = [
  { n: "4.9", l: "تقييم العملاء", s: "/5" },
  { n: "128", l: "عميل نشط", s: "ألف" },
  { n: "24", l: "ساعة للتوصيل", s: "س" },
  { n: "12", l: "شهر ضمان", s: "شهر" },
];

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
    <main className="min-h-screen w-full overflow-hidden bg-[#061026]">
      <img
        src="https://raw.githubusercontent.com/alialaakhader-pixel/REMONTADA-SPORTSWEAR/main/IMG-20261124-WA0002.jpg"
        alt="واجهة متجر ريمونتادا الأصلية"
        className="block h-auto w-full"
        fetchPriority="high"
      />
    </main>
  );
}
