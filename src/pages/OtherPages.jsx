// src/pages/Drafts.jsx
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

export default function Drafts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => { loadDrafts(); }, [user]);

  async function loadDrafts() {
    const q = query(collection(db, "contracts"), where("userId", "==", user.uid), where("status", "==", "draft"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    setDrafts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function deleteDraft(id) {
    if (!window.confirm("Qoralamani o'chirishni istaysizmi?")) return;
    await deleteDoc(doc(db, "contracts", id));
    toast.success("Qoralama o'chirildi");
    loadDrafts();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar draftsCount={drafts.length} />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>⏳ Qoralamalar</h2>
        <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginBottom: 28 }}>Tugallanmagan shartnomalar</p>

        {drafts.length === 0
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(240,237,255,0.4)" }}>Qoralamalar yo'q ✓</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {drafts.map(d => (
                <div key={d.id} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>No: {d.contractNumber || "—"} — {d.typeName || d.type}</div>
                    <div style={{ fontSize: 13, color: "rgba(240,237,255,0.5)" }}>Kontragent: {d.counterpartyName || "kiritilmagan"} | Yangilangan: {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("ru-RU") : "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => navigate(`/create?draft=${d.id}`)} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 10, color: "white", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Davom ettirish →</button>
                    <button onClick={() => deleteDraft(d.id)} style={{ padding: "9px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>O'chirish</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </main>
    </div>
  );
}


// ─────────────────────────────────
// src/pages/Counterparties.jsx
// ─────────────────────────────────
export function Counterparties() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [user]);

  async function load() {
    const q = query(collection(db, "counterparties"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function remove(id) {
    if (!window.confirm("Kontragentni o'chirishni istaysizmi?")) return;
    await deleteDoc(doc(db, "counterparties", id));
    toast.success("O'chirildi");
    load();
  }

  const filtered = list.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.stir?.includes(search));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>👥 Kontragentlar bazasi</h2>
        <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginBottom: 24 }}>Avval ishlashilgan kontragentlar</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Nom yoki STIR bo'yicha qidiruv..." style={{ marginBottom: 20 }} />

        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: 60, color: "rgba(240,237,255,0.4)" }}>Kontragentlar bazasi bo'sh</div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
              {filtered.map(c => (
                <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,237,255,0.4)", marginBottom: 12 }}>STIR: {c.stir || "—"}</div>
                  {[["Bank", c.bankName],["MFO",c.mfo],["H/r",c.account],["Manzil",c.address]].map(([l,v]) => v && (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "rgba(240,237,255,0.4)" }}>{l}:</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  <button onClick={() => remove(c.id)} style={{ marginTop: 14, padding: "7px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#EF4444", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>O'chirish</button>
                </div>
              ))}
            </div>
        }
      </main>
    </div>
  );
}


