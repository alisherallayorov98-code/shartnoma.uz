// In-memory challenge store for E-IMZO authentication
// Each challenge expires after 5 minutes

interface ChallengeEntry {
  challenge: string
  expires: number
}

const challenges = new Map<string, ChallengeEntry>()

// Clean up expired challenges
function cleanup() {
  const now = Date.now()
  for (const [id, entry] of challenges) {
    if (now > entry.expires) challenges.delete(id)
  }
}

export function storeChallenge(id: string, challenge: string) {
  cleanup()
  challenges.set(id, { challenge, expires: Date.now() + 5 * 60 * 1000 })
}

export function consumeChallenge(id: string): string | null {
  const entry = challenges.get(id)
  if (!entry || Date.now() > entry.expires) return null
  challenges.delete(id)
  return entry.challenge
}
