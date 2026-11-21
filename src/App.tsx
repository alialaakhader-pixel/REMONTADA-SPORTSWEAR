import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Check } from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import { Header, Footer, SideRail } from "./components/Chrome";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductPage from "./pages/Product";
import { Cart, Checkout } from "./pages/CartCheckout";
import { About, Journal, Contact, Faq, Returns, Account, Wishlist } from "./pages/Misc";
import Admin from "./pages/Admin";

function Router() {
  const { route, go } = useStore();
  const path = route.split("?")[0];

  let page: React.ReactNode;
  if (path === "/admin") page = <Admin />;\n  else if (path === "/" || path === "") page = <Home />;
  else if (path === "/shop") page = <Shop />;
  else if (path.startsWith("/product/")) page = <ProductPage id={path.replace("/product/", "")} />;
  else if (path === "/cart") page = <Cart />;
  else if (path === "/checkout") page = <Checkout />;
  else if (path === "/about") page = <About />;
  else if (path.startsWith("/journal")) page = <Journal id={path.replace("/journal/", "") || undefined} />;
  else if (path === "/contact") page = <Contact />;
  else if (path === "/faq") page = <Faq />;
  else if (path === "/returns") page = <Returns />;
  else if (path === "/account") page = <Account />;
  else if (path === "/wishlist") page = <Wishlist />;
  else
    page = (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 pt-32 pb-24 text-center">
        <div>
          <span className="tech text-sm tracking-[0.4em] text-fire">404</span>
          <h1 className="display mt-4 text-5xl text-paper">الصفحة غير موجودة</h1>
          <p className="mt-4 text-mute">ربما تغيّر الرابط — عد إلى الصفحة الرئيسية.</p>
          <button
            onClick={() => go("/")}
            className="mt-7 bg-fire px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-flame"
          >
            الصفحة الرئيسية
          </button>
        </div>
      </div>
    );

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={path}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {page}
      </motion.main>
    </AnimatePresence>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-[90] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex w-[320px] max-w-[calc(100vw-3rem)] items-start gap-3 border border-hair bg-panel/95 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,.9)] backdrop-blur"
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fire">
              <Check size={15} className="text-white" />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-bold text-paper">{t.title}</span>
              {t.body && <span className="mt-0.5 block text-[12.5px] text-mute">{t.body}</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen bg-ink">
          <SideRail />
          <Header />
          <div className="2xl:pl-11">
            <Router />
            <Footer />
          </div>
          <Toasts />
        </div>
      </MotionConfig>
    </StoreProvider>
  );
}
