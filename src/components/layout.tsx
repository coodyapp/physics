import { Outlet, useLocation } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";

export default function Layout() {
  const location = useLocation();
  const isSimulationPage = location.pathname.startsWith("/simulations");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Floating Header - Only show on simulation pages */}
      {isSimulationPage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Header />
          </div>
        </div>
      )}

      {/* Main Content - Full Screen */}
      <main className="h-full w-full">
        <Outlet />
      </main>

      {/* Floating Footer - Only show on simulation pages */}
      {isSimulationPage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}