// ─────────────────────────────────
// src/pages/Settings.jsx
// ─────────────────────────────────
export function Settings() {
  const { userProfile, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...userProfile });
  const [saving, setSaving] = useState(false);
  const [newSecondary, setNewSecondary] = useState({ bankName: "", mfo: "", account: "" });
  const [tab, setTab] = useState("rekvizits");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
    toast.success("Saqlandi ✓");
  }

  async function addSecondary() {
    if (!newSecondary.account) return toast.error("Hisob raqam kiriting");
    const arr = [...(form.secondaryRekvizits || []), newSecondary];
    set("secondaryRekvizits", arr);
    setNewSecondary({ bankName: "", mfo: "", account: "" });
    toast.success("Qo'shildi");
  }

  async function handleDeleteAccount() {
    const confirm1 = window.confirm("Hisobingizni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.");
    if (!confirm1) return;
    const confirm2 = window.confirm("Ishonchingiz komilmi? Barcha ma'lumotlar o'chib ketadi.");
    if (!confirm2) return;
    await deleteAccount();
    navigate("/");
    toast.success("Hisob o'chirildi");
  }

  const tabs = [{ id: "rekvizits", label: "🏢 Rekvizitlar" }, { id: "secondary", label: "🔄 Ikkilamchi rekvizitlar" }, { id: "payments", label: "💳 To'lovlar" }, { id: "danger", label: "⚠️ Xavfli zona" }];
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 28 }}>⚙️ Sozlamalar</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 28, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 6 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 16px", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t.id ? "linear-gradient(135deg,#6C3AE8,#2B8EF0)" : "transparent", color: tab === t.id ? "white" : "rgba(240,237,255,0.5)" }}>{t.label}</button>
          ))}
        </div>

        {tab === "rekvizits" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32, maxWidth: 600 }}>
            {form.entityType !== "individual" ? <>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Korxona nomi</label><input value={form.companyName || ""} onChange={e => set("companyName", e.target.value)} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>STIR</label><input value={form.stir || ""} onChange={e => set("stir", e.target.value)} /></div>
                <div><label style={labelStyle}>Direktor</label><input value={form.director || ""} onChange={e => set("director", e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Asosiy hisob raqam</label><input value={form.bankAccount || ""} onChange={e => set("bankAccount", e.target.value)} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>Bank nomi</label><input value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} /></div>
                <div><label style={labelStyle}>MFO</label><input value={form.mfo || ""} onChange={e => set("mfo", e.target.value)} /></div>
              </div>
            </> : <>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>F.I.O.</label><input value={form.fullName || ""} onChange={e => set("fullName", e.target.value)} /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>JSHSHIR</label><input value={form.jshshir || ""} onChange={e => set("jshshir", e.target.value)} /></div>
            </>}
            <div style={{ marginBottom: 24 }}><label style={labelStyle}>Manzil</label><input value={form.address || ""} onChange={e => set("address", e.target.value)} /></div>
            <button onClick={save} disabled={saving} style={{ padding: "13px 28px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saqlanmoqda..." : "Saqlash ✓"}</button>
          </div>
        )}

        {tab === "secondary" && (
          <div style={{ maxWidth: 600 }}>
            {(form.secondaryRekvizits || []).map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Ikkilamchi hisob raqam #{i + 1}</div>
                {[["Bank",r.bankName],["MFO",r.mfo],["H/r",r.account]].map(([l,v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "rgba(240,237,255,0.5)" }}>{l}:</span><span>{v}</span>
                  </div>
                ))}
                <button onClick={() => { const arr = form.secondaryRekvizits.filter((_, j) => j !== i); set("secondaryRekvizits", arr); }} style={{ marginTop: 12, padding: "6px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#EF4444", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>O'chirish</button>
              </div>
            ))}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>+ Yangi qo'shimcha rekvizit</div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Bank nomi</label><input value={newSecondary.bankName} onChange={e => setNewSecondary(p => ({...p,bankName:e.target.value}))} placeholder="Kapitalbank" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><label style={labelStyle}>MFO</label><input value={newSecondary.mfo} onChange={e => setNewSecondary(p => ({...p,mfo:e.target.value}))} placeholder="00896" /></div>
                <div><label style={labelStyle}>Hisob raqam</label><input value={newSecondary.account} onChange={e => setNewSecondary(p => ({...p,account:e.target.value}))} placeholder="20208000..." /></div>
              </div>
              <button onClick={addSecondary} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 10, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>+ Qo'shish</button>
            </div>
            <button onClick={save} disabled={saving} style={{ marginTop: 16, padding: "13px 28px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saqlanmoqda..." : "Saqlash ✓"}</button>
          </div>
        )}

        {tab === "payments" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32, maxWidth: 600 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Joriy tarif: {userProfile?.plan === "pro" ? "Pro ⭐" : "Bepul"}</div>
              <div style={{ fontSize: 13, color: "rgba(240,237,255,0.5)" }}>Ishlatilgan: {userProfile?.contractsUsed}/{userProfile?.contractsLimit} shartnoma</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,rgba(108,58,232,0.15),rgba(43,142,240,0.15))", border: "1px solid rgba(108,58,232,0.3)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Pro — 29 900 so'm/oy</div>
              <div style={{ fontSize: 14, color: "rgba(240,237,255,0.6)", marginBottom: 20 }}>Cheksiz shartnomalar, barcha imkoniyatlar</div>
              <button style={{ padding: "13px 28px", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Payme orqali to'lash →</button>
            </div>
          </div>
        )}

        {tab === "danger" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#EF4444", marginBottom: 8 }}>⚠️ Hisobni o'chirish</div>
              <p style={{ fontSize: 14, color: "rgba(240,237,255,0.6)", marginBottom: 20, lineHeight: 1.7 }}>Bu amalni bajarish bilан barcha shartnomalaringiz, kontragentlaringiz va ma'lumotlaringiz butunlay o'chib ketadi. Bu amalni bekor qilib bo'lmaydi.</p>
              <button onClick={handleDeleteAccount} style={{ padding: "11px 24px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, color: "#EF4444", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Hisobni o'chirish
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
