import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Package, RefreshCw, LogOut, Plus, Minus, Search, Printer, AlertCircle, CheckCircle2, Boxes, Wifi, WifiOff, CloudUpload } from 'lucide-react';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fkywyxiazbcbzqhlaqfm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bT_Y-bbtOCWzffKi7rQgKg_qKaq4Dn6';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
const money = n => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(n||0))+' ج.م';
const id = () => crypto.randomUUID();
const desktop = window.remontadaDesktop;
const variantLabel = v => [v.size,v.colorName].filter(Boolean).join(' / ') || 'بدون مقاس';
const variantCode = (p,v) => v.variantCode || v.sku || (p.modelCode ? String(p.modelCode)+(v.size?'-'+v.size:'') : String(v.id));

function App() {
  const [session,setSession]=useState(null), [authorized,setAuthorized]=useState(false), [offlineMode,setOfflineMode]=useState(false);
  const [email,setEmail]=useState(''), [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [products,setProducts]=useState([]), [stock,setStock]=useState({});
  const [cart,setCart]=useState([]), [query,setQuery]=useState(''), [payment,setPayment]=useState('cash'), [tab,setTab]=useState('sale');
  const [lastReceipt,setLastReceipt]=useState(null), [restock,setRestock]=useState({productId:'',variantId:'',qty:'1'}), [pending,setPending]=useState(0);
  const online = typeof navigator !== 'undefined' && navigator.onLine;
  const isAdmin = authorized;
  const cartTotal = useMemo(()=>cart.reduce((n,x)=>n+x.price*x.qty,0),[cart]);
  const visibleProducts = useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q) return products;
    return products.filter(p => [p.title,p.modelCode,...(p.variants||[]).flatMap(v=>[variantCode(p,v),v.size,v.colorName,v.sku])].some(x=>String(x||'').toLowerCase().includes(q)));
  },[products,query]);

  function applySnapshot(s) {
    if(!s) return;
    setProducts(s.products||[]); setStock(s.stock||{}); setPending(s.pending||0);
  }

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try {
        const local=await desktop?.init();
        if(!alive) return;
        applySnapshot(local);
        const info=await desktop?.offlineInfo();
        if(info?.email) setEmail(info.email);
        const {data}=await supabase.auth.getSession();
        const user=data?.session?.user;
        if(user?.app_metadata?.role==='admin') {
          setSession(data.session); setAuthorized(true); await desktop?.authorize();
          if(!navigator.onLine) setOfflineMode(true);
        } else if(info?.authorized && info?.hasPassword && !navigator.onLine) {
          setOfflineMode(true); setAuthorized(false);
        }
      } catch(e) { if(alive) setMessage('تعذر فتح قاعدة بيانات المحل: '+(e.message||'')); }
    })();
    const onlineHandler=async()=>{
      setOfflineMode(false);
      try {
        const {data}=await supabase.auth.getSession();
        if(data?.session?.user?.app_metadata?.role==='admin') {
          setSession(data.session); setAuthorized(true);
          await refreshData(data.session);
        } else {
          setMessage('عاد الإنترنت. سجّل دخول الإدارة لإرسال المبيعات المحفوظة إلى الموقع.');
        }
      } catch { setMessage('عاد الإنترنت، لكن تعذر استعادة جلسة الإدارة. أعد تسجيل الدخول للمزامنة.'); }
    };
    const offlineHandler=()=>{setOfflineMode(true);setMessage('انقطع الإنترنت؛ ستُحفظ المبيعات محليًا حتى عودة الاتصال.');};
    window.addEventListener('online',onlineHandler); window.addEventListener('offline',offlineHandler);
    return ()=>{alive=false;window.removeEventListener('online',onlineHandler);window.removeEventListener('offline',offlineHandler);};
  },[]);

  async function login(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      if(!navigator.onLine) {
        const valid=await desktop?.verifyOfflinePassword(password);
        if(!valid) throw new Error('كلمة المرور غير صحيحة أو لم يتم تفعيل الدخول دون إنترنت من قبل.');
        setAuthorized(true); setOfflineMode(true); setPassword('');
        setMessage('تم فتح الكاشير دون إنترنت. ستتم المزامنة عند عودة الاتصال.');
        return;
      }
      try {
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error) throw error;
        if(data.user?.app_metadata?.role!=='admin') { await supabase.auth.signOut(); throw new Error('الحساب غير مصرح له باستخدام الكاشير'); }
        setSession(data.session); setAuthorized(true); setOfflineMode(false);
        setMessage('تم تسجيل الدخول. جارٍ تنزيل المنتجات والمخزون لأول مرة.');
        const ready=await refreshData(data.session);
        if(ready) {
          await desktop?.saveOfflineCredentials({email:email.trim(),password});
          setMessage('تم تفعيل جهاز المحل. يمكنك الآن العمل دون إنترنت بعد تحميل المخزون.');
        } else {
          setMessage('تم تسجيل الدخول، لكن لم يكتمل تحميل المخزون. أعد المزامنة قبل الاعتماد على وضع عدم الاتصال.');
        }
        setPassword('');
      } catch(onlineError) {
        const valid=await desktop?.verifyOfflinePassword(password);
        if(!valid) throw onlineError;
        setAuthorized(true); setOfflineMode(true); setPassword('');
        setMessage('تعذر الوصول للخادم؛ تم فتح النسخة المحلية. المزامنة ستبدأ عند استقرار الاتصال.');
      }
    } catch(err) { setMessage(err.message||'تعذر تسجيل الدخول.'); }
    finally { setBusy(false); }
  }

  async function syncPending(activeSession=session) {
    if(!activeSession || !navigator.onLine) return;
    const queue=await desktop?.pending()||[];
    let allSynced=true;
    for(const ev of queue) {
      try {
        const {error}=await supabase.rpc('pos_apply_offline_event',{p_event_id:ev.event_id,p_event_type:ev.event_type,p_payload:ev.payload});
        if(error) throw error;
        const snap=await desktop.markSynced(ev.event_id); applySnapshot(snap);
      } catch(err) {
        await desktop?.syncError({eventId:ev.event_id,error:err.message});
        setMessage('المزامنة متوقفة عند حركة لم تُرفع بعد: '+(err.message||'خطأ اتصال'));
        allSynced=false;
        break;
      }
    }
    const latest=await desktop?.init(); applySnapshot(latest);
    return allSynced;
  }

  async function refreshData(activeSession=session) {
    if(!activeSession || !navigator.onLine) {
      const local=await desktop?.init(); applySnapshot(local);
      setMessage('أنت تعمل دون إنترنت. المبيعات محفوظة على جهاز المحل وستتزامن عند عودة الاتصال.');
      return;
    }
    setBusy(true);
    try {
      const allSynced=await syncPending(activeSession);
      if(!allSynced) throw new Error('توجد حركة محلية لم تُزامن؛ أوقفنا البيع الإلكتروني مؤقتًا لحماية المخزون.');
      const {data:stateRow,error:stateError}=await supabase.from('store_state').select('public_state').eq('id',1).single();
      if(stateError) throw stateError;
      const list=Array.isArray(stateRow?.public_state?.products)?stateRow.public_state.products:[];
      const enriched=[];
      for(const p of list) {
        const {data:assignedCode,error:codeError}=await supabase.rpc('inventory_assign_model_code',{p_product_id:String(p.id),p_product_title:p.title||'منتج'});
        if(codeError) throw codeError;
        const modelCode=String(assignedCode);
        const variants=[];
        for(const v of p.variants||[]) {
          const code=String(modelCode+(v.size?'-'+v.size:''));
          const {error}=await supabase.rpc('inventory_initialize_stock',{
            p_product_id:String(p.id),p_variant_id:String(v.id),p_product_title:p.title||'منتج',
            p_variant_label:variantLabel(v),p_sku:code,p_initial_quantity:Math.max(0,Number(v.stockQty||0))
          });
          if(error) throw error;
          variants.push({...v,sku:code,variantCode:code});
        }
        enriched.push({...p,modelCode:String(modelCode),variants});
      }
      const {data:rows,error}=await supabase.from('inventory_stock').select('*');
      if(error) throw error;
      const snap=await desktop.replaceCatalog({products:enriched,stockRows:rows||[]});
      applySnapshot(snap);
      const {error:heartbeatError}=await supabase.rpc('pos_device_heartbeat');
      if(heartbeatError) throw heartbeatError;
      setOfflineMode(false); setMessage('تم تحديث المنتجات والمخزون والمزامنة بنجاح.');
      return true;
    } catch(err) {
      const local=await desktop?.init(); applySnapshot(local); setOfflineMode(true);
      setMessage('تعذر الاتصال بالمخزون المركزي؛ تم الاحتفاظ بالبيانات المحلية. '+(err.message||''));
      return false;
    } finally { setBusy(false); }
  }

  useEffect(()=>{
    if(!isAdmin) return;
    const timer=setInterval(()=>{if(navigator.onLine && session) refreshData(session);},20000);
    return ()=>clearInterval(timer);
  },[isAdmin,session]);

  async function addToCart(p,v) {
    const key=String(p.id)+':'+String(v.id), qty=Number(stock[key]?.quantity??v.stockQty??0);
    const inCart=cart.find(x=>x.key===key)?.qty||0;
    if(qty<=inCart){setMessage('الكمية المطلوبة أكبر من المتاح في مخزون هذا المقاس');return;}
    setCart(prev=>{const old=prev.find(x=>x.key===key);return old?prev.map(x=>x.key===key?{...x,qty:x.qty+1}:x):[...prev,{key,productId:String(p.id),variantId:String(v.id),title:p.title,label:variantLabel(v),code:variantCode(p,v),price:Number(p.basePrice||0),qty:1}];});
  }
  function changeQty(key,delta) {
    setCart(prev=>prev.map(x=>x.key===key?{...x,qty:Math.max(0,Math.min(x.qty+delta,Number(stock[key]?.quantity||0)))}:x).filter(x=>x.qty>0));
  }

  async function completeSale() {
    if(!cart.length)return;
    setBusy(true);setMessage('');
    const saleId=id(),eventId=id(),receiptNumber='RMT-'+Date.now().toString().slice(-8);
    const payload={sale_id:saleId,event_id:eventId,receipt_number:receiptNumber,subtotal:cartTotal,discount:0,total:cartTotal,payment_method:payment,cashier_note:null,
      items:cart.map(x=>({product_id:x.productId,variant_id:x.variantId,product_title:x.title,variant_label:x.label,quantity:x.qty,unit_price:x.price}))};
    try {
      let centrallyApplied=false;
      if(session && navigator.onLine) {
        await refreshData(session);
        const {error:centralError}=await supabase.rpc('pos_apply_offline_event',{p_event_id:eventId,p_event_type:'sale',p_payload:payload});
        if(!centralError) centrallyApplied=true;
        else if(/رصيد المخزون|الكمية المطلوبة|مخزون/i.test(centralError.message||'')) throw centralError;
      }
      const snap=await desktop.createSale(payload); applySnapshot(snap);
      if(centrallyApplied) { const synced=await desktop.markSynced(eventId); applySnapshot(synced); }
      setLastReceipt({receiptNumber,items:cart,total:cartTotal,date:new Date().toLocaleString('ar-EG')});setCart([]);
      if(centrallyApplied) { await refreshData(session); setMessage('تم تسجيل البيع في المخزون المركزي وحفظ الفاتورة محليًا.'); }
      else if(session && navigator.onLine) { await syncPending(session); setMessage('تم حفظ الفاتورة محليًا، وستُرفع عند استقرار الاتصال.'); }
      else setMessage('تم حفظ الفاتورة محليًا دون إنترنت. ستُرفع تلقائيًا عند عودة الاتصال.');
    } catch(err){setMessage(err.message||'تعذر حفظ الفاتورة محليًا');}
    finally{setBusy(false);}
  }

  async function addStock(e) {
    e.preventDefault();
    const p=products.find(x=>String(x.id)===restock.productId),v=p?.variants?.find(x=>String(x.id)===restock.variantId);
    const qty=Math.floor(Number(restock.qty));
    if(!p||!v||qty<=0)return;
    setBusy(true);
    const payload={event_id:id(),product_id:String(p.id),variant_id:String(v.id),product_title:p.title,variant_label:variantLabel(v),sku:variantCode(p,v),quantity_delta:qty,note:'توريد من برنامج الكاشير'};
    try {
      const snap=await desktop.addStock(payload);applySnapshot(snap);
      if(session&&navigator.onLine){
        const synced=await syncPending(session);
        setMessage(synced?'تمت إضافة الكمية ومزامنتها.':'تم حفظ التوريد محليًا، والمزامنة متوقفة مؤقتًا حتى حل تعارض المخزون.');
      } else setMessage('تم حفظ التوريد محليًا وسيُزامن عند عودة الإنترنت.');
    } catch(err){setMessage(err.message||'تعذر إضافة المخزون');}
    finally{setBusy(false);}
  }

  async function logout() {
    try{await supabase.auth.signOut();}catch{}
    await desktop?.logout();setSession(null);setAuthorized(false);setProducts([]);setStock({});setCart([]);setPending(0);
  }

  if(!isAdmin) return <main className="login-shell"><form className="login-card" onSubmit={login}>
    <div className="brand-mark">R</div><p className="eyebrow">REMONTADA SPORTSWEAR</p><h1>كاشير المحل</h1>
    <p className="muted">أول مرة سجّل بحساب الإدارة والإنترنت متصل. بعد التفعيل يمكنك الدخول بكلمة مرور الإدارة المحفوظة على جهاز المحل والعمل دون إنترنت.</p>
    <label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={!online} placeholder="البريد الإلكتروني للإدارة"/></label>
    <label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور"/></label>
    <button className="primary wide" disabled={busy}>{busy?'جارٍ الدخول...':online?'دخول الكاشير / تفعيل الجهاز':'دخول دون إنترنت'}</button>{message&&<p className="notice">{message}</p>}
  </form></main>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark small">R</div><div><b>REMONTADA <span>POS</span></b><small>نظام البيع والمخزون المحلي والمركزي</small></div></div>
      <div className="top-actions"><span className={online?'online':'offline'}>{online?<Wifi size={15}/>:<WifiOff size={15}/>} {online?'متصل بالإنترنت':'وضع عدم الاتصال'}</span>
      <span className="queue-count"><CloudUpload size={15}/> حركات معلقة: {pending}</span>
      {!session&&online&&<button className="primary" onClick={()=>setAuthorized(false)}>تسجيل الدخول للمزامنة</button>}
      <button className="ghost" onClick={()=>refreshData()} disabled={busy}><RefreshCw size={16}/> مزامنة</button><button className="ghost" onClick={logout}><LogOut size={16}/> خروج</button></div>
    </header>
    <div className="tabs"><button className={tab==='sale'?'active':''} onClick={()=>setTab('sale')}><ShoppingCart size={17}/> الكاشير</button><button className={tab==='stock'?'active':''} onClick={()=>setTab('stock')}><Boxes size={17}/> المخزون والتوريد</button></div>
    {message&&<div className="notice-bar"><AlertCircle size={17}/>{message}<button onClick={()=>setMessage('')}>×</button></div>}
    {tab==='sale'?<div className="workspace">
      <section className="catalog"><div className="section-head"><div><h2>المنتجات</h2><p>ابحث باسم القطعة أو رقم الموديل أو كود المقاس</p></div><span className="count">{products.length} منتج</span></div>
        <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){const q=query.trim().toLowerCase();const hits=products.flatMap(p=>(p.variants||[]).map(v=>({p,v})).filter(({p,v})=>[variantCode(p,v),p.modelCode,v.sku].some(x=>String(x||'').toLowerCase()===q)));if(hits.length===1){addToCart(hits[0].p,hits[0].v);setQuery('');}else if(hits.length>1)setMessage('الكود يطابق أكثر من اختيار، استخدم كود المقاس الكامل.');else if(q)setMessage('لم يتم العثور على كود مطابق.');}}} placeholder="اسم القطعة أو الكود مثل 102-L"/></div>
        <div className="product-grid">{visibleProducts.map(p=><article className="product-card" key={p.id}><div className="product-info"><div><b>{p.title}</b><small className="model-code">كود الموديل: {p.modelCode||'—'}</small></div><strong>{money(p.basePrice)}</strong></div>
          {(p.variants||[]).map(v=>{const key=String(p.id)+':'+String(v.id),qty=Number(stock[key]?.quantity??v.stockQty??0),code=variantCode(p,v);return <div className="variant-row" key={v.id}><div><span>{variantLabel(v)}</span><small>الكود: <b>{code}</b> · المتاح: {qty}</small></div><button className="add" disabled={qty<=0||busy} onClick={()=>addToCart(p,v)}><Plus size={16}/> إضافة</button></div>;})}
        </article>)}</div>
        {!products.length&&<div className="empty"><Package size={32}/><b>لا توجد منتجات محفوظة</b><span>اتصل بالإنترنت واضغط مزامنة لتحميل المنتجات أول مرة.</span></div>}
      </section>
      <aside className="cart-panel"><div className="section-head"><div><h2>فاتورة البيع</h2><p>{cart.reduce((n,x)=>n+x.qty,0)} قطعة في الفاتورة</p></div><ShoppingCart/></div>
        <div className="cart-lines">{cart.map(x=><div className="cart-line" key={x.key}><div><b>{x.title}</b><small>{x.label} · {x.code}</small><strong>{money(x.price*x.qty)}</strong></div><div className="qty"><button onClick={()=>changeQty(x.key,-1)}><Minus size={14}/></button><span>{x.qty}</span><button onClick={()=>changeQty(x.key,1)}><Plus size={14}/></button></div></div>)}{!cart.length&&<div className="empty compact">الفاتورة فارغة</div>}</div>
        <div className="checkout"><label>طريقة الدفع<select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">نقدي</option><option value="card">بطاقة</option><option value="wallet">محفظة</option><option value="other">أخرى</option></select></label>
          <div className="total"><span>الإجمالي</span><b>{money(cartTotal)}</b></div><button className="primary wide" disabled={!cart.length||busy} onClick={completeSale}>{busy?'جارٍ الحفظ...':'تأكيد البيع وحفظ الفاتورة'}</button>
          {lastReceipt&&<button className="ghost wide" onClick={()=>window.print()}><Printer size={16}/> طباعة آخر فاتورة ({lastReceipt.receiptNumber})</button>}
        </div>
      </aside>
    </div>:<section className="stock-page"><div className="section-head"><div><h2>المخزون والتوريد</h2><p>تحديث محلي فوري ثم مزامنة مع المتجر عند الاتصال</p></div><Package/></div>
      <form className="restock-form" onSubmit={addStock}><label>المنتج<select required value={restock.productId} onChange={e=>{const p=products.find(x=>String(x.id)===e.target.value);setRestock({productId:e.target.value,variantId:String(p?.variants?.[0]?.id||''),qty:'1'});}}><option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.title} · {p.modelCode}</option>)}</select></label>
        <label>المقاس / اللون<select required value={restock.variantId} onChange={e=>setRestock(x=>({...x,variantId:e.target.value}))}><option value="">اختر الاختيار</option>{(products.find(p=>String(p.id)===restock.productId)?.variants||[]).map(v=><option key={v.id} value={v.id}>{variantLabel(v)} · {variantCode(products.find(p=>String(p.id)===restock.productId),v)}</option>)}</select></label>
        <label>الكمية المضافة<input type="number" min="1" step="1" required value={restock.qty} onChange={e=>setRestock(x=>({...x,qty:e.target.value}))}/></label><button className="primary" disabled={busy}><Plus size={16}/> إضافة للمخزون</button></form>
      <div className="stock-table"><div className="table-row table-head"><span>القطعة</span><span>المقاس / الكود</span><span>الرصيد</span></div>
        {products.flatMap(p=>(p.variants||[]).map(v=><div className="table-row" key={p.id+':'+v.id}><b>{p.title} <small className="model-code">({p.modelCode})</small></b><span>{variantLabel(v)} · {variantCode(p,v)}</span><strong className={Number(stock[String(p.id)+':'+String(v.id)]?.quantity||0)<=3?'low':''}>{Number(stock[String(p.id)+':'+String(v.id)]?.quantity||0)} قطعة</strong></div>))}
      </div>
    </section>}
    {lastReceipt&&<section className="print-receipt" aria-hidden="true">
      <h2>REMONTADA SPORTSWEAR</h2><p>فاتورة بيع المحل</p><hr/>
      <div>رقم الفاتورة: {lastReceipt.receiptNumber}</div><div>التاريخ: {lastReceipt.date}</div><hr/>
      {lastReceipt.items.map((item,i)=><div className="print-item" key={i}><div><b>{item.title}</b><small>{item.label} · {item.code}</small></div><span>{item.qty} × {money(item.price)}</span><strong>{money(item.qty*item.price)}</strong></div>)}
      <hr/><h3>الإجمالي: {money(lastReceipt.total)}</h3><p>شكراً لزيارتكم ❤️</p>
    </section>}
    <footer><span><CheckCircle2 size={15}/> قاعدة بيانات محلية محفوظة على جهاز المحل</span><span>Windows 10 / 11 · {pending} حركة تنتظر المزامنة</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
