import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import {
  passwordlessFor,
  purgeSessions,
  sessionIdentity,
  SESSION_PREEMPT_MS,
  SESSION_TTL_MS,
  SIGN_IN_PATH,
  SIGN_OUT_PATH,
} from '../apps/control-app/src/sessions'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-231 — **the rotated credential actually reaches the browser.**
 *
 * WHAT MAKES THIS EVIDENCE, AND WHY IT IS NOT THE COMPONENT'S CONTRACT AGAIN.
 * `test_UAT_FC_REQ-202_conformance` runs the shipped contract — rotation cases
 * included — against this deployment's D1 and migration, so *the component works
 * here* is already proved and is deliberately not restated. Every case below
 * drives `worker.fetch` (or `worker.scheduled`) inside workerd instead, because
 * the thing this ticket adds is entirely OUTSIDE the component: the component
 * hands back a `Set-Cookie` and this repository is obliged to send it.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR, in the order they would hurt:
 *
 *   - *`sessionIdentity` maps three fields and drops `setCookie`* — the shape it
 *     had before this ticket, and correct until the component had something else
 *     to say. The server rotates, the browser goes on presenting the retired id,
 *     and everybody is signed out one grace window later.
 *   - *the header is appended on the happy path and not on a refusal or a throw*
 *     — the rotation has already been written to the database by then, so the
 *     credential a refused request was holding is dead and its replacement was
 *     never delivered. Worse than the first failure, because it only bites the
 *     people already having a bad time.
 *   - *rotation lengthens the session* — the one property that makes a 180-day
 *     interval honest rather than an idle timeout in disguise.
 *   - *pre-emption fires on something that is not a navigation* — an XHR that
 *     follows a 303 gets HTML where it expected JSON, silently.
 *   - *a migrated session loses `origin_id`* — ending that sign-in becomes a
 *     DELETE matching nothing, so sign-out leaves a live credential behind.
 *   - *nothing sweeps the retired rows* — the seven-day evidence window never
 *     closes and the table grows by one row per visit per person.
 */

const PLATFORM = 'req231-platform'
const HOST = 'app.req231.test'
const ORIGIN = `https://${HOST}`
const COOKIE_DOMAIN = 'req231.test'
const COOKIE_NAME = 'session'
const FROM = 'no-reply@req231.test'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

/**
 * The whole Worker environment.
 *
 * ACCESS IS CONFIGURED WITH VALUES NOTHING CAN VERIFY, ON PURPOSE. Their only
 * job is to make `isUnconfiguredLocalDev` false, so the identity path below is
 * the real one — session first, gate second. A request carrying a live cookie
 * never reaches `guardAccess`, and one that does not is refused, which is
 * exactly the shape these cases want.
 */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    MAIL_FROM: FROM,
    SESSION_COOKIE_NAME: COOKIE_NAME,
    SESSION_COOKIE_DOMAIN: COOKIE_DOMAIN,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: 'https://req231-team.cloudflareaccess.com',
    ACCESS_AUD: 'f'.repeat(64),
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function call(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), workerEnv())
}

/** A navigation, as a browser announces one — see `isNavigation`. */
function navigate(path: string, cookie: string) {
  return call(path, { headers: { cookie, 'sec-fetch-mode': 'navigate' } })
}

const cookieHeaderFrom = (setCookie: string): string => setCookie.split(';')[0]
const valueOf = (cookieHeader: string): string => cookieHeader.split('=').slice(1).join('=')

let seq = 0

/** A 1st Contact account, entitled and past the terms gate. */
async function aMember(): Promise<{ email: string; userId: string }> {
  const email = `req231-${(seq += 1)}@example.test`
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id }
}

/**
 * Sign somebody in through the real routes and return the `Cookie` header a
 * browser would send back.
 *
 * THE TOKEN IS READ OUT OF THE TABLE RATHER THAN OUT OF THE MAILED MESSAGE.
 * `test_UAT_FC_REQ-202_a_link_is_rendered_recorded_and_sent_as_one_message`
 * already proves the message path end to end; repeating it here would make every
 * case below depend on the template store for a session it only needs to exist.
 */
