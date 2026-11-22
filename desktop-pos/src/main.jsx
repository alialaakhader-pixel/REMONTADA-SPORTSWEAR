import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Package, RefreshCw, LogOut, Plus, Minus, Search, Printer, AlertCircle, CheckCircle2, Boxes } from 'lucide-react';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fkywyxiazbcbzqhlaqfm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bT_Y-bbtOCWzffKi7rQgKg_qKaq4Dn6';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const money = (n) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(Number(n || 0)) + ' ج.م';
const makeId = () => crypto.randomUUID();

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({});
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState('cash');
  const [tab, setTab] = useState('sale');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [restock, setRestock] = useState({ productId: '', variantId: '', qty: '1' });

  const isAdmin = session?.user?.app_metadata?.role === 'admin';
  const cartTotal = useMemo(() => cart.reduce((sum, x) => sum + x.price * x.qty, 0), [cart]);
  const visibleProducts = useMemo(() => products.filter(p => (p.title || '').toLowerCase().includes(query.toLowerCase())), [products, query]);

  async function login(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (data.user?.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('الحساب غير مصرح له باستخدام الكاشير');
      }
      setSession(data);
      setPassword('');
      setMessage('تم تسجيل الدخول');
    } catch (err) { setMessage(err.message || 'تعذر تسجيل الدخول'); }
    finally { setBusy(false); }
  }

  async function refreshData() {
    if (!isAdmin) return;
    setBusy(true);
    try {
      const { data: stateRow, error: stateError } = await supabase.from('store_state').select('public_state').eq('id', 1).single();
      if (stateError) throw stateError;
      const list = Array.isArray(stateRow?.public_state?.products) ? stateRow.public_state.products : [];
      setProducts(list);
      for (const product of list) {
        for (const variant of (product.variants || [])) {
          await supabase.rpc('inventory_initialize_stock', {
            p_product_id: String(product.id), p_variant_id: String(variant.id),
            p_product_title: product.title || 'منتج',
            p_variant_label: [variant.size, variant.colorName].filter(Boolean).join(' / '),
            p_sku: variant.sku || null, p_initial_quantity: Math.max(0, Number(variant.stockQty || 0))
          }).then(({ error }) => { if (error) throw error; });
        }
      }
      const { data: rows, error } = await supabase.from('inventory_stock').select('*');
      if (error) throw error;
      const map = {};
      (rows || []).forEach(row => { map[row.product_id + ':' + row.variant_id] = row; });
      setStock(map);
    } catch (err) { setMessage(err.message || 'تعذر تحديث المخزون'); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (isAdmin) refreshData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => refreshData(), 12000);
    return () => clearInterval(timer);
  }, [isAdmin, products.length]);

  function available(product, variant) {
    const row = stock[product.id + ':' + variant.id];
    return Number(row?.quantity ?? variant.stockQty ?? 0);
  }

  function addToCart(product, variant) {
    const key = product.id + ':' + variant.id;
    const inCart = cart.find(x => x.key === key)?.qty || 0;
    if (available(product, variant) <= inCart) { setMessage('الكمية المطلوبة أكبر من المتاح'); return; }
    setCart(prev => {
      const found = prev.find(x => x.key === key);
      if (found) return prev.map(x => x.key === key ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { key, productId: product.id, variantId: variant.id, title: product.title, label: [variant.size, variant.colorName].filter(Boolean).join(' / '), price: Number(product.basePrice || 0), qty: 1 }];
    });
  }

  function changeQty(key, delta) {
    setCart(prev => prev.map(x => x.key === key ? { ...x, qty: Math.max(0, Math.min(x.qty + delta, Number(stock[key]?.quantity ?? 0))) } : x).filter(x => x.qty > 0));
  }

  async function completeSale() {
    if (!cart.length) return;
    setBusy(true); setMessage('');
    const saleId = makeId();
    const receiptNumber = 'RMT-' + Date.now().toString().slice(-8);
    try {
      const { error } = await supabase.rpc('pos_create_sale', {
        p_sale_id: saleId, p_receipt_number: receiptNumber,
        p_subtotal: cartTotal, p_discount: 0, p_total: cartTotal,
        p_payment_method: payment, p_cashier_note: null,
        p_items: cart.map(x => ({ product_id: x.productId, variant_id: x.variantId, product_title: x.title, variant_label: x.label, quantity: x.qty, unit_price: x.price }))
      });
      if (error) throw error;
      setLastReceipt({ receiptNumber, items: cart, total: cartTotal, date: new Date().toLocaleString('ar-EG') });
      setCart([]);
      await refreshData();
      setMessage('تم تسجيل البيع وخصم الكمية من المخزون المشترك');
    } catch (err) { setMessage(err.message || 'تعذر تسجيل البيع'); }
    finally { setBusy(false); }
  }

  async function addStock(e) {
    e.preventDefault();
    const product = products.find(p => p.id === restock.productId);
    const variant = product?.variants?.find(v => v.id === restock.variantId);
    if (!product || !variant || Number(restock.qty) <= 0) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('inventory_adjust_stock', {
        p_product_id: String(product.id), p_variant_id: String(variant.id),
        p_product_title: product.title || 'منتج',
        p_variant_label: [variant.size, variant.colorName].filter(Boolean).join(' / '),
        p_sku: variant.sku || null, p_quantity_delta: Number(restock.qty),
        p_movement_type: 'restock', p_note: 'توريد للمحل من برنامج الكاشير'
      });
      if (error) throw error;
      await refreshData(); setMessage('تمت إضافة الكمية للمخزون');
    } catch (err) { setMessage(err.message || 'تعذر إضافة المخزون'); }
    finally { setBusy(false); }
  }

  async function logout() { await supabase.auth.signOut(); setSession(null); setProducts([]); setStock({}); setCart([]); }

  if (!isAdmin) return <main className="login-shell"><form className="login-card" onSubmit={login}>
    <div className="brand-mark">R</div><p className="eyebrow">REMONTADA SPORTSWEAR</p><h1>كاشير المحل</h1>
    <p className="muted">سجّل الدخول بحساب الإدارة نفسه المستخدم في المتجر.</p>
    <label>البريد الإلكتروني<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></label>
    <label>كلمة المرور<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
    <button className="primary wide" disabled={busy}>{busy ? 'جارٍ الدخول...' : 'دخول الكاشير'}</button>
    {message && <p className="notice">{message}</p>}
  </form></main>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark small">R</div><div><b>REMONTADA <span>POS</span></b><small>نظام البيع والمخزون الموحد</small></div></div>
      <div className="top-actions"><span className="online"><i /> متصل بالمخزون</span><button className="ghost" onClick={refreshData} disabled={busy}><RefreshCw size={16}/> تحديث</button><button className="ghost" onClick={logout}><LogOut size={16}/> خروج</button></div>
    </header>
    <div className="tabs"><button className={tab==='sale'?'active':''} onClick={()=>setTab('sale')}><ShoppingCart size={17}/> الكاشير</button><button className={tab==='stock'?'active':''} onClick={()=>setTab('stock')}><Boxes size={17}/> المخزون والتوريد</button></div>
    {message && <div className="notice-bar"><AlertCircle size={17}/>{message}<button onClick={()=>setMessage('')}>×</button></div>}
    {tab === 'sale' ? <div className="workspace">
      <section className="catalog"><div className="section-head"><div><h2>المنتجات</h2><p>اختر المنتج ثم المقاس أو اللون</p></div><span className="count">{products.length} منتج</span></div>
        <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن منتج..." /></div>
        <div className="product-grid">{visibleProducts.map(p=><article className="product-card" key={p.id}><div className="product-info"><b>{p.title}</b><strong>{money(p.basePrice)}</strong></div>
          {(p.variants||[]).map(v=>{const qty=available(p,v);return <div className="variant-row" key={v.id}><div><span>{[v.size,v.colorName].filter(Boolean).join(' • ') || 'بدون مقاس'}</span><small>المتاح: {qty}</small></div><button className="add" disabled={qty<=0||busy} onClick={()=>addToCart(p,v)}><Plus size={16}/> إضافة</button></div>})}
        </article>)}</div>
        {!products.length && <div className="empty"><Package size={32}/><b>لا توجد منتجات في المتجر بعد</b><span>أضف المنتجات من لوحة إدارة الموقع ثم اضغط تحديث.</span></div>}
      </section>
      <aside className="cart-panel"><div className="section-head"><div><h2>فاتورة البيع</h2><p>{cart.reduce((n,x)=>n+x.qty,0)} قطعة في الفاتورة</p></div><ShoppingCart/></div>
        <div className="cart-lines">{cart.map(x=><div className="cart-line" key={x.key}><div><b>{x.title}</b><small>{x.label}</small><strong>{money(x.price*x.qty)}</strong></div><div className="qty"><button onClick={()=>changeQty(x.key,-1)}><Minus size={14}/></button><span>{x.qty}</span><button onClick={()=>changeQty(x.key,1)}><Plus size={14}/></button></div></div>)}
        {!cart.length&&<div className="empty compact">الفاتورة فارغة</div>}</div>
        <div className="checkout"><label>طريقة الدفع<select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">نقدي</option><option value="card">بطاقة</option><option value="wallet">محفظة</option><option value="other">أخرى</option></select></label>
          <div className="total"><span>الإجمالي</span><b>{money(cartTotal)}</b></div><button className="primary wide" disabled={!cart.length||busy} onClick={completeSale}>{busy?'جارٍ الحفظ...':'تأكيد البيع وخصم المخزون'}</button>
          {lastReceipt&&<button className="ghost wide" onClick={()=>window.print()}><Printer size={16}/> طباعة آخر فاتورة ({lastReceipt.receiptNumber})</button>}
        </div>
      </aside>
    </div> : <section className="stock-page"><div className="section-head"><div><h2>المخزون والتوريد</h2><p>الرصيد المشترك للمحل والمتجر الإلكتروني</p></div><Package/></div>
      <form className="restock-form" onSubmit={addStock}><label>المنتج<select required value={restock.productId} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setRestock({productId:e.target.value,variantId:p?.variants?.[0]?.id||'',qty:'1'})}}><option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>المقاس / اللون<select required value={restock.variantId} onChange={e=>setRestock(x=>({...x,variantId:e.target.value}))}><option value="">اختر الاختيار</option>{(products.find(p=>p.id===restock.productId)?.variants||[]).map(v=><option key={v.id} value={v.id}>{[v.size,v.colorName].filter(Boolean).join(' / ')||v.id}</option>)}</select></label>
        <label>الكمية المضافة<input type="number" min="1" required value={restock.qty} onChange={e=>setRestock(x=>({...x,qty:e.target.value}))}/></label><button className="primary" disabled={busy}><Plus size={16}/> إضافة للمخزون</button></form>
      <div className="stock-table"><div className="table-row table-head"><span>المنتج</span><span>المقاس / اللون</span><span>الرصيد</span></div>
        {products.flatMap(p=>(p.variants||[]).map(v=><div className="table-row" key={p.id+v.id}><b>{p.title}</b><span>{[v.size,v.colorName].filter(Boolean).join(' / ')||'—'}</span><strong className={available(p,v)<=3?'low':''}>{available(p,v)} قطعة</strong></div>))}
      </div>
    </section>}
    <footer><span><CheckCircle2 size={15}/> البيانات محفوظة في Supabase</span><span>Windows 10 / 11</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
