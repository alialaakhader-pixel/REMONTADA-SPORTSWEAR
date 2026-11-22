import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorMessage: string }> {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || "Unknown render error" };
  }

  componentDidCatch(error: Error) {
    console.error("REMONTADA storefront render error:", error);
  }

  resetStorefront = () => {
    try {
      localStorage.removeItem("remontada_sportswear_pro_v5");
      localStorage.removeItem("remontada_sportswear_pro_v6");
      localStorage.removeItem("remontada_supabase_session");
    } finally {
      window.location.replace("/");
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#05050F", color: "#fff", fontFamily: "Cairo, sans-serif", textAlign: "center" }}>
          <section style={{ maxWidth: 420 }}>
            <h1 style={{ color: "#00D4FF", fontSize: 24, fontWeight: 900 }}>REMONTADA SPORTSWEAR</h1>
            <p style={{ margin: "16px 0", lineHeight: 1.9 }}>حصل خطأ أثناء عرض المتجر. بياناتك المحفوظة على قاعدة البيانات لم تُحذف.</p>
            <button onClick={this.resetStorefront} style={{ background: "#00D4FF", color: "#05050F", border: 0, borderRadius: 12, padding: "12px 24px", fontWeight: 900, cursor: "pointer" }}>إصلاح وتشغيل المتجر</button>
            <button onClick={() => window.location.reload()} style={{ display: "block", margin: "12px auto 0", background: "transparent", color: "#fff", border: "1px solid #454550", borderRadius: 12, padding: "10px 20px", cursor: "pointer" }}>إعادة المحاولة فقط</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
