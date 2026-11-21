export type Product = {
  id: string;
  name: string;
  sub: string;
  brand: string;
  sport: string;
  gender: "رجالي" | "نسائي" | "أطفال";
  type: string;
  price: number;
  old?: number;
  rating: number;
  reviews: number;
  badge?: "جديد" | "الأكثر مبيعاً" | "خصم 30%" | "محدود الكمية";
  img: string;
  images?: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  sold: number;
  desc: string;
  features: string[];
};

export const SPORTS = [
  "كرة القدم",
  "الجري",
  "الجيم",
  "كرة السلة",
  "التنس",
  "السباحة",
  "الأنشطة الخارجية",
] as const;

export const BRANDS: string[] = [];

export const CITIES: { name: string; ship: number; eta: string }[] = [];

export const PRODUCTS: Product[] = [];

export const TESTIMONIALS: { name: string; role: string; text: string; rating: number }[] = [];

export const FAQS = [
  { q: "كيف تُحسب تكلفة التوصيل؟", a: "تُحسب تكلفة التوصيل حسب المحافظة وتظهر بوضوح قبل تأكيد الطلب. لا يوجد توصيل مجاني افتراضياً." },
  { q: "ما طرق الدفع المتاحة؟", a: "سيتم إتاحة الدفع عند الاستلام والبطاقات والمحافظ الإلكترونية بعد تفعيل بوابة الدفع وربط نظام الطلبات." },
  { q: "كيف أعرف المقاس المناسب؟", a: "سيظهر دليل المقاسات داخل صفحة كل منتج عند إدخال بياناته من إدارة المتجر." },
  { q: "كيف أتابع طلبي؟", a: "سيصبح تتبع الطلب متاحاً بعد تفعيل نظام الطلبات وحسابات العملاء." },
  { q: "ما سياسة الاستبدال والاسترجاع؟", a: "تُنشر السياسة النهائية للمتجر قبل بدء استقبال الطلبات." },
];

export const ARTICLES = [];

export const CLUB = [];

export const money = (n: number) => n.toLocaleString("en-US");
