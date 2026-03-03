import { useState, useEffect } from "react";

export default function LandingPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0A0715", color: "#F0EDFF", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(10,7,21,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        transition: "all 0.3s"
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Shartnoma.uz
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Imkoniyatlar", "Qanday ishlaydi", "Narxlar", "Bog'lanish"].map(l => (
            <a key={l} href={`#${l}`} style={{ color: "rgba(240,237,255,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "rgba(240,237,255,0.6)"}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => onNavigate("login")} style={{ padding: "9px 20px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#F0EDFF", background: "transparent", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Kirish
          </button>
          <button onClick={() => onNavigate("register")} style={{ padding: "9px 22px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", color: "white", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Boshlash →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "100px 40px 80px", textAlign: "center" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0533,#0d1f3c,#001f1a)" }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "#6C3AE8", filter: "blur(80px)", opacity: 0.3, top: -200, left: -100, animation: "float 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#2B8EF0", filter: "blur(80px)", opacity: 0.25, bottom: -150, right: -100, animation: "float 10s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "#00D4AA", filter: "blur(80px)", opacity: 0.2, top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "float 6s ease-in-out infinite 2s" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 780 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "rgba(108,58,232,0.2)", border: "1px solid rgba(108,58,232,0.4)", borderRadius: 40, fontSize: 13, fontWeight: 600, color: "#C4AAFF", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, background: "#00D4AA", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
            O'zbekistondagi №1 shartnoma tizimi
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 68, fontWeight: 800, lineHeight: 1.08, marginBottom: 24 }}>
            Shartnomangizni{" "}
            <span style={{ background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              30 soniyada
            </span>{" "}
            tayyorlang
          </h1>

          <p style={{ fontSize: 18, color: "rgba(240,237,255,0.6)", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Rekvizitlarni qayta-qayta yozish vaqti tugadi. Bir marta sozlab qo'ying — har doim tayyor. PDF va Word formatida yuklab oling.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => onNavigate("register")} style={{ padding: "16px 36px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", color: "white", fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(108,58,232,0.45)" }}>
              Bepul boshlash →
            </button>
            <button onClick={() => onNavigate("dashboard")} style={{ padding: "16px 36px", borderRadius: 14, background: "transparent", border: "2px solid rgba(255,255,255,0.2)", color: "#F0EDFF", fontFamily: "inherit", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
              Demo ko'rish
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 60, justifyContent: "center", marginTop: 72 }}>
            {[["2 000+", "Foydalanuvchi"], ["15 000+", "Shartnoma yaratildi"], ["3 sek", "O'rtacha vaqt"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
                <div style={{ fontSize: 13, color: "rgba(240,237,255,0.5)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QANDAY ISHLAYDI ── */}
      <section id="Qanday ishlaydi" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00D4AA", marginBottom: 16 }}>Qanday ishlaydi</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, marginBottom: 16 }}>3 qadamda tayyor shartnoma</h2>
        <p style={{ fontSize: 17, color: "rgba(240,237,255,0.55)", maxWidth: 500, lineHeight: 1.7, marginBottom: 60 }}>Murakkab jarayonlar yo'q. Sodda, tez va ishonchli.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { num: "01", icon: "👤", title: "Bir marta sozlang", desc: "Korxona rekvizitlaringizni bir marta kiriting. Keyingi har bir shartnomada avtomatik chiqadi." },
            { num: "02", icon: "✍️", title: "Kontragentni kiriting", desc: "Kontragent ma'lumotlarini kiriting yoki avvalgi bazadan tanlang. Tizim avtomatik to'ldiradi." },
            { num: "03", icon: "📄", title: "Yuklab oling", desc: "PDF yoki Word formatida yuklab oling. didox.uz orqali kontragentga yuboring." },
          ].map(s => (
            <div key={s.num} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "36px 28px", position: "relative", overflow: "hidden", transition: "transform 0.3s,border-color 0.3s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(108,58,232,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
              <div style={{ position: "absolute", top: 16, right: 24, fontFamily: "'Syne',sans-serif", fontSize: 64, fontWeight: 800, background: "linear-gradient(135deg,#6C3AE8,#00D4AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: 0.2 }}>{s.num}</div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 24 }}>{s.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(240,237,255,0.55)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMKONIYATLAR ── */}
      <section id="Imkoniyatlar" style={{ padding: "20px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00D4AA", marginBottom: 16 }}>Imkoniyatlar</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, marginBottom: 60 }}>Sizga kerak bo'lgan hamma narsa</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {[
            { icon: "📋", title: "3 turdagi shablon", desc: "Xizmat, oldi-sotdi, ijara — bepul tayyor shablonlar. O'z shablonlaringizni ham qo'shing." },
            { icon: "🌐", title: "Ikki tilli shartnoma", desc: "Xalqaro shartnomalar uchun O'zbek + Ingliz/Rus, yonma-yon A4 landscape formatida." },
            { icon: "🏢", title: "Kontragentlar bazasi", desc: "Avval ishlashilgan kontragentlar saqlanadi. Keyingi safar bir qidiruv bilan topiladi." },
            { icon: "🔄", title: "Ikkilamchi rekvizitlar", desc: "Bir nechta hisob raqamlaringiz bormi? Shartnomada bir tugma bilan almashtiring." },
            { icon: "📁", title: "Arxiv va qidiruv", desc: "Barcha shartnomalar saqlanadi. Nom, STIR yoki raqam bo'yicha bir zumda toping." },
            { icon: "⚡", title: "2-3 soniyada tayyor", desc: "Tizim optimallashtirilgan. Shartnoma 2-3 soniyada yaratiladi. Ko'p foydalanuvchi ham qotmaydi." },
          ].map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, transition: "all 0.3s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(43,142,240,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h4>
              <p style={{ fontSize: 13, color: "rgba(240,237,255,0.55)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NARXLAR ── */}
      <section id="Narxlar" style={{ padding: "20px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00D4AA", marginBottom: 16 }}>Narxlar</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, marginBottom: 60 }}>Qulay va shaffof narxlar</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { name: "Bepul", price: "0", unit: "so'm", desc: "Sinab ko'rish uchun", features: ["Oyiga 10 ta shartnoma", "3 ta shablon", "PDF + Word eksport", "Kontragentlar bazasi"], popular: false },
            { name: "Har bir shartnoma", price: "500–1000", unit: "so'm", desc: "Kam ishlatiladiganlar uchun", features: ["Cheksiz shartnomalar", "Barcha shablonlar", "Ikki tilli shartnoma", "Kontragentlar bazasi", "Arxiv va qidiruv"], popular: true },
            { name: "Pro obuna", price: "29 900", unit: "so'm/oy", desc: "Ko'p ishlatiladiganlar uchun", features: ["Cheksiz shartnomalar", "Barcha imkoniyatlar", "Ustuvor qo'llab-quvvatlash", "Yangi funksiyalar birinchi"], popular: false },
          ].map(p => (
            <div key={p.name} style={{ background: p.popular ? "rgba(108,58,232,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${p.popular ? "#6C3AE8" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "36px 28px", textAlign: "center", position: "relative" }}>
              {p.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6C3AE8,#2B8EF0)", padding: "6px 20px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>🔥 Mashhur</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,255,0.5)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{p.name}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 800, marginBottom: 6 }}>{p.price} <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(240,237,255,0.5)" }}>{p.unit}</span></div>
              <div style={{ fontSize: 13, color: "rgba(240,237,255,0.5)", marginBottom: 28 }}>{p.desc}</div>
              <ul style={{ listStyle: "none", textAlign: "left", marginBottom: 32 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(240,237,255,0.6)", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#00D4AA", fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => onNavigate("register")} style={{ width: "100%", padding: "14px", borderRadius: 12, border: p.popular ? "none" : "2px solid rgba(255,255,255,0.2)", background: p.popular ? "linear-gradient(135deg,#6C3AE8,#2B8EF0)" : "transparent", color: "#F0EDFF", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                {p.popular ? "Boshlash →" : "Boshlash"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOG'LANISH ── */}
      <section id="Bog'lanish" style={{ margin: "0 40px 100px", borderRadius: 24, background: "linear-gradient(135deg,#6C3AE8,#2B8EF0,#00D4AA)", padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 800, marginBottom: 16 }}>Bugun boshlamaysizmi?</h2>
        <p style={{ fontSize: 18, opacity: 0.88, marginBottom: 40 }}>10 ta shartnoma bepul. Karta kerak emas. 2 daqiqada ro'yxatdan o'ting.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => onNavigate("register")} style={{ padding: "16px 36px", borderRadius: 14, border: "none", background: "white", color: "#6C3AE8", fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Bepul boshlash →
          </button>
          <a href="https://t.me/shartnoma_uz" target="_blank" rel="noreferrer" style={{ padding: "16px 36px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "transparent", color: "white", fontFamily: "inherit", fontSize: 16, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            📱 Telegram
          </a>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#0A0715} ::-webkit-scrollbar-thumb{background:#6C3AE8;border-radius:3px}
      `}</style>
    </div>
  );
}
