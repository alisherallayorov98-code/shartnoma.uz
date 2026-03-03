// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MONTHS = ["Yan","Feb","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, counterparties: 0, drafts: 0 });
  const [chartData, setChartData] = useState([]);
  const [news] = useState([
    { text: "Xalqaro shartnomalar uchun Ingliz tili qo'shildi!", date: "03.03.2025" },
    { text: "Ijara shartnomasi shabloni yangilandi", date: "25.02.2025" },
    { text: "Word (.docx) eksport funksiyasi qo'shildi", date: "18.02.2025" },
  ]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    const q = query(collection(db, "contracts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(10));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setContracts(list);

    const now = new Date();
    const thisMonth = list.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const drafts = list.filter(c => c.status === "draft").length;

    // Counterparties
    const cpQ = query(collection(db, "counterparties"), where("userId", "==", user.uid));
    const cpSnap = await getDocs(cpQ);

    setStats({ total: list.length, thisMonth, counterparties: cpSnap.size, drafts });

    // Chart data — last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const count = list.filter(c => {
        const cd = new Date(c.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      monthlyData.push({ name: MONTHS[d.getMonth()], count });
    }
    setChartData(monthlyData);
  }

  const today = new Date();
  const dayNames = ["yakshanba","dushanba","seshanba","chorshanba","payshanba","juma","shanba"];
  const todayStr = `Bugun ${today.getDate()}-${MONTHS[today.getMonth()]}, ${today.getFullYear()} — ${dayNames[today.getDay()]}`;
  const userName = userProfile?.companyName || userProfile?.fullName || "Foydalanuvchi";

  const statusLabel = { ready: "Tayyor", draft: "Qoralama", cancelled: "Bekor" };
  const statusClass = { ready: "badge-success", draft: "badge-warning", cancelled: "badge-danger" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar draftsCount={stats.drafts} />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800 }}>Salom, {userName}! 👋</h2>
            <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 4 }}>{todayStr}</p>
          </div>
          <Link to="/create">
            <button style={{ padding: "14px 28px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              + Yangi shartnoma
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
          {[
            { label: "Jami shartnomalar", value: stats.total, sub: "barcha vaqt" },
            { label: "Bu oy", value: stats.thisMonth, sub: "joriy oy" },
            { label: "Kontragentlar", value: stats.counterparties, sub: "bazada" },
            { label: "Qoralamalar", value: stats.drafts, sub: "davom ettirish kerak", warn: stats.drafts > 0 },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, transition: "transform 0.3s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,237,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{s.label}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, background: s.warn ? "none" : "linear-gradient(135deg,#6C3AE8,#00D4AA)", WebkitBackgroundClip: s.warn ? "none" : "text", WebkitTextFillColor: s.warn ? "#F59E0B" : "transparent", color: s.warn ? "#F59E0B" : "transparent", marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(240,237,255,0.4)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Quick create */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Oylik statistika</div>
              <span style={{ background: "rgba(43,142,240,0.15)", color: "#2B8EF0", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>So'nggi 6 oy</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(240,237,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(240,237,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a0f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F0EDFF" }} />
                <Bar dataKey="count" name="Shartnomalar" fill="url(#barGrad)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C3AE8" />
                    <stop offset="100%" stopColor="#2B8EF0" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick create */}
            <div style={{ background: "linear-gradient(135deg,rgba(108,58,232,0.2),rgba(43,142,240,0.2))", border: "1px solid rgba(108,58,232,0.3)", borderRadius: 16, padding: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Tezkor yaratish ⚡</h4>
              <p style={{ fontSize: 13, color: "rgba(240,237,255,0.5)", marginBottom: 16 }}>Qaysi turdagi shartnoma kerak?</p>
              {[
                { label: "📝 Xizmat ko'rsatish", path: "/create?type=service" },
                { label: "🛒 Oldi-sotdi", path: "/create?type=sale" },
                { label: "🏠 Ijara", path: "/create?type=rent" },
                { label: "🌐 Xalqaro (2 tilli)", path: "/create/bilingual" },
              ].map(item => (
                <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 8, color: "#F0EDFF", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,58,232,0.2)"; e.currentTarget.style.borderColor = "rgba(108,58,232,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent + News */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>So'nggi shartnomalar</div>
              <Link to="/archive" style={{ textDecoration: "none" }}>
                <button style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(240,237,255,0.6)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Barchasi →</button>
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Shartnoma","Kontragent","Sana","Holat",""].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(240,237,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "32px 20px", textAlign: "center", color: "rgba(240,237,255,0.4)", fontSize: 14 }}>Hali shartnomalar yo'q. Birinchi shartnomangizni yarating!</td></tr>
                ) : contracts.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>No: {c.contractNumber}</div>
                      <div style={{ fontSize: 12, color: "rgba(240,237,255,0.4)", marginTop: 2 }}>{c.type}</div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.counterpartyName}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "rgba(240,237,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.date}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className={`badge ${statusClass[c.status] || "badge-blue"}`}>{statusLabel[c.status] || c.status}</span>
                    </td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <button style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(240,237,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* News */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📢 Yangiliklar</div>
            {news.map((n, i) => (
              <div key={i} style={{ padding: "14px 0", borderBottom: i < news.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#6C3AE8,#00D4AA)", flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{n.text}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,237,255,0.4)", marginTop: 4 }}>{n.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
