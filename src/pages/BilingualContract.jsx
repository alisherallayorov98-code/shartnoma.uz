// src/pages/BilingualContract.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { generatePDF } from "../utils/contractGenerator";
import toast from "react-hot-toast";

const FOREIGN_LANGS = [
  { value: "en", label: "🇬🇧 Ingliz tili" },
  { value: "ru", label: "🇷🇺 Rus tili" },
];

export default function BilingualContract() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [foreignLang, setForeignLang] = useState("en");
  const [form, setForm] = useState({
    contractNumber: "", date: new Date().toLocaleDateString("ru-RU"),
    type: "service",
    counterpartyName: "", counterpartyStiр: "", counterpartyAddress: "", counterpartyDirector: "",
    amount: "", currency: "USD — Dollar", startDate: "", endDate: "",
    description: ""
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const ourName = userProfile?.companyName || userProfile?.fullName || "—";
  const ourStir = userProfile?.stir || "—";

  const UZ = {
    title: { service: "XIZMAT KO'RSATISH SHARTNOMASI", sale: "OLDI-SOTDI SHARTNOMASI", rent: "IJARA SHARTNOMASI" },
    parties: "1. TOMONLAR", executor: "Ijrochi", client: "Buyurtmachi",
    subject: "2. SHARTNOMA PREDMETI", subjectText: "Ijrochi Buyurtmachiga quyidagi xizmatlarni ko'rsatadi:",
    price: "3. NARX VA TO'LOV", priceText: "Shartnoma summasi:",
    term: "4. MUDDAT", termText: "dan",
    sign1: "IJROCHI:", sign2: "BUYURTMACHI:", seal: "M.O."
  };

  const EN = {
    title: { service: "SERVICE AGREEMENT", sale: "PURCHASE AND SALE AGREEMENT", rent: "LEASE AGREEMENT" },
    parties: "1. PARTIES", executor: "Service Provider", client: "Client",
    subject: "2. SUBJECT OF AGREEMENT", subjectText: "The Service Provider shall provide the following services:",
    price: "3. PRICE AND PAYMENT", priceText: "Total contract value:",
    term: "4. TERM", termText: "from",
    sign1: "SERVICE PROVIDER:", sign2: "CLIENT:", seal: "Seal"
  };

  const RU = {
    title: { service: "ДОГОВОР ОКАЗАНИЯ УСЛУГ", sale: "ДОГОВОР КУПЛИ-ПРОДАЖИ", rent: "ДОГОВОР АРЕНДЫ" },
    parties: "1. СТОРОНЫ", executor: "Исполнитель", client: "Заказчик",
    subject: "2. ПРЕДМЕТ ДОГОВОРА", subjectText: "Исполнитель обязуется оказать следующие услуги:",
    price: "3. ЦЕНА И ПОРЯДОК ОПЛАТЫ", priceText: "Стоимость договора:",
    term: "4. СРОК ДЕЙСТВИЯ", termText: "с",
    sign1: "ИСПОЛНИТЕЛЬ:", sign2: "ЗАКАЗЧИК:", seal: "М.П."
  };

  const FOREIGN = foreignLang === "en" ? EN : RU;

  function DocPane({ lang, L }) {
    return (
      <div style={{ fontSize: 11, lineHeight: 1.8, color: "#333" }}>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: "uppercase" }}>
          {L.title[form.type] || L.title.service}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#777", marginBottom: 16 }}>
          № {form.contractNumber || "___"} &nbsp;|&nbsp; {form.date} &nbsp;|&nbsp; Toshkent
        </div>
        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6, textTransform: "uppercase" }}>{L.parties}</div>
        <p style={{ marginBottom: 8 }}><b>{L.executor}:</b> {ourName}, STIR: {ourStir}, {userProfile?.address || "—"}, {userProfile?.director || "—"}.</p>
        <p style={{ marginBottom: 14 }}><b>{L.client}:</b> {form.counterpartyName || "—"}, STIR: {form.counterpartyStiр || "—"}, {form.counterpartyAddress || "—"}.</p>
        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6, textTransform: "uppercase" }}>{L.subject}</div>
        <p style={{ marginBottom: 14 }}>{L.subjectText} {form.description || "—"}</p>
        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6, textTransform: "uppercase" }}>{L.price}</div>
        <p style={{ marginBottom: 14 }}>{L.priceText} <b>{form.amount || "—"} {form.currency?.split("—")[1]?.trim() || ""}</b>.</p>
        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6, textTransform: "uppercase" }}>{L.term}</div>
        <p style={{ marginBottom: 24 }}>{form.startDate || form.date} — {form.endDate || "—"}</p>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #ddd", fontSize: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{L.sign1}</div>
            <div>{ourName}</div>
            <div style={{ marginTop: 20 }}>_________________</div>
            <div style={{ color: "#999" }}>{L.seal}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>{L.sign2}</div>
            <div>{form.counterpartyName || "—"}</div>
            <div style={{ marginTop: 20 }}>_________________</div>
            <div style={{ color: "#999" }}>{L.seal}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>🌐 Xalqaro shartnoma</h2>
            <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 4 }}>Ikki tilli — yonma-yon ko'rinish</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => generatePDF({...form, language: "uz"}, userProfile)} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#F0EDFF", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>📄 Word</button>
            <button onClick={() => { generatePDF({...form, language: "uz"}, userProfile); toast.success("Ikki tilli PDF tayyor!"); }} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 10, color: "white", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇️ PDF (Landscape A4)</button>
          </div>
        </div>

        {/* Settings row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <select value={form.type} onChange={e => set("type", e.target.value)} style={{ flex: 1 }}>
            <option value="service">Xizmat ko'rsatish</option>
            <option value="sale">Oldi-sotdi</option>
            <option value="rent">Ijara</option>
          </select>
          <select value={foreignLang} onChange={e => setForeignLang(e.target.value)} style={{ width: 200 }}>
            {FOREIGN_LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <input value={form.contractNumber} onChange={e => set("contractNumber", e.target.value)} placeholder="Shartnoma raqami" style={{ width: 160 }} />
          <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="Sana" style={{ width: 130 }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input value={form.counterpartyName} onChange={e => set("counterpartyName", e.target.value)} placeholder="Kontragent nomi" style={{ flex: 1 }} />
          <input value={form.counterpartyStiр} onChange={e => set("counterpartyStiр", e.target.value)} placeholder="STIR" style={{ width: 150 }} />
          <input value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="Summa" style={{ width: 130 }} />
          <select value={form.currency} onChange={e => set("currency", e.target.value)} style={{ width: 160 }}>
            {["UZS — So'm","USD — Dollar","EUR — Euro","RUB — Rubl"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Xizmat tavsifi / Description..." rows={2} style={{ width: "100%" }} />
        </div>

        {/* Bilingual view */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: "rgba(255,255,255,0.04)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>🇺🇿 O'zbek tili</div>
              <span style={{ background: "rgba(108,58,232,0.2)", color: "#C4AAFF", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Chap ustun</span>
            </div>
            <div style={{ padding: 24, background: "white", minHeight: 500 }}><DocPane lang="uz" L={UZ} /></div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>{foreignLang === "en" ? "🇬🇧 English" : "🇷🇺 Русский"}</div>
              <span style={{ background: "rgba(43,142,240,0.2)", color: "#2B8EF0", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>O'ng ustun</span>
            </div>
            <div style={{ padding: 24, background: "white", minHeight: 500 }}><DocPane lang={foreignLang} L={FOREIGN} /></div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
          <button onClick={() => navigate("/create")} style={{ padding: "12px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#F0EDFF", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>← Orqaga</button>
          <button onClick={() => { generatePDF({...form, language: "uz"}, userProfile); toast.success("PDF tayyor!"); }} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>⬇️ PDF yuklab olish (Landscape A4)</button>
        </div>
      </main>
    </div>
  );
}


// ─────────────────────────────────
// src/pages/AdminPanel.jsx
// ─────────────────────────────────
export function AdminPanel() {
  const [stats] = useState({ users: 0, contracts: 0, revenue: 0, activeToday: 0 });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>⚙️ Admin panel</h2>
        <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginBottom: 32 }}>Tizimni boshqarish</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
          {[
            ["Jami foydalanuvchilar", stats.users, "👥"],
            ["Jami shartnomalar", stats.contracts, "📄"],
            ["Jami daromad", `${stats.revenue.toLocaleString()} so'm`, "💰"],
            ["Bugun aktiv", stats.activeToday, "⚡"],
          ].map(([l, v, icon]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,255,0.5)", marginBottom: 8 }}>{l}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📋 Shablonlarni boshqarish</div>
            <p style={{ fontSize: 13, color: "rgba(240,237,255,0.5)", marginBottom: 16 }}>Tizim shablonlarini qo'shing, tahrirlang yoki o'chiring.</p>
            {["Xizmat ko'rsatish (UZ/RU)", "Oldi-sotdi (UZ/RU)", "Ijara (UZ/RU)", "Xalqaro - EN", "Xalqaro - RU"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 14 }}>📄 {t}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "5px 12px", background: "rgba(43,142,240,0.15)", border: "1px solid rgba(43,142,240,0.3)", borderRadius: 8, color: "#2B8EF0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Tahrirlash</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📢 Yangilik e'lon qilish</div>
            <textarea placeholder="Yangilik matni..." rows={3} style={{ width: "100%", marginBottom: 12 }} />
            <button style={{ padding: "11px 24px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 10, color: "white", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>E'lon qilish</button>
          </div>
        </div>
      </main>
    </div>
  );
}
