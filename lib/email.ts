import { Resend } from 'resend'

const FROM = 'Shartnoma.uz <noreply@shartnoma.uz>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function sendSubscriptionReminder({
  to,
  orgName,
  daysLeft,
  periodEnd,
}: {
  to: string
  orgName: string
  daysLeft: number
  periodEnd: string
}) {
  const endDate = new Date(periodEnd).toLocaleDateString('uz-UZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const urgency = daysLeft === 1 ? '🔴 BUGUN' : daysLeft <= 2 ? '🟠' : '🟡'
  const subject = `${urgency} Obunangiz ${daysLeft === 1 ? 'bugun' : daysLeft + ' kunda'} tugaydi — ${orgName}`

  const html = `
<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1d27;border-radius:16px;overflow:hidden;border:1px solid #2d3148;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;">
      <div style="font-size:22px;font-weight:700;color:#fff;">📋 Shartnoma.uz</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Obuna eslatmasi</div>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">
      <p style="color:#9ca3af;font-size:14px;margin:0 0 8px;">Hurmatli foydalanuvchi,</p>
      <h2 style="color:#fff;font-size:20px;margin:0 0 20px;line-height:1.4;">
        <strong style="color:#f59e0b;">${orgName}</strong> tashkilotingiz uchun<br>
        obuna muddati ${daysLeft === 1 ? '<span style="color:#ef4444">bugun tugaydi</span>' : `<span style="color:#f59e0b">${daysLeft} kunda tugaydi</span>`}
      </h2>

      <!-- Info box -->
      <div style="background:#0f1117;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;">Tashkilot</span>
          <span style="color:#fff;font-size:13px;font-weight:600;">${orgName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;">Muddat tugash sanasi</span>
          <span style="color:#f59e0b;font-size:13px;font-weight:600;">${endDate}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#6b7280;font-size:13px;">Qolgan kunlar</span>
          <span style="color:${daysLeft <= 2 ? '#ef4444' : '#f59e0b'};font-size:13px;font-weight:700;">${daysLeft} kun</span>
        </div>
      </div>

      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Obuna muddati tugagach, shartnoma yaratish, AI yordamchi va boshqa premium funksiyalar
        <strong style="color:#fff;">cheklanadi</strong>. Uzluksiz ishlash uchun obunani yangilang.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://shartnoma-uz.vercel.app/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">
          Obunani yangilash →
        </a>
      </div>

      <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">
        Agar bu xabar sizga tegishli emas deb o'ylasangiz, uni e'tiborsiz qoldiring.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #2d3148;padding:20px 36px;text-align:center;">
      <p style="color:#4b5563;font-size:12px;margin:0;">
        © 2026 Shartnoma.uz · Avtomatik xabar
      </p>
    </div>
  </div>
</body>
</html>`

  await getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendContractSigned({
  to,
  orgName,
  contractNumber,
  contractType,
  counterpartyName,
}: {
  to: string
  orgName: string
  contractNumber: string
  contractType: string
  counterpartyName: string
}) {
  const subject = `✅ Shartnoma imzolandi — ${contractNumber}`
  const html = `
<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1d27;border-radius:16px;overflow:hidden;border:1px solid #2d3148;">
    <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 36px;">
      <div style="font-size:22px;font-weight:700;color:#fff;">📋 Shartnoma.uz</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Imzolash xabarnomasi</div>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">
        ✅ Shartnoma ikki tomonlama imzolandi
      </h2>
      <div style="background:#0f1117;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;">Shartnoma №</span>
          <span style="color:#10b981;font-size:13px;font-weight:700;">${contractNumber}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;">Tur</span>
          <span style="color:#fff;font-size:13px;">${contractType}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;">Tashkilot</span>
          <span style="color:#fff;font-size:13px;">${orgName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#6b7280;font-size:13px;">Kontragent</span>
          <span style="color:#fff;font-size:13px;">${counterpartyName}</span>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="https://shartnoma-uz.vercel.app/dashboard/shartnomalar"
          style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">
          Shartnomani ko'rish →
        </a>
      </div>
    </div>
    <div style="border-top:1px solid #2d3148;padding:20px 36px;text-align:center;">
      <p style="color:#4b5563;font-size:12px;margin:0;">© 2026 Shartnoma.uz · Avtomatik xabar</p>
    </div>
  </div>
</body>
</html>`
  await getResend().emails.send({ from: FROM, to, subject, html })
}
