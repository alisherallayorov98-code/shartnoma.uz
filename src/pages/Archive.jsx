// src/pages/Archive.jsx
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { generatePDF } from "../utils/contractGenerator";
import toast from "react-hot-toast";

export default function Archive() {
  const { user, userProfile } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => { loadContracts(); }, [user]);

  async function loadContracts() {
    const q = query(collection(db, "contracts"), where("userId", "==", user.uid), where("status", "!=", "draft"), orderBy("status"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function cancelContract(id) {
    await updateDoc(doc(db, "contracts", id), { status: "cancelled" });
    toast.success("Bekor qilindi");
    loadContracts();
  }

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.counterpartyName?.toLowerCase().includes(search.toLowerCase()) || c.contractNumber?.toString().includes(search) || c.counterpartyStiр?.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const statusLabel = { ready: "Tayyor", draft: "Qoralama", cancelled: "Bekor" };
  const statusClass = { ready: "badge-success", draft: "badge-warning", cancelled: "badge-danger" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>📁 Arxiv</h2>
          <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 4 }}>Barcha yaratilgan shartnomalar</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Nom, STIR yoki raqam bo'yicha qidiruv..." style={{ flex: 1 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">Barcha holat</option>
            <option value="ready">Tayyor</option>
            <option value="cancelled">Bekor qilingan</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 200 }}>
            <option value="all">Barcha turlar</option>
            <option value="service">Xizmat ko'rsatish</option>
            <option value="sale">Oldi-sotdi</option>
            <option value="rent">Ijara</option>
          </select>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["№","Tur","Kontragent","Sana","Summa","Holat",""].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(240,237,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "rgba(240,237,255,0.4)" }}>Shartnomalar topilmadi</td></tr>
                : filtered.map(c => (
                  <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>No: {c.contractNumber}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "rgba(240,237,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.typeName}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.counterpartyName}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "rgba(240,237,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.date}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.amount ? `${Number(c.amount).toLocaleString()} ${c.currency?.split("—")[0]}` : "—"}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}><span className={`badge ${statusClass[c.status] || "badge-blue"}`}>{statusLabel[c.status]}</span></td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => generatePDF(c, userProfile)} style={{ padding: "6px 12px", background: "rgba(43,142,240,0.15)", border: "1px solid rgba(43,142,240,0.3)", borderRadius: 8, color: "#2B8EF0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>PDF</button>
                        <button onClick={() => navigator.clipboard.writeText(c.id).then(() => toast.success("Nusxa olindi"))} style={{ padding: "6px 12px", background: "rgba(108,58,232,0.15)", border: "1px solid rgba(108,58,232,0.3)", borderRadius: 8, color: "#C4AAFF", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Nusxa</button>
                        {c.status !== "cancelled" && <button onClick={() => cancelContract(c.id)} style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(240,237,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Bekor</button>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
