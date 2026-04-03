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

// Extract STIR from Uzbekistan e-imzo certificate
function extractStir(cert: forge.pki.Certificate): string {
  // UZ TIN OID: 1.2.860.3.16.1.2
  for (const attr of cert.subject.attributes) {
    if (attr.type === '1.2.860.3.16.1.2') return String(attr.value)
  }
  // Fallback: serialNumber or CN
  const sn = cert.subject.getField('serialNumber')
  if (sn) return String(sn.value)
  const cn = cert.subject.getField('CN')
  if (cn) return String(cn.value)
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { challengeId, signatureB64, certificateB64 } = await req.json()

    // 1. Get and consume challenge
    const challenge = consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge muddati o\'tgan yoki noto\'g\'ri' }, { status: 400 })
    }

    // 2. Parse certificate
    const certDer = forge.util.decode64(certificateB64)
    const certAsn1 = forge.asn1.fromDer(certDer)
    const cert = forge.pki.certificateFromAsn1(certAsn1)

    // 3. Verify signature
    const md = forge.md.sha256.create()
    md.update(challenge)
    const sigBytes = forge.util.decode64(signatureB64)
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey
    const verified = publicKey.verify(md.digest().bytes(), sigBytes)
    if (!verified) {
      return NextResponse.json({ error: 'Elektron imzo noto\'g\'ri' }, { status: 400 })
    }

    // 4. Extract STIR
    const stir = extractStir(cert)
    if (!stir) {
      return NextResponse.json({ error: 'Sertifikatda STIR topilmadi' }, { status: 400 })
    }

    // 5. Find or create Supabase user by STIR
    const email = `stir_${stir}@eimzo.local`
    const secret = process.env.NEXTAUTH_SECRET || 'eimzo-fallback-secret'
    const password = createHmac('sha256', secret).update(`eimzo:${stir}`).digest('hex')

    let { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password })

    if (signInError) {
      // User doesn't exist — create it
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { stir, auth_method: 'eimzo' }
      })
      if (createError) {
        return NextResponse.json({ error: 'Foydalanuvchi yaratishda xato: ' + createError.message }, { status: 500 })
      }
      const result = await supabaseAnon.auth.signInWithPassword({ email, password })
      signInData = result.data
    }

    if (!signInData?.session) {
      return NextResponse.json({ error: 'Sessiya yaratishda xato' }, { status: 500 })
    }

    return NextResponse.json({ session: signInData.session, stir })
  } catch (e) {
    console.error('[eimzo/verify]', e)
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 })
  }
}
