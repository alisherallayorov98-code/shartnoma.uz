// src/pages/CreateContract.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";
import { generatePDF, generateWord } from "../utils/contractGenerator";

const CONTRACT_TYPES = {
  service: "Xizmat ko'rsatish shartnomasi",
  sale: "Oldi-sotdi shartnomasi",
  rent: "Ijara shartnomasi",
  custom: "O'z shabloni"
};

const CURRENCIES = ["UZS — So'm","USD — Dollar","EUR — Euro","RUB — Rubl"];

const STEPS = ["Tur & Til","Rekvizitlar","Kontragent","Shartlar","Yakunlash"];

export default function CreateContract() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoSaveTimer = useRef(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [counterparties, setCounterparties] = useState([]);

  const [form, setForm] = useState({
    type: searchParams.get("type") || "service",
    language: "uz",
    contractNumber: "",
    date: new Date().toLocaleDateString("ru-RU").replace(/\./g, "."),
    // Our rekvizits (from profile, can switch to secondary)
    ourRekvizit: "main",
    secondaryRekvizits: userProfile?.secondaryRekvizits || [],
    // Counterparty
    counterpartyType: "legal",
    counterpartyName: "",
    counterpartyStiр: "",
    counterpartyBank: "",
    counterpartyMfo: "",
    counterpartyAccount: "",
    counterpartyAddress: "",
    counterpartyDirector: "",
    // Contract terms
    amount: "",
    currency: "UZS — So'm",
    startDate: "",
    endDate: "",
    description: "",
    // Logo
    useLogo: false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    loadCounterparties();
  }, []);

  // Auto-save draft on form change
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSaveDraft(), 30000); // 30 sec
    return () => clearTimeout(autoSaveTimer.current);
  }, [form]);

  // Auto-save on connection issues
  useEffect(() => {
    function handleOffline() {
      autoSaveDraft();
      toast("📡 Internet uzildi. Qoralamaga saqlandi.", { icon: "⚠️" });
    }
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [form]);

  async function loadCounterparties() {
    const q = query(collection(db, "counterparties"), where("userId", "==", user.uid));
    const snap = await getDocs(q);
    setCounterparties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function autoSaveDraft() {
    try {
      const data = { ...form, userId: user.uid, status: "draft", updatedAt: new Date().toISOString() };
      if (draftId) {
        await updateDoc(doc(db, "contracts", draftId), data);
      } else {
        const ref = await addDoc(collection(db, "contracts"), { ...data, createdAt: new Date().toISOString() });
        setDraftId(ref.id);
      }
    } catch (e) { console.error("Auto-save failed:", e); }
  }

  async function saveDraft() {
    setSaving(true);
    await autoSaveDraft();
    setSaving(false);
    toast.success("Qoralamaga saqlandi ✓");
  }

  function selectCounterparty(cp) {
    set("counterpartyName", cp.name);
    set("counterpartyStiр", cp.stir);
    set("counterpartyBank", cp.bankName);
    set("counterpartyMfo", cp.mfo);
    set("counterpartyAccount", cp.account);
    set("counterpartyAddress", cp.address);
    set("counterpartyDirector", cp.director || "");
    toast.success(`${cp.name} tanlandi ✓`);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      // Check limit
      if (userProfile?.plan === "free" && userProfile?.contractsUsed >= userProfile?.contractsLimit) {
        toast.error("Bepul limit tugadi! Pro ga o'ting.");
        setSaving(false);
        return;
      }

      const contractData = {
        ...form,
        userId: user.uid,
        status: "ready",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typeName: CONTRACT_TYPES[form.type],
        ourName: userProfile?.companyName || userProfile?.fullName,
        ourStir: userProfile?.stir || userProfile?.jshshir,
        ourBank: form.ourRekvizit === "main"
          ? { account: userProfile?.bankAccount, bank: userProfile?.bankName, mfo: userProfile?.mfo }
          : userProfile?.secondaryRekvizits?.[form.ourRekvizit],
        ourAddress: userProfile?.address,
        ourDirector: userProfile?.director || userProfile?.fullName,
      };

      // Save contract
      const ref = draftId
        ? doc(db, "contracts", draftId)
        : null;
      if (ref) {
        await updateDoc(ref, contractData);
      } else {
        await addDoc(collection(db, "contracts"), contractData);
      }

      // Save counterparty to base
      const existingCp = counterparties.find(c => c.stir === form.counterpartyStiр);
      if (!existingCp && form.counterpartyName) {
        await addDoc(collection(db, "counterparties"), {
          userId: user.uid,
          name: form.counterpartyName,
          stir: form.counterpartyStiр,
          bankName: form.counterpartyBank,
          mfo: form.counterpartyMfo,
          account: form.counterpartyAccount,
          address: form.counterpartyAddress,
          director: form.counterpartyDirector,
          createdAt: new Date().toISOString()
        });
      }

      // Update usage count
      await updateDoc(doc(db, "users", user.uid), {
        contractsUsed: (userProfile?.contractsUsed || 0) + 1
      });

      toast.success("Shartnoma yaratildi! ✓");
      navigate("/archive");
    } catch (e) {
      toast.error("Xato yuz berdi");
      console.error(e);
    }
    setSaving(false);
  }

  const ourName = userProfile?.companyName || userProfile?.fullName || "—";
  const ourStir = userProfile?.stir || userProfile?.jshshir || "—";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 40px", color: "#F0EDFF" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Yangi shartnoma</h2>
            <p style={{ fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 4 }}>Barcha maydonlarni to'ldiring</p>
          </div>
          <button onClick={saveDraft} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#F0EDFF", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
            {saving ? "Saqlanmoqda..." : "💾 Qoralama"}
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: step > i ? "linear-gradient(135deg,#6C3AE8,#2B8EF0)" : step === i ? "rgba(108,58,232,0.2)" : "rgba(255,255,255,0.06)", border: step === i ? "2px solid #6C3AE8" : "none", color: step > i ? "white" : step === i ? "#6C3AE8" : "rgba(240,237,255,0.4)" }}>{step > i ? "✓" : i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: step === i ? "#F0EDFF" : "rgba(240,237,255,0.4)", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: step > i ? "linear-gradient(90deg,#6C3AE8,#2B8EF0)" : "rgba(255,255,255,0.08)", margin: "0 12px" }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          <div>

            {/* STEP 0: Type & Language */}
            {step === 0 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#2B8EF0", marginBottom: 20 }}>📋 Shartnoma turi</div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Shablon tanlang</label>
                  <select value={form.type} onChange={e => set("type", e.target.value)}>
                    {Object.entries(CONTRACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Til</label>
                  <select value={form.language} onChange={e => set("language", e.target.value)}>
                    <option value="uz">O'zbek tili</option>
                    <option value="ru">Rus tili</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Shartnoma raqami</label>
                    <input value={form.contractNumber} onChange={e => set("contractNumber", e.target.value)} placeholder="247" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Sana</label>
                    <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="03.03.2025" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Our rekvizits */}
            {step === 1 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#2B8EF0", marginBottom: 20 }}>🏢 Bizning rekvizitlar</div>

                {/* Switch rekvizit button */}
                {userProfile?.secondaryRekvizits?.length > 0 && (
                  <div>
                    <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(43,142,240,0.1)", border: "1px solid rgba(43,142,240,0.3)", borderRadius: 10, fontSize: 13, color: "#2B8EF0", cursor: "pointer", marginBottom: 16, fontFamily: "inherit", fontWeight: 500 }}>
                      🔄 Ikkilamchi rekvizitlarga almashtirish
                    </button>
                    {form.ourRekvizit !== "main" && (
                      <select value={form.ourRekvizit} onChange={e => set("ourRekvizit", e.target.value)} style={{ marginBottom: 16 }}>
                        <option value="main">Asosiy rekvizitlar</option>
                        {userProfile.secondaryRekvizits.map((r, i) => (
                          <option key={i} value={i}>Ikkilamchi: {r.bankName} — {r.account}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 20 }}>
                  {[
                    ["Korxona nomi", ourName],
                    ["STIR", ourStir],
                    ["Hisob raqam", userProfile?.bankAccount || "—"],
                    ["Bank / MFO", `${userProfile?.bankName || "—"} / ${userProfile?.mfo || "—"}`],
                    ["Direktor", userProfile?.director || userProfile?.fullName || "—"],
                    ["Manzil", userProfile?.address || "—"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,212,170,0.1)" }}>
                      <span style={{ fontSize: 13, color: "rgba(240,237,255,0.5)" }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "rgba(240,237,255,0.4)", marginTop: 12 }}>
                  Rekvizitlarni o'zgartirish uchun: <a href="/settings" style={{ color: "#2B8EF0" }}>Sozlamalar → Rekvizitlar</a>
                </p>
              </div>
            )}

            {/* STEP 2: Counterparty */}
            {step === 2 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#2B8EF0", marginBottom: 20 }}>👥 Kontragent ma'lumotlari</div>

                {/* From base */}
                {counterparties.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Bazadan tanlash</label>
                    <select onChange={e => { const cp = counterparties.find(c => c.id === e.target.value); if (cp) selectCounterparty(cp); }} style={{ marginBottom: 0 }}>
                      <option value="">— Yangi kontragent kiritish —</option>
                      {counterparties.map(cp => <option key={cp.id} value={cp.id}>{cp.name} — {cp.stir}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Kontragent toifasi</label>
                  <select value={form.counterpartyType} onChange={e => set("counterpartyType", e.target.value)}>
                    <option value="legal">Yuridik shaxs</option>
                    <option value="yatt">YaTT</option>
                    <option value="individual">Jismoniy shaxs</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>
                      {form.counterpartyType === "individual" ? "JSHSHIR" : "STIR raqami"}
                    </label>
                    <input value={form.counterpartyStiр} onChange={e => set("counterpartyStiр", e.target.value)} placeholder={form.counterpartyType === "individual" ? "12345678901234" : "302 000 000"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Nomi</label>
                    <input value={form.counterpartyName} onChange={e => set("counterpartyName", e.target.value)} placeholder="Kompaniya nomi" />
                  </div>
                </div>

                {form.counterpartyType !== "individual" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Hisob raqam</label>
                        <input value={form.counterpartyAccount} onChange={e => set("counterpartyAccount", e.target.value)} placeholder="20208000900000000000" />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Bank / MFO</label>
                        <input value={form.counterpartyBank} onChange={e => set("counterpartyBank", e.target.value)} placeholder="Bank nomi / 00000" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Direktor F.I.O.</label>
                      <input value={form.counterpartyDirector} onChange={e => set("counterpartyDirector", e.target.value)} placeholder="Ismi Familiyasi" />
                    </div>
                  </>
                )}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Yuridik manzil</label>
                  <input value={form.counterpartyAddress} onChange={e => set("counterpartyAddress", e.target.value)} placeholder="Toshkent sh., ..." />
                </div>
              </div>
            )}

            {/* STEP 3: Terms */}
            {step === 3 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#2B8EF0", marginBottom: 20 }}>📝 Shartnoma shartlari</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Summa</label>
                    <input value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="5 000 000" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Valyuta</label>
                    <select value={form.currency} onChange={e => set("currency", e.target.value)}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Boshlanish sanasi</label>
                    <input value={form.startDate || form.date} onChange={e => set("startDate", e.target.value)} placeholder="03.03.2025" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Tugash sanasi</label>
                    <input value={form.endDate} onChange={e => set("endDate", e.target.value)} placeholder="03.06.2025" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" }}>Xizmat / tovar tavsifi</label>
                  <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Xizmat yoki tovar tavsifi..." />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="useLogo" checked={form.useLogo} onChange={e => set("useLogo", e.target.checked)} style={{ width: "auto", cursor: "pointer" }} />
                  <label htmlFor="useLogo" style={{ fontSize: 14, cursor: "pointer" }}>Korxona logosini shartnomaga qo'shish (ixtiyoriy)</label>
                </div>
              </div>
            )}

            {/* STEP 4: Final */}
            {step === 4 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#00D4AA", marginBottom: 20 }}>✅ Yakunlash</div>
                <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  {[
                    ["Tur", CONTRACT_TYPES[form.type]],
                    ["Raqam", form.contractNumber || "—"],
                    ["Sana", form.date],
                    ["Ijrochi", ourName],
                    ["Kontragent", form.counterpartyName || "—"],
                    ["Summa", `${form.amount || "—"} ${form.currency}`],
                    ["Muddat", `${form.startDate || form.date} — ${form.endDate || "—"}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,212,170,0.1)" }}>
                      <span style={{ fontSize: 13, color: "rgba(240,237,255,0.5)" }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => generatePDF(form, userProfile)} style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#F0EDFF", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    📄 Word yuklab olish
                  </button>
                  <button onClick={() => generatePDF(form, userProfile)} style={{ flex: 1, padding: 14, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    ⬇️ PDF yuklab olish
                  </button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: "13px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#F0EDFF", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>← Orqaga</button>}
              {step < STEPS.length - 1
                ? <button onClick={() => setStep(s => s + 1)} style={{ flex: 1, padding: 14, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Davom etish →</button>
                : <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: 14, background: "linear-gradient(135deg,#00D4AA,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saqlanmoqda..." : "✅ Shartnomani yaratish"}
                  </button>
              }
            </div>
          </div>

          {/* Preview */}
          <div style={{ position: "sticky", top: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>👁 Preview</span>
                <span style={{ background: "rgba(0,212,170,0.15)", color: "#00D4AA", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Jonli</span>
              </div>
              <div style={{ padding: 20, background: "white", color: "#1a1a2e", fontSize: 11, lineHeight: 1.7, minHeight: 460 }}>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase" }}>
                  {CONTRACT_TYPES[form.type] || "SHARTNOMA"}
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#666", marginBottom: 16 }}>
                  № {form.contractNumber || "___"} | {form.date}
                </div>
                <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", marginBottom: 6, color: "#333" }}>1. Tomonlar</div>
                <div style={{ marginBottom: 8, color: "#444" }}>
                  <b>Ijrochi:</b> <span style={{ background: "rgba(108,58,232,0.12)", borderRadius: 3, padding: "1px 4px", color: "#6C3AE8", fontWeight: 600 }}>{ourName}</span>, STIR: {ourStir}
                </div>
                <div style={{ marginBottom: 12, color: "#444" }}>
                  <b>Buyurtmachi:</b> <span style={{ background: "rgba(43,142,240,0.12)", borderRadius: 3, padding: "1px 4px", color: "#2B8EF0", fontWeight: 600 }}>{form.counterpartyName || "_______________"}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", marginBottom: 6, color: "#333" }}>2. Predmet</div>
                <div style={{ marginBottom: 12, color: "#444" }}>{form.description || "Xizmat tavsifi..."}</div>
                <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", marginBottom: 6, color: "#333" }}>3. Summa</div>
                <div style={{ marginBottom: 12, color: "#444" }}>
                  <span style={{ background: "rgba(0,212,170,0.12)", borderRadius: 3, padding: "1px 4px", color: "#009977", fontWeight: 600 }}>{form.amount || "___"}</span> {form.currency}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 12, borderTop: "1px solid #eee", fontSize: 10 }}>
                  <div><div style={{ fontWeight: 700 }}>IJROCHI:</div><div>{ourName}</div><div style={{ marginTop: 16 }}>___________</div><div>M.O.</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>BUYURTMACHI:</div><div>{form.counterpartyName || "___________"}</div><div style={{ marginTop: 16 }}>___________</div><div>M.O.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