async function signIn(email: string): Promise<string> {
  const issued = await call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(issued.status, 'the issue route refused').toBeLessThan(400)
  const token = await env.DB.prepare(
    'SELECT id FROM login_tokens WHERE used_at IS NULL ORDER BY created_at DESC, rowid DESC LIMIT 1',
  ).first<{ id: string }>()
  expect(token, 'no token was minted for this address').not.toBeNull()
  const redeemed = await call(`${SIGN_IN_PATH}/${token!.id}`, { method: 'POST' })
  const setCookie = redeemed.headers.get('set-cookie')
  expect(setCookie, 'redeeming handed back no cookie').toBeTruthy()
  return cookieHeaderFrom(setCookie!)
}

/** Every bearer of one subject's sign-ins, live and retired. */
async function bearersOf(subjectId: string) {
  const rows = await env.DB.prepare(
    'SELECT id, origin_id, expires_at, created_at, issued_at, retired_at, superseded_by ' +
      'FROM sessions WHERE subject_id = ? ORDER BY issued_at',
  )
    .bind(subjectId)
    .all<{
      id: string
      origin_id: string | null
      expires_at: string
      created_at: string
      issued_at: string | null
      retired_at: string | null
      superseded_by: string | null
    }>()
  return rows.results
}

/**
 * Age a session so the next request is the start of a visit.
 *
 * TIME IS THE ONE THING A REQUEST CANNOT CARRY. `worker.fetch` takes a request
 * and an environment and has no clock seam — correctly, because a production
 * Worker has no reason to be told what time it is — so a case that needs half an
 * hour to have passed moves the only thing that records elapsed time. This is
 * ageing the fixture, not reaching past the component: `last_seen_at` is the
 * value a real half-hour of silence would have left behind, and everything the
 * component then decides it decides for itself.
 */
async function fallSilent(sessionId: string, agoMs = 60 * 60_000): Promise<void> {
  await env.DB.prepare('UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2')
    .bind(new Date(Date.now() - agoMs).toISOString(), sessionId)
    .run()
}

/** Move a sign-in's deadline, without touching any other clock. */
async function endsIn(subjectId: string, ms: number): Promise<void> {
  await env.DB.prepare('UPDATE sessions SET expires_at = ?1 WHERE subject_id = ?2')
    .bind(new Date(Date.now() + ms).toISOString(), subjectId)
    .run()
}

/**
 * Run `0002` the way `wrangler d1 migrations apply` runs it — statement by
 * statement, off the file on disk.
 *
 * THE FILE AND NOT A RESTATEMENT OF IT. A fixture with its own DDL proves the
 * fixture, and would go on passing after the migration that ships had drifted
 * from it.
 */
