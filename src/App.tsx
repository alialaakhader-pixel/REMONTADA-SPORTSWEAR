import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag, Heart, Search, Shield, Plus, Trash2, Edit3,
  Power, X, Truck, CreditCard, Wallet, Banknote, Zap,
  Package, BarChart3, Percent, Settings, ChevronLeft, Printer,
  SlidersHorizontal, Image as ImageIcon, Upload, Sparkles,
  CheckCircle2, Sun, Moon, User, Scale, Eye, Ruler, Star,
  Lock, KeyRound, Camera, CheckSquare, Copy, Download,
  AlertTriangle, Clock, Footprints, Shirt, UserCheck, FileUp
} from 'lucide-react';
import { readAdminSession, signInAdmin, signOutAdmin, getCurrentAdmin, loadStoreState, saveStoreState, changeAdminPassword, reserveOnlineInventory, releaseOnlineInventory, setInventoryVariantStock } from './lib/supabase';
import { IMG } from './lib/img';

// ============================================================================
// 1. الإعدادات الافتراضية النظيفة 100% (بدون أي بيانات وهمية - بداية فارغة)
// ============================================================================

const STORAGE_KEY = 'remontada_sportswear_pro_v6';

const PRODUCT_CATEGORIES = [
  { id: 'hoodies', name: 'هوديز', description: 'هوديز وسويت شيرت' },
  { id: 'tshirts', name: 'تيشيرتات', description: 'تيشيرتات رياضية وكاجوال' },
  { id: 'football-kits', name: 'أطقم كرة القدم', description: 'أطقم الأندية والمنتخبات' },
  { id: 'pants-shorts', name: 'بناطيل وشورتات', description: 'بناطيل وشورتات رياضية' },
  { id: 'shoes', name: 'أحذية رياضية', description: 'أحذية التدريب والجري' },
  { id: 'accessories', name: 'إكسسوارات', description: 'شنط وجوارب وإكسسوارات رياضية' },
];

const DEFAULT_SPORTS = [
  { id: 'sport-football', name: 'كرة القدم', visible: true },
  { id: 'sport-gym', name: 'الجيم واللياقة', visible: true },
  { id: 'sport-running', name: 'الجري', visible: true },
  { id: 'sport-basketball', name: 'كرة السلة', visible: true },
  { id: 'sport-apparel', name: 'ملابس رياضية', visible: true },
  { id: 'sport-accessories', name: 'إكسسوارات', visible: true },
];

const INITIAL_STATE = {
  theme: 'dark', // 'dark' | 'light'
  settings: {
    storeName: 'REMONTADA SPORTSWEAR',
    heroTitle: 'REMONTADA SPORTSWEAR',
    heroSubtitle:
      'أداء رياضي فائق بتصميم مستقبلي — أضف منتجاتك وصورك وعروضك الخاصة من لوحة التحكم لتظهر هنا مباشرة.',
    heroCtaText: 'استكشف التشكيلة',
    customHeroImage: '',
    announcementText: '',
    announcementActive: false,
    codEnabled: true,
    cardEnabled: false,
    walletEnabled: false,
    metaPixelId: '',
    gaMeasurementId: '',
    namePrintingFee: 0,
  },
  // تكاليف الشحن المدفوع حسب المحافظة (إلزامي > 0 ج.م - لا يوجد شحن مجاني)
  governorates: [
    { id: 'gov-cairo', name: 'القاهرة', fee: 65, active: true },
    { id: 'gov-giza', name: 'الجيزة', fee: 65, active: true },
    { id: 'gov-alex', name: 'الإسكندرية', fee: 80, active: true },
    { id: 'gov-menofia', name: 'المنوفية', fee: 75, active: true },
    { id: 'gov-dakahlia', name: 'الدقهلية', fee: 80, active: true },
    { id: 'gov-sharqia', name: 'الشرقية', fee: 80, active: true },
    { id: 'gov-upper', name: 'محافظات الصعيد', fee: 105, active: true },
  ],
  sports: DEFAULT_SPORTS,
  // تبدأ فارغة تماماً بدون أي منتجات أو عروض أو تقييمات أو طلبات أو مناديب وهميين
  products: [],
  promotions: [],
  coupons: [],
  deliveryAgents: [],
  orders: [],
  reviews: [],
  customerProfile: {
    name: '',
    phone: '',
    governorateId: 'gov-cairo',
    city: '',
    address: '',
  },
};

// Normalize persisted and remote data so one malformed/older record cannot crash the storefront.
function normalizeStoreState(candidate, includePrivate = false) {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const objectArray = (value) => Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    : [];
  const products = objectArray(source.products).map((product, index) => ({
    ...product,
    id: String(product.id ?? `product-${index}`),
    title: typeof product.title === 'string' ? product.title : '',
    brand: typeof product.brand === 'string' ? product.brand : '',
    basePrice: Number.isFinite(Number(product.basePrice)) ? Number(product.basePrice) : 0,
    variants: objectArray(product.variants).map((variant, variantIndex) => ({
      ...variant,
      id: String(variant.id ?? `${product.id ?? index}-variant-${variantIndex}`),
      stockQty: Number.isFinite(Number(variant.stockQty)) ? Number(variant.stockQty) : 0,
      lowStockThreshold: Number.isFinite(Number(variant.lowStockThreshold)) ? Number(variant.lowStockThreshold) : 3,
    })),
  }));
  const sourceSettings = source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings)
    ? source.settings : {};
  const customer = source.customerProfile && typeof source.customerProfile === 'object' && !Array.isArray(source.customerProfile)
    ? source.customerProfile : {};

  return {
    ...INITIAL_STATE,
    ...source,
    theme: source.theme === 'light' ? 'light' : 'dark',
    settings: { ...INITIAL_STATE.settings, ...sourceSettings },
    sports: objectArray(source.sports).length
      ? objectArray(source.sports).map((item) => ({ ...item, id: String(item.id ?? ''), name: String(item.name ?? '') }))
      : INITIAL_STATE.sports,
    governorates: objectArray(source.governorates).length
      ? objectArray(source.governorates).map((item) => ({
          ...item, id: String(item.id ?? ''), name: String(item.name ?? ''),
          fee: Number.isFinite(Number(item.fee)) ? Number(item.fee) : 0,
        }))
      : INITIAL_STATE.governorates,
    products,
    promotions: objectArray(source.promotions),
    coupons: objectArray(source.coupons),
    reviews: objectArray(source.reviews),
    orders: includePrivate ? objectArray(source.orders) : [],
    deliveryAgents: includePrivate ? objectArray(source.deliveryAgents) : [],
    customerProfile: includePrivate ? { ...INITIAL_STATE.customerProfile, ...customer } : INITIAL_STATE.customerProfile,
  };
}

// ============================================================================
// 2. دوال مساعدة: ضغط الصور، التسعير بالجنيه المصري، المقاسات، والتقييمات
// ============================================================================

function formatEGP(amount) {
  const num = Number(amount || 0);
  return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
}

