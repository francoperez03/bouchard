import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import { DashboardNav } from "./components/DashboardNav";
import { LandingPage } from "./pages/LandingPage";
import { StatusPage } from "./pages/StatusPage";
import { ControlPage } from "./pages/ControlPage";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ConnectionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/status" element={<StatusPage />} />
            <Route path="/control" element={<ControlPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConnectionProvider>
  );
}
