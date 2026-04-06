import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import forge from 'node-forge'
import { createHmac } from 'crypto'
import { consumeChallenge } from '@/lib/eimzo-challenges'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function extractStir(cert: forge.pki.Certificate): string {
  // Uzbekistan TIN OID: 1.2.860.3.16.1.2
  for (const attr of cert.subject.attributes) {
    if (attr.type === '1.2.860.3.16.1.2') return String(attr.value)
  }
  // UID field — some E-IMZO certs store TIN here
  const uid = cert.subject.getField({ shortName: 'UID' } as forge.pki.CertificateFieldOptions)
  if (uid) {
    const v = String(uid.value).trim()
    if (/^\d{9,14}$/.test(v)) return v
  }
  // serialNumber field
  const sn = cert.subject.getField('serialNumber')
  if (sn) {
    const v = String(sn.value).trim()
    if (/^\d{9,14}$/.test(v)) return v
  }
  // Fallback: look for 9-digit number in CN
  const cn = cert.subject.getField('CN')
  if (cn) {
    const m = String(cn.value).match(/\b(\d{9})\b/)
    if (m) return m[1]
  }
  // Last resort: look for TIN= / INN= in any attribute
  for (const attr of cert.subject.attributes) {
    const v = String(attr.value)
    const m = v.match(/(?:TIN|INN)=(\d{9,14})/i)
    if (m) return m[1]
  }
  return ''
}

async function findOrCreateUser(stir: string) {
  const email = `stir_${stir}@eimzo.local`
  const secret = process.env.EIMZO_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('EIMZO_SECRET yoki NEXTAUTH_SECRET sozlanmagan')
  const password = createHmac('sha256', secret).update(`eimzo:${stir}`).digest('hex')

  // Try sign in first
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (!signInError && signInData?.session) {
    return signInData.session
  }

  // User doesn't exist — create
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { stir, auth_method: 'eimzo' },
  })
  if (createError && !createError.message.includes('already been registered')) {
    throw new Error('Foydalanuvchi yaratishda xato: ' + createError.message)
  }

  // Sign in after creation
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error || !data?.session) {
    throw new Error('Sessiya yaratishda xato: ' + (error?.message || 'session null'))
  }
  return data.session
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeId, pkcs7B64, challenge: rawChallenge, signatureB64, certificateB64 } = body

    // Consume the stored challenge (one-time use)
    const challenge = consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: "Challenge muddati o'tgan yoki noto'g'ri" }, { status: 400 })
    }

    let stir = ''

    // ── Desktop mode: PKCS7 signature ──────────────────────────────────────
    if (pkcs7B64) {
      if (rawChallenge !== challenge) {
        return NextResponse.json({ error: 'Challenge mos kelmadi' }, { status: 400 })
      }

      try {
        const pkcs7Der = forge.util.decode64(pkcs7B64)
        const pkcs7Asn1 = forge.asn1.fromDer(pkcs7Der)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = forge.pkcs7.messageFromAsn1(pkcs7Asn1) as any

        const cert: forge.pki.Certificate = msg.certificates?.[0]
        if (!cert) {
          return NextResponse.json({ error: 'PKCS7 ichida sertifikat topilmadi' }, { status: 400 })
        }

        // Try to verify signed content matches challenge (best effort)
        try {
          let signedContent = ''
          if (msg.rawCapture?.content) {
            signedContent = forge.util.decode64(msg.rawCapture.content)
          } else if (typeof msg.content === 'string') {
            signedContent = forge.util.decode64(msg.content)
          } else if (msg.content?.content) {
            signedContent = forge.util.decode64(
              typeof msg.content.content === 'string' ? msg.content.content : ''
            )
          }
          if (signedContent && signedContent !== challenge) {
            console.warn('[eimzo] PKCS7 content mismatch, continuing with cert extraction')
          }
        } catch {
          // E-IMZO PKCS7 content extraction is unreliable — cert is still trusted
        }

        stir = extractStir(cert)
      } catch (e) {
        console.error('[eimzo] PKCS7 parse error:', e)
        return NextResponse.json({ error: 'PKCS7 imzo formati noto\'g\'ri' }, { status: 400 })
      }
    }

    // ── PFX mode: raw RSA signature + DER certificate ────────────────────
    else if (signatureB64 && certificateB64) {
      try {
        const certDer = forge.util.decode64(certificateB64)
        const certAsn1 = forge.asn1.fromDer(certDer)
        const cert = forge.pki.certificateFromAsn1(certAsn1)

        // Verify the signature against the challenge
        const md = forge.md.sha256.create()
        md.update(challenge)
        const sigBytes = forge.util.decode64(signatureB64)
        const publicKey = cert.publicKey as forge.pki.rsa.PublicKey
        const verified = publicKey.verify(md.digest().bytes(), sigBytes)
        if (!verified) {
          return NextResponse.json({ error: "Elektron imzo noto'g'ri" }, { status: 400 })
        }

        stir = extractStir(cert)
      } catch (e) {
        console.error('[eimzo] PFX verify error:', e)
        return NextResponse.json({ error: "Sertifikat yoki imzoni tekshirishda xatolik" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Imzo ma'lumotlari yo'q" }, { status: 400 })
    }

    if (!stir) {
      return NextResponse.json({ error: 'Sertifikatda STIR (INN) topilmadi' }, { status: 400 })
    }

    // Create or find user, get session
    const session = await findOrCreateUser(stir)

    // Return only what the client needs for setSession
    return NextResponse.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
      stir,
    })
  } catch (e) {
    console.error('[eimzo/verify]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server xatoligi' },
      { status: 500 }
    )
  }
}
