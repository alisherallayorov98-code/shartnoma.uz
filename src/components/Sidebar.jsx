// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const menuItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/create", icon: "➕", label: "Yangi shartnoma" },
  { path: "/archive", icon: "📁", label: "Arxiv" },
  { path: "/drafts", icon: "⏳", label: "Qoralamalar", badge: true },
  { path: "/counterparties", icon: "👥", label: "Kontragentlar" },
];

const settingsItems = [
  { path: "/settings", icon: "🏢", label: "Rekvizitlar" },
  { path: "/settings?tab=templates", icon: "📋", label: "Shablonlarim" },
  { path: "/settings?tab=payments", icon: "💳", label: "To'lovlar" },
];

export default function Sidebar({ draftsCount = 0 }) {
  const { pathname } = useLocation();
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const usedPct = userProfile ? Math.round((userProfile.contractsUsed / userProfile.contractsLimit) * 100) : 0;
  const isPro = userProfile?.plan === "pro";

  async function handleLogout() {
    await logout();
    navigate("/");
    toast.success("Chiqildi");
  }

  return (
    <aside style={{
      width: 260, background: "rgba(255,255,255,0.03)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      padding: "28px 16px", flexShrink: 0,
      position: "fixed", top: 0, left: 0, bottom: 0,
      display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 50
    }}>
      {/* Logo */}
      <div style={{ padding: "0 12px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Shartnoma.uz
        </div>
        <div style={{ fontSize: 12, color: "rgba(240,237,255,0.4)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userProfile?.companyName || userProfile?.fullName || userProfile?.email}
        </div>
      </div>

      {/* Main menu */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,237,255,0.35)", padding: "0 12px", marginBottom: 8 }}>Asosiy</div>
      {menuItems.map(item => (
        <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
            borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 2, cursor: "pointer",
            color: pathname === item.path ? "#F0EDFF" : "rgba(240,237,255,0.55)",
            background: pathname === item.path ? "rgba(108,58,232,0.2)" : "transparent",
            border: pathname === item.path ? "1px solid rgba(108,58,232,0.3)" : "1px solid transparent",
            transition: "all 0.2s"
          }}>
            <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && draftsCount > 0 && (
              <span style={{ background: "#6C3AE8", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{draftsCount}</span>
            )}
          </div>
        </Link>
      ))}

      {/* Settings menu */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,237,255,0.35)", padding: "0 12px", margin: "20px 0 8px" }}>Sozlamalar</div>
      {settingsItems.map(item => (
        <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
            borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 2, cursor: "pointer",
            color: pathname === item.path ? "#F0EDFF" : "rgba(240,237,255,0.55)",
            background: pathname === item.path ? "rgba(108,58,232,0.2)" : "transparent",
            border: "1px solid transparent", transition: "all 0.2s"
          }}>
            <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </div>
        </Link>
      ))}

      {userProfile?.isAdmin && (
        <Link to="/admin" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 2, color: "#F59E0B", border: "1px solid transparent", transition: "all 0.2s" }}>
            <span>⚙️</span> Admin panel
          </div>
        </Link>
      )}

      {/* Free plan indicator */}
      {!isPro && (
        <div style={{ marginTop: "auto", padding: 16, background: "rgba(108,58,232,0.15)", border: "1px solid rgba(108,58,232,0.3)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#C4AAFF", marginBottom: 8 }}>
            Bepul limit {userProfile?.contractsUsed >= 8 && "⚠️"}
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6, marginBottom: 8 }}>
            <div style={{ width: `${Math.min(usedPct, 100)}%`, height: "100%", background: usedPct >= 80 ? "#F59E0B" : "linear-gradient(90deg,#6C3AE8,#00D4AA)", borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(240,237,255,0.5)", marginBottom: 12 }}>
            {userProfile?.contractsUsed}/{userProfile?.contractsLimit} ishlatildi
          </div>
          {userProfile?.contractsUsed >= 8 && (
            <div style={{ fontSize: 11, color: "#F59E0B", marginBottom: 10 }}>
              ⚠️ Limitdan {userProfile?.contractsLimit - userProfile?.contractsUsed} ta qoldi!
            </div>
          )}
          <Link to="/settings?tab=payments" style={{ textDecoration: "none" }}>
            <div style={{ padding: "9px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "white" }}>
              Pro ga o'tish →
            </div>
          </Link>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout} style={{ marginTop: isPro ? "auto" : 12, padding: "10px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(240,237,255,0.4)", fontFamily: "inherit", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        🚪 Chiqish
      </button>
    </aside>
  );
}