async function applyRotationMigration(): Promise<void> {
  const migration = (await import('../db/migrations/0002_session_rotation.sql?raw')).default
  const statements = migration
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
  for (const statement of statements) await env.DB.prepare(statement).run()
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-231 — the obligation', () => {
  it('test_UAT_FC_REQ-231_a_visit_after_silence_answers_with_a_rotated_cookie_the_browser_can_use', async () => {
    // THE WHOLE TICKET IN ONE CASE. Somebody comes back after a break; the
    // server replaces the credential under them and has to say so; the value it
    // said resolves to the same person on the next request, and the one it
    // replaced does not survive its grace window.
    const { email, userId } = await aMember();
    const cookie = await signIn(email)
    const [first] = await bearersOf(userId)
    await fallSilent(first.id)

    const visit = await navigate('/', cookie)

    const setCookie = visit.headers.get('set-cookie')
    expect(setCookie, 'the response carried no rotated cookie').toBeTruthy()
    expect(setCookie).toContain(`${COOKIE_NAME}=`)
    const rolled = cookieHeaderFrom(setCookie!)
    expect(valueOf(rolled), 'the cookie value did not change').not.toBe(valueOf(cookie))

    // AND IT IS A CREDENTIAL, not merely a different string: the next request on
    // it resolves to the same person.
    const who = await sessionIdentity(workerEnv(), PLATFORM, rolled)
    expect(who?.subjectId).toBe(userId)
    expect(who?.email).toBe(email)

    // The predecessor is retired and points at what replaced it, which is what
    // lets a request that raced the rotation still be answered.
    const bearers = await bearersOf(userId)
    expect(bearers.length).toBe(2)
    const retired = bearers.find((b) => b.id === first.id)!
    expect(retired.retired_at).not.toBeNull()
    expect(retired.superseded_by).toBe(valueOf(rolled))
  })

  it('test_UAT_FC_REQ-231_a_refused_request_still_carries_the_rotated_cookie', async () => {
    // THE FAILURE THAT ONLY BITES THE PEOPLE ALREADY HAVING A BAD TIME. The
    // rotation is written to the database by the time the refusal is decided, so
    // a refusal that dropped the header would leave its holder presenting an id
    // the server has retired — signed out by a 403 they could otherwise have
    // simply navigated away from.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    const [first] = await bearersOf(userId)
    await fallSilent(first.id)

    // A business that is not theirs. `resolveScope` throws `ScopeRefusedError`,
    // which is caught in the handler's `catch` — the exit furthest from where
    // the rotation was read.
    const refused = await navigate('/b/biz_someone_elses/', cookie)

    expect(refused.status).toBe(403)
    const setCookie = refused.headers.get('set-cookie')
    expect(setCookie, 'a refusal dropped the rotated cookie').toBeTruthy()
    const who = await sessionIdentity(workerEnv(), PLATFORM, cookieHeaderFrom(setCookie!))
    expect(who?.subjectId).toBe(userId)
  })

  it('test_UAT_FC_REQ-231_an_ordinary_request_inside_a_visit_rotates_nothing', async () => {
    // THE OTHER HALF OF THE OBLIGATION, and the one a careless fix breaks:
    // sending a cookie on every response would be a rotation per request, which
    // is a write per request and a table that grows without bound. Rotation is
    // an event, so a `Set-Cookie` is too.
    const { email } = await aMember()
    const cookie = await signIn(email)

    const response = await navigate('/', cookie)

    expect(response.headers.get('set-cookie')).toBeNull()
  })
})

describe('REQ-231 — rotation moves no clock', () => {
  it('test_UAT_FC_REQ-231_the_sign_in_ends_when_it_always_would_however_heavily_it_is_used', async () => {
    // THE PROPERTY THAT MAKES THE LONGER INTERVAL HONEST. If rotation carried a
    // fresh `expires_at`, this would be an idle timeout wearing a different name
    // — somebody who visits daily would never sign in again, and "180 days"
    // would describe nobody. Read off the DATABASE rather than off the return
    // value, because it is the row that ends the session.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    const [minted] = await bearersOf(userId)

    let carried = cookie
    for (let visit = 0; visit < 3; visit += 1) {
      const live = (await bearersOf(userId)).find((b) => b.retired_at === null)!
      await fallSilent(live.id)
      const response = await navigate('/', carried)
      carried = cookieHeaderFrom(response.headers.get('set-cookie') ?? carried)
    }

    const bearers = await bearersOf(userId)
    expect(bearers.length, 'three visits did not produce three rotations').toBe(4)
    for (const bearer of bearers) {
      expect(bearer.expires_at, 'a rotation moved the sign-in deadline').toBe(minted.expires_at)
      expect(bearer.created_at, 'a rotation reset the sign-in start').toBe(minted.created_at)
      // Every bearer belongs to the one sign-in, which is what makes ending it
      // one indexed DELETE.
      expect(bearer.origin_id).toBe(minted.id)
    }
    // And `issued_at` is the thing that DOES move — it is what `rotateAfterMs`
    // measures, and the reason a bearer's age is not its session's age.
    expect(bearers.at(-1)!.issued_at).not.toBe(minted.issued_at)
  })

  it('test_UAT_FC_REQ-231_a_fresh_sign_in_lasts_the_interval_this_deployment_chose', async () => {
    // THE NUMBER ITSELF, because it is a decision rather than a default now and
    // an accidental revert to the component's 90 days would be invisible: every
    // test above would still pass, and the only symptom would be people being
    // mailed links twice as often.
    const { email, userId } = await aMember()
    await signIn(email)
    const [minted] = await bearersOf(userId)

    const lifetime = Date.parse(minted.expires_at) - Date.parse(minted.created_at)
    expect(Math.abs(lifetime - SESSION_TTL_MS)).toBeLessThan(60_000)
  })
})

