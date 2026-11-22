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
    throw new Error(message);
  }
  return data;
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
  const rows = await request(
    "/rest/v1/store_state?id=eq.1&select=id,public_state,private_state,updated_at",
    { method: "GET" },
    session?.access_token || null
  );
  return rows?.[0] || null;
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
