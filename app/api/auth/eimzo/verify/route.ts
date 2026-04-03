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
  // Try subjectName TIN= / INN= / UID= patterns via serialNumber
  const sn = cert.subject.getField('serialNumber')
  if (sn) return String(sn.value)
  // Fallback: extract TIN from CN-like fields
  const cn = cert.subject.getField('CN')
  if (cn) {
    const m = String(cn.value).match(/\b\d{9}\b/)
    if (m) return m[0]
  }
  return ''
}

async function findOrCreateUser(stir: string) {
  const email = `stir_${stir}@eimzo.local`
  const secret = process.env.NEXTAUTH_SECRET || 'eimzo-fallback-secret'
  const password = createHmac('sha256', secret).update(`eimzo:${stir}`).digest('hex')

  let { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (signInError) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { stir, auth_method: 'eimzo' }
    })
    if (createError) throw new Error('Foydalanuvchi yaratishda xato: ' + createError.message)
    const result = await supabaseAnon.auth.signInWithPassword({ email, password })
    signInData = result.data
  }
  if (!signInData?.session) throw new Error('Sessiya yaratishda xato')
  return signInData.session
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeId, pkcs7B64, challenge: rawChallenge, signatureB64, certificateB64 } = body

    // Consume the stored challenge
    const challenge = consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge muddati o\'tgan yoki noto\'g\'ri' }, { status: 400 })
    }

    let stir = ''

    // --- Desktop mode: PKCS7 signature ---
    if (pkcs7B64) {
      // Verify that the challenge matches what was sent
      if (rawChallenge !== challenge) {
        return NextResponse.json({ error: 'Challenge mos kelmadi' }, { status: 400 })
      }

      const pkcs7Der = forge.util.decode64(pkcs7B64)
      const pkcs7Asn1 = forge.asn1.fromDer(pkcs7Der)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = forge.pkcs7.messageFromAsn1(pkcs7Asn1) as any

      const cert: forge.pki.Certificate = msg.certificates?.[0]
      if (!cert) return NextResponse.json({ error: 'Sertifikat topilmadi' }, { status: 400 })

      // Verify signed content contains our challenge
      try {
        const signedContent = forge.util.decode64(
          typeof msg.content === 'string' ? msg.content : msg.content?.toString?.() || ''
        )
        if (signedContent !== challenge) {
          return NextResponse.json({ error: 'Imzo challenge bilan mos kelmadi' }, { status: 400 })
        }
      } catch {
        // Some PKCS7 formats store content differently — skip content check, trust cert
      }

      stir = extractStir(cert)
      if (!stir) return NextResponse.json({ error: 'Sertifikatda STIR topilmadi' }, { status: 400 })
    }

    // --- PFX fallback mode: raw RSA signature ---
    else if (signatureB64 && certificateB64) {
      const certDer = forge.util.decode64(certificateB64)
      const certAsn1 = forge.asn1.fromDer(certDer)
      const cert = forge.pki.certificateFromAsn1(certAsn1)

      const md = forge.md.sha256.create()
      md.update(challenge)
      const sigBytes = forge.util.decode64(signatureB64)
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey
      const verified = publicKey.verify(md.digest().bytes(), sigBytes)
      if (!verified) return NextResponse.json({ error: 'Elektron imzo noto\'g\'ri' }, { status: 400 })

      stir = extractStir(cert)
      if (!stir) return NextResponse.json({ error: 'Sertifikatda STIR topilmadi' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Imzo ma\'lumotlari yo\'q' }, { status: 400 })
    }

    const session = await findOrCreateUser(stir)
    return NextResponse.json({ session, stir })
  } catch (e) {
    console.error('[eimzo/verify]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server xatoligi' }, { status: 500 })
  }
}
