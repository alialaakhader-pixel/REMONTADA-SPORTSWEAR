import React,
  {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
import { PRODUCTS, type Product } from "./data";

const PRODUCTS_KEY = "remontada:products:v1";
function readProducts(): Product[] {
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return PRODUCTS;
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value as Product[] : PRODUCTS;
  } catch { return PRODUCTS; }
}

export type Line = { id: string; qty: number; size: string; color: string };

type Toast = { id: number; title: string; body?: string };

type Ctx = {
  products: Product[];
  setProducts: (products: Product[]) => void;
  route: string;
  go: (r: string) => void;
  cart: Line[];
  add: (p: Product, size?: string, color?: string, qty?: number) => void;
  setQty: (i: number, q: number) => void;
  remove: (i: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  wish: string[];
  toggleWish: (id: string) => void;
  toasts: Toast[];
  toast: (title: string, body?: string) => void;
  search: string;
  setSearch: (s: string) => void;
  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;
};

const StoreCtx = createContext<Ctx | null>(null);
const CART_KEY = "remontada:cart:v1";
const WISH_KEY = "remontada:wishlist:v1";

function readCart(): Line[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): Line[] => {
      if (!item || typeof item !== "object") return [];
      const line = item as Partial<Line>;
      const product = readProducts().find((p) => p.id === line.id);
      if (!product) return [];
      const size = typeof line.size === "string" && product.sizes.includes(line.size)
        ? line.size
        : product.sizes[0];
      const color = typeof line.color === "string" && product.colors.some((c) => c.name === line.color)
        ? line.color
        : product.colors[0].name;
      const qty = Number.isFinite(line.qty) ? Math.max(1, Math.min(9, Math.floor(line.qty as number))) : 1;
      return [{ id: product.id, qty, size, color }];
    });
  } catch {
    return [];
  }
}

function readWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISH_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string =>
      typeof id === "string" && readProducts().some((p) => p.id === id)
    ))];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(readProducts);
  const setProducts = useCallback((next: Product[]) => {
    setProductsState(next);
    try { window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next)); } catch { /* storage quota */ }
  }, []);
  const [route, setRoute] = useState<string>(
    () => window.location.hash.replace(/^#/, "") || (window.location.pathname !== "/" ? window.location.pathname : "/")
  );
  const [cart, setCart] = useState<Line[]>(readCart);
  const [wish, setWish] = useState<string[]>(readWishlist);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.replace(/^#/, "") || "/");
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Keep the in-memory cart usable when browser storage is unavailable.
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISH_KEY, JSON.stringify(wish));
    } catch {
      // Keep the in-memory wishlist usable when browser storage is unavailable.
    }
  }, [wish]);

  const go = useCallback((r: string) => {
    if ((window.location.hash.replace(/^#/, "") || "/") === r) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = r;
  }, []);

  const toast = useCallback((title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const add = useCallback(
    (p: Product, size?: string, color?: string, qty = 1) => {
      const s = size ?? p.sizes[0];
      const c = color ?? p.colors[0].name;
      setCart((prev) => {
        const i = prev.findIndex(
          (l) => l.id === p.id && l.size === s && l.color === c
        );
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: Math.min(9, next[i].qty + qty) };
          return next;
        }
        return [...prev, { id: p.id, qty: Math.max(1, Math.min(9, qty)), size: s, color: c }];
      });
      toast("أُضيف إلى السلة", `${p.name} — مقاس ${s}`);
    },
    [toast]
  );

  const setQty = useCallback((i: number, q: number) => {
    setCart((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, qty: Math.max(1, Math.min(9, q)) } : l))
    );
  }, []);

  const remove = useCallback((i: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const toggleWish = useCallback(
    (id: string) => {
      setWish((prev) => {
        const has = prev.includes(id);
        toast(has ? "أُزيل من المفضلة" : "أُضيف إلى المفضلة");
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [toast]
  );

  const count = useMemo(() => cart.reduce((a, l) => a + l.qty, 0), [cart]);
  const subtotal = useMemo(
    () =>
      cart.reduce((a, l) => {
        const p = products.find((x) => x.id === l.id);
        return a + (p ? p.price * l.qty : 0);
      }, 0),
    [cart]
  );

  const value: Ctx = {
    products,
    setProducts,
    route,
    go,
    cart,
    add,
    setQty,
    remove,
    clear,
    count,
    subtotal,
    wish,
    toggleWish,
    toasts,
    toast,
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export const findProduct = (id: string) => {
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    const products: Product[] = raw ? JSON.parse(raw) : PRODUCTS;
    return products.find((p) => p.id === id);
  } catch {
    return PRODUCTS.find((p) => p.id === id);
  }
};
