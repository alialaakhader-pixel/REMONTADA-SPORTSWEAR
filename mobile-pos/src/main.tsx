import React from 'react';
import { createRoot } from 'react-dom/client';
import TabletPos from './pos/TabletPos';

class MobileErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(this.state.failed)return <main dir="rtl" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#090b12',color:'#fff',fontFamily:'Cairo,sans-serif',textAlign:'center'}}><section><h2>REMONTADA POS</h2><p>حدث خطأ أثناء تشغيل الكاشير.</p><button onClick={()=>location.reload()}>إعادة التشغيل</button></section></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><MobileErrorBoundary><TabletPos /></MobileErrorBoundary></React.StrictMode>);