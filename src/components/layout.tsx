import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();
  const isSimulationPage = location.pathname.startsWith("/simulations");
  const containerClassName = isSimulationPage
    ? "relative h-screen w-screen overflow-hidden bg-background"
    : "relative min-h-screen w-screen overflow-x-hidden bg-background";
  const mainClassName = isSimulationPage ? "h-full w-full" : "min-h-screen w-full";

  return (
    <div className={containerClassName}>
      {/* Main Content - Full Screen */}
      <main className={mainClassName}>
        <Outlet />
      </main>
    </div>
  );
}
