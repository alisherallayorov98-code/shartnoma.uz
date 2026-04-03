import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { storeChallenge } from '@/lib/eimzo-challenges'

export async function GET() {
  const id = randomBytes(16).toString('hex')
  const challenge = randomBytes(32).toString('hex')
  storeChallenge(id, challenge)
  return NextResponse.json({ id, challenge })
}
