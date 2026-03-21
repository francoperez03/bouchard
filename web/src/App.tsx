import { BrowserRouter, Routes, Route, NavLink, Outlet } from "react-router-dom";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import { ConnectionIndicator } from "./components/ConnectionIndicator";
import { LandingPage } from "./pages/LandingPage";
import { StatusPage } from "./pages/StatusPage";
import { ControlPage } from "./pages/ControlPage";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? "#e2e8f0" : "#64748b",
  textDecoration: "none",
  padding: "8px 16px",
  borderRadius: 6,
  background: isActive ? "#334155" : "transparent",
  fontSize: 14,
  transition: "all 0.15s",
});

function DashboardLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      <nav
        style={{
          width: 200,
          padding: 16,
          background: "#1e293b",
          borderRight: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <a href="/" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, padding: "8px 16px", color: "#e2e8f0", textDecoration: "none" }}>
          Bouchard
        </a>
        <NavLink to="/status" style={navLinkStyle}>Status</NavLink>
        <NavLink to="/control" style={navLinkStyle}>Control</NavLink>
        <div style={{ marginTop: "auto" }}>
          <ConnectionIndicator />
        </div>
      </nav>
      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
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
