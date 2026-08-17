/**
 * A stand-in Cloudflare Access team, for tests that must drive the control app
 * through its gate (REQ-147).
 *
 * WHY A REAL HTTP SERVER. The Worker fetches its team's JWKS over the network
 * and verifies an RS256 signature against it. A test that stubbed either half
 * would prove the stub — and these tests run the Worker inside real workerd
 * (`unstable_dev`), where there is no global to stub anyway. So this publishes a
 * real `/cdn-cgi/access/certs` on loopback and mints real signatures against it.
 * `ACCESS_TEAM_DOMAIN` accepts the `http://127.0.0.1:<port>` origin because the
 * team domain is normalised, not pattern-matched — which is exactly what makes
 * the gate testable without a Cloudflare account.
 */
import { createServer, type Server } from 'node:http'
import { webcrypto } from 'node:crypto'

const crypto = webcrypto as unknown as Crypto

export interface AccessTeam {
  /** Origin to set as `ACCESS_TEAM_DOMAIN`, e.g. `http://127.0.0.1:54321`. */
  teamDomain: string
  /** The AUD tag to set as `ACCESS_AUD`. */
  aud: string
  /** A valid token, and the header a caller presents it in. */
  token(claims?: Record<string, unknown>): Promise<string>
  headers(claims?: Record<string, unknown>): Promise<Record<string, string>>
  close(): Promise<void>
}

function b64url(input: Uint8Array | string): string {
  const raw =
    typeof input === 'string' ? input : Array.from(input, (b) => String.fromCharCode(b)).join('')
  return Buffer.from(raw, 'binary').toString('base64url')
}

export async function startAccessTeam(): Promise<AccessTeam> {
  const aud = 'f'.repeat(64)
  const pair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const jwks = JSON.stringify({ keys: [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] })

  const server: Server = createServer((req, res) => {
    if (req.url === '/cdn-cgi/access/certs') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(jwks)
      return
    }
    res.writeHead(404)
    res.end('not found')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('no port')
  const teamDomain = `http://127.0.0.1:${address.port}`

  const token = async (claims: Record<string, unknown> = {}) => {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', kid: 'test-key', typ: 'JWT' }
    const payload = {
      iss: teamDomain,
      aud: [aud],
      iat: now,
      nbf: now,
      exp: now + 3600,
      email: 'uat@westhead.me',
      ...claims,
    }
    const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      pair.privateKey,
      new TextEncoder().encode(signed),
    )
    return `${signed}.${b64url(new Uint8Array(signature))}`
  }

  return {
    teamDomain,
    aud,
    token,
    headers: async (claims) => ({ 'cf-access-jwt-assertion': await token(claims) }),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
