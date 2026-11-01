import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, findAccount, type IdentityEnv } from '../apps/control-app/src/identity'
import type { Person } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PEOPLE_PATH } from '../apps/control-app/src/router'
import { stageLabel, stageOf } from '../apps/control-app/src/builder/people-axes.js'
import { runMigration } from './support/d1-site-factory'

/**
 * story-0ea74f39 — **existing contacts are placed on the pipeline once**, by
 * migration 0009, and the seeded platform operator starts at Invited.
 *
 * A FILE OF ITS OWN because it needs a database that has run every migration
 * BEFORE 0009 and not 0009 itself — `applySchema` runs the lot. The migrations
 * are the real SQL files, applied in the deployed order, against real D1 inside
 * workerd; the JWKS fetch is the only external boundary.
 */

const BEFORE_STAGE = [
  () => import('../db/migrations/0001_site_store.sql?raw'),
  () => import('../db/migrations/0002_revisions.sql?raw'),
  () => import('../db/migrations/0003_ticket_store.sql?raw'),
  () => import('../db/migrations/0004_identity.sql?raw'),
  () => import('../db/migrations/0005_operator_membership.sql?raw'),
  () => import('../db/migrations/0006_entitlement_subject.sql?raw'),
  () => import('../db/migrations/0007_platform_operator.sql?raw'),
  () => import('../db/migrations/0008_entitlement_revocation.sql?raw'),
]
const STAGE_MIGRATION = () => import('../db/migrations/0009_pipeline_stage.sql?raw')

const LEGACY = 'legacy-business'
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

describe('story-0ea74f39 — the one-time pipeline backfill', () => {
  it('test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited', async () => {
    for (const load of BEFORE_STAGE) await runMigration((await load()).default as string)

    // Contacts as they stood before the stage existed.
    const contacts: Array<{ id: string; invited: string | null; accepted: string | null }> = [
      { id: 'usr_legacy_1', invited: '2026-08-01T00:00:00.000Z', accepted: null },
      { id: 'usr_legacy_2', invited: '2026-08-02T00:00:00.000Z', accepted: '2026-08-03T00:00:00.000Z' },
      { id: 'usr_legacy_3', invited: null, accepted: null },
      { id: 'usr_legacy_4', invited: null, accepted: '2026-08-04T00:00:00.000Z' },
    ]
    const now = new Date().toISOString()
    for (const c of contacts) {
      await env.DB.prepare(
        'INSERT INTO users (id, tenant_id, email, status, invited_at, tos_accepted_at, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(c.id, LEGACY, `${c.id}@example.test`, 'active', c.invited, c.accepted, now, now)
        .run()
    }

    await runMigration((await STAGE_MIGRATION()).default as string)

    for (const c of contacts) {
      const row = await env.DB.prepare(
        'SELECT pipeline_stage, tos_accepted_at FROM users WHERE id = ?',
      )
        .bind(c.id)
        .first<{ pipeline_stage: string; tos_accepted_at: string | null }>()
      expect(row?.pipeline_stage, c.id).toBe(c.invited ? 'invited' : 'lead')
      expect(row?.tos_accepted_at, `${c.id} terms changed`).toBe(c.accepted)
    }
    // No row anywhere — including any a data migration seeded — disagrees with its stamp.
    const disagree = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE (invited_at IS NOT NULL AND pipeline_stage <> 'invited') " +
        "OR (invited_at IS NULL AND pipeline_stage <> 'lead')",
    ).first<{ n: number }>()
    expect(disagree?.n).toBe(0)

    // Bootstrap seeding of a platform operator, now that the column exists.
    const operator = 'seeded-operator@example.test'
    await ensurePlatformOperator(identityEnv(), operator)
    const account = await findAccount(identityEnv(), operator)
    expect(account).toBeTruthy()
    const seeded = await env.DB.prepare(
      'SELECT invited_at, pipeline_stage FROM users WHERE tenant_id = ? AND email = ?',
    )
      .bind(PLATFORM, operator)
      .first<{ invited_at: string | null; pipeline_stage: string }>()
    expect(seeded?.invited_at).toBeTruthy()
    expect(seeded?.pipeline_stage).toBe('invited')

    // And it reads as Invited through the people API.
    await acceptTerms(identityEnv(), account!.id)
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
