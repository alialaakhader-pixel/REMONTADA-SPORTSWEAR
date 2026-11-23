import React from 'react';
import { createRoot } from 'react-dom/client';
import TabletPos from './pos/TabletPos';

const REPO = 'alialaakhader-pixel/REMONTADA-SPORTSWEAR';
const APP_VERSION = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || '1.0.0';

function compareVersions(a, b) {
  const aa = String(a).split('.').map(Number);
  const bb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    const x = aa[i] || 0, y = bb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function UpdateNotice() {
  const [release, setRelease] = React.useState(null);
  const [checking, setChecking] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [error, setError] = React.useState('');

  const check = React.useCallback(async () => {
    if (!navigator.onLine) return;
    setChecking(true);
    setError('');
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('تعذر فحص التحديثات الآن');
      const releases = await response.json();
      const latest = releases.find(item =>
        !item.draft && !item.prerelease &&
        String(item.tag_name || '').startsWith('pos-android-') &&
        Array.isArray(item.assets) &&
        item.assets.some(asset => asset.name === 'REMONTADA-POS-Android.apk')
      );
      if (latest) {
        const version = String(latest.tag_name).replace('pos-android-v', '');
        if (compareVersions(version, APP_VERSION) > 0) {
          const apk = latest.assets.find(asset => asset.name === 'REMONTADA-POS-Android.apk');
          setRelease({ version, url: apk.browser_download_url, notes: latest.body || '' });
          setDismissed(false);
        } else {
          setRelease(null);
        }
      }
    } catch (e) {
      setError(e?.message || 'تعذر فحص التحديثات');
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    check();
    const onOnline = () => check();
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(check, 6 * 60 * 60 * 1000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
  }, [check]);

  if (!release || dismissed) return null;
  return <div dir="rtl" role="dialog" aria-live="polite" style={{position:'fixed',inset:0,zIndex:99999,display:'grid',placeItems:'center',padding:20,background:'rgba(2,6,23,.78)',backdropFilter:'blur(8px)',fontFamily:'Cairo,sans-serif'}}>
    <section style={{width:'min(100%,420px)',background:'#101827',color:'#fff',border:'1px solid #2c405b',borderRadius:22,padding:22,boxShadow:'0 24px 80px #0008'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{width:46,height:46,borderRadius:14,display:'grid',placeItems:'center',background:'#0d9488',fontSize:23}}>↻</div>
        <div><b style={{fontSize:19}}>تحديث جديد متاح</b><div style={{color:'#9fb1c8',fontSize:13}}>REMONTADA POS · الإصدار {release.version}</div></div>
      </div>
      <p style={{color:'#cbd5e1',lineHeight:1.8,fontSize:14}}>يوجد إصدار أحدث من برنامج الكاشير. نزّل التحديث وثبّته للمتابعة بأحدث المزايا.</p>
      <a href={release.url} target="_blank" rel="noreferrer" onClick={() => setDismissed(true)} style={{display:'block',textAlign:'center',textDecoration:'none',background:'#0d9488',color:'#fff',fontWeight:800,padding:'13px 16px',borderRadius:12,marginTop:18}}>تنزيل التحديث الآن</a>
      <button onClick={() => setDismissed(true)} style={{width:'100%',marginTop:10,padding:11,border:0,borderRadius:12,background:'#243247',color:'#e2e8f0',fontFamily:'inherit'}}>لاحقًا</button>
      <small style={{display:'block',color:'#91a4bc',lineHeight:1.7,marginTop:12}}>بعد التنزيل، افتح ملف APK ووافق على تثبيته عندما يطلب Android ذلك. لن تُحذف بيانات التطبيق عند التحديث المتوافق بالتوقيع نفسه.</small>
    </section>
  </div>;
}

class MobileErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(this.state.failed)return <main dir="rtl" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#090b12',color:'#fff',fontFamily:'Cairo,sans-serif',textAlign:'center'}}><section><h2>REMONTADA POS</h2><p>حدث خطأ أثناء تشغيل الكاشير.</p><button onClick={()=>location.reload()}>إعادة التشغيل</button></section></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><MobileErrorBoundary><><TabletPos /><UpdateNotice /></></MobileErrorBoundary></React.StrictMode>);
