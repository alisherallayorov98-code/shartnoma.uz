// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function passwordStrength(val) {
  const hasLetter = /[a-zA-Z]/.test(val);
  const len = val.length;
  if (!val) return { pct: 0, color: "", msg: "" };
  if (len < 8) return { pct: 25, color: "#EF4444", msg: "Kamida 8 ta belgi kiriting" };
  if (!hasLetter) return { pct: 50, color: "#F59E0B", msg: "Kamida 1 ta harf qo'shing" };
  if (len < 12) return { pct: 75, color: "#2B8EF0", msg: "Yaxshi parol ✓" };
  return { pct: 100, color: "#00D4AA", msg: "Kuchli parol! ✓✓" };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "",
    entityType: "legal", // legal | yatt | individual
    companyName: "", stir: "", director: "",
    bankAccount: "", bankName: "", mfo: "", address: "",
    fullName: "", jshshir: "", passport: "", phone: ""
  });

  const strength = passwordStrength(form.password);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function validateStep1() {
    if (!form.email) return "Email kiriting";
    if (strength.pct < 75) return strength.msg;
    if (form.password !== form.confirmPassword) return "Parollar mos kelmadi";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step === 1) {
      const err = validateStep1();
      if (err) return toast.error(err);
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const profileData = form.entityType === "individual"
        ? { entityType: form.entityType, fullName: form.fullName, jshshir: form.jshshir, passport: form.passport, phone: form.phone, address: form.address }
        : { entityType: form.entityType, companyName: form.companyName, stir: form.stir, director: form.director, bankAccount: form.bankAccount, bankName: form.bankName, mfo: form.mfo, address: form.address };
      await register(form.email, form.password, profileData);
      navigate("/dashboard");
      toast.success("Xush kelibsiz! Emailingizni tasdiqlang.");
    } catch (err) {
      toast.error(err.code === "auth/email-already-in-use" ? "Bu email allaqachon ro'yxatdan o'tgan" : "Xato yuz berdi");
    }
    setLoading(false);
  }

  const inputStyle = { marginBottom: 16 };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.55)", marginBottom: 8, display: "block" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1a0533,#0d1f3c,#001f1a)" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#6C3AE8", filter: "blur(80px)", opacity: 0.2, top: -100, right: -100 }} />

      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 48, width: "100%", maxWidth: 500, position: "relative", zIndex: 2, backdropFilter: "blur(20px)" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>Shartnoma.uz</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Ro'yxatdan o'tish</h2>
        <p style={{ fontSize: 13, color: "rgba(240,237,255,0.5)", marginBottom: 28 }}>Qadam {step} / 2 — {step === 1 ? "Kirish ma'lumotlari" : "Rekvizitlar"}</p>

        {/* Steps indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          {[1, 2].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 1 ? 1 : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: step >= s ? "linear-gradient(135deg,#6C3AE8,#2B8EF0)" : "rgba(255,255,255,0.08)", color: step >= s ? "white" : "rgba(240,237,255,0.4)" }}>{step > s ? "✓" : s}</div>
              {i < 1 && <div style={{ flex: 1, height: 2, background: step > 1 ? "linear-gradient(90deg,#6C3AE8,#2B8EF0)" : "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
            </div>
          ))}
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: step >= 2 ? "linear-gradient(135deg,#6C3AE8,#2B8EF0)" : "rgba(255,255,255,0.08)", color: step >= 2 ? "white" : "rgba(240,237,255,0.4)" }}>2</div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div style={inputStyle}><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@kompaniya.uz" required /></div>
              <div style={inputStyle}>
                <label style={labelStyle}>Parol <span style={{ fontWeight: 400 }}>(kamida 8 ta belgi + 1 ta harf)</span></label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" required />
                {form.password && (<><div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", marginTop: 8, overflow: "hidden" }}><div style={{ width: `${strength.pct}%`, height: "100%", background: strength.color, borderRadius: 2, transition: "width 0.3s" }} /></div><div style={{ fontSize: 12, color: strength.color, marginTop: 4 }}>{strength.msg}</div></>)}
              </div>
              <div style={inputStyle}><label style={labelStyle}>Parolni tasdiqlang</label><input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="••••••••" required /></div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={inputStyle}>
                <label style={labelStyle}>Toifa</label>
                <select value={form.entityType} onChange={e => set("entityType", e.target.value)}>
                  <option value="legal">Yuridik shaxs (MChJ, AJ)</option>
                  <option value="yatt">YaTT (Yakka tartibli tadbirkor)</option>
                  <option value="individual">Jismoniy shaxs</option>
                </select>
              </div>

              {form.entityType !== "individual" && (<>
                <div style={inputStyle}><label style={labelStyle}>Korxona nomi</label><input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Kompaniya nomi" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label style={labelStyle}>STIR</label><input value={form.stir} onChange={e => set("stir", e.target.value)} placeholder="302 000 000" /></div>
                  <div><label style={labelStyle}>Direktor F.I.O.</label><input value={form.director} onChange={e => set("director", e.target.value)} placeholder="Ismi Familiyasi" /></div>
                </div>
                <div style={inputStyle}><label style={labelStyle}>Asosiy hisob raqam</label><input value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} placeholder="20208000900000000000" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label style={labelStyle}>Bank nomi</label><input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="Ipak Yo'li" /></div>
                  <div><label style={labelStyle}>MFO</label><input value={form.mfo} onChange={e => set("mfo", e.target.value)} placeholder="00896" /></div>
                </div>
              </>)}

              {form.entityType === "individual" && (<>
                <div style={inputStyle}><label style={labelStyle}>F.I.O. (to'liq)</label><input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Ismi Familiyasi Otasining ismi" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><label style={labelStyle}>JSHSHIR</label><input value={form.jshshir} onChange={e => set("jshshir", e.target.value)} placeholder="12345678901234" /></div>
                  <div><label style={labelStyle}>Passport</label><input value={form.passport} onChange={e => set("passport", e.target.value)} placeholder="AA 1234567" /></div>
                </div>
                <div style={inputStyle}><label style={labelStyle}>Telefon</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+998 90 000 00 00" /></div>
              </>)}

              <div style={inputStyle}><label style={labelStyle}>Manzil</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Toshkent sh., ..." /></div>
            </>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            {step === 2 && <button type="button" onClick={() => setStep(1)} style={{ padding: "14px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#F0EDFF", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>← Orqaga</button>}
            <button type="submit" disabled={loading} style={{ flex: 1, padding: 16, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", border: "none", borderRadius: 12, color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saqlanmoqda..." : step === 1 ? "Davom etish →" : "Ro'yxatdan o'tish →"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "rgba(240,237,255,0.5)", marginTop: 24 }}>
          Hisobingiz bormi? <Link to="/login" style={{ color: "#2B8EF0", textDecoration: "none", fontWeight: 600 }}>Kiring →</Link>
        </p>
      </div>
    </div>
  );
}
