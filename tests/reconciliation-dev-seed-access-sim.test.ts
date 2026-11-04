import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resetJwksCache, verifyAccessJwt } from '../apps/control-app/src/access'

/**
 * Story story-5b5be809 — `bin/seed` and `bin/access-sim`, driven as commands.
 *
 * THE STORE IS REAL; ONLY ITS LOCATION IS MOVED. Both tools reach D1 through
 * `npx wrangler d1 …` with `--local`. A developer's local store must never be
 * written by a suite, so a thin `npx` shim is put first on PATH that runs the
 * repository's own wrangler with `--persist-to <temp dir>` appended. Everything
 * else — the runner's argument handling, its output, wrangler, SQLite, the
 * simulator's query — is the real thing. The shim refuses `--remote` outright,
 * so no test can reach a deployed database.
 *
 * Target selection (AC-2313) and `--help` use a RECORDING shim instead, which
 * logs what it was asked to run and runs nothing: that is the "D1 executor
 * stubbed" the AC names, and it is what lets `--remote` be exercised safely.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEED = path.join(REPO, 'bin', 'seed')
const SIM = path.join(REPO, 'bin', 'access-sim')
const APP = path.join(REPO, 'apps', 'control-app')
const TOML = path.join(APP, 'wrangler.toml')
const WRANGLER = path.join(APP, 'node_modules', '.bin', 'wrangler')
const ACCESS_MD = path.join(APP, 'ACCESS.md')

const PLATFORM = 'biz_51a6746495c8057e886ff98d4208e6b9'
const PLUMBING = 'biz_c1f0a4b7e2d84936ab5107cc9e3f2d61'

const SEEDED_ADDRESSES = [
  'alice@plumbing.example',
  'alice@oldsalon.example',
  'bob@example.com',
  'carol@example.com',
  'dave@example.com',
]
const SEEDED_BUSINESSES = ["Alice's Plumbing", "Alice's Lettings", "Alice's Old Salon"]
const SEEDED_TABLES = ['tenants', 'accounts', 'users', 'user_emails', 'user_names', 'memberships', 'entitlements']

interface Run {
  code: number
  stdout: string
  stderr: string
}

let work = ''
let persistShimDir = ''
let recordShimDir = ''
/** The store the shared cast is seeded into once. */
let seeded = ''
let firstSeed: Run
let countsBeforeSeed: Record<string, number> = {}

function baseEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    WRANGLER_SEND_METRICS: 'false',
    WRANGLER_LOG_PATH: path.join(work, 'wrangler-logs'),
    CI: '1',
    ...extra,
  }
  delete env.SIM_PORT
  delete env.SIM_AUD
  delete env.SIM_BUILDER
  return env
}

function persistEnv(store: string): NodeJS.ProcessEnv {
  return baseEnv({ PATH: `${persistShimDir}:${process.env.PATH ?? ''}`, SEED_TEST_PERSIST: store })
}

function recordEnv(log: string): NodeJS.ProcessEnv {
  return baseEnv({ PATH: `${recordShimDir}:${process.env.PATH ?? ''}`, SEED_TEST_LOG: log })
}

