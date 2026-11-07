import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import type { Person } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PEOPLE_PATH } from '../apps/control-app/src/router'
import { stageLabel, stageOf } from '../apps/control-app/src/builder/people-axes.js'
import { applySchema } from './support/d1-site-factory'
import { personByEmail } from './support/person'

/**
 * story-0ea74f39 — **the pipeline stage is a baseline column**, and the seeded
 * platform operator's stage agrees with its invite stamp.
 *
 * THERE IS NO BACKFILL TO TEST ANY MORE. The pipeline stage used to arrive in
 * its own migration, which placed existing contacts on the pipeline by their
 * invite stamp. The [[REQ-190]] rebaseline folded every prior migration into
 * `0001_baseline.sql` with `pipeline_stage TEXT NOT NULL DEFAULT 'lead'` as an
 * ordinary column, and the database was wiped rather than migrated — so there
 * are no pre-existing contacts for any migration to place. What survives of the
 * old claim is what a fresh database still has to get right: a contact nobody
 * staged is a Lead, and the one row bootstrap seeds does not carry a stamp its
 * stage contradicts.
 *
 * Real baseline SQL against real D1 inside workerd; the JWKS fetch is the only
 * external boundary.
 */

const PLATFORM = 'migration-platform'
const TEAM = 'https://migration-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mintWith(signing: CryptoKeyPair, email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'migration-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-0ea74f39 — the pipeline stage on the baseline schema', () => {
  it('test_UAT_AC2208_unstaged_contact_is_lead_and_seeded_operator_stage_agrees_with_its_stamp', async () => {
    await applySchema()
    const now = new Date().toISOString()

    // (a) A contact written without naming a stage — with and without an invite
    // stamp — is stored at `lead`: the column's default, not a derivation.
    // Raw SQL on purpose: the claim is about the schema, and every product write
    // path names the stage explicitly.
    for (const [id, invited] of [
      ['usr_unstaged_1', null],
      ['usr_unstaged_2', '2026-08-01T00:00:00.000Z'],
    ] as const) {
      const accountId = `acct_${id}`
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO accounts (id, tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ).bind(accountId, PLATFORM, now, now),
        env.DB.prepare(
          'INSERT INTO users (id, tenant_id, account_id, invited_at, created_at, updated_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(id, PLATFORM, accountId, invited, now, now),
      ])
      const stored = await env.DB.prepare('SELECT pipeline_stage FROM users WHERE id = ?')
        .bind(id)
        .first<{ pipeline_stage: string }>()
      expect(stored?.pipeline_stage, id).toBe('lead')
    }

    // (b) Bootstrap seeding of a platform operator on the fresh database.
    const operator = 'seeded-operator@example.test'
    await ensurePlatformOperator(identityEnv(), operator)
    const person = await personByEmail(identityEnv(), PLATFORM, operator)
    expect(person).toBeTruthy()
    const seeded = await env.DB.prepare('SELECT invited_at, pipeline_stage FROM users WHERE id = ?')
      .bind(person!.id)
      .first<{ invited_at: string | null; pipeline_stage: string }>()
    // The stamp and the stage agree: an invite time is set, so the stage is `invited`.
    expect(seeded?.invited_at).toBeTruthy()
    expect(seeded?.pipeline_stage).toBe('invited')

    // Seeding again — every admission by a holder re-runs it — writes no second
    // row and does not move the stage.
    await ensurePlatformOperator(identityEnv(), operator)
    const again = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM user_emails WHERE tenant_id = ? AND email = ?',
    )
      .bind(PLATFORM, operator)
      .first<{ n: number }>()
    expect(again?.n).toBe(1)

    // (c) And it reads as Invited through the people API.
    await acceptTerms(identityEnv(), person!.id)
    const params = {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    }
    const signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
    const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
    const jwks = { keys: [{ ...jwk, kid: 'migration-key', alg: 'RS256', use: 'sig' }] }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (url === certsUrl(TEAM)) {
          return new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } })
        }
        throw new Error(`unexpected fetch to ${url}`)
      }),
    )
    const response = await worker.fetch(
      new Request(`https://app.example/b/${PLATFORM}${PEOPLE_PATH}`, {
        headers: { 'cf-access-jwt-assertion': await mintWith(signing, operator) },
      }),
      workerEnv(),
    )
    expect(response.status).toBe(200)
    const people = (await response.json<{ people: Person[] }>()).people
    const them = people.find((p) => p.email === operator)!
    expect(them.pipelineStage).toBe('invited')
    expect(stageLabel(stageOf(them))).toBe('Invited')
  })
})
