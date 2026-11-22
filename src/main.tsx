import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("REMONTADA storefront render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#05050F", color: "#fff", fontFamily: "Cairo, sans-serif", textAlign: "center" }}>
          <section style={{ maxWidth: 420 }}>
            <h1 style={{ color: "#00D4FF", fontSize: 24, fontWeight: 900 }}>REMONTADA SPORTSWEAR</h1>
            <p style={{ margin: "16px 0", lineHeight: 1.9 }}>حصل خطأ أثناء تحميل المتجر. بياناتك لم تُحذف. أعد تحميل الصفحة للمحاولة مرة أخرى.</p>
            <button onClick={() => window.location.reload()} style={{ background: "#00D4FF", color: "#05050F", border: 0, borderRadius: 12, padding: "12px 24px", fontWeight: 900, cursor: "pointer" }}>إعادة تحميل المتجر</button>
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
