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


function DesktopUpdateNotice() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!desktop || desktop.platform !== 'win32') return;
    let active = true;
    const unsubscribe = desktop.onUpdateStatus?.(next => {
      if (active) { setStatus(next); setDismissed(false); }
    });
    desktop.checkForUpdates?.().then(result => {
      if (active && result?.state === 'error') setStatus(result);
    }).catch(error => {
      if (active) setStatus({ state: 'error', message: String(error?.message || error) });
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  if (!desktop || desktop.platform !== 'win32' || !status || status.state === 'current' || status.state === 'checking' || status.state === 'unsupported' || dismissed) return null;
  const ready = status.state === 'downloaded';
  const failed = status.state === 'error';
  return <div role="status" style={{position:'fixed',zIndex:9999,bottom:18,left:18,right:18,maxWidth:520,margin:'0 auto',padding:'14px 16px',borderRadius:14,background:'#10243b',color:'#fff',boxShadow:'0 8px 32px #0005',border:'1px solid #2c5878',display:'flex',alignItems:'center',gap:12}}>
    <div style={{flex:1,minWidth:0}}>
      <b style={{display:'block',marginBottom:4}}>{ready?'التحديث جاهز للتثبيت':failed?'تعذر التحديث':'تحديث REMONTADA POS'}</b>
      <span style={{fontSize:13,opacity:.9}}>{status.message || 'جارٍ تجهيز التحديث...'}</span>
      {status.state === 'downloading' && <div style={{height:5,background:'#34516b',borderRadius:8,marginTop:9,overflow:'hidden'}}><div style={{height:'100%',width:Math.max(0,Math.min(100,Number(status.percent)||0))+'%',background:'#39c6a3'}}/></div>}
      {status.state === 'available' && <span style={{display:'block',fontSize:12,marginTop:4}}>الإصدار {status.version || ''}</span>}
    </div>
    {ready && <button onClick={()=>desktop.installUpdate()} style={{border:0,borderRadius:9,padding:'9px 12px',background:'#27b68b',color:'#06251d',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>إعادة التشغيل والتحديث</button>}
    <button aria-label="إغلاق" onClick={()=>setDismissed(true)} style={{border:0,background:'transparent',color:'#fff',fontSize:22,cursor:'pointer'}}>×</button>
  </div>;
}

function App() {
  const [session,setSession]=useState(null), [authorized,setAuthorized]=useState(false), [offlineMode,setOfflineMode]=useState(false);
  const [email,setEmail]=useState(''), [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [products,setProducts]=useState([]), [stock,setStock]=useState({});
  const [cart,setCart]=useState([]), [query,setQuery]=useState(''), [payment,setPayment]=useState('cash'), [tab,setTab]=useState('sale');
  const [lastReceipt,setLastReceipt]=useState(null), [restock,setRestock]=useState({productId:'',variantId:'',qty:'1'}), [pending,setPending]=useState(0);
  const [manageOpen,setManageOpen]=useState(false), [editingId,setEditingId]=useState('');
  const [productForm,setProductForm]=useState({title:'',modelCode:'',basePrice:'',variants:'S,أسود,0\nM,أسود,0\nL,أسود,0'});
  const [adjust,setAdjust]=useState({productId:'',variantId:'',delta:'',note:'جرد فعلي'});
  const [returnForm,setReturnForm]=useState({saleId:'',itemIndex:'0',quantity:'1',refund:'',reason:'استرجاع',restock:true});
  const [expenseForm,setExpenseForm]=useState({title:'',amount:'',category:'عام',note:''});
  const [sales,setSales]=useState([]),[returns,setReturns]=useState([]),[expenses,setExpenses]=useState([]);
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
    setProducts(s.products||[]); setStock(s.stock||{}); setPending(s.pending||0); setSales(s.sales||[]);setReturns(s.returns||[]);setExpenses(s.expenses||[]);
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
        if(onlineError?.status && onlineError.status < 500) throw onlineError;
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
    if(!activeSession && navigator.onLine) {
      const local=await desktop?.init(); applySnapshot(local);
      setMessage('لإرسال المبيعات والتوريدات للموقع، اضغط تسجيل الدخول للمزامنة وأدخل حساب الإدارة.');
      return false;
    }
    if(!navigator.onLine) {
      const local=await desktop?.init(); applySnapshot(local);
      setMessage('أنت تعمل دون إنترنت. المبيعات محفوظة على جهاز المحل وستتزامن عند عودة الاتصال.');
      return false;
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
        const variants=[];
        const assignedCodes=new Set();
        for(const v of p.variants||[]) {
          const color=String(v.colorName||'').trim();
          const modelKey=String(p.id)+'::color::'+(color?color.toLocaleLowerCase('ar-EG'):'default');
          const {data:assignedCode,error:codeError}=await supabase.rpc('inventory_assign_model_code',{
            p_product_id:modelKey,p_product_title:(p.title||'منتج')+(color?' - '+color:'')
          });
          if(codeError) throw codeError;
          const modelCode=String(assignedCode);
          assignedCodes.add(modelCode);
          const code=String(modelCode+(v.size?'-'+v.size:''));
          const {error}=await supabase.rpc('inventory_initialize_stock',{
            p_product_id:String(p.id),p_variant_id:String(v.id),p_product_title:p.title||'منتج',
            p_variant_label:variantLabel(v),p_sku:code,p_initial_quantity:Math.max(0,Number(v.stockQty||0))
          });
          if(error) throw error;
          variants.push({...v,modelCode,sku:code,variantCode:code});
        }
        const productModelCode=assignedCodes.size===1?[...assignedCodes][0]:'';
        enriched.push({...p,modelCode:productModelCode,variants});
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
        const inventoryReady=await refreshData(session);
        if(!inventoryReady) throw new Error('تعذر تحديث المخزون المركزي. لم يتم تسجيل البيع؛ أعد المزامنة أولاً.');
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

  function openProductEditor(p) {
    setEditingId(p?.id||'');
    setProductForm(p?{title:p.title,modelCode:p.modelCode||'',basePrice:String(p.basePrice||0),variants:(p.variants||[]).map(v=>[v.size||'',v.colorName||'',v.stockQty||0].join(',')).join('\n')}:{title:'',modelCode:'',basePrice:'',variants:'S,أسود,0\nM,أسود,0\nL,أسود,0'});
    setManageOpen(true);
  }
  async function saveProduct(e) {
    e.preventDefault();
    const p=products.find(x=>x.id===editingId);
    const variants=productForm.variants.split(/\r?\n/).filter(Boolean).map((line,i)=>{const [size='',colorName='',qty='0']=line.split(',').map(x=>x.trim());return {...(p?.variants?.[i]||{}),id:p?.variants?.[i]?.id||id(),size,colorName,stockQty:Math.max(0,Number(qty)||0),variantCode:productForm.modelCode+(size?'-'+size:'')};});
    try {
      const productPayload={...(p||{}),id:editingId||id(),title:productForm.title,modelCode:productForm.modelCode,basePrice:Number(productForm.basePrice),brand:p?.brand||'REMONTADA',sportId:p?.sportId||'sport-apparel',gender:p?.gender||'unisex',description:p?.description||'',images:p?.images||[],isActive:p?.isActive??true,variants};
      const snap=await desktop.saveProduct(productPayload);
      applySnapshot(snap);setManageOpen(false);
      if(session&&navigator.onLine){const ok=await syncPending(session);if(ok){await refreshData(session);setMessage('تم حفظ المنتج ومزامنته مع الموقع.');}else setMessage('تم حفظ المنتج محليًا، والمزامنة معلقة لحين حل التعارض.');}
      else setMessage('تم حفظ المنتج محليًا وسيظهر على الموقع بعد عودة الإنترنت والمزامنة.');
    } catch(err){setMessage(err.message||'تعذر حفظ المنتج');}
  }
  async function adjustStockNow(e) {
    e.preventDefault();
    const p=products.find(x=>String(x.id)===adjust.productId),v=p?.variants?.find(x=>String(x.id)===adjust.variantId);
    if(!p||!v)return setMessage('اختر المنتج والمقاس أولاً.');
    try {
      const snap=await desktop.adjustStock({event_id:id(),movement_id:id(),product_id:adjust.productId,variant_id:adjust.variantId,quantity_delta:Number(adjust.delta),note:adjust.note});
      applySnapshot(snap);
      if(session&&navigator.onLine){const ok=await syncPending(session);if(ok){await refreshData(session);setMessage('تم تسجيل الجرد وتحديث رصيد الموقع.');}else setMessage('تم حفظ الجرد محليًا والمزامنة معلقة.');}
      else setMessage('تم حفظ تسوية الجرد محليًا وستُزامن عند عودة الإنترنت.');
    } catch(err){setMessage(err.message||'تعذر تعديل الجرد');}
  }
  async function recordReturn(e) {
    e.preventDefault();
    const sale=sales.find(x=>x.sale_id===returnForm.saleId), item=sale?.items?.[Number(returnForm.itemIndex)];
    if(!item)return setMessage('اختر فاتورة وصنفًا للمرتجع.');
    try {
      const snap=await desktop.returnSaleItem({event_id:id(),return_id:id(),sale_id:sale.sale_id,product_id:item.product_id,variant_id:item.variant_id,product_title:item.product_title,variant_label:item.variant_label,quantity:Number(returnForm.quantity),refund_amount:Number(returnForm.refund||item.unit_price*Number(returnForm.quantity)),reason:returnForm.reason,restock:returnForm.restock});
      applySnapshot(snap);
      if(session&&navigator.onLine){const ok=await syncPending(session);if(ok){await refreshData(session);setMessage('تم تسجيل المرتجع وتحديث المخزون المركزي.');}else setMessage('تم تسجيل المرتجع محليًا والمزامنة معلقة.');}
      else setMessage('تم تسجيل المرتجع محليًا وسيُزامن عند عودة الإنترنت.');
    } catch(err){setMessage(err.message||'تعذر تسجيل المرتجع');}
  }
  async function recordExpense(e) {
    e.preventDefault();
    try {
      const snap=await desktop.addExpense({event_id:id(),expense_id:id(),...expenseForm,amount:Number(expenseForm.amount)});applySnapshot(snap);
      if(session&&navigator.onLine){const ok=await syncPending(session);setMessage(ok?'تم حفظ المصروف ومزامنته مع التقارير المركزية.':'تم حفظ المصروف محليًا والمزامنة معلقة.');}
      else setMessage('تم حفظ المصروف محليًا وسيُزامن عند عودة الإنترنت.');
      setExpenseForm({title:'',amount:'',category:'عام',note:''});
    } catch(err){setMessage(err.message||'تعذر حفظ المصروف');}
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

  return <div className="app-shell"><DesktopUpdateNotice/>
    <header className="topbar"><div className="brand"><div className="brand-mark small">R</div><div><b>REMONTADA <span>POS</span></b><small>نظام البيع والمخزون المحلي والمركزي</small></div></div>
      <div className="top-actions"><span className={online?'online':'offline'}>{online?<Wifi size={15}/>:<WifiOff size={15}/>} {online?'متصل بالإنترنت':'وضع عدم الاتصال'}</span>
      <span className="queue-count"><CloudUpload size={15}/> حركات معلقة: {pending}</span>
      {!session&&online&&<button className="primary" onClick={()=>setAuthorized(false)}>تسجيل الدخول للمزامنة</button>}
      <button className="ghost" onClick={()=>refreshData()} disabled={busy}><RefreshCw size={16}/> مزامنة</button><button className="ghost" onClick={logout}><LogOut size={16}/> خروج</button></div>
    </header>
    <div className="tabs"><button className={tab==='sale'?'active':''} onClick={()=>setTab('sale')}><ShoppingCart size={17}/> الكاشير</button><button className={tab==='stock'?'active':''} onClick={()=>setTab('stock')}><Boxes size={17}/> المنتجات والجرد</button><button className={tab==='returns'?'active':''} onClick={()=>setTab('returns')}>المرتجعات</button><button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}>المصروفات والتقارير</button></div>
    {message&&<div className="notice-bar"><AlertCircle size={17}/>{message}<button onClick={()=>setMessage('')}>×</button></div>}
    {tab==='sale'?<div className="workspace">
      <section className="catalog"><div className="section-head"><div><h2>المنتجات</h2><p>ابحث باسم القطعة أو رقم الموديل أو كود المقاس</p></div><span className="count">{products.length} منتج</span></div>
        <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){const q=query.trim().toLowerCase();const hits=products.flatMap(p=>(p.variants||[]).map(v=>({p,v})).filter(({p,v})=>[variantCode(p,v),p.modelCode,v.sku].some(x=>String(x||'').toLowerCase()===q)));if(hits.length===1){addToCart(hits[0].p,hits[0].v);setQuery('');}else if(hits.length>1)setMessage('الكود يطابق أكثر من اختيار، استخدم كود المقاس الكامل.');else if(q)setMessage('لم يتم العثور على كود مطابق.');}}} placeholder="اسم القطعة أو الكود مثل 102-L"/></div>
        <div className="product-grid">{visibleProducts.map(p=><article className="product-card" key={p.id}><div className="product-info"><div><b>{p.title}</b><small className="model-code">كود الموديل: {p.modelCode||'حسب اللون / النوع'}</small></div><strong>{money(p.basePrice)}</strong></div>
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
    </div>:tab==='stock'?<section className="stock-page"><div className="section-head"><div><h2>إدارة المنتجات والجرد</h2><p>إضافة وتعديل المنتجات والأسعار والجرد محليًا</p></div><button className="primary" onClick={()=>openProductEditor()}><Plus size={16}/> إضافة منتج</button></div>
      <form className="restock-form" onSubmit={addStock}><label>المنتج<select required value={restock.productId} onChange={e=>{const p=products.find(x=>String(x.id)===e.target.value);setRestock({productId:e.target.value,variantId:String(p?.variants?.[0]?.id||''),qty:'1'});}}><option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.title} · {p.modelCode}</option>)}</select></label>
        <label>المقاس / اللون<select required value={restock.variantId} onChange={e=>setRestock(x=>({...x,variantId:e.target.value}))}><option value="">اختر الاختيار</option>{(products.find(p=>String(p.id)===restock.productId)?.variants||[]).map(v=><option key={v.id} value={v.id}>{variantLabel(v)} · {variantCode(products.find(p=>String(p.id)===restock.productId),v)}</option>)}</select></label>
        <label>الكمية المضافة<input type="number" min="1" step="1" required value={restock.qty} onChange={e=>setRestock(x=>({...x,qty:e.target.value}))}/></label><button className="primary" disabled={busy}><Plus size={16}/> إضافة للمخزون</button></form>
      <form className="restock-form" onSubmit={adjustStockNow}>
        <label>تسوية الجرد — المنتج<select required value={adjust.productId} onChange={e=>{const p=products.find(x=>String(x.id)===e.target.value);setAdjust(x=>({...x,productId:e.target.value,variantId:String(p?.variants?.[0]?.id||'')}));}}><option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>المقاس / اللون<select required value={adjust.variantId} onChange={e=>setAdjust(x=>({...x,variantId:e.target.value}))}><option value="">اختر الاختيار</option>{(products.find(p=>String(p.id)===adjust.productId)?.variants||[]).map(v=><option key={v.id} value={v.id}>{variantLabel(v)} · {variantCode(products.find(p=>String(p.id)===adjust.productId),v)}</option>)}</select></label>
        <label>فرق الكمية (+ زيادة / - نقص)<input type="number" step="1" required value={adjust.delta} onChange={e=>setAdjust(x=>({...x,delta:e.target.value}))} placeholder="مثال: -2 أو 5"/></label>
        <label>ملاحظة<input value={adjust.note} onChange={e=>setAdjust(x=>({...x,note:e.target.value}))}/></label>
        <button className="primary" disabled={busy}>حفظ تسوية الجرد</button>
      </form>
      <div className="stock-table"><div className="table-row table-head"><span>القطعة</span><span>المقاس / الكود</span><span>الرصيد / تعديل</span></div>
        {products.flatMap(p=>(p.variants||[]).map(v=><div className="table-row" key={p.id+':'+v.id}><b>{p.title} <small className="model-code">({p.modelCode})</small></b><span>{variantLabel(v)} · {variantCode(p,v)}</span><strong className={Number(stock[String(p.id)+':'+String(v.id)]?.quantity||0)<=3?'low':''}>{Number(stock[String(p.id)+':'+String(v.id)]?.quantity||0)} قطعة</strong><button className="ghost" onClick={()=>openProductEditor(p)}>تعديل</button></div>))}
      </div>
    </section>:null}
    {tab==='returns'&&<section className="stock-page"><div className="section-head"><div><h2>المرتجعات</h2><p>المرتجع لا يتجاوز الكمية المباعة المتبقية من الفاتورة</p></div></div><form className="restock-form" onSubmit={recordReturn}><label>الفاتورة<select required value={returnForm.saleId} onChange={e=>setReturnForm(x=>({...x,saleId:e.target.value,itemIndex:'0'}))}><option value="">اختر فاتورة</option>{sales.map(s=><option key={s.sale_id} value={s.sale_id}>{s.receipt_number} — {new Date(s.created_at).toLocaleString('ar-EG')}</option>)}</select></label><label>الصنف<select required value={returnForm.itemIndex} onChange={e=>setReturnForm(x=>({...x,itemIndex:e.target.value}))}>{(sales.find(s=>s.sale_id===returnForm.saleId)?.items||[]).map((it,i)=><option key={i} value={i}>{it.product_title} · {it.variant_label} · الكمية {it.quantity}</option>)}</select></label><label>كمية المرتجع<input type="number" min="1" required value={returnForm.quantity} onChange={e=>setReturnForm(x=>({...x,quantity:e.target.value}))}/></label><label>قيمة المبلغ المسترد<input type="number" min="0" step="0.01" value={returnForm.refund} onChange={e=>setReturnForm(x=>({...x,refund:e.target.value}))}/></label><label>السبب<input value={returnForm.reason} onChange={e=>setReturnForm(x=>({...x,reason:e.target.value}))}/></label><label><input type="checkbox" checked={returnForm.restock} onChange={e=>setReturnForm(x=>({...x,restock:e.target.checked}))}/> القطعة صالحة للبيع وإرجاعها للمخزون</label><button className="primary">تسجيل المرتجع</button></form><div className="stock-table">{returns.map(r=><div className="table-row" key={r.return_id}><b>{r.product_title}</b><span>{r.variant_label} × {r.quantity}</span><strong>{money(r.refund_amount)}</strong></div>)}</div></section>}
    {tab==='reports'&&<section className="stock-page"><div className="section-head"><div><h2>المصروفات وسجل المبيعات</h2><p>ملخص محفوظ محليًا على جهاز المحل</p></div></div><form className="restock-form" onSubmit={recordExpense}><label>اسم المصروف<input required value={expenseForm.title} onChange={e=>setExpenseForm(x=>({...x,title:e.target.value}))}/></label><label>القيمة بالجنيه<input type="number" min="0.01" step="0.01" required value={expenseForm.amount} onChange={e=>setExpenseForm(x=>({...x,amount:e.target.value}))}/></label><label>التصنيف<input value={expenseForm.category} onChange={e=>setExpenseForm(x=>({...x,category:e.target.value}))}/></label><label>ملاحظة<input value={expenseForm.note} onChange={e=>setExpenseForm(x=>({...x,note:e.target.value}))}/></label><button className="primary">حفظ المصروف</button></form><div className="stock-table"><div className="table-row table-head"><span>المبيعات</span><span>المصروفات</span><span>صافي تقريبي</span></div><div className="table-row"><b>{money(sales.reduce((n,s)=>n+Number(s.total||0),0))}</b><b>{money(expenses.reduce((n,x)=>n+Number(x.amount||0),0))}</b><strong>{money(sales.reduce((n,s)=>n+Number(s.total||0),0)-expenses.reduce((n,x)=>n+Number(x.amount||0),0))}</strong></div>{sales.map(s=><div className="table-row" key={s.sale_id}><b>فاتورة {s.receipt_number}</b><span>{new Date(s.created_at).toLocaleString('ar-EG')}</span><strong>{money(s.total)}</strong></div>)}</div></section>}
    {manageOpen&&<div className="modal-backdrop"><form className="login-card manage-card" onSubmit={saveProduct}><div className="section-head"><h2>{editingId?'تعديل المنتج':'إضافة منتج جديد'}</h2><button type="button" className="ghost" onClick={()=>setManageOpen(false)}>إغلاق</button></div><label>اسم المنتج<input required value={productForm.title} onChange={e=>setProductForm(x=>({...x,title:e.target.value}))}/></label><label>كود الموديل<input required value={productForm.modelCode} onChange={e=>setProductForm(x=>({...x,modelCode:e.target.value}))}/></label><label>سعر البيع (ج.م)<input type="number" min="0" step="0.01" required value={productForm.basePrice} onChange={e=>setProductForm(x=>({...x,basePrice:e.target.value}))}/></label><label>المقاسات والألوان والكميات — سطر لكل اختيار: مقاس,لون,كمية<textarea rows="5" value={productForm.variants} onChange={e=>setProductForm(x=>({...x,variants:e.target.value}))}/></label><button className="primary wide">حفظ المنتج</button></form></div>}
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