describe('REQ-231 — spending the start of a visit rather than the middle of a task', () => {
  it('test_UAT_FC_REQ-231_a_visit_starting_near_the_end_of_a_sign_in_is_sent_to_sign_in', async () => {
    // [[ticket://lagrangefoundry/1stcontact/REQ-187]]'s unacceptable case, moved.
    // The deadline is a wall-clock instant and nothing moves it, so it arrives
    // whenever it arrives — which for somebody who uses the builder is in the
    // middle of using the builder. This is the one moment it costs nothing.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    await endsIn(userId, SESSION_PREEMPT_MS - 60 * 60_000)
    await fallSilent((await bearersOf(userId))[0].id)

    const arriving = await navigate('/', cookie)

    expect(arriving.status).toBe(303)
    expect(arriving.headers.get('location')).toBe(SIGN_IN_PATH)
    // AND IT STILL CARRIES THE ROTATION, because the visit rotated the
    // credential before any of this was decided.
    expect(arriving.headers.get('set-cookie')).toBeTruthy()

    // IT DOES NOT END THE SESSION. The cookie is still theirs and still works —
    // what happened is an offer, not a revocation.
    const rolled = cookieHeaderFrom(arriving.headers.get('set-cookie')!)
    expect((await sessionIdentity(workerEnv(), PLATFORM, rolled))?.subjectId).toBe(userId)
  })

  it('test_UAT_FC_REQ-231_a_visit_with_the_interval_ahead_of_it_is_not_interrupted', async () => {
    // THE FALSIFIER FOR THE WINDOW. Without the deadline half of the predicate
    // this would redirect at the start of every visit forever, which is a
    // sign-in per morning rather than a sign-in per interval.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    await fallSilent((await bearersOf(userId))[0].id)

    const arriving = await navigate('/', cookie)

    expect(arriving.status).not.toBe(303)
    expect(arriving.headers.get('set-cookie'), 'the visit did not rotate').toBeTruthy()
  })

  it('test_UAT_FC_REQ-231_a_request_that_is_not_a_navigation_is_never_redirected', async () => {
    // A 303 ANSWERED TO AN XHR IS HTML WHERE JSON WAS EXPECTED, silently — and
    // to an SSE stream it is the stream ending. The browser says which kind of
    // request this is and no page can forge it, so that is what is asked.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    await endsIn(userId, SESSION_PREEMPT_MS - 60 * 60_000)
    await fallSilent((await bearersOf(userId))[0].id)

    const fetched = await call('/', { headers: { cookie, 'sec-fetch-mode': 'cors' } })

    expect(fetched.status).not.toBe(303)
    // The rotation still happened and is still reported, which is what keeps the
    // request that declined the offer from being the one that gets signed out.
    expect(fetched.headers.get('set-cookie')).toBeTruthy()
  })
})

describe('REQ-231 — signing out of every browser', () => {
  it('test_UAT_FC_REQ-231_sign_out_everywhere_ends_every_sign_in_the_person_holds', async () => {
    // THE RESIDUAL RISK OF A LONGER INTERVAL IS A DEVICE SOMEBODY NO LONGER HAS,
    // and it is the one rotation cannot detect: theft is detected by CONFLICT,
    // and an abandoned laptop has no second party to conflict with. This is the
    // control that lets the person act on what only they know.
    const { email, userId } = await aMember()
    const laptop = await signIn(email)
    const phone = await signIn(email)
    expect(await sessionIdentity(workerEnv(), PLATFORM, laptop)).not.toBeNull()
    expect(await sessionIdentity(workerEnv(), PLATFORM, phone)).not.toBeNull()

    const out = await call(SIGN_OUT_PATH, {
      method: 'POST',
      headers: { cookie: phone, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'everywhere=1',
    })

    expect(out.status).toBe(303)
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(await sessionIdentity(workerEnv(), PLATFORM, phone)).toBeNull()
    expect(
      await sessionIdentity(workerEnv(), PLATFORM, laptop),
      'the other browser kept a live session',
    ).toBeNull()
    expect(await bearersOf(userId)).toEqual([])
  })

  it('test_UAT_FC_REQ-231_an_ordinary_sign_out_still_ends_only_this_browser', async () => {
    // THE FALSIFIER FOR THE FIELD. A `signOut` that swept the subject whatever
    // the body said would be a Sign out button that signs you out of your other
    // machines — the same surprise as the feature above, arrived at by accident
    // and with nobody having asked for it.
    const { email } = await aMember()
    const laptop = await signIn(email)
    const phone = await signIn(email)

    await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie: phone } })

    expect(await sessionIdentity(workerEnv(), PLATFORM, phone)).toBeNull()
    expect(await sessionIdentity(workerEnv(), PLATFORM, laptop)).not.toBeNull()
  })
})

