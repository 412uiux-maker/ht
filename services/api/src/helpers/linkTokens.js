const crypto = require('crypto')

// In-memory token store: token → { vet_id, expires_at }
// Single-use, 15-minute TTL. Acceptable for MVP single-instance deployment.
const tokens = new Map()

function createLinkToken(vetId) {
  const token = crypto.randomBytes(16).toString('hex')
  tokens.set(token, { vet_id: vetId, expires_at: Date.now() + 15 * 60 * 1000 })
  // Prune stale entries opportunistically
  if (tokens.size > 1000) {
    const now = Date.now()
    for (const [k, v] of tokens) { if (v.expires_at < now) tokens.delete(k) }
  }
  return token
}

function consumeLinkToken(token) {
  const entry = tokens.get(token)
  if (!entry || entry.expires_at < Date.now()) return null
  tokens.delete(token) // single-use
  return entry.vet_id
}

module.exports = { createLinkToken, consumeLinkToken }
