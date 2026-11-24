const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "remontada_supabase_session";

function headers(token) {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function readAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function request(path, options = {}, token = null) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("إعدادات Supabase غير مكتملة");
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "تعذر الاتصال بقاعدة البيانات";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

const CUSTOMER_SESSION_KEY = "remontada_customer_session";

export function readCustomerSession() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveCustomerSession(session) {
  if (session) localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export async function signInCustomerWithGoogle() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("إعدادات تسجيل الدخول غير مكتملة");
  const redirectTo = window.location.origin + window.location.pathname;
  const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  window.location.assign(authorizeUrl.toString());
}

export async function getCurrentCustomer(session) {
  if (!session?.access_token) throw new Error("لا توجد جلسة عميل");
  let activeSession = session;

  const refreshCustomerSession = async () => {
    if (!activeSession.refresh_token) throw new Error("انتهت جلسة الدخول؛ سجّل الدخول بحساب Google مرة أخرى");
    const refreshed = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: activeSession.refresh_token }),
    });
    activeSession = {
      ...activeSession,
      ...refreshed,
      expires_at: refreshed.expires_at || Math.floor(Date.now() / 1000) + Number(refreshed.expires_in || 3600),
    };
    saveCustomerSession(activeSession);
  };

  const expiresAt = Number(activeSession.expires_at || 0);
  if (activeSession.refresh_token && expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60) {
    await refreshCustomerSession();
  }

  try {
    const user = await request("/auth/v1/user", { method: "GET" }, activeSession.access_token);
    return { user, session: activeSession };
  } catch (error) {
    // Retry once with the rotating refresh token if the access token was rejected.
    if (![400, 401].includes(error?.status) || !activeSession.refresh_token) throw error;
    await refreshCustomerSession();
    const user = await request("/auth/v1/user", { method: "GET" }, activeSession.access_token);
    return { user, session: activeSession };
  }
}

export async function signOutCustomer(session) {
  try {
    if (session?.access_token) await request("/auth/v1/logout", { method: "POST" }, session.access_token);
  } finally {
    saveCustomerSession(null);
  }
}

export async function signInAdmin(email, password) {
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const user = await request("/auth/v1/user", { method: "GET" }, session.access_token);
  if (user?.app_metadata?.role !== "admin") {
    await request("/auth/v1/logout", { method: "POST" }, session.access_token).catch(() => {});
    throw new Error("الحساب غير مصرح له بدخول لوحة الإدارة");
  }
  saveSession(session);
  return { session, user };
}

export async function getCurrentAdmin(session) {
  if (!session?.access_token) return null;
  try {
    const user = await request("/auth/v1/user", { method: "GET" }, session.access_token);
    return user?.app_metadata?.role === "admin" ? user : null;
  } catch {
    return null;
  }
}

export async function signOutAdmin(session) {
  try {
    if (session?.access_token) await request("/auth/v1/logout", { method: "POST" }, session.access_token);
  } finally {
    saveSession(null);
  }
}

export async function changeAdminPassword(session, password) {
  if (!session?.access_token) throw new Error("سجّل الدخول مرة أخرى");
  await request("/auth/v1/user", {
    method: "PUT",
    body: JSON.stringify({ password }),
  }, session.access_token);
}

export async function loadStoreState(session = null) {
  // Public visitors must never request the private_state column.
  const columns = session?.access_token
    ? "id,public_state,private_state,updated_at"
    : "id,public_state,updated_at";
  const rows = await request(
    `/rest/v1/store_state?id=eq.1&select=${columns}`,
    { method: "GET" },
    session?.access_token || null
  );
  const row = rows?.[0] || null;
  if (!row?.public_state) return row;
  try {
    const stockRows = await request(
      "/rest/v1/inventory_public_stock?select=product_id,variant_id,quantity,sku",
      { method: "GET" },
      session?.access_token || null
    );
    const stock = new Map((stockRows || []).map((item) => [
      String(item.product_id) + ":" + String(item.variant_id), Number(item.quantity || 0)
    ]));
    row.public_state = {
      ...row.public_state,
      products: (row.public_state.products || []).map((product) => ({
        ...product,
        variants: (product.variants || []).map((variant) => ({
          ...variant,
          stockQty: stock.get(String(product.id) + ":" + String(variant.id)) ?? 0,
        })),
      })),
    };
  } catch (error) {
    console.warn("تعذر تحميل المخزون المركزي، سيتم عرض بيانات المتجر المحفوظة مؤقتاً:", error);
  }
  return row;
}