// ضغط وتصغير الصور تلقائياً عبر Canvas قبل الحفظ لتسريع المتجر وتقليل المساحة
function compressImageFile(file, maxDimension = 960, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('صيغة الصورة غير مدعومة'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getEffectivePrice(basePrice, productId, sportId, promotions) {
  const now = new Date();
  let bestPrice = Number(basePrice || 0);
  let activePromo = null;

  for (const promo of promotions) {
    if (!promo.isActive) continue;
    if (promo.startsAt && now < new Date(promo.startsAt)) continue;
    if (promo.endsAt && now > new Date(promo.endsAt)) continue;

    const matches =
      promo.scope === 'all' ||
      (promo.scope === 'product' && promo.targetId === productId) ||
      (promo.scope === 'sport' && sportId && promo.targetId === sportId);

    if (!matches) continue;

    const candidate =
      promo.discountType === 'percentage'
        ? Math.max(0, basePrice * (1 - Number(promo.discountValue) / 100))
        : Math.max(0, basePrice - Number(promo.discountValue));

    if (candidate < bestPrice) {
      bestPrice = candidate;
      activePromo = promo;
    }
  }

  const hasDiscount = bestPrice < basePrice && basePrice > 0;
  const discountPercent = hasDiscount ? Math.round(((basePrice - bestPrice) / basePrice) * 100) : 0;

  return {
    finalPrice: Math.round(bestPrice * 100) / 100,
    hasDiscount,
    discountPercent,
    activePromo,
  };
}

// حاسبة المقاسات المتقدمة: الملابس الرياضية (طول + وزن + قصة) + الأحذية (طول القدم سم)
function recommendApparelSize(heightCm, weightKg, fitType = 'regular') {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h < 100 || h > 230 || w < 25 || w > 200) return null;

  let score = w * 0.62 + (h - 150) * 0.45;
  if (fitType === 'slim') score += 3;
  if (fitType === 'oversized') score += 6;

  let size = 'M';
  let chestRange = '96 - 101 سم';
  let waistRange = '81 - 86 سم';

  if (score < 46) {
    size = 'XS';
    chestRange = '84 - 89 سم';
    waistRange = '69 - 74 سم';
  } else if (score < 54) {
    size = 'S';
    chestRange = '90 - 95 سم';
    waistRange = '75 - 80 سم';
  } else if (score < 64) {
    size = 'M';
    chestRange = '96 - 101 سم';
    waistRange = '81 - 86 سم';
  } else if (score < 75) {
    size = 'L';
    chestRange = '102 - 108 سم';
    waistRange = '87 - 93 سم';
  } else if (score < 88) {
    size = 'XL';
    chestRange = '109 - 116 سم';
    waistRange = '94 - 101 سم';
  } else {
    size = 'XXL';
    chestRange = '117 - 125 سم';
    waistRange = '102 - 110 سم';
  }

  return {
    size,
    chestRange,
    waistRange,
    note:
      fitType === 'slim'
        ? 'قصة رياضية ضيقة تمنح ثباتاً عالياً أثناء الجري والتدريب'
        : fitType === 'oversized'
        ? 'قصة واسعة عصرية مريحة للحركة والاستشفاء'
        : 'قصة قياسية متوازنة لجميع التمارين اليومية',
  };
}

function recommendFootwearSize(footLengthCm) {
  const cm = Number(footLengthCm);
  if (!cm || cm < 18 || cm > 33) return null;

  const table = [
    { maxCm: 22.5, eu: '36', advice: 'مناسب للأقدام الصغيرة بمساحة أمامية مريحة' },
    { maxCm: 23.5, eu: '37.5', advice: 'توازن مثالي للثبات الجانبي في الملاعب' },
    { maxCm: 24.2, eu: '38.5', advice: 'يوفر 0.5 سم مساحة تمدد أثناء الجري' },
    { maxCm: 25.0, eu: '40', advice: 'مقاس قياسي مريح لجوارب التدريب السميكة' },
    { maxCm: 25.8, eu: '41', advice: 'مثالي للانطلاق السريع وتغيير الاتجاه' },
    { maxCm: 26.5, eu: '42', advice: 'الأكثر ملاءمة مع مساحة كافية لأصابع القدم' },
    { maxCm: 27.3, eu: '43', advice: 'يوفر تهوية وراحة مستمرة في الجري الطويل' },
    { maxCm: 28.0, eu: '44', advice: 'دعم كامل للكعب ومشط القدم' },
    { maxCm: 28.8, eu: '45', advice: 'مقاس واسع مريح للتمارين عالية الكثافة' },
    { maxCm: 33.0, eu: '46', advice: 'أقصى ثبات وراحة للمقاسات الكبيرة' },
  ];

  const found = table.find((row) => cm <= row.maxCm) || table[table.length - 1];
  return {
    euSize: found.eu,
    cm,
    advice: found.advice,
  };
}

function getProductRatingStats(productId, reviews) {
  const productReviews = reviews.filter((r) => r.productId === productId);
  if (productReviews.length === 0) {
    return { avg: 0, count: 0, items: [] };
  }
  const sum = productReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  const avg = Math.round((sum / productReviews.length) * 10) / 10;
  return { avg, count: productReviews.length, items: productReviews };
}

function getRemainingTimeLabel(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'انتهى العرض';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `متبقي ${days} يوم و ${hours} ساعة`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `متبقي ${hours} ساعة و ${mins} دقيقة`;
}

// ============================================================================
// 3. شعار REMONTADA الرسمي (الوعل الهندسي Low-Poly الأزرق الكهربائي النيوني)
// ============================================================================

const RemontadaOfficialLogo = ({ variant = 'header', customImage = '', isLight = false }) => {
  const isHero = variant === 'hero';

  return (
    <div className={`inline-flex select-none ${isHero ? 'flex-col items-center text-center' : 'items-center gap-3'}`}>
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-[#00D4FF]/45 bg-[#05050F] ${
          isHero
            ? 'h-72 w-72 sm:h-80 sm:w-80 rounded-3xl p-4 shadow-[0_0_65px_rgba(0,212,255,0.42),inset_0_0_30px_rgba(0,180,255,0.2)]'
            : 'h-12 w-12 rounded-xl p-1.5 shadow-[0_0_18px_rgba(0,212,255,0.35)]'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,212,255,0.32),transparent_70%)]" />

        {customImage ? (
          <img
            src={customImage}
            alt="REMONTADA SPORTSWEAR"
            className="relative z-10 h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 320 290"
            className="relative z-10 h-full w-full drop-shadow-[0_0_16px_rgba(0,212,255,0.9)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ibexBlueLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#80E5FF" />
                <stop offset="45%" stopColor="#00B4FF" />
                <stop offset="100%" stopColor="#003380" />
              </linearGradient>
              <linearGradient id="ibexBlueDark" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#040D21" />
                <stop offset="60%" stopColor="#0A2A66" />
                <stop offset="100%" stopColor="#0099FF" />
              </linearGradient>
              <linearGradient id="textMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E6FAFF" />
                <stop offset="35%" stopColor="#00D4FF" />
                <stop offset="75%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#002B66" />
              </linearGradient>
            </defs>

            <line x1="70" y1="185" x2="275" y2="62" stroke="#00D4FF" strokeOpacity="0.45" strokeWidth="2.5" />
            <line x1="120" y1="190" x2="290" y2="92" stroke="#00B4FF" strokeOpacity="0.3" strokeWidth="1.5" />

            <polygon
              points="135,54 132,34 146,24 162,26 174,38 176,54 168,42 156,34 144,38"
              fill="url(#ibexBlueLight)"
              stroke="#80E5FF"
              strokeWidth="1"
            />
            <polygon points="146,24 162,26 155,34" fill="#FFFFFF" fillOpacity="0.75" />

            <polygon points="135,54 122,68 126,86 138,84 146,66" fill="url(#ibexBlueDark)" stroke="#00D4FF" strokeWidth="1" />
            <polygon points="135,54 146,66 156,60 148,48" fill="url(#ibexBlueLight)" stroke="#80E5FF" strokeWidth="1" />
            <polygon points="138,84 146,66 164,84 152,102" fill="url(#ibexBlueLight)" stroke="#00D4FF" strokeWidth="1" />

            <polygon points="146,66 178,76 164,84" fill="#80E5FF" fillOpacity="0.85" stroke="#00D4FF" strokeWidth="1" />
            <polygon points="164,84 178,76 206,96 184,114" fill="url(#ibexBlueLight)" stroke="#00D4FF" strokeWidth="1" />
            <polygon points="152,102 164,84 184,114 166,122" fill="url(#ibexBlueDark)" stroke="#00B4FF" strokeWidth="1" />
            <polygon points="184,114 206,96 226,118 202,130" fill="url(#ibexBlueDark)" stroke="#00D4FF" strokeWidth="1" />

            <polygon points="152,102 166,122 146,132 138,118" fill="url(#ibexBlueLight)" stroke="#00D4FF" strokeWidth="1" />
            <polygon points="146,132 162,138 156,148 140,140" fill="url(#ibexBlueDark)" stroke="#80E5FF" strokeWidth="1" />

            <polygon points="202,130 226,118 238,148 222,154" fill="url(#ibexBlueLight)" stroke="#00D4FF" strokeWidth="1" />
            <polygon points="222,154 238,148 250,174 238,178" fill="url(#ibexBlueDark)" stroke="#80E5FF" strokeWidth="1" />

            {isHero && (
              <>
                <text
                  x="160"
                  y="228"
                  textAnchor="middle"
                  fill="url(#textMetallic)"
                  stroke="#80E5FF"
                  strokeWidth="0.9"
                  style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 900, fontSize: '36px', letterSpacing: '3px' }}
                >
                  REMONTADA
                </text>
                <line x1="36" y1="248" x2="86" y2="248" stroke="#00D4FF" strokeWidth="1.5" />
                <text
                  x="160"
                  y="252"
                  textAnchor="middle"
                  fill="#E6FAFF"
                  style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '5px' }}
                >
                  SPORTSWEAR
                </text>
                <line x1="234" y1="248" x2="284" y2="248" stroke="#00D4FF" strokeWidth="1.5" />
              </>
            )}
          </svg>
        )}
      </div>

      {!isHero && (
        <div>
          <div
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            className="text-lg sm:text-xl font-black tracking-widest text-[#00D4FF] drop-shadow-[0_0_12px_rgba(0,212,255,0.65)] leading-none"
          >
            REMONTADA
          </div>
          <div
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            className={`mt-1 text-[9px] font-bold tracking-[0.34em] ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}
          >
            SPORTSWEAR
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. التطبيق الرئيسي المتكامل
// ============================================================================

export default function App() {
  const [store, setStore] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeStoreState(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STATE;
  });
  const [adminSession, setAdminSession] = useState(() => readAdminSession());
  const [adminUser, setAdminUser] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  useEffect(() => {
    try {
      const safeStore = {
        ...store,
        orders: [],
        deliveryAgents: [],
        customerProfile: INITIAL_STATE.customerProfile,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeStore));
    } catch (e) {
      console.error('تعذر الحفظ المحلي:', e);
    }
  }, [store]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const row = await loadStoreState();
        if (active && row?.public_state) {
          setStore((prev) => normalizeStoreState({ ...prev, ...row.public_state }));
        }
      } catch (e) {
        console.error('تعذر تحميل بيانات المتجر من Supabase:', e);
      } finally {
        if (active) setDbReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!adminSession?.access_token) return () => { active = false; };
    setDbReady(false);
    (async () => {
      try {
        const user = await getCurrentAdmin(adminSession);
        if (!user) {
          await signOutAdmin(adminSession);
          if (active) {
            setAdminSession(null);
            setAdminUser(null);
            setAdminUnlocked(false);
          }
          return;
        }
        const row = await loadStoreState(adminSession);
        if (active) {
          setAdminUser(user);
          if (row?.public_state) {
            setStore((prev) => normalizeStoreState({ ...prev, ...row.public_state, ...(row.private_state || {}) }, true));
          }
          setAdminUnlocked(true);
        }
      } catch (e) {
        console.error('تعذر استعادة جلسة الإدارة:', e);
        if (active) {
          setAdminSession(null);
          setAdminUser(null);
          setAdminUnlocked(false);
        }
      } finally {
        if (active) setDbReady(true);
      }
    })();
    return () => { active = false; };
  }, [adminSession]);

  useEffect(() => {
    if (!dbReady || !adminSession?.access_token || !adminUnlocked) return;
    saveStoreState(store, adminSession).catch((e) => {
      console.error('تعذر حفظ التغييرات في Supabase:', e);
    });
  }, [store, adminSession, adminUnlocked, dbReady]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Chakra+Petch:wght@600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  const isLight = store.theme === 'light';

  // الصفحات: 'home' | 'shop' | 'account' | 'courier' | 'admin'
  const [activePage, setActivePage] = useState('home');
  const [adminTab, setAdminTab] = useState('products'); // 'products' | 'promotions' | 'orders' | 'agents' | 'shipping' | 'security'

  const handleAdminLogin = async (email, password) => {
    const { session, user } = await signInAdmin(email, password);
    setAdminSession(session);
    setAdminUser(user);
    return user;
  };

  const handleAdminLogout = async () => {
    await signOutAdmin(adminSession);
    setAdminSession(null);
    setAdminUser(null);
    setAdminUnlocked(false);
    setStore((prev) => ({
      ...prev,
      orders: [],
      deliveryAgents: [],
      customerProfile: INITIAL_STATE.customerProfile,
    }));
  };

  const handleAdminPasswordChange = async (password) => {
    await changeAdminPassword(adminSession, password);
  };

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSizeFinderOpen, setIsSizeFinderOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [toast, setToast] = useState('');

  // البحث والفلاتر
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  const toggleTheme = () => {
    setStore((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const activePromotions = useMemo(() => {
    const now = new Date();
    return store.promotions.filter((p) => {
      if (!p.isActive) return false;
      if (p.startsAt && now < new Date(p.startsAt)) return false;
      if (p.endsAt && now > new Date(p.endsAt)) return false;
      return true;
    });
  }, [store.promotions]);

  // تنبيهات انخفاض المخزون الحقيقية في الإدارة
  const lowStockAlerts = useMemo(() => {
    const alerts = [];
    for (const prod of store.products) {
      for (const v of prod.variants || []) {
        const threshold = Number(v.lowStockThreshold ?? 3);
        const qty = Number(v.stockQty ?? 0);
        if (qty <= threshold) {
          alerts.push({
            productId: prod.id,
            productTitle: prod.title,
            variantId: v.id,
            size: v.size,
            colorName: v.colorName,
            stockQty: qty,
            threshold,
          });
        }
      }
    }
    return alerts;
  }, [store.products]);

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => {
        const product = store.products.find((p) => p.id === item.productId);
        if (!product) return null;
        const variant = product.variants.find((v) => v.id === item.variantId) || product.variants[0];
        const pricing = getEffectivePrice(product.basePrice, product.id, product.sportId, store.promotions);
        return {
          ...item,
          product,
          variant,
          unitPrice: pricing.finalPrice,
          originalPrice: product.basePrice,
          hasDiscount: pricing.hasDiscount,
          lineTotal: pricing.finalPrice * item.qty,
        };
      })
      .filter(Boolean);
  }, [cart, store.products, store.promotions]);

  const cartSubtotal = useMemo(
    () => cartDetails.reduce((acc, i) => acc + i.lineTotal, 0),
    [cartDetails]
  );

  const totalCartCount = useMemo(
    () => cartDetails.reduce((acc, i) => acc + i.qty, 0),
    [cartDetails]
  );

  const handleAddToCart = (productId, variantId = null, qty = 1) => {
    const product = store.products.find((p) => p.id === productId);
    if (!product) return;

    const chosenVariant = variantId
      ? product.variants.find((v) => v.id === variantId)
      : product.variants.find((v) => Number(v.stockQty) > 0) || product.variants[0];

    if (!chosenVariant || Number(chosenVariant.stockQty) <= 0) {
      notify('هذا المقاس غير متوفر حالياً بالمخزون');
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId && i.variantId === chosenVariant.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          qty: Math.min(Number(chosenVariant.stockQty), updated[idx].qty + qty),
        };
        return updated;
      }
      return [
        ...prev,
        { productId, variantId: chosenVariant.id, qty: Math.min(Number(chosenVariant.stockQty), qty) },
      ];
    });

    notify(`تمت إضافة "${product.title}" إلى السلة`);
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleCompare = (productId) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 3) {
        notify('يمكن مقارنة حتى 3 منتجات كحد أقصى');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const filteredProducts = useMemo(() => {
    return store.products
      .filter((p) => {
        if (!p.isActive) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          if (
            !p.title.toLowerCase().includes(q) &&
            !(p.brand && p.brand.toLowerCase().includes(q))
          ) {
            return false;
          }
        }
        if (filterSport !== 'all' && p.sportId !== filterSport) return false;
        if (filterCategory !== 'all' && (p.categoryId || 'other') !== filterCategory) return false;
        if (filterGender !== 'all' && p.gender !== filterGender) return false;
        if (filterDiscountOnly) {
          const pr = getEffectivePrice(p.basePrice, p.id, p.sportId, store.promotions);
          if (!pr.hasDiscount) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pa = getEffectivePrice(a.basePrice, a.id, a.sportId, store.promotions).finalPrice;
        const pb = getEffectivePrice(b.basePrice, b.id, b.sportId, store.promotions).finalPrice;
        if (sortBy === 'price-asc') return pa - pb;
        if (sortBy === 'price-desc') return pb - pa;
        if (sortBy === 'top-rated') {
          return (
            getProductRatingStats(b.id, store.reviews).avg -
            getProductRatingStats(a.id, store.reviews).avg
          );
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [store.products, store.promotions, store.reviews, searchQuery, filterSport, filterCategory, filterGender, filterDiscountOnly, sortBy]);

  return (
    <div
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      className={`min-h-screen transition-colors duration-300 selection:bg-[#00B4FF] selection:text-[#05050F] ${
        isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
      }`}
    >
      {/* إشعار عائم بالأزرق الكهربائي النيوني فقط */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-2xl border border-[#00D4FF] bg-[#0A1A3A] px-5 py-3.5 text-xs font-extrabold text-white shadow-[0_0_28px_rgba(0,212,255,0.55)]">
          <Zap className="h-4 w-4 text-[#00D4FF]" />
          <span>{toast}</span>
        </div>
      )}

      {/* شريط إعلانات مخصص أو شريط العروض الخاصة المفعلة */}
      {store.settings.announcementActive && store.settings.announcementText ? (
        <div className="border-b border-[#00D4FF]/35 bg-[#001F4D] px-4 py-2 text-center text-xs font-extrabold text-[#00D4FF]">
          {store.settings.announcementText}
        </div>
      ) : (
        activePromotions.length > 0 && (
          <div className="border-b border-[#00D4FF]/35 bg-gradient-to-l from-[#001F4D] via-[#0A1A3A] to-[#001F4D] px-4 py-2 text-center">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-xs font-extrabold text-[#00D4FF]">
              <Sparkles className="h-3.5 w-3.5" />
              {activePromotions.map((pr, idx) => (
                <span key={pr.id}>
                  {pr.title} — خصم{' '}
                  {pr.discountType === 'percentage' ? `${pr.discountValue}%` : formatEGP(pr.discountValue)}
                  {idx < activePromotions.length - 1 ? '  |  ' : ''}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {/* الهيدر الثابت */}
      <header
        className={`sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl ${
          isLight ? 'bg-[#F3F8FF]/90' : 'bg-[#05050F]/90'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <button onClick={() => setActivePage('home')} className="text-right focus:outline-none">
            <RemontadaOfficialLogo
              variant="header"
              customImage={store.settings.customHeroImage}
              isLight={isLight}
            />
          </button>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {[
              { id: 'home', label: 'الواجهة الرئيسية' },
              { id: 'shop', label: 'المتجر' },
              { id: 'account', label: 'طلباتي وتقييمي' },
              { id: 'courier', label: 'عامل التوصيل' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { if (item.id === 'shop') setFilterCategory('all'); setActivePage(item.id); }}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  activePage === item.id
                    ? 'bg-[#00B4FF] text-[#05050F] shadow-[0_0_20px_rgba(0,212,255,0.5)]'
                    : isLight
                    ? 'text-[#3B5278] hover:bg-[#00B4FF]/15 hover:text-[#05050F]'
                    : 'text-[#A0AEC0] hover:bg-[#0A1A3A] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* شريط البحث الذكي */}
          <div className="relative order-3 w-full sm:order-none sm:w-52 xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[#00D4FF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activePage === 'home' && e.target.value.trim()) setActivePage('shop');
              }}
              placeholder="ابحث عن منتج أو ماركة..."
              className={`w-full rounded-xl border border-[#00D4FF]/35 py-2 pr-10 pl-4 text-xs outline-none transition focus:border-[#00D4FF] ${
                isLight
                  ? 'bg-white text-[#05050F] placeholder-[#5A7194]'
                  : 'bg-[#0A1A3A]/55 text-white placeholder-[#A0AEC0]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSizeFinderOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/40 px-3 py-2 text-xs font-extrabold text-[#00D4FF] transition hover:border-[#00D4FF] ${
                isLight ? 'bg-white' : 'bg-[#0A1A3A]/70'
              }`}
              title="حاسبة المقاس (ملابس وأحذية)"
            >
              <Ruler className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">حاسبة المقاس</span>
            </button>

            {compareIds.length > 0 && (
              <button
                onClick={() => setIsCompareOpen(true)}
                className="relative rounded-xl border border-[#00D4FF]/45 bg-[#0A1A3A] p-2.5 text-[#00D4FF]"
                title="مقارنة المنتجات"
              >
                <Scale className="h-4 w-4" />
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] text-[10px] font-black text-[#05050F]">
                  {compareIds.length}
                </span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className={`rounded-xl border border-[#00D4FF]/35 p-2.5 text-[#00D4FF] transition hover:border-[#00D4FF] ${
                isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'
              }`}
              title={isLight ? 'الوضع الليلي' : 'الوضع النهاري'}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setActivePage('account')}
              className={`rounded-xl border border-[#00D4FF]/35 p-2.5 text-[#00D4FF] transition hover:border-[#00D4FF] ${
                isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'
              }`}
              title="طلباتي وتأكيد الاستلام"
            >
              <User className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative rounded-xl border border-[#00D4FF]/35 p-2.5 text-[#00D4FF] transition hover:border-[#00D4FF] ${
                isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'
              }`}
              title="سلة المشتريات"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] text-[10px] font-black text-[#05050F]">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePage('admin')}
              className={`relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition ${
                activePage === 'admin'
                  ? 'bg-white text-[#05050F] shadow-[0_0_24px_rgba(255,255,255,0.6)]'
                  : 'bg-[#00B4FF] text-[#05050F] shadow-[0_0_22px_rgba(0,212,255,0.55)] hover:bg-[#00D4FF]'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>الإدارة</span>
              {lowStockAlerts.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#05050F] bg-[#00D4FF] text-[10px] font-black text-[#05050F]">
                  {lowStockAlerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط تنقل سريع للموبايل */}
        <div className="flex items-center justify-around border-t border-[#00D4FF]/15 px-2 py-2 lg:hidden text-[11px] font-bold">
          <button onClick={() => setActivePage('home')} className={activePage === 'home' ? 'text-[#00D4FF]' : 'text-[#A0AEC0]'}>
            الرئيسية
          </button>
          <button onClick={() => { setFilterCategory('all'); setActivePage('shop'); }} className={activePage === 'shop' || activePage.startsWith('category-') ? 'text-[#00D4FF]' : 'text-[#A0AEC0]'}>
            المتجر
          </button>
          <button onClick={() => setActivePage('account')} className={activePage === 'account' ? 'text-[#00D4FF]' : 'text-[#A0AEC0]'}>
            طلباتي وتقييمي
          </button>
          <button onClick={() => setActivePage('courier')} className={activePage === 'courier' ? 'text-[#00D4FF]' : 'text-[#A0AEC0]'}>
            عامل التوصيل
          </button>
        </div>
      </header>

      {/* ====================================================================
          محتوى الصفحات
      ==================================================================== */}
      <main>
        {activePage === 'home' && (
          <HomeView
            store={store}
            isLight={isLight}
            activePromotions={activePromotions}
            onNavigate={setActivePage}
            onGoAdminTab={(tab) => {
              setAdminTab(tab);
              setActivePage('admin');
            }}
            onSelectCategory={(categoryId) => {
              setFilterCategory(categoryId);
              setFilterSport('all');
              setSearchQuery('');
              setActivePage(`category-${categoryId}`);
            }}
            onOpenProduct={(p) => setSelectedProductModal(p)}
            onAddToCart={handleAddToCart}
            onOpenSizeFinder={() => setIsSizeFinderOpen(true)}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
          />
        )}

        {(activePage === 'shop' || activePage.startsWith('category-')) && (
          <ShopView
            store={store}
            isLight={isLight}
            products={filteredProducts}
            filterSport={filterSport}
            setFilterSport={setFilterSport}
            filterCategory={filterCategory}
            setFilterCategory={(categoryId) => {
              setFilterCategory(categoryId);
              setActivePage(categoryId === 'all' ? 'shop' : `category-${categoryId}`);
            }}
            onSelectCategory={(categoryId) => {
              setFilterCategory(categoryId);
              setFilterSport('all');
              setSearchQuery('');
              setActivePage(categoryId === 'all' ? 'shop' : `category-${categoryId}`);
            }}
            filterGender={filterGender}
            setFilterGender={setFilterGender}
            filterDiscountOnly={filterDiscountOnly}
            setFilterDiscountOnly={setFilterDiscountOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onOpenProduct={(p) => setSelectedProductModal(p)}
            onAddToCart={handleAddToCart}
            onOpenSizeFinder={() => setIsSizeFinderOpen(true)}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onGoAdmin={() => {
              setAdminTab('products');
              setActivePage('admin');
            }}
          />
        )}

        {activePage === 'account' && (
          <AccountAndRatingView
            store={store}
            setStore={setStore}
            isLight={isLight}
            onViewReceipt={(ord) => setReceiptOrder(ord)}
            notify={notify}
          />
        )}

        {activePage === 'courier' && (
          <DeliveryAgentView
            store={store}
            setStore={setStore}
            isLight={isLight}
            notify={notify}
          />
        )}

        {activePage === 'admin' && (
          <AdminGateAndDashboard
            store={store}
            setStore={setStore}
            isLight={isLight}
            adminUnlocked={adminUnlocked}
            setAdminUnlocked={setAdminUnlocked}
            onAdminLogin={handleAdminLogin}
            onAdminLogout={handleAdminLogout}
            onChangeAdminPassword={handleAdminPasswordChange}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            lowStockAlerts={lowStockAlerts}
            onViewReceipt={(ord) => setReceiptOrder(ord)}
            notify={notify}
          />
        )}
      </main>

      {/* الفوتر الاحترافي */}
      <footer
        className={`mt-20 border-t border-[#00D4FF]/25 ${
          isLight ? 'bg-white' : 'bg-[#05050F]'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
          <RemontadaOfficialLogo
            variant="header"
            customImage={store.settings.customHeroImage}
            isLight={isLight}
          />
          <div className="flex items-center gap-2 rounded-xl border border-[#00D4FF]/30 bg-[#0A1A3A]/50 px-4 py-2 text-xs text-[#00D4FF]">
            <Truck className="h-4 w-4" />
            <span>التوصيل مدفوع لجميع المحافظات المصرية — الأسعار بالجنيه المصري (ج.م)</span>
          </div>
          <div className={`text-xs ${isLight ? 'text-[#475F84]' : 'text-[#A0AEC0]'}`}>
            © {new Date().getFullYear()} REMONTADA SPORTSWEAR
          </div>
        </div>
      </footer>

      {/* حاسبة المقاس التفاعلية (ملابس: طول + وزن + قصة | أحذية: طول القدم سم) */}
      {isSizeFinderOpen && (
        <SizeFinderModal
          onClose={() => setIsSizeFinderOpen(false)}
          notify={notify}
        />
      )}

      {/* نافذة تفاصيل المنتج */}
      {selectedProductModal && (
        <ProductDetailModal
          product={selectedProductModal}
          store={store}
          onClose={() => setSelectedProductModal(null)}
          onAddToCart={handleAddToCart}
          onOpenSizeFinder={() => {
            setSelectedProductModal(null);
            setIsSizeFinderOpen(true);
          }}
          onBuyNow={(prodId, varId, qty) => {
            handleAddToCart(prodId, varId, qty);
            setSelectedProductModal(null);
            setIsCartOpen(true);
          }}
        />
      )}

      {/* نافذة مقارنة المنتجات */}
      {isCompareOpen && (
        <CompareModal
          products={store.products.filter((p) => compareIds.includes(p.id))}
          promotions={store.promotions}
          reviews={store.reviews}
          onRemove={(id) => toggleCompare(id)}
          onAddToCart={(id) => handleAddToCart(id)}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* سلة المشتريات وإتمام الطلب */}
      {isCartOpen && (
        <CartDrawer
          store={store}
          setStore={setStore}
          cartDetails={cartDetails}
          cartSubtotal={cartSubtotal}
          setCart={setCart}
          onClose={() => setIsCartOpen(false)}
          onOrderCreated={(newOrd) => {
            setIsCartOpen(false);
            setReceiptOrder(newOrd);
            notify(`تم تأكيد الطلب بنجاح — رقم الطلب ${newOrd.orderNumber}`);
          }}
          notify={notify}
        />
      )}

      {/* إيصال تأكيد الطلب */}
      {receiptOrder && (
        <OrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}

// ============================================================================
// 5. الواجهة الرئيسية (HomeView) — عروض خاصة + أفضل المنتجات تقييماً + حاسبة المقاس
// ============================================================================

function HomeView({
  store, isLight, activePromotions, onNavigate, onGoAdminTab, onSelectCategory,
  onOpenProduct, onAddToCart, onOpenSizeFinder, wishlist, onToggleWishlist,
  compareIds, onToggleCompare,
}) {
  const activeProducts = store.products.filter((p) => p.isActive);
  const bestSellers = activeProducts.filter((p) =>
    p.badge === 'الأكثر مبيعاً' || p.isFeatured || p.isBestSeller
  ).slice(0, 4);
  const featuredProducts = bestSellers.length ? bestSellers : activeProducts.slice(0, 4);
  const categoryImages = {
    hoodies: IMG.hoodie, tshirts: IMG.cta, 'football-kits': IMG.jersey,
    'pants-shorts': IMG.running, shoes: IMG.shoe, accessories: IMG.bag,
  };
  const benefits = [
    { icon: Truck, title: 'توصيل سريع', detail: 'لكل محافظات مصر' },
    { icon: Shield, title: 'جودة مضمونة', detail: 'منتجات مختارة بعناية' },
    { icon: CheckCircle2, title: 'استبدال سهل', detail: 'خدمة تساعدك بعد الشراء' },
    { icon: CreditCard, title: 'طرق دفع متعددة', detail: 'اختر الأنسب لك' },
  ];

  return (
    <div className="bg-[#08090B] text-white" dir="rtl">
      <section className="border-b border-white/10 bg-[#17191D] px-4 py-2.5 text-center text-[11px] font-bold text-white sm:text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1">
          <span>توصيل سريع لجميع أنحاء مصر</span><span className="hidden text-white/30 sm:inline">•</span>
          <span>جودة رياضية مميزة</span><span className="hidden text-white/30 sm:inline">•</span>
          <span>خدمة عملاء لمساعدتك</span>
        </div>
      </section>

      <section className="relative isolate min-h-[520px] overflow-hidden sm:min-h-[620px]">
        <img src={store.settings.customHeroImage || IMG.hero} alt="تشكيلة ريمونتادا للملابس الرياضية" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/75 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-black/20" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-16 sm:min-h-[620px] sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-white/30 bg-black/30 px-4 py-2 text-xs font-extrabold text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#E6392B]" /> ريمونتادا — ارتدِ الشغف
            </div>
            <h1 className="text-4xl font-black leading-[1.2] tracking-tight sm:text-6xl lg:text-7xl">
              {store.settings.heroTitle && store.settings.heroTitle !== 'REMONTADA SPORTSWEAR' ? store.settings.heroTitle : 'ارتدِ الشغف'}
              <span className="mt-2 block text-[#E6392B]">وكن مستعداً للانطلاق</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-white/80 sm:text-base">
              {store.settings.heroSubtitle && !store.settings.heroSubtitle.includes('أضف منتجاتك وصورك')
                ? store.settings.heroSubtitle
                : 'اكتشف الملابس الرياضية والأطقم والأحذية والإكسسوارات التي تجمع بين الراحة والأداء.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('shop')} className="inline-flex items-center gap-3 bg-[#E6392B] px-7 py-4 text-sm font-black text-white transition hover:bg-[#C92C22]">
                تسوق الآن <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={onOpenSizeFinder} className="inline-flex items-center gap-2 border border-white/60 bg-black/20 px-6 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-black">
                اعرف مقاسك
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-xs font-bold text-white/75">
              <span className="border-r-2 border-[#E6392B] pr-3">ملابس رياضية</span>
              <span className="border-r-2 border-[#E6392B] pr-3">أطقم كرة القدم</span>
              <span className="border-r-2 border-[#E6392B] pr-3">أحذية وإكسسوارات</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111317]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {benefits.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-3 bg-[#111317] px-4 py-5 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E6392B]/50 text-[#E6392B]"><Icon className="h-5 w-5" /></span>
              <span><span className="block text-xs font-black text-white sm:text-sm">{title}</span><span className="mt-1 block text-[10px] text-white/55 sm:text-xs">{detail}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-black tracking-widest text-[#E6392B]">تسوق حسب احتياجك</p><h2 className="text-3xl font-black sm:text-4xl">أقسام المتجر</h2><p className="mt-2 text-sm text-white/55">اختر القسم لعرض منتجاته فقط في صفحة مستقلة.</p></div>
          <button onClick={() => onNavigate('shop')} className="text-xs font-bold text-[#E6392B] hover:text-white">عرض كل المنتجات ←</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PRODUCT_CATEGORIES.map((category) => (
            <button key={category.id} onClick={() => onSelectCategory(category.id)} className="group relative min-h-[190px] overflow-hidden border border-white/10 bg-[#17191D] text-right transition hover:-translate-y-1 hover:border-[#E6392B]">
              <img src={categoryImages[category.id] || IMG.cta} alt={category.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-110 group-hover:opacity-75" />
              <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="block text-sm font-black text-white sm:text-base">{category.name}</span>
                <span className="mt-1 block text-[10px] font-bold text-white/65">{category.description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#FF6258]">تسوق القسم <ChevronLeft className="h-3.5 w-3.5" /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111317]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-xs font-black tracking-widest text-[#E6392B]">اختيارات ريمونتادا</p><h2 className="text-3xl font-black sm:text-4xl">الأكثر مبيعاً</h2><p className="mt-2 text-sm text-white/55">منتجات المتجر الفعلية المضافة من لوحة الإدارة.</p></div>
            <button onClick={() => onNavigate('shop')} className="text-xs font-bold text-[#E6392B] hover:text-white">اكتشف كل المنتجات ←</button>
          </div>
          {featuredProducts.length === 0 ? (
            <div className="border border-dashed border-white/20 bg-black/20 px-5 py-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-[#E6392B]" />
              <h3 className="text-base font-black">قريباً — منتجات ريمونتادا</h3>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-white/55">المنتجات التي تضيفها من لوحة الإدارة ستظهر هنا تلقائياً، بدون عرض منتجات أو أسعار غير حقيقية.</p>
              <button onClick={() => onGoAdminTab('products')} className="mt-5 bg-[#E6392B] px-5 py-3 text-xs font-black text-white">إضافة المنتجات</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} promotions={store.promotions} reviews={store.reviews} isLight={false}
                  onOpen={() => onOpenProduct(product)} onAddToCart={() => onAddToCart(product.id)}
                  isWishlisted={wishlist.includes(product.id)} onToggleWishlist={() => onToggleWishlist(product.id)}
                  isCompared={compareIds.includes(product.id)} onToggleCompare={() => onToggleCompare(product.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {activePromotions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6"><p className="mb-2 text-xs font-black tracking-widest text-[#E6392B]">لفترة محدودة</p><h2 className="text-2xl font-black sm:text-3xl">العروض الحالية</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePromotions.map((promo) => (
              <div key={promo.id} className="border border-white/10 bg-[#17191D] p-5">
                <span className="inline-block bg-[#E6392B] px-3 py-1 text-xs font-black text-white">
                  {promo.discountType === 'percentage' ? 'خصم ' + promo.discountValue + '%' : 'خصم ' + formatEGP(promo.discountValue)}
                </span>
                <h3 className="mt-3 text-base font-black">{promo.title}</h3>
                {promo.endsAt && <p className="mt-2 text-xs text-white/55">ينتهي العرض: {new Date(promo.endsAt).toLocaleDateString('ar-EG')}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden border-y border-white/10">
        <img src={IMG.cta} alt="تصميمات ريمونتادا الرياضية" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/85 to-black/45" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:py-20">
          <div><p className="mb-3 text-xs font-black tracking-widest text-[#FF6258]">تصميمك — بطريقتك</p><h2 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">اطبع اسمك أو تصميمك على التيشيرتات والهوديز</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/70">ابعتلنا الاسم واللون والتصميم على واتساب، وهنأكد لك التفاصيل والسعر قبل التنفيذ.</p></div>
          <a href="https://wa.me/201221855469?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%AA%D8%B5%D9%85%D9%8A%D9%85%D8%A7%D9%8B%20%D8%AE%D8%A7%D8%B5%D8%A7%D9%8B%20%D8%B9%D9%84%D9%89%20%D9%85%D9%86%D8%AA%D8%AC" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#E6392B] px-7 py-4 text-sm font-black text-white transition hover:bg-[#C92C22]">
            اطلب تصميمك عبر واتساب <ChevronLeft className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="bg-[#08090B] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
          <div><div className="text-xl font-black tracking-widest text-white">REMONTADA</div><div className="mt-1 text-[10px] font-bold tracking-[0.3em] text-white/45">SPORTSWEAR</div></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/65">
            <button onClick={() => onNavigate('home')}>الرئيسية</button><button onClick={() => onNavigate('shop')}>كل المنتجات</button><button onClick={() => onNavigate('account')}>طلباتي</button><a href="https://wa.me/201221855469" target="_blank" rel="noreferrer">دعم واتساب</a>
          </div>
        </div>
        <p className="mx-auto max-w-7xl pt-6 text-center text-[11px] text-white/40">© ريمونتادا. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}

// ============================================================================
// 6. بطاقة المنتج الاحترافية (ProductCard)
// ============================================================================

function ProductCard({
  product,
  promotions,
  reviews,
  isLight,
  onOpen,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isCompared,
  onToggleCompare,
}) {
  const pricing = getEffectivePrice(product.basePrice, product.id, product.sportId, promotions);
  const ratingStats = getProductRatingStats(product.id, reviews);
  const totalStock = product.variants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0);

  return (
    <div
      className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#00D4FF]/30 transition duration-300 hover:-translate-y-1 hover:border-[#00D4FF] hover:shadow-[0_0_28px_rgba(0,212,255,0.3)] ${
        isLight
          ? 'bg-white text-[#05050F]'
          : 'bg-gradient-to-b from-[#0A1A3A]/85 to-[#05050F] text-white'
      }`}
    >
      <div>
        <div onClick={onOpen} className="relative aspect-square cursor-pointer overflow-hidden bg-[#05050F]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-[#00D4FF]/40">
              <ImageIcon className="h-10 w-10" />
              <span className="mt-1 text-[10px]">بدون صورة</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {pricing.hasDiscount && (
              <span
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                className="rounded-lg bg-[#00B4FF] px-2.5 py-1 text-[11px] font-black text-[#05050F] shadow-[0_0_16px_rgba(0,212,255,0.75)]"
              >
                خصم {pricing.discountPercent}%
              </span>
            )}
            {ratingStats.count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#00D4FF]/50 bg-[#05050F]/90 px-2 py-0.5 text-[10px] font-extrabold text-[#00D4FF]">
                <Star className="h-3 w-3 fill-[#00D4FF]" />
                <span>{ratingStats.avg} ({ratingStats.count})</span>
              </span>
            )}
            {totalStock === 0 && (
              <span className="rounded-lg border border-white/30 bg-[#05050F]/90 px-2.5 py-0.5 text-[10px] font-bold text-[#A0AEC0]">
                نفد المخزون
              </span>
            )}
          </div>

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist();
              }}
              className={`rounded-xl border p-2 backdrop-blur-md transition ${
                isWishlisted
                  ? 'border-[#00D4FF] bg-[#00B4FF] text-[#05050F]'
                  : 'border-[#00D4FF]/30 bg-[#05050F]/75 text-white hover:border-[#00D4FF]'
              }`}
              title="المفضلة"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`rounded-xl border p-2 backdrop-blur-md transition ${
                isCompared
                  ? 'border-[#00D4FF] bg-[#00B4FF] text-[#05050F]'
                  : 'border-[#00D4FF]/30 bg-[#05050F]/75 text-white hover:border-[#00D4FF]'
              }`}
              title="مقارنة"
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-bold text-[#00B4FF]">{product.brand || 'REMONTADA'}</div>
          <h3 onClick={onOpen} className="mt-1 cursor-pointer text-sm font-extrabold hover:text-[#00B4FF]">
            {product.title}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.variants.map((v) => (
              <span
                key={v.id}
                className={`rounded border px-1.5 py-0.5 text-[10px] ${
                  Number(v.stockQty) > 0
                    ? 'border-[#00D4FF]/30 text-[#00B4FF]'
                    : 'border-white/10 text-[#A0AEC0]/35 line-through'
                }`}
              >
                {v.size}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#00D4FF]/15 px-4 py-3.5">
        <div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-base font-black text-[#00B4FF]">
            {formatEGP(pricing.finalPrice)}
          </div>
          {pricing.hasDiscount && (
            <div className="text-[11px] text-[#A0AEC0] line-through">{formatEGP(product.basePrice)}</div>
          )}
        </div>

        <button
          disabled={totalStock === 0}
          onClick={onAddToCart}
          className="rounded-xl bg-[#00B4FF] px-3.5 py-2 text-xs font-black text-[#05050F] transition hover:bg-[#00D4FF] disabled:opacity-35"
        >
          {totalStock === 0 ? 'غير متوفر' : 'أضف للسلة'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 7. صفحة المتجر والفلاتر (ShopView)
// ============================================================================

function ShopView({
  store,
  isLight,
  products,
  filterSport,
  setFilterSport,
  filterCategory,
  setFilterCategory,
  onSelectCategory,
  filterGender,
  setFilterGender,
  filterDiscountOnly,
  setFilterDiscountOnly,
  sortBy,
  setSortBy,
  onOpenProduct,
  onAddToCart,
  onOpenSizeFinder,
  wishlist,
  onToggleWishlist,
  compareIds,
  onToggleCompare,
  onGoAdmin,
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-3xl font-black">
            {filterCategory === 'all' ? 'كل المنتجات' : (PRODUCT_CATEGORIES.find((c) => c.id === filterCategory)?.name || 'القسم')}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenSizeFinder}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/45 bg-[#0A1A3A] px-4 py-2.5 text-xs font-extrabold text-[#00D4FF]"
          >
            <Ruler className="h-4 w-4" />
            <span>حاسبة المقاس (ملابس / أحذية)</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-4 py-2.5 text-xs font-bold outline-none ${
              isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
            }`}
          >
            <option value="newest">الترتيب: الأحدث</option>
            <option value="top-rated">الأعلى تقييماً</option>
            <option value="price-asc">السعر: من الأقل للأعلى (ج.م)</option>
            <option value="price-desc">السعر: من الأعلى للأقل (ج.م)</option>
          </select>
        </div>
      </div>

      <section className={`mb-7 rounded-2xl border border-[#00D4FF]/25 p-4 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/45'}`}>
        <div className="mb-3 text-sm font-black text-[#00B4FF]">تصفح أقسام المتجر</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onSelectCategory('all')} className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${filterCategory === 'all' ? 'bg-[#00B4FF] text-[#05050F]' : 'border border-[#00D4FF]/30'}`}>كل المنتجات</button>
          {PRODUCT_CATEGORIES.map((category) => (
            <button key={category.id} onClick={() => onSelectCategory(category.id)} className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${filterCategory === category.id ? 'bg-[#00B4FF] text-[#05050F]' : 'border border-[#00D4FF]/30'}`}>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside
          className={`h-fit space-y-4 rounded-2xl border border-[#00D4FF]/30 p-5 lg:col-span-3 ${
            isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-black text-[#00B4FF]">
            <SlidersHorizontal className="h-4 w-4" />
            <span>تصفية المنتجات</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">قسم المنتجات</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            >
              <option value="all">كل الأقسام</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">الرياضة</label>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className={`w-full rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            >
              <option value="all">كل الرياضات</option>
              {store.sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">الفئة</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={`w-full rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            >
              <option value="all">الكل</option>
              <option value="men">رجالي</option>
              <option value="women">نسائي</option>
              <option value="unisex">للجنسين</option>
              <option value="kids">أطفال</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-bold">
            <input
              type="checkbox"
              checked={filterDiscountOnly}
              onChange={(e) => setFilterDiscountOnly(e.target.checked)}
              className="accent-[#00B4FF]"
            />
            <span>العروض الخاصة والمخفضة فقط</span>
          </label>
        </aside>

        <div className="lg:col-span-9">
          {products.length === 0 ? (
            <div
              className={`rounded-3xl border border-dashed border-[#00D4FF]/35 p-14 text-center ${
                isLight ? 'bg-white' : 'bg-[#0A1A3A]/35'
              }`}
            >
              <Package className="mx-auto mb-3 h-12 w-12 text-[#00D4FF]" />
              <h3 className="text-lg font-black">لا توجد منتجات مضافة في هذا القسم بعد</h3>
              <button
                onClick={onGoAdmin}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00B4FF] px-6 py-3 text-xs font-black text-[#05050F]"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة منتجات من لوحة التحكم</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  promotions={store.promotions}
                  reviews={store.reviews}
                  isLight={isLight}
                  onOpen={() => onOpenProduct(product)}
                  onAddToCart={() => onAddToCart(product.id)}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={() => onToggleWishlist(product.id)}
                  isCompared={compareIds.includes(product.id)}
                  onToggleCompare={() => onToggleCompare(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. حاسبة المقاس الذكية المتطورة (ملابس رياضية + أحذية رياضية)
// ============================================================================

function SizeFinderModal({ onClose, notify }) {
  const [mode, setMode] = useState('apparel'); // 'apparel' | 'footwear'
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitType, setFitType] = useState('regular');
  const [footCm, setFootCm] = useState('');

  const apparelRec = useMemo(
    () => recommendApparelSize(height, weight, fitType),
    [height, weight, fitType]
  );

  const footwearRec = useMemo(() => recommendFootwearSize(footCm), [footCm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-[#00D4FF]/50 bg-gradient-to-br from-[#0A1A3A] to-[#05050F] p-6 text-white shadow-[0_0_50px_rgba(0,212,255,0.35)]">
        <div className="flex items-center justify-between border-b border-[#00D4FF]/25 pb-4">
          <div className="flex items-center gap-2 text-[#00D4FF]">
            <Ruler className="h-5 w-5" />
            <h2 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-lg font-black">
              حاسبة المقاس الذكية
            </h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#00D4FF]/40 p-2 text-[#00D4FF]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* التبديل بين الملابس الرياضية والأحذية الرياضية */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#00D4FF]/30 bg-[#05050F] p-1.5 text-xs font-black">
          <button
            type="button"
            onClick={() => setMode('apparel')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 transition ${
              mode === 'apparel' ? 'bg-[#00B4FF] text-[#05050F]' : 'text-[#A0AEC0] hover:text-white'
            }`}
          >
            <Shirt className="h-4 w-4" />
            <span>الملابس الرياضية</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('footwear')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 transition ${
              mode === 'footwear' ? 'bg-[#00B4FF] text-[#05050F]' : 'text-[#A0AEC0] hover:text-white'
            }`}
          >
            <Footprints className="h-4 w-4" />
            <span>الأحذية الرياضية</span>
          </button>
        </div>

        {mode === 'apparel' ? (
          <div className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-bold text-[#00D4FF]">الطول (سم)</label>
                <input
                  type="number"
                  min={100}
                  max={230}
                  placeholder="مثال: 178"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl border border-[#00D4FF]/40 bg-[#05050F] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[#00D4FF]">الوزن (كجم)</label>
                <input
                  type="number"
                  min={25}
                  max={200}
                  placeholder="مثال: 76"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-[#00D4FF]/40 bg-[#05050F] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-[#00D4FF]">نوع القصة المفضلة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slim', label: 'ضيقة (Slim)' },
                  { id: 'regular', label: 'قياسية (Regular)' },
                  { id: 'oversized', label: 'واسعة (Oversized)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFitType(opt.id)}
                    className={`rounded-xl border py-2.5 font-extrabold transition ${
                      fitType === opt.id
                        ? 'border-[#00D4FF] bg-[#00B4FF] text-[#05050F]'
                        : 'border-[#00D4FF]/30 bg-[#05050F] text-[#A0AEC0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {apparelRec ? (
              <div className="rounded-2xl border border-[#00D4FF] bg-[#001F4D]/80 p-5 text-center shadow-[0_0_25px_rgba(0,212,255,0.3)]">
                <div className="text-xs font-bold text-[#00D4FF]">المقاس الأنسب للملابس الرياضية</div>
                <div
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                  className="my-2 text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(0,212,255,0.8)]"
                >
                  {apparelRec.size}
                </div>
                <div className="flex justify-center gap-4 text-[11px] font-bold text-[#00D4FF]">
                  <span>محيط الصدر: {apparelRec.chestRange}</span>
                  <span>|</span>
                  <span>محيط الخصر: {apparelRec.waistRange}</span>
                </div>
                <div className="mt-1.5 text-xs text-[#A0AEC0]">{apparelRec.note}</div>
                <button
                  type="button"
                  onClick={() => {
                    notify(`تم اعتماد مقاس الملابس (${apparelRec.size})`);
                    onClose();
                  }}
                  className="mt-4 rounded-xl bg-[#00B4FF] px-5 py-2 text-xs font-black text-[#05050F]"
                >
                  اعتماد المقاس {apparelRec.size}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#00D4FF]/30 bg-[#05050F]/60 p-4 text-center text-[#A0AEC0]">
                أدخل الطول والوزن ليظهر لك المقاس المناسب ومحيط الصدر والخصر تلقائياً.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <label className="mb-1.5 block font-bold text-[#00D4FF]">طول القدم (سم)</label>
              <input
                type="number"
                step="0.1"
                min={18}
                max={33}
                placeholder="مثال: 26.5"
                value={footCm}
                onChange={(e) => setFootCm(e.target.value)}
                className="w-full rounded-xl border border-[#00D4FF]/40 bg-[#05050F] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF]"
              />
            </div>

            {footwearRec ? (
              <div className="rounded-2xl border border-[#00D4FF] bg-[#001F4D]/80 p-5 text-center shadow-[0_0_25px_rgba(0,212,255,0.3)]">
                <div className="text-xs font-bold text-[#00D4FF]">مقاس الحذاء الرياضي المقترح (EU)</div>
                <div
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                  className="my-2 text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(0,212,255,0.8)]"
                >
                  EU {footwearRec.euSize}
                </div>
                <div className="text-xs text-[#A0AEC0]">{footwearRec.advice}</div>
                <button
                  type="button"
                  onClick={() => {
                    notify(`تم اعتماد مقاس الحذاء (EU ${footwearRec.euSize})`);
                    onClose();
                  }}
                  className="mt-4 rounded-xl bg-[#00B4FF] px-5 py-2 text-xs font-black text-[#05050F]"
                >
                  اعتماد مقاس EU {footwearRec.euSize}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#00D4FF]/30 bg-[#05050F]/60 p-4 text-center text-[#A0AEC0]">
                أدخل طول القدم بالسنتيمتر (من الكعب حتى أطول إصبع) لحساب مقاس الحذاء الرياضي بدقة.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 9. نافذة تفاصيل المنتج (معرض صور + تكبير + اختيار المقاس واللون + التقييمات الحقيقية)
// ============================================================================

function ProductDetailModal({ product, store, onClose, onAddToCart, onOpenSizeFinder, onBuyNow }) {
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '');
  const [qty, setQty] = useState(1);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const maxStock = Number(selectedVariant?.stockQty || 0);
  const pricing = getEffectivePrice(product.basePrice, product.id, product.sportId, store.promotions);
  const ratingStats = getProductRatingStats(product.id, store.reviews);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#00D4FF]/45 bg-gradient-to-br from-[#0A1A3A] to-[#05050F] p-6 text-white shadow-[0_0_50px_rgba(0,212,255,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rounded-xl border border-[#00D4FF]/40 p-2 text-[#00D4FF] hover:bg-[#00D4FF]/15"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-3 md:col-span-6">
            <div
              onClick={() => setZoomed((z) => !z)}
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-[#00D4FF]/30 bg-[#05050F]"
            >
              {product.images?.[activeImg] ? (
                <img
                  src={product.images[activeImg]}
                  alt={product.title}
                  className={`h-full w-full object-cover transition-transform duration-300 ${
                    zoomed ? 'scale-150 cursor-zoom-out' : ''
                  }`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#00D4FF]/40">
                  <ImageIcon className="h-14 w-14" />
                </div>
              )}
              {product.images?.[activeImg] && (
                <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-[#05050F]/80 px-2.5 py-1 text-[10px] text-[#00D4FF]">
                  <Eye className="h-3 w-3" />
                  <span>{zoomed ? 'تصغير' : 'تكبير'}</span>
                </span>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveImg(i);
                      setZoomed(false);
                    }}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                      activeImg === i ? 'border-[#00D4FF]' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 md:col-span-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00D4FF]">{product.brand || 'REMONTADA'}</span>
                {ratingStats.count > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00D4FF]">
                    <Star className="h-3.5 w-3.5 fill-[#00D4FF]" />
                    <span>{ratingStats.avg} ({ratingStats.count} تقييم)</span>
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-2xl font-black">{product.title}</h2>
            </div>

            <div className="flex items-baseline gap-3">
              <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-3xl font-black text-[#00D4FF]">
                {formatEGP(pricing.finalPrice)}
              </span>
              {pricing.hasDiscount && (
                <>
                  <span className="text-sm text-[#A0AEC0] line-through">{formatEGP(product.basePrice)}</span>
                  <span className="rounded-lg bg-[#00B4FF] px-2.5 py-0.5 text-xs font-black text-[#05050F]">
                    خصم {pricing.discountPercent}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="text-xs leading-relaxed text-[#A0AEC0]">{product.description}</p>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span>اختر المقاس واللون:</span>
                <button
                  type="button"
                  onClick={onOpenSizeFinder}
                  className="inline-flex items-center gap-1 text-[#00D4FF] underline"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>حاسبة المقاس (ملابس / أحذية)</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSel = v.id === selectedVariant?.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQty(1);
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
                        isSel
                          ? 'border-[#00D4FF] bg-[#00B4FF]/20 font-black text-white'
                          : 'border-[#00D4FF]/25 text-[#A0AEC0]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full border border-white/50"
                          style={{ backgroundColor: v.colorHex || '#00B4FF' }}
                        />
                        <span>{v.size} - {v.colorName}</span>
                      </span>
                      <span className="text-[10px] text-[#00D4FF]">({v.stockQty})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center rounded-xl border border-[#00D4FF]/40 bg-[#05050F]">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-2.5 font-black text-[#00D4FF]">
                  -
                </button>
                <span className="px-3 text-sm font-bold">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(Math.max(1, maxStock), qty + 1))}
                  className="px-3.5 py-2.5 font-black text-[#00D4FF]"
                >
                  +
                </button>
              </div>

              <button
                disabled={maxStock <= 0}
                onClick={() => onAddToCart(product.id, selectedVariant?.id, qty)}
                className="flex-1 rounded-xl bg-[#00B4FF] py-3 text-xs font-black text-[#05050F] hover:bg-[#00D4FF] disabled:opacity-35"
              >
                أضف للسلة
              </button>

              <button
                disabled={maxStock <= 0}
                onClick={() => onBuyNow(product.id, selectedVariant?.id, qty)}
                className="rounded-xl border border-[#00D4FF] bg-[#0A1A3A] px-4 py-3 text-xs font-black text-[#00D4FF]"
              >
                اشترِ الآن
              </button>
            </div>

            {/* التقييمات الحقيقية للمنتج */}
            <div className="space-y-2 border-t border-[#00D4FF]/20 pt-4">
              <div className="text-xs font-black text-[#00D4FF]">
                تقييمات العملاء ({ratingStats.count})
              </div>
              {ratingStats.items.length === 0 ? (
                <div className="text-[11px] text-[#A0AEC0]">
                  لا توجد تقييمات بعد — يمكن للمشتري تقييم المنتج من صفحة "طلباتي وتقييمي" بعد استلام الطلب.
                </div>
              ) : (
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {ratingStats.items.map((rev) => (
                    <div key={rev.id} className="rounded-xl border border-[#00D4FF]/20 bg-[#05050F]/60 p-2.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span>{rev.authorName}</span>
                        <span className="text-[#00D4FF]">{rev.rating} / 5 ★</span>
                      </div>
                      {rev.comment && <p className="mt-1 text-[11px] text-[#A0AEC0]">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. نافذة مقارنة المنتجات (CompareModal)
// ============================================================================

function CompareModal({ products, promotions, reviews, onRemove, onAddToCart, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-3xl border border-[#00D4FF]/45 bg-[#05050F] p-6 text-white">
        <div className="flex items-center justify-between border-b border-[#00D4FF]/25 pb-4">
          <h2 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-lg font-black text-[#00D4FF]">
            مقارنة المنتجات ({products.length})
          </h2>
          <button onClick={onClose} className="rounded-xl border border-[#00D4FF]/40 p-2 text-[#00D4FF]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {products.map((p) => {
            const pr = getEffectivePrice(p.basePrice, p.id, p.sportId, promotions);
            const st = getProductRatingStats(p.id, reviews);
            return (
              <div key={p.id} className="space-y-3 rounded-2xl border border-[#00D4FF]/30 bg-[#0A1A3A]/60 p-4">
                <div className="aspect-square overflow-hidden rounded-xl bg-[#05050F]">
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="text-sm font-black">{p.title}</div>
                <div className="text-xs text-[#A0AEC0]">الماركة: {p.brand || 'REMONTADA'}</div>
                <div className="text-xs text-[#00D4FF]">
                  التقييم: {st.count > 0 ? `${st.avg} / 5 (${st.count})` : 'غير مقيّم بعد'}
                </div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-base font-black text-[#00D4FF]">
                  {formatEGP(pr.finalPrice)}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onAddToCart(p.id)}
                    className="flex-1 rounded-xl bg-[#00B4FF] py-2 text-xs font-black text-[#05050F]"
                  >
                    أضف للسلة
                  </button>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs text-[#A0AEC0]"
                  >
                    إزالة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. سلة المشتريات وإتمام الطلب (شحن مدفوع دائماً - لا يوجد شحن مجاني)
// ============================================================================

function CartDrawer({
  store,
  setStore,
  cartDetails,
  cartSubtotal,
  setCart,
  onClose,
  onOrderCreated,
  notify,
}) {
  const [step, setStep] = useState('cart');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const activeGovs = store.governorates.filter((g) => g.active);
  const [govId, setGovId] = useState(store.customerProfile?.governorateId || activeGovs[0]?.id || '');
  const [customerName, setCustomerName] = useState(store.customerProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(store.customerProfile?.phone || '');
  const [city, setCity] = useState(store.customerProfile?.city || '');
  const [address, setAddress] = useState(store.customerProfile?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [printOptions, setPrintOptions] = useState({});
  const namePrintingFee = Math.max(0, Number(store.settings?.namePrintingFee || 0));
  const getPrintOption = (item) => printOptions[`${item.productId}-${item.variantId}`] || { enabled: false, names: Array.from({ length: item.qty }, () => '') };
  const printingTotal = cartDetails.reduce((sum, item) => {
    const option = getPrintOption(item);
    return sum + (item.product.supportsNamePrinting && option.enabled ? item.qty * namePrintingFee : 0);
  }, 0);

  const selectedGov = activeGovs.find((g) => g.id === govId) || activeGovs[0];
  const shippingFee = Math.max(1, Number(selectedGov?.fee || 65));

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || !appliedCoupon.isActive) return 0;
    return appliedCoupon.discountType === 'percentage'
      ? Math.round(cartSubtotal * (Number(appliedCoupon.discountValue) / 100))
      : Math.min(cartSubtotal, Number(appliedCoupon.discountValue));
  }, [appliedCoupon, cartSubtotal]);

  const grandTotal = Math.max(0, cartSubtotal - couponDiscount) + shippingFee + printingTotal;

  const handleApplyCoupon = () => {
    const found = store.coupons.find(
      (c) => c.code === couponCode.trim().toUpperCase() && c.isActive
    );
    if (!found) {
      notify('كود الخصم غير صالح');
      return;
    }
    setAppliedCoupon(found);
    notify(`تم تفعيل كود الخصم (${found.code})`);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !city.trim() || !address.trim()) {
      notify('يرجى إدخال جميع بيانات التوصيل');
      return;
    }
    if (printingTotal > 0 && namePrintingFee <= 0) { notify('الإدارة لم تحدد سعر طباعة الاسم بعد'); return; }
    const missingPrintName = cartDetails.some((item) => {
      const option = getPrintOption(item);
      return item.product.supportsNamePrinting && option.enabled && Array.from({ length: item.qty }, (_, i) => String(option.names?.[i] || '').trim()).some((name) => !name);
    });
    if (missingPrintName) {
      notify('اكتب الاسم المطلوب طباعته لكل قطعة اخترت لها الطباعة');
      return;
    }

    const orderNumber = `RMT-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      governorate: selectedGov?.name || 'القاهرة',
      city: city.trim(),
      address: address.trim(),
      paymentMethod,
      assignedAgentId: '',
      assignedAgentName: '',
      cashCollected: false,
      deliveryPhoto: '',
      deliveryNote: '',
      customerConfirmedReceipt: false,
      status: 'جديد',
      subtotal: cartSubtotal,
      discount: couponDiscount,
      shippingFee,
      total: grandTotal,
      printingTotal,
      items: cartDetails.map((d) => {
        const option = getPrintOption(d);
        const shouldPrint = Boolean(d.product.supportsNamePrinting && option.enabled);
        const names = shouldPrint ? Array.from({ length: d.qty }, (_, i) => String(option.names?.[i] || '').trim()) : [];
        return { productId: d.product.id, variantId: d.variant.id, productTitle: d.product.title, size: d.variant.size, colorName: d.variant.colorName, qty: d.qty, lineTotal: d.lineTotal, printNames: names, printingQty: shouldPrint ? d.qty : 0, printingFee: shouldPrint ? namePrintingFee : 0, printingTotal: shouldPrint ? d.qty * namePrintingFee : 0, rated: false };
      }),
      createdAt: new Date().toISOString(),
    };

    try {
      await reserveOnlineInventory(newOrder.id, cartDetails.map((d) => ({
        productId: d.product.id,
        variantId: d.variant.id,
        productTitle: d.product.title,
        qty: d.qty,
      })));
    } catch (error) {
      notify(error?.message || 'تعذر تأكيد الكمية من المخزون المركزي. حاول مرة أخرى.');
      return;
    }

    setStore((prev) => ({
      ...prev,
      customerProfile: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        governorateId: selectedGov?.id || prev.customerProfile.governorateId,
        city: city.trim(),
        address: address.trim(),
      },
      products: prev.products.map((prod) => {
        const bought = cartDetails.filter((d) => d.product.id === prod.id);
        if (bought.length === 0) return prod;
        return {
          ...prod,
          variants: prod.variants.map((v) => {
            const m = bought.find((b) => b.variant.id === v.id);
            return m ? { ...v, stockQty: Math.max(0, Number(v.stockQty) - m.qty) } : v;
          }),
        };
      }),
      orders: [newOrder, ...prev.orders],
    }));

    setCart([]);
    onOrderCreated(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col justify-between overflow-y-auto border-r border-[#00D4FF]/40 bg-gradient-to-b from-[#0A1A3A] to-[#05050F] p-6 text-white">
        <div>
          <div className="flex items-center justify-between border-b border-[#00D4FF]/25 pb-4">
            <h2 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-xl font-black text-[#00D4FF]">
              {step === 'cart' ? 'سلة المشتريات' : 'إتمام الطلب والدفع'}
            </h2>
            <button onClick={onClose} className="rounded-xl border border-[#00D4FF]/35 p-2 text-[#00D4FF]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {cartDetails.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#A0AEC0]">سلة المشتريات فارغة حالياً.</div>
          ) : step === 'cart' ? (
            <div className="mt-5 space-y-4">
              {cartDetails.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#00D4FF]/25 bg-[#05050F]/65 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#05050F]">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">{item.product.title}</div>
                      <div className="text-[11px] text-[#A0AEC0]">
                        {item.variant?.size} — {item.variant?.colorName}
                      </div>
                      <div className="mt-1 text-xs font-black text-[#00D4FF]">{formatEGP(item.lineTotal)}</div>
                      {item.product.supportsNamePrinting && (
                        <div className="mt-2 space-y-2 rounded-xl border border-[#00D4FF]/25 bg-[#0A1A3A]/60 p-2">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-[#00D4FF]">
                            <input type="checkbox" checked={Boolean(getPrintOption(item).enabled)} onChange={(e) => { if (e.target.checked && namePrintingFee <= 0) { notify('الإدارة لم تحدد سعر طباعة الاسم بعد'); return; } setPrintOptions((prev) => { const key = `${item.productId}-${item.variantId}`; const current = prev[key] || { names: Array.from({ length: item.qty }, () => '') }; return { ...prev, [key]: { ...current, enabled: e.target.checked, names: Array.from({ length: item.qty }, (_, i) => current.names?.[i] || '') } }; }); }} className="accent-[#00B4FF]" />
                            <span>طباعة اسم على التيشيرت (+{formatEGP(namePrintingFee)} للقطعة)</span>
                          </label>
                          {getPrintOption(item).enabled && Array.from({ length: item.qty }, (_, i) => (
                            <input key={i} type="text" maxLength={18} required value={getPrintOption(item).names?.[i] || ''} onChange={(e) => setPrintOptions((prev) => { const key = `${item.productId}-${item.variantId}`; const current = prev[key] || { enabled: true, names: Array.from({ length: item.qty }, () => '') }; const names = Array.from({ length: item.qty }, (_, index) => current.names?.[index] || ''); names[i] = e.target.value; return { ...prev, [key]: { ...current, enabled: true, names } }; })} placeholder={`اسم القطعة ${i + 1} للطباعة`} className="w-full rounded-lg border border-[#00D4FF]/30 bg-[#05050F] px-2.5 py-2 text-[11px] text-white outline-none" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setCart((prev) =>
                        prev.filter((c) => !(c.productId === item.productId && c.variantId === item.variantId))
                      )
                    }
                    className="text-xs text-[#A0AEC0] hover:text-white"
                  >
                    حذف
                  </button>
                </div>
              ))}

              <div className="space-y-3 rounded-2xl border border-[#00D4FF]/30 bg-[#05050F]/70 p-4">
                <label className="block text-xs font-bold text-[#00D4FF]">
                  اختر المحافظة لحساب التوصيل (مدفوع دائماً):
                </label>
                <select
                  value={govId}
                  onChange={(e) => setGovId(e.target.value)}
                  className="w-full rounded-xl border border-[#00D4FF]/35 bg-[#0A1A3A] px-3 py-2 text-xs text-white outline-none"
                >
                  {activeGovs.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — الشحن: {formatEGP(g.fee)}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 rounded-xl border border-[#00D4FF]/35 bg-[#0A1A3A] px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="rounded-xl bg-[#00B4FF] px-4 py-2 text-xs font-black text-[#05050F]"
                  >
                    تطبيق
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form id="rmt-checkout" onSubmit={handleCheckoutSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                required
                placeholder="الاسم الكامل *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-[#00D4FF]/35 bg-[#05050F] px-3.5 py-2.5 text-xs text-white outline-none"
              />
              <input
                type="tel"
                required
                placeholder="رقم الهاتف *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-[#00D4FF]/35 bg-[#05050F] px-3.5 py-2.5 text-xs text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={govId}
                  onChange={(e) => setGovId(e.target.value)}
                  className="rounded-xl border border-[#00D4FF]/35 bg-[#05050F] px-3 py-2.5 text-xs text-white outline-none"
                >
                  {activeGovs.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({formatEGP(g.fee)})</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="المدينة / المنطقة *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border border-[#00D4FF]/35 bg-[#05050F] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>
              <input
                type="text"
                required
                placeholder="العنوان التفصيلي *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-[#00D4FF]/35 bg-[#05050F] px-3.5 py-2.5 text-xs text-white outline-none"
              />

              <div className="space-y-2 pt-2 text-xs">
                <div className="font-bold text-[#00D4FF]">طريقة الدفع:</div>
                {[
                  store.settings.codEnabled && { id: 'cod', label: 'الدفع عند الاستلام (COD)', icon: Banknote },
                  store.settings.cardEnabled && { id: 'card', label: 'بطاقة بنكية (Paymob / Visa / Meeza)', icon: CreditCard },
                  store.settings.walletEnabled && { id: 'wallet', label: 'محفظة إلكترونية (Vodafone Cash / InstaPay)', icon: Wallet },
                ]
                  .filter(Boolean)
                  .map((m) => {
                    const Icon = m.icon;
                    return (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-[#00D4FF]/30 bg-[#05050F]/70 p-3"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <Icon className="h-4 w-4 text-[#00D4FF]" />
                          <span>{m.label}</span>
                        </span>
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                          className="accent-[#00B4FF]"
                        />
                      </label>
                    );
                  })}
              </div>
            </form>
          )}
        </div>

        {cartDetails.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-[#00D4FF]/25 pt-4 text-xs">
            <div className="flex justify-between text-[#A0AEC0]">
              <span>المجموع الفرعي:</span>
              <span>{formatEGP(cartSubtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between font-bold text-[#00D4FF]">
                <span>الخصم:</span>
                <span>- {formatEGP(couponDiscount)}</span>
              </div>
            )}
            {printingTotal > 0 && <div className="flex justify-between font-bold"><span>طباعة الأسماء:</span><span className="text-[#00D4FF]">{formatEGP(printingTotal)}</span></div>}
            <div className="flex justify-between font-bold">
              <span>تكلفة التوصيل ({selectedGov?.name}) — مدفوع:</span>
              <span className="text-[#00D4FF]">{formatEGP(shippingFee)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-black">
              <span>الإجمالي النهائي:</span>
              <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-[#00D4FF]">
                {formatEGP(grandTotal)}
              </span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="mt-2 w-full rounded-xl bg-[#00B4FF] py-3.5 text-xs font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
              >
                المتابعة للدفع
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="rounded-xl border border-[#00D4FF]/40 px-4 py-3 font-bold"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  form="rmt-checkout"
                  className="flex-1 rounded-xl bg-[#00B4FF] py-3 font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)]"
                >
                  تأكيد الطلب ({formatEGP(grandTotal)})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 12. حساب العميل + شريط التتبع المرئي + تأكيد الاستلام والتقييم الإلزامي
// ============================================================================

const ORDER_STEPS = ['جديد', 'قيد التجهيز', 'تم الشحن', 'تم التسليم'];

function AccountAndRatingView({ store, setStore, isLight, onViewReceipt, notify }) {
  const [ratingDrafts, setRatingDrafts] = useState({});

  const handleConfirmReceipt = (orderId) => {
    setStore((prev) => ({
      ...prev,
      orders: prev.orders.map((ord) =>
        ord.id === orderId
          ? { ...ord, customerConfirmedReceipt: true, status: 'تم التسليم' }
          : ord
      ),
    }));
    notify('تم تأكيد استلام الطلب — يمكنك الآن تقييم منتجات الطلب');
  };

  const handleSubmitProductRating = (orderId, item) => {
    const key = `${orderId}_${item.productId}`;
    const draft = ratingDrafts[key] || { rating: 5, comment: '' };
    const chosenRating = Number(draft.rating || 5);

    if (chosenRating < 1 || chosenRating > 5) {
      notify('يرجى اختيار تقييم من 1 إلى 5 نجوم');
      return;
    }

    const newReview = {
      id: `rev-${Date.now()}-${item.productId}`,
      productId: item.productId,
      orderId,
      authorName: store.customerProfile?.name || 'عميل مؤكد',
      rating: chosenRating,
      comment: draft.comment?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      reviews: [newReview, ...prev.reviews],
      orders: prev.orders.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) =>
            it.productId === item.productId ? { ...it, rated: true } : it
          ),
        };
      }),
    }));

    notify(`تم تسجيل تقييم "${item.productTitle}" (${chosenRating}/5) وتحديث قائمة الأفضل تقييماً`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-3xl font-black">
          طلباتي وتأكيد الاستلام والتقييم
        </h1>
        <p className={`mt-1 text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>
          تابع مراحل طلبك، أكّد الاستلام من داخل التطبيق، ثم قيّم المنتجات التي اشتريتها.
        </p>
      </div>

      {store.orders.length === 0 ? (
        <div className={`rounded-3xl border border-dashed border-[#00D4FF]/35 p-12 text-center text-xs text-[#A0AEC0] ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/35'}`}>
          لا توجد طلبات مسجلة حتى الآن.
        </div>
      ) : (
        <div className="space-y-6">
          {store.orders.map((ord) => {
            const canRate = Boolean(ord.customerConfirmedReceipt || ord.status === 'تم التسليم');
            const currentStepIndex = ORDER_STEPS.indexOf(ord.status);

            return (
              <div
                key={ord.id}
                className={`space-y-5 rounded-3xl border border-[#00D4FF]/35 p-6 ${
                  isLight ? 'bg-white' : 'bg-gradient-to-br from-[#0A1A3A]/80 to-[#05050F]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#00D4FF]/20 pb-4">
                  <div>
                    <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-base font-black text-[#00B4FF]">
                      طلب #{ord.orderNumber} — الحالة: {ord.status}
                    </div>
                    <div className="text-xs text-[#A0AEC0]">
                      الإجمالي: {formatEGP(ord.total)} (شامل شحن {formatEGP(ord.shippingFee)}) | {ord.governorate}، {ord.city}
                      {ord.assignedAgentName ? ` | مندوب التوصيل: ${ord.assignedAgentName}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!canRate ? (
                      <button
                        onClick={() => handleConfirmReceipt(ord.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B4FF] px-4 py-2.5 text-xs font-black text-[#05050F] shadow-[0_0_20px_rgba(0,212,255,0.45)] hover:bg-[#00D4FF]"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>تأكيد استلام الطلب من التطبيق</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-[#00D4FF]/50 bg-[#001F4D] px-3.5 py-2 text-xs font-extrabold text-[#00D4FF]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تم تأكيد الاستلام</span>
                      </span>
                    )}

                    <button
                      onClick={() => onViewReceipt(ord)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/40 px-3.5 py-2 text-xs font-bold text-[#00B4FF]"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>الفاتورة</span>
                    </button>
                  </div>
                </div>

                {/* خط سير مراحل الطلب المرئي */}
                {ord.status !== 'ملغي' && (
                  <div className="grid grid-cols-4 gap-2">
                    {ORDER_STEPS.map((st, idx) => {
                      const active = currentStepIndex >= idx;
                      return (
                        <div
                          key={st}
                          className={`rounded-xl border px-3 py-2 text-center text-[11px] font-extrabold transition ${
                            active
                              ? 'border-[#00D4FF] bg-[#00B4FF]/20 text-[#00D4FF]'
                              : 'border-[#00D4FF]/15 bg-[#05050F]/40 text-[#A0AEC0]'
                          }`}
                        >
                          {idx + 1}. {st}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* منتجات الطلب وتقييمها */}
                <div className="space-y-3">
                  {ord.items.map((item, idx) => {
                    const key = `${ord.id}_${item.productId}`;
                    const draft = ratingDrafts[key] || { rating: 5, comment: '' };
                    return (
                      <div
                        key={`${item.productId}-${idx}`}
                        className={`rounded-2xl border border-[#00D4FF]/25 p-4 ${
                          isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/70'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-extrabold">
                            {item.productTitle} — المقاس: {item.size} | اللون: {item.colorName} × {item.qty}
                          </div>
                          <div className="text-xs font-black text-[#00B4FF]">{formatEGP(item.lineTotal)}</div>
                        </div>

                        {item.rated ? (
                          <div className="mt-2 text-xs font-bold text-[#00D4FF]">
                            ✓ تم تقييم هذا المنتج بنجاح
                          </div>
                        ) : !canRate ? (
                          <div className="mt-2 text-[11px] text-[#A0AEC0]">
                            يجب تأكيد استلام الطلب أولاً ليتم فتح نموذج تقييم المنتج.
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#00D4FF]/15 pt-3 sm:grid-cols-12">
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-[11px] font-bold text-[#00D4FF]">
                                تقييمك للمنتج (إلزامي)
                              </label>
                              <select
                                value={draft.rating}
                                onChange={(e) =>
                                  setRatingDrafts((prev) => ({
                                    ...prev,
                                    [key]: { ...draft, rating: Number(e.target.value) },
                                  }))
                                }
                                className={`w-full rounded-xl border border-[#00D4FF]/40 px-3 py-2 text-xs font-bold outline-none ${
                                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
                                }`}
                              >
                                <option value={5}>5 نجوم — ممتاز</option>
                                <option value={4}>4 نجوم — جيد جداً</option>
                                <option value={3}>3 نجوم — جيد</option>
                                <option value={2}>2 نجمة — مقبول</option>
                                <option value={1}>1 نجمة — ضعيف</option>
                              </select>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="mb-1 block text-[11px] font-bold text-[#A0AEC0]">
                                رأيك في الخامة والمقاس
                              </label>
                              <input
                                type="text"
                                placeholder="اكتب تعليقك الحقيقي عن المنتج..."
                                value={draft.comment}
                                onChange={(e) =>
                                  setRatingDrafts((prev) => ({
                                    ...prev,
                                    [key]: { ...draft, comment: e.target.value },
                                  }))
                                }
                                className={`w-full rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
                                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
                                }`}
                              />
                            </div>

                            <div className="flex items-end sm:col-span-3">
                              <button
                                type="button"
                                onClick={() => handleSubmitProductRating(ord.id, item)}
                                className="w-full rounded-xl bg-[#00B4FF] py-2 text-xs font-black text-[#05050F] hover:bg-[#00D4FF]"
                              >
                                إرسال التقييم
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 13. واجهة عامل التوصيل (تصفية حسب المندوب + تصوير عند التوصيل + تأكيد أخذ المال)
// ============================================================================

function DeliveryAgentView({ store, setStore, isLight, notify }) {
  const cameraInputRef = useRef({});
  const [selectedAgentId, setSelectedAgentId] = useState('all');
  const [cashChecks, setCashChecks] = useState({});
  const [notesDraft, setNotesDraft] = useState({});

  const visibleOrders = useMemo(() => {
    if (selectedAgentId === 'all') return store.orders;
    return store.orders.filter((o) => o.assignedAgentId === selectedAgentId);
  }, [store.orders, selectedAgentId]);

  const handlePhotoCapture = async (orderId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.78);
      setStore((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, deliveryPhoto: compressed } : o
        ),
      }));
      notify('تم ضغط وحفظ صورة إثبات التوصيل بنجاح');
    } catch (err) {
      notify(err.message || 'تعذر معالجة الصورة');
    }
  };

  const handleCompleteDelivery = (ord) => {
    const hasPhoto = Boolean(ord.deliveryPhoto);
    const cashConfirmed = Boolean(cashChecks[ord.id] || ord.cashCollected);

    if (!hasPhoto) {
      notify('يرجى تصوير / رفع صورة إثبات التوصيل أولاً');
      return;
    }
    if (!cashConfirmed) {
      notify('يرجى تأكيد أخذ المال من العميل أولاً');
      return;
    }

    setStore((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === ord.id
          ? {
              ...o,
              cashCollected: true,
              deliveryNote: notesDraft[ord.id] || o.deliveryNote || '',
              deliveredAt: new Date().toISOString(),
              status: 'تم التسليم',
            }
          : o
      ),
    }));

    notify(`تم تأكيد التوصيل وتحصيل ${formatEGP(ord.total)} للطلب #${ord.orderNumber}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#00D4FF]/25 pb-5">
        <div>
          <span className="text-xs font-extrabold text-[#00D4FF]">بوابة مندوب التوصيل</span>
          <h1 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-3xl font-black">
            واجهة عامل التوصيل
          </h1>
          <p className={`mt-1 text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>
            تصوير عند التوصيل + تأكيد أخذ المال وتحديث حالة الطلب مباشرة.
          </p>
        </div>

        {store.deliveryAgents.length > 0 && (
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#00D4FF]" />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className={`rounded-xl border border-[#00D4FF]/40 px-4 py-2.5 text-xs font-bold outline-none ${
                isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
              }`}
            >
              <option value="all">جميع الشحنات ({store.orders.length})</option>
              {store.deliveryAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  مندوب: {ag.name} ({ag.phone})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {visibleOrders.length === 0 ? (
        <div className={`rounded-3xl border border-dashed border-[#00D4FF]/35 p-12 text-center text-xs text-[#A0AEC0] ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/35'}`}>
          لا توجد شحنات أو طلبات مسجلة للتوصيل حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {visibleOrders.map((ord) => {
            const isCashChecked = Boolean(cashChecks[ord.id] || ord.cashCollected);
            return (
              <div
                key={ord.id}
                className={`space-y-4 rounded-3xl border border-[#00D4FF]/35 p-6 ${
                  isLight ? 'bg-white' : 'bg-gradient-to-br from-[#0A1A3A]/85 to-[#05050F]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#00D4FF]/20 pb-3">
                  <div>
                    <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-base font-black text-[#00D4FF]">
                      #{ord.orderNumber}
                    </div>
                    <div className="text-xs font-bold">
                      {ord.customerName} — {ord.customerPhone}
                    </div>
                    <div className="text-[11px] text-[#A0AEC0]">
                      {ord.governorate}، {ord.city} — {ord.address}
                    </div>
                    {ord.assignedAgentName && (
                      <div className="mt-1 text-[11px] font-bold text-[#00D4FF]">
                        المندوب المسؤول: {ord.assignedAgentName}
                      </div>
                    )}
                  </div>

                  <span className="rounded-xl border border-[#00D4FF]/40 bg-[#001F4D] px-3 py-1 text-xs font-extrabold text-[#00D4FF]">
                    {ord.status}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#00D4FF]/30 bg-[#05050F]/75 px-4 py-3 text-white">
                  <span className="text-xs font-bold">المبلغ المطلوب تحصيله (شامل الشحن):</span>
                  <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-lg font-black text-[#00D4FF]">
                    {formatEGP(ord.total)}
                  </span>
                </div>

                {/* تصوير عند التوصيل */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#00D4FF]">1. تصوير إثبات التوصيل</span>
                    <input
                      ref={(el) => {
                        cameraInputRef.current[ord.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoCapture(ord.id, e)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current[ord.id]?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B4FF] px-3.5 py-2 text-xs font-black text-[#05050F]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>تصوير / اختيار صورة</span>
                    </button>
                  </div>

                  {ord.deliveryPhoto && (
                    <div className="h-40 w-full overflow-hidden rounded-2xl border border-[#00D4FF]/50 bg-[#05050F]">
                      <img src={ord.deliveryPhoto} alt="إثبات التوصيل" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* تأكيد أخذ المال */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#00D4FF]/35 bg-[#05050F]/75 p-3.5 text-xs font-black text-white">
                  <span className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#00D4FF]" />
                    <span>2. تأكيد أخذ المال ({formatEGP(ord.total)})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isCashChecked}
                    onChange={(e) =>
                      setCashChecks((prev) => ({ ...prev, [ord.id]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#00B4FF]"
                  />
                </label>

                <input
                  type="text"
                  placeholder="ملاحظات عامل التوصيل (اختياري)..."
                  value={notesDraft[ord.id] ?? ord.deliveryNote ?? ''}
                  onChange={(e) =>
                    setNotesDraft((prev) => ({ ...prev, [ord.id]: e.target.value }))
                  }
                  className={`w-full rounded-xl border border-[#00D4FF]/30 px-3.5 py-2 text-xs outline-none ${
                    isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => handleCompleteDelivery(ord)}
                  className="w-full rounded-xl bg-[#00B4FF] py-3 text-xs font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
                >
                  تأكيد التسليم وتحصيل المبلغ
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 14. بوابة كلمة مرور الإدارة + لوحة التحكم الكاملة
// ============================================================================

function AdminGateAndDashboard({
  store,
  setStore,
  isLight,
  adminUnlocked,
  setAdminUnlocked,
  onAdminLogin,
  onAdminLogout,
  onChangeAdminPassword,
  adminTab,
  setAdminTab,
  lowStockAlerts,
  onViewReceipt,
  notify,
}) {
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');

  if (!adminUnlocked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20">
        <div
          className={`w-full rounded-3xl border border-[#00D4FF]/45 p-8 text-center shadow-[0_0_40px_rgba(0,212,255,0.25)] ${
            isLight ? 'bg-white' : 'bg-gradient-to-b from-[#0A1A3A] to-[#05050F]'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B4FF] text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.6)]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-2xl font-black">
            دخول لوحة الإدارة
          </h1>
          <p className={`mt-2 text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>
            سجّل الدخول بالبريد الإلكتروني وكلمة مرور حساب الإدارة.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await onAdminLogin(emailInput.trim(), passInput);
                setPassInput('');
                setEmailInput('');
                notify('تم تسجيل الدخول وفتح لوحة تحكم REMONTADA SPORTSWEAR');
              } catch (error) {
                notify(error?.message || 'تعذر تسجيل الدخول');
              }
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="البريد الإلكتروني للإدارة..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={`mb-3 w-full rounded-xl border border-[#00D4FF]/40 px-4 py-3 text-center text-sm outline-none focus:border-[#00D4FF] ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="كلمة مرور حساب الإدارة..."
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              className={`w-full rounded-xl border border-[#00D4FF]/40 px-4 py-3 text-center text-sm outline-none focus:border-[#00D4FF] ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[#00B4FF] py-3 text-xs font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
            >
              دخول لوحة التحكم
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalSales = store.orders
    .filter((o) => o.status !== 'ملغي')
    .reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#00D4FF]/25 pb-5">
        <div>
          <span className="text-xs font-bold text-[#00B4FF]">لوحة إدارة ريمونتادا</span>
          <h1 style={{ fontFamily: "'Chakra Petch', 'Cairo', sans-serif" }} className="text-2xl font-black sm:text-3xl">
            لوحة تحكم المتجر
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'products', label: 'المنتجات والمخزون', icon: Package },
            { id: 'stock', label: 'تعديل الكميات', icon: Package },
            { id: 'promotions', label: 'العروض الخاصة', icon: Percent },
            { id: 'orders', label: 'الطلبات وإثبات التوصيل', icon: BarChart3 },
            { id: 'agents', label: 'مناديب التوصيل', icon: UserCheck },
            { id: 'shipping', label: 'الشحن والهوية والنسخ', icon: Settings },
            { id: 'security', label: 'كلمة المرور', icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black transition ${
                  adminTab === tab.id
                    ? 'bg-[#00B4FF] text-[#05050F] shadow-[0_0_20px_rgba(0,212,255,0.5)]'
                    : isLight
                    ? 'border border-[#00D4FF]/35 bg-white text-[#05050F]'
                    : 'border border-[#00D4FF]/30 bg-[#0A1A3A]/60 text-white hover:border-[#00D4FF]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => { onAdminLogout(); }}
            className="rounded-xl border border-[#00D4FF]/40 px-3.5 py-2.5 text-xs font-bold text-[#A0AEC0] hover:text-white"
          >
            قفل
          </button>
        </div>
      </div>

      {/* تنبيهات انخفاض المخزون الحقيقية (بالأزرق الكهربائي النيوني فقط) */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-8 rounded-2xl border border-[#00D4FF] bg-[#001F4D]/80 p-4 text-white shadow-[0_0_24px_rgba(0,212,255,0.28)]">
          <div className="flex items-center gap-2 text-xs font-black text-[#00D4FF]">
            <AlertTriangle className="h-4 w-4" />
            <span>تنبيه انخفاض المخزون ({lowStockAlerts.length} متغيرات وصلت للحد الأدنى):</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockAlerts.map((al) => (
              <span
                key={`${al.productId}-${al.variantId}`}
                className="rounded-lg border border-[#00D4FF]/45 bg-[#05050F] px-3 py-1 text-[11px] font-bold text-[#00D4FF]"
              >
                {al.productTitle} ({al.size} / {al.colorName}): متبقي {al.stockQty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* إحصائيات حقيقية */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`rounded-2xl border border-[#00D4FF]/30 p-4 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'}`}>
          <div className={`text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>إجمالي المبيعات الحقيقية</div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="mt-1 text-xl font-black text-[#00B4FF]">
            {formatEGP(totalSales)}
          </div>
        </div>
        <div className={`rounded-2xl border border-[#00D4FF]/30 p-4 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'}`}>
          <div className={`text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>المنتجات المضافة</div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="mt-1 text-xl font-black text-[#00B4FF]">
            {store.products.length}
          </div>
        </div>
        <div className={`rounded-2xl border border-[#00D4FF]/30 p-4 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'}`}>
          <div className={`text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>العروض الخاصة</div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="mt-1 text-xl font-black text-[#00B4FF]">
            {store.promotions.length}
          </div>
        </div>
        <div className={`rounded-2xl border border-[#00D4FF]/30 p-4 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/60'}`}>
          <div className={`text-xs ${isLight ? 'text-[#3B5278]' : 'text-[#A0AEC0]'}`}>التقييمات الحقيقية</div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="mt-1 text-xl font-black text-[#00B4FF]">
            {store.reviews.length}
          </div>
        </div>
      </div>

      {adminTab === 'products' && (
        <AdminProductsWithFileUpload store={store} setStore={setStore} isLight={isLight} notify={notify} />
      )}

      {adminTab === 'stock' && (
        <AdminStockManager store={store} setStore={setStore} isLight={isLight} notify={notify} />
      )}

      {adminTab === 'promotions' && (
        <AdminPromotionsEngine store={store} setStore={setStore} isLight={isLight} notify={notify} />
      )}

      {adminTab === 'orders' && (
        <AdminOrdersList store={store} setStore={setStore} isLight={isLight} onViewReceipt={onViewReceipt} notify={notify} />
      )}

      {adminTab === 'agents' && (
        <AdminDeliveryAgentsManager store={store} setStore={setStore} isLight={isLight} notify={notify} />
      )}

      {adminTab === 'shipping' && (
        <AdminShippingAndBrand store={store} setStore={setStore} isLight={isLight} notify={notify} />
      )}

      {adminTab === 'security' && (
        <AdminPasswordChanger isLight={isLight} notify={notify} onChangePassword={onChangeAdminPassword} />
      )}
    </div>
  );
}

// ============================================================================
// 15. إدارة مناديب التوصيل (إضافة وحذف مناديب لتخصيص الطلبات لهم)
// ============================================================================

function AdminDeliveryAgentsManager({ store, setStore, isLight, notify }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddAgent = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
    };
    setStore((prev) => ({
      ...prev,
      deliveryAgents: [newAgent, ...prev.deliveryAgents],
    }));
    setName('');
    setPhone('');
    notify(`تمت إضافة مندوب التوصيل "${newAgent.name}"`);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAddAgent}
        className={`space-y-4 rounded-3xl border border-[#00D4FF]/35 p-6 ${
          isLight ? 'bg-white' : 'bg-[#0A1A3A]/70'
        }`}
      >
        <h3 className="text-base font-black text-[#00B4FF]">إضافة عامل / مندوب توصيل</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            required
            placeholder="اسم عامل التوصيل *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <input
            type="tel"
            required
            placeholder="رقم هاتف عامل التوصيل *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <button
            type="submit"
            className="rounded-xl bg-[#00B4FF] px-5 py-2.5 text-xs font-black text-[#05050F]"
          >
            + إضافة المندوب
          </button>
        </div>
      </form>

      <div className={`space-y-3 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="text-sm font-black">مناديب التوصيل المسجلون ({store.deliveryAgents.length})</h3>
        {store.deliveryAgents.length === 0 ? (
          <p className="text-xs text-[#A0AEC0]">لا يوجد مناديب مسجلون بعد — أضف مندوباً لإسناد الطلبات إليه.</p>
        ) : (
          store.deliveryAgents.map((ag) => (
            <div
              key={ag.id}
              className={`flex items-center justify-between rounded-2xl border border-[#00D4FF]/25 p-4 text-xs ${
                isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/70'
              }`}
            >
              <div>
                <div className="font-black text-[#00B4FF]">{ag.name}</div>
                <div className="text-[#A0AEC0]">{ag.phone}</div>
              </div>
              <button
                onClick={() =>
                  setStore((prev) => ({
                    ...prev,
                    deliveryAgents: prev.deliveryAgents.filter((x) => x.id !== ag.id),
                  }))
                }
                className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#A0AEC0] hover:text-[#00B4FF]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 16. تغيير كلمة مرور الإدارة من داخل لوحة التحكم
// ============================================================================

function AdminPasswordChanger({ isLight, notify, onChangePassword }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass.trim().length < 8) {
      notify('كلمة المرور الجديدة يجب أن تكون 8 أحرف أو أكثر');
      return;
    }
    if (newPass !== confirmPass) {
      notify('تأكيد كلمة المرور غير متطابق');
      return;
    }
    try {
      await onChangePassword(newPass.trim());
      setNewPass('');
      setConfirmPass('');
      notify('تم تحديث كلمة مرور حساب الإدارة بنجاح');
    } catch (error) {
      notify(error?.message || 'تعذر تغيير كلمة المرور');
    }
  };

  return (
    <form
      onSubmit={handleChangePassword}
      className={`max-w-lg space-y-4 rounded-3xl border border-[#00D4FF]/35 p-6 ${
        isLight ? 'bg-white' : 'bg-[#0A1A3A]/70'
      }`}
    >
      <div className="flex items-center gap-2 text-[#00B4FF]">
        <KeyRound className="h-5 w-5" />
        <h3 className="text-base font-black">تغيير كلمة مرور الإدارة</h3>
      </div>
      <p className="text-xs text-[#A0AEC0]">
        يتم تحديث كلمة المرور مباشرة في Supabase Auth، ولا تُخزّن داخل كود المتجر.
      </p>

      <input
        type="password"
        required
        placeholder="كلمة المرور الجديدة *"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        className={`w-full rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
          isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
        }`}
      />
      <input
        type="password"
        required
        placeholder="تأكيد كلمة المرور الجديدة *"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
        className={`w-full rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
          isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
        }`}
      />

      <button
        type="submit"
        className="rounded-xl bg-[#00B4FF] px-6 py-3 text-xs font-black text-[#05050F] shadow-[0_0_22px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
      >
        حفظ كلمة المرور الجديدة
      </button>
    </form>
  );
}

// ============================================================================
// 17. إدارة المنتجات مع ضغط الصور التلقائي + حد التنبيه للمخزون + نسخ منتج
// ============================================================================

function AdminProductsWithFileUpload({ store, setStore, isLight, notify }) {
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('REMONTADA');
  const [sportId, setSportId] = useState(store.sports[0]?.id || '');
  const [categoryId, setCategoryId] = useState('hoodies');
  const [gender, setGender] = useState('unisex');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [supportsNamePrinting, setSupportsNamePrinting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [variants, setVariants] = useState([
    { id: 'v1', size: 'M', colorName: 'أزرق كهربائي', colorHex: '#00B4FF', stockQty: 10, lowStockThreshold: 3 },
    { id: 'v2', size: 'L', colorName: 'أسود فضائي', colorHex: '#05050F', stockQty: 10, lowStockThreshold: 3 },
  ]);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedList = await Promise.all(
        files.map((f) => compressImageFile(f, 960, 0.78))
      );
      setUploadedImages((prev) => [...prev, ...compressedList]);
      notify(`تم ضغط وتحميل ${compressedList.length} صورة بنجاح`);
    } catch (err) {
      notify(err.message || 'تعذر تحميل الصور');
    }
    e.target.value = '';
  };

  const handleAddUrlImage = () => {
    if (!imageUrlInput.trim()) return;
    setUploadedImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!title.trim() || Number(basePrice) <= 0) {
      notify('يرجى كتابة اسم المنتج والسعر بالجنيه المصري');
      return;
    }

    const cleanVariants = variants
      .filter((v) => v.size.trim())
      .map((v, idx) => ({
        ...v,
        id: v.id || `var-${Date.now()}-${idx}`,
        stockQty: Math.max(0, Number(v.stockQty || 0)),
        lowStockThreshold: Math.max(0, Number(v.lowStockThreshold ?? 3)),
      }));

    const payload = {
      title: title.trim(),
      brand: brand.trim() || 'REMONTADA',
      sportId: sportId || store.sports[0]?.id || '',
      categoryId,
      gender,
      basePrice: Number(basePrice),
      description: description.trim(),
      supportsNamePrinting,
      images: uploadedImages,
      isActive: true,
      variants: cleanVariants,
    };

    if (editingId) {
      setStore((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === editingId ? { ...p, ...payload } : p)),
      }));
      setEditingId(null);
      notify('تم تحديث المنتج وصوره بنجاح');
    } else {
      const newProd = {
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setStore((prev) => ({ ...prev, products: [newProd, ...prev.products] }));
      notify(`تمت إضافة "${newProd.title}" للواجهة الرئيسية والمتجر`);
    }

    setTitle('');
    setBasePrice('');
    setDescription('');
    setSupportsNamePrinting(false);
    setUploadedImages([]);
  };

  const handleDuplicateProduct = (prod) => {
    const copy = {
      ...prod,
      id: `prod-${Date.now()}`,
      title: `${prod.title} (نسخة)`,
      variants: (prod.variants || []).map((v, i) => ({
        ...v,
        id: `var-${Date.now()}-${i}`,
      })),
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({ ...prev, products: [copy, ...prev.products] }));
    notify(`تم نسخ "${prod.title}"`);
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSaveProduct}
        className={`space-y-5 rounded-3xl border border-[#00D4FF]/35 p-6 ${
          isLight ? 'bg-white' : 'bg-gradient-to-br from-[#0A1A3A]/80 to-[#05050F]'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#00B4FF]">
            {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد (مع ضغط الصور التلقائي)'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setUploadedImages([]);
              }}
              className="text-xs text-[#A0AEC0] underline"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            required
            placeholder="اسم المنتج *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none focus:border-[#00D4FF] ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <input
            type="text"
            placeholder="الماركة (REMONTADA)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          >
            {store.sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label className="block text-[11px] font-bold text-[#00B4FF]">سعر بيع القطعة الواحدة (ج.م)</label>
          <input
            type="number"
            required
            min={1}
            placeholder="مثال: 850 جنيه"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none focus:border-[#00D4FF] ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
        </div>

        <div
          className={`space-y-3 rounded-2xl border border-[#00D4FF]/35 p-4 ${
            isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/75'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-black text-[#00B4FF]">صور المنتج (تُضغط تلقائياً لتسريع التحميل)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FF] px-4 py-2 text-xs font-black text-[#05050F] shadow-[0_0_16px_rgba(0,212,255,0.45)] hover:bg-[#00D4FF]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>اختر صور من الجهاز</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="أو الصق رابط صورة مباشر (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className={`flex-1 rounded-xl border border-[#00D4FF]/30 px-3 py-2 text-xs outline-none ${
                isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A]/50 text-white'
              }`}
            />
            <button
              type="button"
              onClick={handleAddUrlImage}
              className="rounded-xl border border-[#00D4FF]/40 px-4 py-2 text-xs font-bold text-[#00B4FF] hover:bg-[#00D4FF]/15"
            >
              إضافة الرابط
            </button>
          </div>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#00D4FF]/50 bg-[#05050F]"
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 left-1 rounded-md bg-[#05050F]/85 px-1.5 py-0.5 text-[10px] font-black text-[#00D4FF]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className={`flex items-center gap-2 rounded-xl border border-[#00D4FF]/30 p-3 text-xs font-bold ${isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/60'}`}>
          <input type="checkbox" checked={supportsNamePrinting} onChange={(e) => setSupportsNamePrinting(e.target.checked)} className="accent-[#00B4FF]" />
          <span>السماح بطباعة اسم على هذا المنتج (مثل تيشيرتات الكورة)</span>
        </label>
        <textarea
          rows={2}
          placeholder="وصف المنتج (اختياري)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
            isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
          }`}
        />

        <div
          className={`space-y-2 rounded-2xl border border-[#00D4FF]/25 p-4 ${
            isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#00B4FF]">المقاسات والألوان والمخزون وحد التنبيه</span>
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  {
                    id: `v-${Date.now()}`,
                    size: 'XL',
                    colorName: 'أبيض نقي',
                    colorHex: '#FFFFFF',
                    stockQty: 8,
                    lowStockThreshold: 3,
                  },
                ])
              }
              className="rounded-lg border border-[#00D4FF]/40 px-3 py-1 text-xs font-bold text-[#00B4FF]"
            >
              + إضافة مقاس
            </button>
          </div>

          {variants.map((v, idx) => (
            <div key={v.id} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <input
                type="text"
                placeholder="المقاس"
                value={v.size}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx] = { ...copy[idx], size: e.target.value };
                  setVariants(copy);
                }}
                className={`rounded-xl border border-[#00D4FF]/30 px-3 py-2 text-xs outline-none ${
                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A]/50 text-white'
                }`}
              />
              <input
                type="text"
                placeholder="اللون"
                value={v.colorName}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx] = { ...copy[idx], colorName: e.target.value };
                  setVariants(copy);
                }}
                className={`rounded-xl border border-[#00D4FF]/30 px-3 py-2 text-xs outline-none ${
                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A]/50 text-white'
                }`}
              />
              <input
                type="color"
                value={v.colorHex}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx] = { ...copy[idx], colorHex: e.target.value };
                  setVariants(copy);
                }}
                className="h-9 w-full cursor-pointer rounded-xl border border-[#00D4FF]/30 bg-transparent"
              />
              <label className="text-[10px] font-bold text-[#00B4FF]">عدد القطع المتاحة</label>
              <input
                type="number"
                min={0}
                placeholder="مثال: 12 قطعة"
                value={v.stockQty}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx] = { ...copy[idx], stockQty: Number(e.target.value) };
                  setVariants(copy);
                }}
                className={`rounded-xl border border-[#00D4FF]/30 px-3 py-2 text-xs outline-none ${
                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A]/50 text-white'
                }`}
              />
              <label className="text-[10px] font-bold text-[#00B4FF]">حد التنبيه (قطعة)</label>
              <input
                type="number"
                min={0}
                placeholder="مثال: 3 قطع"
                value={v.lowStockThreshold ?? 3}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx] = { ...copy[idx], lowStockThreshold: Number(e.target.value) };
                  setVariants(copy);
                }}
                className={`rounded-xl border border-[#00D4FF]/30 px-3 py-2 text-xs outline-none ${
                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A]/50 text-white'
                }`}
                title="حد تنبيه انخفاض المخزون"
              />
              <button
                type="button"
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-xl border border-[#00D4FF]/30 text-xs text-[#A0AEC0] hover:text-[#00B4FF]"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FF] px-6 py-3 text-xs font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
        >
          <Plus className="h-4 w-4" />
          <span>{editingId ? 'حفظ التعديلات' : 'نشر المنتج في الواجهة الرئيسية والمتجر'}</span>
        </button>
      </form>

      <div className={`rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="mb-4 text-sm font-black">المنتجات المسجلة ({store.products.length})</h3>
        {store.products.length === 0 ? (
          <p className="text-xs text-[#A0AEC0]">لا توجد منتجات مسجلة بعد.</p>
        ) : (
          <div className="space-y-3">
            {store.products.map((p) => {
              const eff = getEffectivePrice(p.basePrice, p.id, p.sportId, store.promotions);
              return (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#00D4FF]/25 p-4 ${
                    isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#0A1A3A]">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold">{p.title}</div>
                      <div className="text-xs font-bold text-[#00B4FF]">
                        {formatEGP(eff.finalPrice)}
                        {eff.hasDiscount && (
                          <span className="mr-2 text-[#A0AEC0] line-through">{formatEGP(p.basePrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicateProduct(p)}
                      className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#00D4FF]"
                      title="نسخ المنتج"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setTitle(p.title);
                        setBrand(p.brand || '');
                        setSportId(p.sportId || '');
                        setCategoryId(p.categoryId || 'hoodies');
                        setGender(p.gender || 'unisex');
                        setBasePrice(String(p.basePrice));
                        setDescription(p.description || '');
                        setSupportsNamePrinting(Boolean(p.supportsNamePrinting));
                        setUploadedImages(p.images || []);
                        setVariants(p.variants || []);
                      }}
                      className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#00D4FF]"
                      title="تعديل"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setStore((prev) => ({
                          ...prev,
                          products: prev.products.filter((x) => x.id !== p.id),
                        }));
                        notify('تم حذف المنتج');
                      }}
                      className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#A0AEC0] hover:text-[#00B4FF]"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// إدارة المخزون السريعة — تعديل الكميات مباشرة من لوحة الموقع
// ============================================================================
function AdminStockManager({ store, setStore, isLight, notify }) {
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const products = (store.products || []).filter((p) =>
    String(p.title || '').toLowerCase().includes(query.toLowerCase())
  );
  const rows = products.flatMap((p) => (p.variants || []).map((v) => ({
    product: p, variant: v,
    qty: Number(drafts[v.id] ?? v.stockQty ?? 0),
    threshold: Number(v.lowStockThreshold ?? 3),
  }))).filter((row) => !onlyLow || row.qty <= row.threshold);
  const totalUnits = (store.products || []).reduce((sum, p) =>
    sum + (p.variants || []).reduce((n, v) => n + Math.max(0, Number(v.stockQty || 0)), 0), 0);
  const updateQty = (variantId, value) => {
    setDrafts((prev) => ({ ...prev, [variantId]: Math.max(0, Math.floor(Number(value) || 0)) }));
  };
  const saveRow = async (product, variant) => {
    const qty = Math.max(0, Math.floor(Number(drafts[variant.id] ?? variant.stockQty ?? 0)));
    const threshold = Math.max(0, Math.floor(Number(variant.lowStockThreshold ?? 3)));
    setSavingRows((prev) => ({ ...prev, [variant.id]: true }));
    try {
      await setInventoryVariantStock(readAdminSession(), product, variant, qty, threshold);
      setStore((prev) => ({
        ...prev,
        products: prev.products.map((p) => p.id !== product.id ? p : ({
          ...p,
          variants: (p.variants || []).map((v) => v.id !== variant.id ? v : { ...v, stockQty: qty, lowStockThreshold: threshold }),
        })),
      }));
      setDrafts((prev) => { const next = { ...prev }; delete next[variant.id]; return next; });
      notify("تم تحديث المخزون المركزي بنجاح");
    } catch (error) {
      notify(error?.message || "تعذر حفظ كمية المخزون");
    } finally {
      setSavingRows((prev) => ({ ...prev, [variant.id]: false }));
    }
  };
  const updateThreshold = (productId, variantId, value) => {
    const threshold = Math.max(0, Math.floor(Number(value) || 0));
    setStore((prev) => ({
      ...prev,
      products: prev.products.map((p) => p.id !== productId ? p : ({
        ...p,
        variants: (p.variants || []).map((v) => v.id !== variantId ? v : { ...v, lowStockThreshold: threshold }),
      })),
    }));
  };
  return (
    <section className={`space-y-5 rounded-3xl border border-[#00D4FF]/30 p-5 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#00B4FF]">إدارة كميات المخزون</h2>
          <p className="mt-1 text-xs text-[#A0AEC0]">عدّل رصيد كل مقاس ولون مباشرة. التغييرات تُحفظ على قاعدة بيانات الموقع مع حفظ الإدارة.</p>
        </div>
        <div className="rounded-xl border border-[#00D4FF]/40 px-4 py-3">
          <div className="text-[11px] text-[#A0AEC0]">إجمالي القطع المسجلة</div>
          <div className="text-2xl font-black text-[#00B4FF]">{totalUnits}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم المنتج..." className={`min-w-[220px] flex-1 rounded-xl border border-[#00D4FF]/35 px-4 py-3 text-sm outline-none ${isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'}`} />
        <button type="button" onClick={() => setOnlyLow((v) => !v)} className={`rounded-xl border px-4 py-3 text-xs font-bold ${onlyLow ? 'border-[#00D4FF] bg-[#00D4FF]/15 text-[#00B4FF]' : 'border-[#00D4FF]/30 text-[#A0AEC0]'}`}>
          {onlyLow ? 'عرض كل المقاسات' : 'عرض الناقص فقط'}
        </button>
      </div>
      {rows.length === 0 ? <p className="rounded-xl border border-[#00D4FF]/20 p-6 text-center text-sm text-[#A0AEC0]">لا توجد مقاسات مطابقة للبحث.</p> : (
        <div className="overflow-x-auto rounded-2xl border border-[#00D4FF]/20">
          <table className="w-full min-w-[620px] text-right text-xs">
            <thead className={isLight ? 'bg-[#EAF4FF]' : 'bg-[#05050F]'}>
              <tr className="text-[#00B4FF]"><th className="p-3">المنتج</th><th className="p-3">المقاس / اللون</th><th className="p-3">عدد القطع المتاحة</th><th className="p-3">حد تنبيه النقص (قطعة)</th><th className="p-3">الحالة</th><th className="p-3">حفظ</th></tr>
            </thead>
            <tbody>
              {rows.map(({ product, variant, qty, threshold }) => (
                <tr key={product.id + '-' + variant.id} className="border-t border-[#00D4FF]/15">
                  <td className="p-3 font-bold">{product.title}</td>
                  <td className="p-3">{variant.size || '—'} / {variant.colorName || '—'}</td>
                  <td className="p-3"><input aria-label="الكمية المتاحة" type="number" min="0" value={qty} onChange={(e) => updateQty(variant.id, e.target.value)} className={`w-24 rounded-lg border border-[#00D4FF]/40 px-3 py-2 text-center font-black ${isLight ? 'bg-white text-[#05050F]' : 'bg-[#05050F] text-white'}`} /></td>
                  <td className="p-3"><input aria-label="حد تنبيه المخزون" type="number" min="0" value={threshold} onChange={(e) => updateThreshold(product.id, variant.id, e.target.value)} className={`w-20 rounded-lg border border-[#00D4FF]/30 px-2 py-2 text-center ${isLight ? 'bg-white text-[#05050F]' : 'bg-[#05050F] text-white'}`} /></td>
                  <td className="p-3"><span className={qty === 0 ? 'font-bold text-red-500' : qty <= threshold ? 'font-bold text-amber-500' : 'font-bold text-emerald-500'}>{qty === 0 ? 'نفد' : qty <= threshold ? 'منخفض' : 'متوفر'}</span></td>
                  <td className="p-3"><button type="button" disabled={!!savingRows[variant.id]} onClick={() => saveRow(product, variant)} className="rounded-lg bg-[#00B4FF] px-3 py-2 font-black text-[#05050F] disabled:opacity-50">{savingRows[variant.id] ? 'جارٍ الحفظ' : 'حفظ'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-[#A0AEC0]">ملحوظة: الكمية تُحدّث في بيانات المتجر المشتركة، وتُستخدم لمنع طلب كمية أكبر من المتاح. اكتب 0 لإيقاف بيع هذا المقاس مؤقتاً.</p>
    </section>
  );
}

// ============================================================================
// 18. إدارة العروض الخاصة والخصومات والكوبونات
// ============================================================================

function AdminPromotionsEngine({ store, setStore, isLight, notify }) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(20);
  const [scope, setScope] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percentage');
  const [couponValue, setCouponValue] = useState(10);

  const handleSavePromo = (e) => {
    e.preventDefault();
    if (!title.trim() || Number(discountValue) <= 0) return;

    const payload = {
      title: title.trim(),
      discountType,
      discountValue: Number(discountValue),
      scope,
      targetId: scope === 'all' ? '' : targetId,
      endsAt,
      isActive: true,
    };

    if (editingId) {
      setStore((prev) => ({
        ...prev,
        promotions: prev.promotions.map((p) => (p.id === editingId ? { ...p, ...payload } : p)),
      }));
      setEditingId(null);
      notify('تم تعديل العرض الخاص وتحديث الواجهة الرئيسية');
    } else {
      setStore((prev) => ({
        ...prev,
        promotions: [{ id: `promo-${Date.now()}`, ...payload }, ...prev.promotions],
      }));
      notify('تم إضافة العرض الخاص وإظهاره في الواجهة الرئيسية فوراً');
    }

    setTitle('');
    setDiscountValue(20);
    setTargetId('');
    setEndsAt('');
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim() || Number(couponValue) <= 0) return;
    setStore((prev) => ({
      ...prev,
      coupons: [
        {
          id: `cpn-${Date.now()}`,
          code: couponCode.trim().toUpperCase(),
          discountType: couponType,
          discountValue: Number(couponValue),
          isActive: true,
        },
        ...prev.coupons,
      ],
    }));
    setCouponCode('');
    notify('تم إنشاء كوبون الخصم');
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSavePromo}
        className={`space-y-4 rounded-3xl border border-[#00D4FF]/35 p-6 ${
          isLight ? 'bg-white' : 'bg-gradient-to-br from-[#0A1A3A]/80 to-[#05050F]'
        }`}
      >
        <h3 className="text-base font-black text-[#00B4FF]">
          {editingId ? 'تعديل العرض الخاص' : 'إنشاء عرض خاص أو خصم (يظهر في قسم عروض خاصة بالواجهة الرئيسية)'}
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            required
            placeholder="عنوان العرض الخاص *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          >
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ج.م)</option>
          </select>
          <label className="block text-[11px] font-bold text-[#00B4FF]">قيمة الخصم ({discountType === "percentage" ? "نسبة مئوية %" : "جنيه مصري"})</label>
          <input
            type="number"
            required
            min={1}
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          >
            <option value="all">على كل منتجات المتجر</option>
            <option value="sport">على رياضة محددة</option>
            <option value="product">على منتج محدد</option>
          </select>

          {scope === 'sport' && (
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            >
              <option value="">اختر الرياضة</option>
              {store.sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {scope === 'product' && (
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
                isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
              }`}
            >
              <option value="">اختر المنتج</option>
              {store.products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#00B4FF] px-6 py-3 text-xs font-black text-[#05050F] shadow-[0_0_24px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]"
        >
          {editingId ? 'حفظ التعديلات' : 'نشر العرض الخاص'}
        </button>
      </form>

      <div className={`space-y-3 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="text-sm font-black">العروض الخاصة المسجلة ({store.promotions.length})</h3>
        {store.promotions.length === 0 ? (
          <p className="text-xs text-[#A0AEC0]">لا توجد عروض مسجلة بعد.</p>
        ) : (
          store.promotions.map((pr) => (
            <div
              key={pr.id}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#00D4FF]/25 p-4 ${
                isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/70'
              }`}
            >
              <div>
                <div className="text-sm font-extrabold">
                  {pr.title}{' '}
                  <span className="mr-2 rounded bg-[#00B4FF] px-2.5 py-0.5 text-xs font-black text-[#05050F]">
                    {pr.discountType === 'percentage' ? `${pr.discountValue}%` : formatEGP(pr.discountValue)}
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-[#00B4FF]">
                  {pr.isActive ? 'مفعّل وظاهر بالواجهة' : 'معطّل'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setStore((prev) => ({
                      ...prev,
                      promotions: prev.promotions.map((x) =>
                        x.id === pr.id ? { ...x, isActive: !x.isActive } : x
                      ),
                    }))
                  }
                  className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#00B4FF]"
                  title="تفعيل / تعطيل"
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingId(pr.id);
                    setTitle(pr.title);
                    setDiscountType(pr.discountType);
                    setDiscountValue(pr.discountValue);
                    setScope(pr.scope);
                    setTargetId(pr.targetId || '');
                    setEndsAt(pr.endsAt || '');
                  }}
                  className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#00B4FF]"
                  title="تعديل"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setStore((prev) => ({
                      ...prev,
                      promotions: prev.promotions.filter((x) => x.id !== pr.id),
                    }))
                  }
                  className="rounded-lg border border-[#00D4FF]/40 p-2 text-[#A0AEC0] hover:text-[#00B4FF]"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`space-y-4 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="text-sm font-black text-[#00B4FF]">كوبونات الخصم للسلة ({store.coupons.length})</h3>
        <form onSubmit={handleAddCoupon} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            required
            placeholder="كود الخصم (مثال: RMT15)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <select
            value={couponType}
            onChange={(e) => setCouponType(e.target.value)}
            className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          >
            <option value="percentage">نسبة (%)</option>
            <option value="fixed">مبلغ (ج.م)</option>
          </select>
          <label className="block text-[11px] font-bold text-[#00B4FF]">قيمة الكوبون ({couponType === "percentage" ? "نسبة مئوية %" : "جنيه مصري"})</label>
          <input
            type="number"
            min={1}
            value={couponValue}
            onChange={(e) => setCouponValue(Number(e.target.value))}
            className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <button
            type="submit"
            className="rounded-xl bg-[#00B4FF] px-4 py-2 text-xs font-black text-[#05050F]"
          >
            إضافة كوبون
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 19. إدارة الطلبات + إسناد مندوب التوصيل + عرض صورة الإثبات والتحصيل
// ============================================================================

function AdminOrdersList({ store, setStore, isLight, onViewReceipt, notify }) {
  return (
    <div className={`space-y-4 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
      <h3 className="text-base font-black text-[#00B4FF]">الطلبات وإثباتات التوصيل ({store.orders.length})</h3>
      {store.orders.length === 0 ? (
        <p className="text-xs text-[#A0AEC0]">لا توجد طلبات مسجلة حتى الآن.</p>
      ) : (
        store.orders.map((ord) => (
          <div
            key={ord.id}
            className={`space-y-3 rounded-2xl border border-[#00D4FF]/25 p-4 ${
              isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/75'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-sm font-black text-[#00B4FF]">
                  {ord.orderNumber}
                </div>
                <div className="text-xs font-bold">{ord.customerName} — {ord.customerPhone}</div>
                <div className="text-[11px] text-[#A0AEC0]">
                  {ord.governorate}، {ord.city} | الإجمالي: {formatEGP(ord.total)} (شامل شحن {formatEGP(ord.shippingFee)}) | التحصيل: {ord.cashCollected ? 'تم أخذ المال ✓' : 'لم يُحصّل بعد'}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* إسناد الطلب لمندوب توصيل */}
                <select
                  value={ord.assignedAgentId || ''}
                  onChange={(e) => {
                    const agId = e.target.value;
                    const agObj = store.deliveryAgents.find((a) => a.id === agId);
                    setStore((prev) => ({
                      ...prev,
                      orders: prev.orders.map((x) =>
                        x.id === ord.id
                          ? {
                              ...x,
                              assignedAgentId: agId,
                              assignedAgentName: agObj ? agObj.name : '',
                            }
                          : x
                      ),
                    }));
                    notify(agObj ? `تم إسناد الطلب للمندوب ${agObj.name}` : 'تم إلغاء إسناد المندوب');
                  }}
                  className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs font-bold outline-none ${
                    isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
                  }`}
                >
                  <option value="">إسناد لمندوب توصيل...</option>
                  {store.deliveryAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.phone})
                    </option>
                  ))}
                </select>

                <select
                  value={ord.status}
                  onChange={async (e) => {
                    const next = e.target.value;
                    if (next === 'ملغي' && ord.status !== 'ملغي') {
                      try {
                        await releaseOnlineInventory(ord.id);
                      } catch (error) {
                        notify(error?.message || 'تعذر تحرير المخزون لهذا الطلب');
                        return;
                      }
                    }
                    setStore((prev) => ({
                      ...prev,
                      orders: prev.orders.map((x) => (x.id === ord.id ? { ...x, status: next } : x)),
                      ...(next === 'ملغي' ? {
                        products: prev.products.map((product) => {
                          const canceledItems = (ord.items || []).filter((item) => item.productId === product.id);
                          if (!canceledItems.length) return product;
                          return {
                            ...product,
                            variants: product.variants.map((variant) => {
                              const canceled = canceledItems.find((item) =>
                                item.variantId != null
                                  ? item.variantId === variant.id
                                  : item.size === variant.size && item.colorName === variant.colorName
                              );
                              return canceled
                                ? { ...variant, stockQty: Number(variant.stockQty || 0) + Number(canceled.qty || 0) }
                                : variant;
                            }),
                          };
                        }),
                      } : {}),
                    }));
                    notify(next === 'ملغي' ? 'تم إلغاء الطلب وإعادة الكمية للمخزون إن كان محجوزًا' : `تم تحديث حالة الطلب إلى ${next}`);
                  }}
                  disabled={ord.status === 'ملغي' || ord.status === 'تم الشحن' || ord.status === 'تم التسليم' || ord.cashCollected}
                  className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs font-bold outline-none disabled:opacity-50 ${
                    isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
                  }`}
                >
                  {['جديد', 'قيد التجهيز', 'تم الشحن', 'تم التسليم', 'ملغي'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <button
                  onClick={() => onViewReceipt(ord)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/40 px-3.5 py-2 text-xs font-bold text-[#00B4FF]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>الفاتورة</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#00D4FF]/20 bg-[#0A1A3A]/40 p-3 text-[11px]">
              {(ord.items || []).map((it, idx) => <div key={idx} className="mb-1"><b>{it.productTitle}</b> — {it.size}/{it.colorName} × {it.qty}{it.printNames?.length ? <div className="font-bold text-[#00D4FF]">أسماء الطباعة: {it.printNames.map((name, i) => `${i + 1}) ${name}`).join(' | ')}</div> : null}</div>)}
            </div>
            {ord.deliveryPhoto && (
              <div className="flex items-center gap-3 border-t border-[#00D4FF]/15 pt-3">
                <img src={ord.deliveryPhoto} alt="إثبات التوصيل" className="h-16 w-16 rounded-xl border border-[#00D4FF]/40 object-cover" />
                <div className="text-xs">
                  <div className="font-bold text-[#00D4FF]">صورة إثبات التوصيل مسجلة</div>
                  {ord.deliveryNote && <div className="text-[#A0AEC0]">{ord.deliveryNote}</div>}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// 20. إدارة الشحن المدفوع وتخصيص الهوية + تصدير/استيراد النسخة الاحتياطية + SEO
// ============================================================================

function AdminShippingAndBrand({ store, setStore, isLight, notify }) {
  const [newGovernorateName, setNewGovernorateName] = useState('');
  const [newGovernorateFee, setNewGovernorateFee] = useState('');
  const logoUploadRef = useRef(null);
  const backupImportRef = useRef(null);

  const handleUploadBrandImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 960, 0.85);
      setStore((prev) => ({
        ...prev,
        settings: { ...prev.settings, customHeroImage: compressed },
      }));
      notify('تم تحديث صورة اللوجو / الواجهة الرئيسية بنجاح');
    } catch (err) {
      notify(err.message || 'تعذر تحميل الصورة');
    }
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remontada-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('تم تحميل نسخة احتياطية كاملة من بيانات المتجر');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('ملف غير صالح');
        setStore((prev) => ({
          ...INITIAL_STATE,
          ...prev,
          ...parsed,
        }));
        notify('تم استيراد واستعادة النسخة الاحتياطية بنجاح');
      } catch (err) {
        notify('فشل استيراد الملف — تأكد أنه ملف JSON صحيح من المتجر');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      <div className={`space-y-4 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-black text-[#00B4FF]">تخصيص الهوية البصرية والنسخ الاحتياطي</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/45 bg-[#05050F] px-4 py-2 text-xs font-bold text-[#00D4FF]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تصدير نسخة احتياطية</span>
            </button>
            <input ref={backupImportRef} type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
            <button
              type="button"
              onClick={() => backupImportRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D4FF]/45 bg-[#05050F] px-4 py-2 text-xs font-bold text-[#00D4FF]"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>استيراد نسخة احتياطية</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={logoUploadRef} type="file" accept="image/*" onChange={handleUploadBrandImage} className="hidden" />
          <button
            type="button"
            onClick={() => logoUploadRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FF] px-5 py-2.5 text-xs font-black text-[#05050F]"
          >
            <Upload className="h-4 w-4" />
            <span>رفع صورة لوجو / غلاف مخصصة</span>
          </button>
          {store.settings.customHeroImage && (
            <button
              type="button"
              onClick={() =>
                setStore((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, customHeroImage: '' },
                }))
              }
              className="rounded-xl border border-[#00D4FF]/40 px-4 py-2.5 text-xs font-bold text-[#00B4FF]"
            >
              استعادة شعار الوعل النيوني الرسمي
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
          <input
            type="text"
            placeholder="نص الشريط العلوي (اختياري)"
            value={store.settings.announcementText}
            onChange={(e) =>
              setStore((prev) => ({
                ...prev,
                settings: { ...prev.settings, announcementText: e.target.value },
              }))
            }
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={store.settings.announcementActive}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, announcementActive: e.target.checked },
                }))
              }
              className="accent-[#00B4FF]"
            />
            <span>تفعيل شريط الإعلانات العلوي</span>
          </label>

          <input
            type="text"
            placeholder="معرف Meta Pixel ID (اختياري)"
            value={store.settings.metaPixelId || ''}
            onChange={(e) =>
              setStore((prev) => ({
                ...prev,
                settings: { ...prev.settings, metaPixelId: e.target.value },
              }))
            }
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
          <input
            type="text"
            placeholder="معرف Google Analytics ID (اختياري)"
            value={store.settings.gaMeasurementId || ''}
            onChange={(e) =>
              setStore((prev) => ({
                ...prev,
                settings: { ...prev.settings, gaMeasurementId: e.target.value },
              }))
            }
            className={`rounded-xl border border-[#00D4FF]/35 px-3.5 py-2 text-xs outline-none ${
              isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'
            }`}
          />
        </div>
      </div>

      <div className={`space-y-3 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="text-base font-black text-[#00B4FF]">إعدادات طباعة أسماء تيشيرتات الكورة</h3>
        <label className="block text-xs font-bold text-[#00B4FF]">سعر طباعة الاسم على القطعة الواحدة (ج.م)</label>
        <input type="number" min={0} step="1" value={store.settings.namePrintingFee ?? 0} onChange={(e) => setStore((prev) => ({ ...prev, settings: { ...prev.settings, namePrintingFee: Math.max(0, Number(e.target.value) || 0) } }))} className={`w-full max-w-xs rounded-xl border border-[#00D4FF]/35 px-3.5 py-2.5 text-xs outline-none ${isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'}`} placeholder="مثال: 50 جنيه" />
        <p className="text-[11px] text-[#A0AEC0]">السعر بيتحسب لكل قطعة عليها طباعة، وتقدر تغيّره في أي وقت.</p>
      </div>

      <div className={`space-y-3 rounded-3xl border border-[#00D4FF]/30 p-6 ${isLight ? 'bg-white' : 'bg-[#0A1A3A]/50'}`}>
        <h3 className="text-base font-black text-[#00B4FF]">تكاليف الشحن المدفوع حسب المحافظة (ج.م)</h3>
        <form onSubmit={(e) => { e.preventDefault(); const name = newGovernorateName.trim(); const fee = Number(newGovernorateFee); if (!name || !Number.isFinite(fee) || fee < 1) { notify('اكتب اسم المحافظة ورسوم شحن صحيحة'); return; } if (store.governorates.some((g) => g.name.trim() === name)) { notify('المحافظة موجودة بالفعل'); return; } setStore((prev) => ({ ...prev, governorates: [...prev.governorates, { id: `gov-${Date.now()}`, name, fee, active: true }] })); setNewGovernorateName(''); setNewGovernorateFee(''); notify('تمت إضافة المحافظة ورسوم الشحن'); }} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input required value={newGovernorateName} onChange={(e) => setNewGovernorateName(e.target.value)} placeholder="اسم المحافظة الجديدة" className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs ${isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'}`} />
          <input required type="number" min={1} value={newGovernorateFee} onChange={(e) => setNewGovernorateFee(e.target.value)} placeholder="رسوم الشحن (ج.م)" className={`rounded-xl border border-[#00D4FF]/35 px-3 py-2 text-xs ${isLight ? 'bg-[#F3F8FF] text-[#05050F]' : 'bg-[#05050F] text-white'}`} />
          <button type="submit" className="rounded-xl bg-[#00B4FF] px-4 py-2 text-xs font-black text-[#05050F]">+ إضافة محافظة</button>
        </form>
        {store.governorates.map((g) => (
          <div
            key={g.id}
            className={`flex items-center justify-between rounded-xl border border-[#00D4FF]/25 px-4 py-2.5 text-xs ${
              isLight ? 'bg-[#F3F8FF]' : 'bg-[#05050F]/70'
            }`}
          >
            <span className="font-bold">{g.name}</span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#00B4FF]">رسوم الشحن (ج.م)</label>
              <input
                type="number"
                min={1}
                value={g.fee}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setStore((prev) => ({
                    ...prev,
                    governorates: prev.governorates.map((x) => (x.id === g.id ? { ...x, fee: val } : x)),
                  }));
                }}
                className={`w-24 rounded-lg border border-[#00D4FF]/35 px-2.5 py-1 text-xs outline-none ${
                  isLight ? 'bg-white text-[#05050F]' : 'bg-[#0A1A3A] text-white'
                }`}
              />
              <span className="text-[#00B4FF]">ج.م</span>
              <button type="button" onClick={() => { if (store.governorates.length <= 1) { notify('لازم تسيب محافظة واحدة على الأقل'); return; } if (window.confirm(`حذف محافظة ${g.name}؟`)) { setStore((prev) => ({ ...prev, governorates: prev.governorates.filter((x) => x.id !== g.id) })); notify('تم حذف المحافظة'); } }} className="rounded-lg border border-red-400/40 px-2 py-1 text-[10px] font-bold text-red-400">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 21. إيصال تأكيد الطلب (OrderReceiptModal)
// ============================================================================

function OrderReceiptModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl border border-[#00D4FF]/50 bg-[#05050F] p-6 text-white shadow-[0_0_50px_rgba(0,212,255,0.4)]">
        <div className="flex items-center justify-between border-b border-[#00D4FF]/25 pb-4">
          <div className="flex items-center gap-2 text-[#00D4FF]">
            <CheckCircle2 className="h-6 w-6" />
            <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-lg font-black">
              إيصال طلب #{order.orderNumber}
            </span>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#00D4FF]/40 p-2 text-[#00D4FF]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-4 space-y-2 text-xs">
          <div>العميل: <span className="font-bold">{order.customerName}</span> ({order.customerPhone})</div>
          <div>العنوان: {order.governorate}، {order.city} — {order.address}</div>
          {order.assignedAgentName && (
            <div className="text-[#00D4FF]">مندوب التوصيل: {order.assignedAgentName}</div>
          )}
          <div className="space-y-1.5 border-y border-[#00D4FF]/20 py-3">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.productTitle} ({it.size} / {it.colorName}) × {it.qty}{it.printNames?.length ? <span className="mt-1 block text-[11px] font-bold text-[#00D4FF]">أسماء الطباعة: {it.printNames.map((name, i) => `قطعة ${i + 1}: ${name}`).join(' — ')}</span> : null}</span>
                <span className="font-bold text-[#00D4FF]">{formatEGP(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[#A0AEC0]">
            <span>المجموع الفرعي:</span>
            <span>{formatEGP(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between font-bold text-[#00D4FF]">
              <span>الخصم:</span>
              <span>- {formatEGP(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>تكلفة التوصيل (مدفوع):</span>
            <span className="text-[#00D4FF]">{formatEGP(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-black">
            <span>الإجمالي النهائي:</span>
            <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-[#00D4FF]">
              {formatEGP(order.total)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FF] px-5 py-2.5 text-xs font-black text-[#05050F]"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الفاتورة</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#00D4FF]/40 px-5 py-2.5 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}