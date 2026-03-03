// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
      toast.success("Xush kelibsiz!");
    } catch (err) {
      toast.error("Email yoki parol noto'g'ri");
    }
    setLoading(false);
  }

  async function handleReset() {
    if (!email) return toast.error("Email kiriting");
    try {
      await resetPassword(email);
      toast.success("Parol tiklash linki yuborildi!");
      setShowReset(false);
    } catch {
      toast.error("Email topilmadi");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1a0533,#0d1f3c,#001f1a)" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#6C3AE8", filter: "blur(80px)", opacity: 0.2, top: -100, right: -100 }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#00D4AA", filter: "blur(80px)", opacity: 0.15, bottom: -100, left: -100 }} />

      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 48, width: "100%", maxWidth: 440, position: "relative", zIndex: 2, backdropFilter: "blur(20px)" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
          Shartnoma.uz
        </div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Xush kelibsiz! 👋</h2>
        <p style={{ fontSize: 14, color: "rgba(240,237,255,0.55)", marginBottom: 36 }}>Hisobingizga kiring</p>

        {!showReset ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@kompaniya.uz" required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Parol</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="button" onClick={() => setShowReset(true)} style={{ background: "none", border: "none", color: "#2B8EF0", fontSize: 13, cursor: "pointer", marginBottom: 24, fontFamily: "inherit" }}>
              Parolni unutdingizmi?
            </button>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 16, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Kirilmoqda..." : "Kirish →"}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: "rgba(240,237,255,0.55)", marginBottom: 20 }}>Email manzilingizni kiriting, parol tiklash havolasi yuboramiz.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@kompaniya.uz" style={{ marginBottom: 16 }} />
            <button onClick={handleReset} style={{ width: "100%", padding: 16, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
              Havolani yuborish
            </button>
            <button onClick={() => setShowReset(false)} style={{ width: "100%", padding: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#F0EDFF", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
              Orqaga
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 24 }}>
          Hisob yo'qmi? <Link to="/register" style={{ color: "#2B8EF0", textDecoration: "none", fontWeight: 600 }}>Ro'yxatdan o'ting →</Link>
        </p>
      </div>
    </div>
  );
}