export async function setInventoryVariantStock(session, product, variant, quantity, lowStockThreshold) {
  if (!session?.access_token) throw new Error("سجّل دخول الإدارة لتعديل المخزون");
  const currentRows = await request(
    `/rest/v1/inventory_stock?product_id=eq.${encodeURIComponent(String(product.id))}&variant_id=eq.${encodeURIComponent(String(variant.id))}&select=quantity`,
    { method: "GET" },
    session.access_token
  );
  const currentQty = Number(currentRows?.[0]?.quantity || 0);
  const nextQty = Math.max(0, Math.floor(Number(quantity) || 0));
  const delta = nextQty - currentQty;
  if (delta !== 0) {
    await request("/rest/v1/rpc/inventory_adjust_stock", {
      method: "POST",
      body: JSON.stringify({
        p_product_id: String(product.id),
        p_variant_id: String(variant.id),
        p_product_title: String(product.title || ""),
        p_variant_label: `${variant.size || ""} / ${variant.colorName || ""}`,
        p_sku: variant.sku || null,
        p_quantity_delta: delta,
        p_movement_type: delta > 0 ? "restock" : "adjustment",
        p_note: "تعديل مباشر من لوحة إدارة الموقع",
      }),
    }, session.access_token);
  }
  if (nextQty > 0 || currentRows?.length) {
    await request(
      `/rest/v1/inventory_stock?product_id=eq.${encodeURIComponent(String(product.id))}&variant_id=eq.${encodeURIComponent(String(variant.id))}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ low_stock_threshold: Math.max(0, Math.floor(Number(lowStockThreshold) || 0)) }),
      },
      session.access_token
    );
  }
  return nextQty;
}

export async function reserveOnlineInventory(orderId, items) {
  return request("/rest/v1/rpc/inventory_reserve_online_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_id: String(orderId),
      p_items: items.map((item) => ({
        product_id: String(item.productId),
        variant_id: String(item.variantId),
        quantity: Number(item.qty),
        product_title: String(item.productTitle || ""),
      })),
    }),
  });
}

export async function saveStoreState(store, session) {
  if (!session?.access_token) throw new Error("يلزم تسجيل دخول الإدارة لحفظ التغييرات");
  const publicState = {
    theme: store.theme,
    settings: store.settings,
    sports: store.sports,
    governorates: store.governorates,
    products: store.products,
    promotions: store.promotions,
    coupons: store.coupons,
    reviews: (store.reviews || []).filter((review) => review.isApproved === true),
  };
  const privateState = {
    deliveryAgents: store.deliveryAgents || [],
    orders: store.orders || [],
    customerProfile: store.customerProfile || {},
    reviews: store.reviews || [],
  };
  await request("/rest/v1/store_state?id=eq.1", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ public_state: publicState, private_state: privateState, updated_at: new Date().toISOString() }),
  }, session.access_token);
}

export async function releaseOnlineInventory(orderId) {
  const session = readAdminSession();
  if (!session?.access_token) throw new Error("سجّل دخول الإدارة لإلغاء الطلب وتحرير المخزون");
  return request("/rest/v1/rpc/inventory_release_online_order", {
    method: "POST",
    body: JSON.stringify({ p_order_id: String(orderId) }),
  }, session.access_token);
}
