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

// Catch errors outside React rendering (for example, module-level and async failures)
// and show a recovery screen instead of leaving visitors with a blank page.
if (typeof window !== "undefined") {
  const showEmergencyScreen = () => {
    if (document.getElementById("remontada-emergency-screen")) return;
    const panel = document.createElement("div");
    panel.id = "remontada-emergency-screen";
    panel.dir = "rtl";
    panel.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:#05050F;color:#fff;font-family:Cairo,system-ui,sans-serif;text-align:center";
    panel.innerHTML = '<section style="max-width:440px"><h1 style="color:#00D4FF;font-size:24px;font-weight:900">REMONTADA SPORTSWEAR</h1><p style="margin:16px 0;line-height:1.9">حصل خطأ أثناء تشغيل المتجر. بيانات المنتجات والطلبات المحفوظة على قاعدة البيانات لم تُحذف.</p><button id="remontada-retry" style="background:#00D4FF;color:#05050F;border:0;border-radius:12px;padding:12px 24px;font-weight:900">إعادة تشغيل المتجر</button><button id="remontada-reset" style="display:block;margin:12px auto 0;background:transparent;color:#fff;border:1px solid #454550;border-radius:12px;padding:10px 20px">إصلاح بيانات العرض المحلية</button></section>';
    document.body.appendChild(panel);
    panel.querySelector("#remontada-retry")?.addEventListener("click", () => window.location.reload());
    panel.querySelector("#remontada-reset")?.addEventListener("click", () => {
      try {
        localStorage.removeItem("remontada_sportswear_pro_v5");
        localStorage.removeItem("remontada_sportswear_pro_v6");
      } finally {
        window.location.replace("/");
      }
    });
  };
  window.addEventListener("error", (event) => {
    console.error("REMONTADA uncaught browser error:", event.error || event.message);
    showEmergencyScreen();
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("REMONTADA unhandled promise rejection:", event.reason);
    showEmergencyScreen();
  });
}