describe('REQ-231 — the sweep', () => {
  it('test_UAT_FC_REQ-231_the_cron_reaps_retired_credentials_and_spares_live_ones', async () => {
    // WITHOUT THIS THE EVIDENCE WINDOW NEVER CLOSES. A retired row's two jobs run
    // in sequence — resolve through to its successor for the grace window, then
    // stand as proof that two parties held one credential — and nothing but this
    // ends the second. Unswept, the table grows by one row per visit per person
    // and every one of them survives the whole 180-day interval.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    await fallSilent((await bearersOf(userId))[0].id)
    const visit = await navigate('/', cookie)
    const rolled = cookieHeaderFrom(visit.headers.get('set-cookie')!)

    const before = await bearersOf(userId)
    expect(before.filter((b) => b.retired_at !== null).length).toBe(1)
    // Older than the component's retention window, which is what a retired row
    // reaches once it has stopped being evidence anybody could act on.
    await env.DB.prepare('UPDATE sessions SET retired_at = ?1 WHERE retired_at IS NOT NULL')
      .bind(new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString())
      .run()

    await worker.scheduled!(
      { cron: '17 4 * * *', scheduledTime: Date.now(), noRetry: () => {} } as ScheduledController,
      workerEnv(),
      { waitUntil: () => {}, passThroughOnException: () => {} } as ExecutionContext,
    )

    const after = await bearersOf(userId)
    expect(after.filter((b) => b.retired_at !== null), 'the retired bearer survived').toEqual([])
    expect(after.length, 'the live bearer was reaped with it').toBe(1)
    // And the person is still signed in, which is the whole point of reaping the
    // credential rather than the session. Asserted on the cookie the browser
    // actually holds — the one the rotation handed it — because the one it held
    // before is precisely what was reaped.
    expect(await sessionIdentity(workerEnv(), PLATFORM, rolled)).not.toBeNull()
  })

  it('test_UAT_FC_REQ-231_the_sweep_reports_what_it_took', async () => {
    // THREE NUMBERS BECAUSE THEY ARE THREE FACTS, and a cron nothing consumes
    // has only its log line. A deployment whose `retired` count is flat at zero
    // is a deployment where rotation is not firing, and no other signal says so.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    await fallSilent((await bearersOf(userId))[0].id)
    await navigate('/', cookie)
    await env.DB.prepare('UPDATE sessions SET retired_at = ?1 WHERE retired_at IS NOT NULL')
      .bind(new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString())
      .run()

    const report = await purgeSessions(workerEnv())

    expect(report.retired).toBeGreaterThanOrEqual(1)
    expect(report).toHaveProperty('tokens')
    expect(report).toHaveProperty('sessions')
  })

  it('test_UAT_FC_REQ-231_a_deployment_that_issues_no_sessions_sweeps_nothing_rather_than_failing', async () => {
    // The cron runs on every deployment, including one that has not switched
    // sign-in on. A refusal there would be a red alarm every night about a
    // feature nobody asked for.
    const report = await purgeSessions({ ...workerEnv(), SESSION_COOKIE_NAME: '' })
    expect(report).toEqual({ tokens: 0, sessions: 0, retired: 0 })
  })
})