function run(file: string, args: string[], env: NodeJS.ProcessEnv): Promise<Run> {
  return new Promise((resolve) => {
    execFile(file, args, { env, cwd: REPO, timeout: 120_000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
      resolve({ code, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

async function migrate(store: string): Promise<void> {
  const result = await run(
    WRANGLER,
    ['d1', 'migrations', 'apply', 'DB', '--local', '--config', TOML, '--persist-to', store],
    baseEnv(),
  )
  if (result.code !== 0) throw new Error(`migrations apply failed:\n${result.stdout}\n${result.stderr}`)
}

/** Run SQL against an isolated store; one result set per statement. */
async function query(store: string, sql: string): Promise<Array<Array<Record<string, unknown>>>> {
  const result = await run(
    WRANGLER,
    ['d1', 'execute', 'DB', '--local', '--config', TOML, '--persist-to', store, '--json', '--command', sql],
    baseEnv(),
  )
  if (result.code !== 0) throw new Error(`query failed:\n${result.stdout}\n${result.stderr}`)
  const parsed = JSON.parse(result.stdout.slice(result.stdout.indexOf('['))) as Array<{
    results: Array<Record<string, unknown>>
  }>
  return parsed.map((p) => p.results)
}

/** Every row of every seeded table, ordered, as one comparable value. */
async function snapshot(store: string): Promise<string> {
  const sets = await query(store, SEEDED_TABLES.map((t) => `SELECT * FROM ${t} ORDER BY id`).join('; '))
  return SEEDED_TABLES.map((t, i) => `${t}\n${sets[i].map((r) => JSON.stringify(r)).join('\n')}`).join('\n\n')
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

function portIsClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

interface Sim {
  proc: ChildProcess
  origin: string
}

async function startSim(args: string[], env: NodeJS.ProcessEnv): Promise<Sim> {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const proc = spawn(process.execPath, [SIM, '--port', String(port), ...args], { env, stdio: 'ignore' })
  for (let i = 0; i < 100; i += 1) {
    try {
      if ((await fetch(`${origin}/cdn-cgi/access/certs`)).ok) return { proc, origin }
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  proc.kill()
  throw new Error('access-sim did not start')
}

function payloadOf(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as Record<string, unknown>
}

const sims: Sim[] = []

beforeAll(async () => {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-uat-'))

  // The persisting shim: real wrangler, isolated store, never remote.
  persistShimDir = path.join(work, 'persist-shim')
  fs.mkdirSync(persistShimDir)
  fs.writeFileSync(
    path.join(persistShimDir, 'npx'),
    [
      '#!/usr/bin/env bash',
      'if [ "$1" = "wrangler" ]; then',
      '  shift',
      '  for a in "$@"; do',
      '    if [ "$a" = "--remote" ]; then echo "test shim: refusing --remote" >&2; exit 97; fi',
      '  done',
      `  exec "${WRANGLER}" "$@" --persist-to "$SEED_TEST_PERSIST"`,
      'fi',
      'echo "test shim: unexpected npx $*" >&2',
      'exit 98',
      '',
    ].join('\n'),
    { mode: 0o755 },
  )

  // The recording shim: logs the call and touches nothing.
  recordShimDir = path.join(work, 'record-shim')
  fs.mkdirSync(recordShimDir)
  fs.writeFileSync(
    path.join(recordShimDir, 'npx'),
    ['#!/usr/bin/env bash', 'echo "$*" >> "$SEED_TEST_LOG"', 'echo \'[{"results":[],"success":true}]\'', ''].join('\n'),
    { mode: 0o755 },
  )

  // One store with the baseline applied, then seeded through the real runner.
  seeded = path.join(work, 'seeded-store')
  await migrate(seeded)
  const counts = await query(
    seeded,
    [...SEEDED_TABLES, 'sites'].map((t) => `SELECT '${t}' AS t, COUNT(*) AS n FROM ${t}`).join('; '),
  )
  countsBeforeSeed = Object.fromEntries(counts.map((rows) => [rows[0].t as string, rows[0].n as number]))
  firstSeed = await run(SEED, [], persistEnv(seeded))
}, 180_000)

afterAll(() => {
  for (const sim of sims) sim.proc.kill()
  if (work) fs.rmSync(work, { recursive: true, force: true })
})

describe('story-5b5be809 — bin/seed', () => {
  it('test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast', async () => {
    expect(firstSeed.code, firstSeed.stderr).toBe(0)

    // Fresh baseline: no people, no seeded businesses, no sites.
    expect(countsBeforeSeed.users).toBe(0)
    expect(countsBeforeSeed.user_emails).toBe(0)
    expect(countsBeforeSeed.memberships).toBe(0)

    const [people, businesses, ownership, members, tenants, sites] = await query(
      seeded,
      [
        'SELECT u.id AS user_id, u.tenant_id AS tenant_id, ue.email AS email FROM users u JOIN user_emails ue ON ue.user_id = u.id ORDER BY ue.email',
        `SELECT id, name, owner_account_id FROM tenants WHERE id <> '${PLATFORM}' ORDER BY name`,
        "SELECT account_id FROM users WHERE id = 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a'",
        'SELECT user_id, business_id, role FROM memberships',
        'SELECT COUNT(*) AS n FROM tenants',
        'SELECT COUNT(*) AS n FROM sites',
      ].join('; '),
    )

    // Addresses: exactly the five, Alice's two on one person.
    expect(people.map((p) => p.email).sort()).toEqual([...SEEDED_ADDRESSES].sort())
    const personOf = (email: string) => people.find((p) => p.email === email)?.user_id
    expect(personOf('alice@plumbing.example')).toBe(personOf('alice@oldsalon.example'))
    expect(new Set(people.map((p) => p.user_id)).size).toBe(4)

    // Businesses: exactly the three, all on Alice's single account.
    expect(businesses.map((b) => b.name).sort()).toEqual([...SEEDED_BUSINESSES].sort())
    const aliceAccount = ownership[0].account_id
    expect(aliceAccount).toBeTruthy()
    expect(businesses.every((b) => b.owner_account_id === aliceAccount)).toBe(true)
    expect(tenants[0].n).toBe(countsBeforeSeed.tenants + 3)

    // Alice owns each business.
    const aliceId = personOf('alice@plumbing.example')
    const aliceMemberships = members.filter((m) => m.user_id === aliceId)
    expect(aliceMemberships.map((m) => m.business_id).sort()).toEqual(businesses.map((b) => b.id).sort())
    expect(aliceMemberships.every((m) => m.role === 'owner')).toBe(true)
    expect(members.length).toBe(3)

    // Bob, Carol and Dave are people of Alice's Plumbing.
    for (const email of ['bob@example.com', 'carol@example.com', 'dave@example.com']) {
      expect(people.find((p) => p.email === email)?.tenant_id, email).toBe(PLUMBING)
    }

    // No sites.
    expect(sites[0].n).toBe(0)
    expect(countsBeforeSeed.sites).toBe(0)
  })

  it('test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical', async () => {
    expect(firstSeed.code).toBe(0)
    const before = await snapshot(seeded)
    const again = await run(SEED, [], persistEnv(seeded))
    expect(again.code, again.stderr).toBe(0)
    const after = await snapshot(seeded)
    expect(after).toBe(before)
    // Not a vacuous comparison: the snapshot holds the cast.
    for (const address of SEEDED_ADDRESSES) expect(before).toContain(address)
  }, 120_000)

  it('test_UAT_AC2312_the_seed_creates_no_platform_operator', async () => {
    expect(firstSeed.code).toBe(0)
    const [operators, platformMembers, users] = await query(
      seeded,
      [
        'SELECT COUNT(*) AS n FROM users WHERE platform_operator = 1',
        `SELECT COUNT(*) AS n FROM memberships WHERE business_id = '${PLATFORM}'`,
        'SELECT COUNT(*) AS n FROM users',
      ].join('; '),
    )
    expect(users[0].n).toBe(4)
    expect(operators[0].n).toBe(0)
    expect(platformMembers[0].n).toBe(0)

    const notSeeded = firstSeed.stdout.slice(firstSeed.stdout.indexOf('NOT seeded'))
    expect(firstSeed.stdout).toContain('NOT seeded')
    expect(notSeeded).toMatch(/the platform operator\s+PLATFORM_ADMINS/)
  })

  it('test_UAT_AC2313_seed_targets_local_unless_remote_is_typed', async () => {
    const cases: Array<{ args: string[]; target: '--local' | '--remote' }> = [
      { args: [], target: '--local' },
      { args: ['--local'], target: '--local' },
      { args: ['--remote'], target: '--remote' },
    ]
    for (const { args, target } of cases) {
      const log = path.join(work, `record-${target}-${args.length}.log`)
      const result = await run(SEED, args, recordEnv(log))
      expect(result.code, `${args.join(' ')}: ${result.stderr}`).toBe(0)
      const calls = fs.readFileSync(log, 'utf8').trim().split('\n')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toContain('wrangler d1 execute DB')
      expect(calls[0]).toContain(`--file ${path.join(REPO, 'db', 'dev-seed.sql')}`)
      if (target === '--remote') {
        expect(calls[0]).toContain('--remote')
        expect(calls[0]).not.toContain('--local')
        expect(result.stderr).toContain('REMOTE D1')
        expect(result.stderr).toContain('real customers')
      } else {
        expect(calls[0]).toContain('--local')
        expect(calls[0]).not.toContain('--remote')
        expect(result.stderr).not.toContain('REMOTE')
      }
    }

    // A typo never falls through to some target.
    const log = path.join(work, 'record-unknown.log')
    const typo = await run(SEED, ['--remtoe'], recordEnv(log))
    expect(typo.code).toBe(2)
    expect(typo.stderr).toContain("unknown argument '--remtoe'")
    expect(fs.existsSync(log)).toBe(false)
  })

  it('test_UAT_AC2314_success_report_and_help_text', async () => {
    expect(firstSeed.code).toBe(0)
    const report = firstSeed.stdout

    for (const address of SEEDED_ADDRESSES) expect(report).toContain(address)
    for (const business of SEEDED_BUSINESSES) expect(report).toContain(business)
    expect(report).toContain('grant that ENDED')
    expect(report).toContain('invited, never came')
    expect(report).toContain('a lead, never invited')
    expect(report).toContain('NOT seeded')
    expect(report).toContain('the platform operator')
    expect(report).toContain('any site')
    expect(report).toContain('./bin/access-sim --print-env')
    expect(report).toContain('./bin/access-sim &')
    expect(report).toContain('http://127.0.0.1:8799/login')

    // Wrangler's per-statement JSON is held back on success.
    expect(report).not.toContain('"results"')
    expect(report).not.toContain('"success"')
    expect(report.split('\n').some((line) => /^\s*[[{]/.test(line))).toBe(false)

    // --help explains, exits 0, and touches no store.
    const log = path.join(work, 'record-help.log')
    const help = await run(SEED, ['--help'], recordEnv(log))
    expect(help.code).toBe(0)
    expect(help.stdout).toContain('bin/seed')
    expect(help.stdout).toMatch(/--remote\s+# the deployed one/)
    expect(fs.existsSync(log)).toBe(false)
  })

  it('test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance', async () => {
    const bare = path.join(work, 'bare-store')
    const result = await run(SEED, [], persistEnv(bare))
    expect(result.code).toBe(1)
    expect(result.stderr).toMatch(/no such table/i)
    const errorAt = result.stderr.search(/no such table/i)
    const guidanceAt = result.stderr.indexOf('npx wrangler d1 migrations apply DB --local')
    expect(guidanceAt).toBeGreaterThan(errorAt)
    expect(result.stdout).not.toContain('Seeded (')
  }, 120_000)

  it('test_UAT_AC2316_applying_migrations_never_applies_the_fixture', async () => {
    const migrated = path.join(work, 'migrated-only-store')
    await migrate(migrated)
    const [emails, names, users] = await query(
      migrated,
      [
        'SELECT email FROM user_emails',
        'SELECT name FROM tenants',
        'SELECT COUNT(*) AS n FROM users',
      ].join('; '),
    )
    for (const address of SEEDED_ADDRESSES) expect(emails.map((e) => e.email)).not.toContain(address)
    for (const business of SEEDED_BUSINESSES) expect(names.map((n) => n.name)).not.toContain(business)
    expect(users[0].n).toBe(0)

    // The fixture lives beside the migration set, not in it.
    const migrations = fs.readdirSync(path.join(REPO, 'db', 'migrations'))
    expect(migrations).not.toContain('dev-seed.sql')
    expect(fs.existsSync(path.join(REPO, 'db', 'dev-seed.sql'))).toBe(true)
    for (const file of migrations) {
      const body = fs.readFileSync(path.join(REPO, 'db', 'migrations', file), 'utf8')
      expect(body, file).not.toContain('alice@plumbing.example')
    }
  }, 120_000)
})

describe('story-5b5be809 — bin/access-sim', () => {
  let emptySim: Sim
  const AUD = 'story-5b5be809-aud'

  beforeAll(async () => {
    // A store that does not exist: the simulator's listing cannot read it.
    emptySim = await startSim(['--aud', AUD], persistEnv(path.join(work, 'missing-store')))
    sims.push(emptySim)
  }, 60_000)

  it('test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings', async () => {
    const defaults = await run(process.execPath, [SIM, '--print-env'], baseEnv())
    expect(defaults.code).toBe(0)
    expect(defaults.stdout).toBe('ACCESS_TEAM_DOMAIN="http://127.0.0.1:8799"\nACCESS_AUD="local-dev-aud"\n')

    const port = await freePort()
    const custom = await run(process.execPath, [SIM, '--print-env', '--port', String(port), '--aud', 'other-aud'], baseEnv())
    expect(custom.code).toBe(0)
    const lines = custom.stdout.trimEnd().split('\n')
    expect(lines).toEqual([`ACCESS_TEAM_DOMAIN="http://127.0.0.1:${port}"`, 'ACCESS_AUD="other-aud"'])

    // It exited without leaving a server behind.
    expect(await portIsClosed(port)).toBe(true)
  })

  it('test_UAT_AC2318_a_minted_token_passes_the_real_verifier', async () => {
    resetJwksCache()
    const res = await fetch(`${emptySim.origin}/mint?email=alice@plumbing.example`)
    expect(res.status).toBe(200)
    const token = (await res.text()).trim()

    const result = await verifyAccessJwt({ token, teamDomain: emptySim.origin, aud: AUD })
    expect(result.ok, JSON.stringify(result)).toBe(true)
    if (!result.ok) return
    expect(result.claims.email).toBe('alice@plumbing.example')
    expect(result.identity).toBe('alice@plumbing.example')

    const thirtyDays = 30 * 24 * 60 * 60
    const now = Math.floor(Date.now() / 1000)
    expect(Math.abs(result.claims.exp - now - thirtyDays)).toBeLessThan(120)

    const missing = await fetch(`${emptySim.origin}/mint`)
    expect(missing.status).toBe(400)
  })

  it('test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud', async () => {
    resetJwksCache()
    const token = (await (await fetch(`${emptySim.origin}/mint?email=bob@example.com`)).text()).trim()

    const accepted = await verifyAccessJwt({ token, teamDomain: emptySim.origin, aud: AUD })
    expect(accepted.ok).toBe(true)

    const refused = await verifyAccessJwt({ token, teamDomain: emptySim.origin, aud: 'a-different-aud' })
    expect(refused.ok).toBe(false)
  })

  it('test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one', async () => {
    expect(firstSeed.code).toBe(0)
    const builder = 'http://127.0.0.1:8788'
    const sim = await startSim(['--aud', AUD, '--builder', builder], persistEnv(seeded))
    sims.push(sim)

    const page = await fetch(`${sim.origin}/login`)
    expect(page.status).toBe(200)
    const html = await page.text()
    const listed = [...html.matchAll(/href="\/login\?email=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]))

    expect([...listed].sort()).toEqual([...SEEDED_ADDRESSES].sort())
    const primaryAt = listed.indexOf('alice@plumbing.example')
    expect(listed[primaryAt + 1]).toBe('alice@oldsalon.example')

    // Choose Alice's secondary address and follow the link.
    const chosen = 'alice@oldsalon.example'
    const signIn = await fetch(`${sim.origin}/login?email=${encodeURIComponent(chosen)}`, { redirect: 'manual' })
    expect(signIn.status).toBe(302)
    expect(signIn.headers.get('location')).toBe(builder)
    const cookie = signIn.headers.get('set-cookie') ?? ''
    const match = /CF_Authorization=([^;]+)/.exec(cookie)
    expect(match).not.toBeNull()
    const token = match?.[1] ?? ''
    expect(payloadOf(token).email).toBe(chosen)

    resetJwksCache()
    const verified = await verifyAccessJwt({ token, teamDomain: sim.origin, aud: AUD })
    expect(verified.ok).toBe(true)
  }, 60_000)

  it('test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing', async () => {
    const res = await fetch(`${emptySim.origin}/login`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('No seeded people found')
    expect(html).toContain('Run the seed')
    expect(html).toContain('/login?email=')
    expect(html).not.toMatch(/href="\/login\?email=/)
  }, 60_000)
})

describe('story-5b5be809 — ACCESS.md', () => {
  it('test_UAT_AC2322_access_md_points_to_seed_and_simulator', () => {
    const doc = fs.readFileSync(ACCESS_MD, 'utf8')
    const start = doc.indexOf('### Locally, as a seeded person')
    expect(start).toBeGreaterThan(-1)
    const rest = doc.slice(start + 1)
    const end = rest.search(/\n##? /)
    const section = end === -1 ? rest : rest.slice(0, end)

    expect(section).toContain('./bin/seed')
    expect(section).toContain('./bin/access-sim --print-env')
    expect(section).toContain('./bin/access-sim &')
    expect(section).toContain('npx wrangler dev')
    expect(section).toMatch(/no operator in the seed/i)
    expect(section).toContain('PLATFORM_ADMINS')
  })
})