describe('REQ-231 — the migration reaches the database that is already there', () => {
  it('test_UAT_FC_REQ-231_a_pre_rotation_session_survives_and_becomes_its_own_chain', async () => {
    // THE LIVE DATABASE RAN `0001` MONTHS AGO AND WILL NEVER RUN IT AGAIN, so
    // editing the baseline reaches every database except the one that matters.
    // This builds the shape that database actually has, applies the migration
    // this ticket ships, and asks the two questions that decide whether
    // somebody signed in last week stays signed in: does the row survive, and
    // does it name its own chain.
    //
    // WITHOUT `origin_id`, SIGN-OUT SILENTLY STOPS WORKING for exactly those
    // people — `endSession` deletes by chain, and a chain of NULL matches
    // nothing.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    const [live] = await bearersOf(userId)

    // Rebuild `sessions` in its pre-rotation shape, carrying the real row. This
    // is the state of the deployed database, reconstructed rather than imagined.
    await env.DB.prepare('ALTER TABLE sessions RENAME TO sessions_rotation_shape').run()
    await env.DB.prepare(
      `CREATE TABLE sessions (
         id           TEXT PRIMARY KEY,
         subject_id   TEXT NOT NULL,
         expires_at   TEXT NOT NULL,
         created_at   TEXT NOT NULL,
         last_seen_at TEXT NOT NULL
       )`,
    ).run()
    await env.DB.prepare(
      'INSERT INTO sessions (id, subject_id, expires_at, created_at, last_seen_at) ' +
        'SELECT id, subject_id, expires_at, created_at, last_seen_at FROM sessions_rotation_shape',
    ).run()
    await env.DB.prepare('DROP TABLE sessions_rotation_shape').run()
    // THE PREMISE, STATED RATHER THAN ASSUMED: the columns are genuinely absent
    // before the migration runs, so everything asserted after it is something
    // the migration did. (READING such a session still works on this shape — the
    // component treats the missing columns as null and resolves — which is why
    // the absence has to be asked about directly rather than inferred from a
    // failure. What does NOT work is ending one: `endSession` selects
    // `origin_id`, and SQLite refuses a column that is not there.)
    const columnsBefore = await env.DB.prepare('PRAGMA table_info(sessions)').all<{ name: string }>()
    expect(columnsBefore.results.map((c) => c.name)).not.toContain('origin_id')

    await applyRotationMigration()

    const migrated = (await bearersOf(userId)).find((b) => b.id === live.id)
    expect(migrated, 'the migration lost a live session').toBeDefined()
    expect(migrated!.origin_id, 'a migrated session is not its own chain').toBe(live.id)
    expect(migrated!.issued_at).toBe(live.created_at)
    expect(migrated!.expires_at, 'the migration moved the sign-in deadline').toBe(live.expires_at)
    expect(migrated!.retired_at).toBeNull()

    // AND IT IS STILL A CREDENTIAL. The cookie the browser has held since before
    // the deploy resolves to the same person it always did.
    const who = await sessionIdentity(workerEnv(), PLATFORM, cookie)
    expect(who?.subjectId).toBe(userId)
    expect(who?.email).toBe(email)
  })

  it('test_UAT_FC_REQ-231_the_migration_also_applies_to_a_database_the_baseline_already_shaped', async () => {
    // THE CASE THE OBVIOUS MIGRATION CANNOT SURVIVE, and the reason `0002` is a
    // rebuild rather than four `ALTER TABLE ADD COLUMN`. `wrangler d1 migrations
    // apply` runs every unapplied file in order, so a brand-new database — a
    // preview environment, `wrangler dev`'s local D1, the next deployment of
    // this product — runs `0001` and then `0002`. With ALTERs that is
    // `duplicate column name: issued_at` and a migration set that cannot create
    // a database.
    //
    // THIS IS THAT SEQUENCE. The table is already in the rotation shape here,
    // because `applySchema` put it there; running the migration against it is
    // exactly what a fresh database does.
    const { email, userId } = await aMember()
    const cookie = await signIn(email)
    const [live] = await bearersOf(userId)

    await applyRotationMigration()

    const survived = (await bearersOf(userId)).find((b) => b.id === live.id)
    expect(survived, 'the migration lost a session on a database that did not need it').toBeDefined()
    expect(survived!.expires_at).toBe(live.expires_at)
    expect(survived!.origin_id).toBe(live.origin_id)
    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).not.toBeNull()
  })
})
