import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { WEBUI_SCOPE, sharedModulePath, sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { TICKETING_INSTALLED, TICKETING_SKIP_REASON } from './support/ticketing-installed'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * story-ab1ecd62 — **the schema step, and reaching the component that owns it**.
 *
 * The runtime half of this story is proved in workerd against a real database
 * (`reconciliation-product-ticket-store.workers.test.ts`). This is the half that
 * is about the repository's own files and the out-of-repo component they are a
 * transcription of: where the schema step is declared, that it still agrees with
 * the component that publishes it, and that the component is reachable at build
 * time from any checkout — including a linked working tree, which is where a bare
 * package specifier finds nothing at all.
 *
 * THE COMPONENT IS AN ENVIRONMENT PRECONDITION, not repository content. It
 * arrives through the shared artifact store an operator populates out of band, so
 * "absent" is an ordinary state on a fresh clone. Checks that need it therefore
 * report a NAMED skip carrying the command that installs it, while every check
 * over this repository's own files runs unconditionally.
 */

const REPO = path.resolve(__dirname, '..')
const APP = path.join(REPO, 'apps', 'control-app')
const WRANGLER = path.join(APP, 'wrangler.toml')
const MIGRATIONS_DIR = path.join(REPO, 'db', 'migrations')
const TICKET_MIGRATION = path.join(MIGRATIONS_DIR, '0003_ticket_store.sql')
const SITE_MIGRATION = path.join(MIGRATIONS_DIR, '0001_site_store.sql')
const BIN = path.join(REPO, 'tools', 'generate', 'bin', '1c.mjs')

/** The component whose schema this repository transcribes. */
const COMPONENT = 'ticketing'

const toml = readFileSync(WRANGLER, 'utf8')

/** Collapse whitespace, so formatting is not what any comparison here compares. */
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

/** A migration file's statements, the way the runner sees them: comments out, split on `;`. */
function statementsOf(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(flat)
    .filter((s) => s.length > 0)
}

let scratch: string

beforeAll(() => {
  scratch = realpathSync(mkdtempSync(path.join(tmpdir(), 'story-ab1ecd62-')))
})

afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true })
})

// ── AC-1476: the schema step is part of the deployment's ordinary sequence ────

describe('story-ab1ecd62 — the ticket store schema is applied as a migration in sequence', () => {
  it('test_UAT_AC1476_the_step_is_declared_in_the_migration_sequence_and_applies_after_the_site_stores', () => {
    // ── (a) the deployment declares where the sequence lives ────────────────
    // `migrations_dir` belongs to the D1 binding, and both halves of the file
    // declare it — a named environment inherits neither vars nor bindings.
    const declared = [...toml.matchAll(/migrations_dir\s*=\s*"([^"]+)"/g)].map((m) => m[1])
    expect(declared.length, 'both the dev and the production binding declare it').toBe(2)
    for (const dir of declared) {
      expect(path.resolve(path.dirname(WRANGLER), dir)).toBe(MIGRATIONS_DIR)
    }

    // ── (b) and that location holds the step, beside the site store's ───────
    // The runner applies a DIRECTORY in lexical order, so the order is the file
    // names — and it is load-bearing: 0001 creates `tenants` without the column
    // the ticket store writes, and 0003 is what adds it.
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
    expect(files).toContain(path.basename(TICKET_MIGRATION))
    expect(files).toContain(path.basename(SITE_MIGRATION))
    expect(files.indexOf(path.basename(TICKET_MIGRATION))).toBeGreaterThan(
      files.indexOf(path.basename(SITE_MIGRATION)),
    )

    // ── (c) applied from empty, by the real runner, in the declared order ───
    // `wrangler d1 migrations apply` against a fresh local database — not a
    // hand-written CREATE in a helper, which would prove the helper.
    const persist = path.join(scratch, 'd1')
    const apply = (): string => {
      const run = spawnSync(
        'npx',
        ['wrangler', 'd1', 'migrations', 'apply', '1stcontact', '--local', '--persist-to', persist],
        { cwd: APP, encoding: 'utf8' },
      )
      expect(run.status, run.stderr).toBe(0)
      return run.stdout
    }
    const first = apply()
    for (const name of files) expect(first).toContain(name)
    expect(first.indexOf(path.basename(TICKET_MIGRATION))).toBeGreaterThan(
      first.indexOf(path.basename(SITE_MIGRATION)),
    )

    // ── (d) the result is a database the store needs no further schema work in ──
    const dump = (): { status: number | null; stderr: string; stdout: string } =>
      spawnSync(
        'npx',
        [
          'wrangler',
          'd1',
          'execute',
          '1stcontact',
          '--local',
          '--persist-to',
          persist,
          '--json',
          '--command',
          'SELECT name, sql FROM sqlite_master',
        ],
        { cwd: APP, encoding: 'utf8' },
      )
    const raw = dump()
    expect(raw.status, raw.stderr).toBe(0)
    const objects = (
      JSON.parse(raw.stdout.slice(raw.stdout.indexOf('['))) as Array<{
        results: Array<{ name: string; sql: string | null }>
      }>
    )[0].results
    const byName = new Map(objects.map((o) => [o.name, o.sql ?? '']))
    for (const table of ['tickets', 'counters', 'tenants']) {
      expect([...byName.keys()], `the applied schema carries ${table}`).toContain(table)
    }
    // The reconciliation actually happened: `tenants` carries the column 0001
    // never created.
    expect(byName.get('tenants')).toContain('config')

    // ── (e) re-applying the sequence changes nothing ────────────────────────
    expect(apply()).toContain('No migrations to apply')
    const again = dump()
    expect(again.status, again.stderr).toBe(0)
    expect(
      JSON.parse(again.stdout.slice(again.stdout.indexOf('[')))[0].results,
    ).toEqual(objects)

    // ── (f) and the runtime acceptance harness applies that same sequence ───
    // Enumerated, not globbed — a glob would be unordered, and the order is the
    // one property that has to hold. So the enumeration is a diff a reviewer
    // sees, and this is the assertion that it names this step.
    const harness = readFileSync(path.join(__dirname, 'support', 'd1-site-factory.ts'), 'utf8')
    const enumerated = [...harness.matchAll(/db\/migrations\/([0-9a-z_]+\.sql)/g)].map((m) => m[1])
    expect(enumerated).toEqual(files)
  })
})

// ── AC-1477: the transcription still agrees with the component ───────────────

/** Every published statement the migration does not contain, named in full. */
function missingFromMigration(migrationSql: string, published: string[]): string[] {
  const haystack = flat(migrationSql)
  return published.filter((s) => !haystack.includes(flat(s)))
}

describe('story-ab1ecd62 — the schema step stays in agreement with the component', () => {
  it.skipIf(!TICKETING_INSTALLED)(
    'test_UAT_AC1477_every_published_statement_is_present_and_a_missing_one_is_named',
    async () => {
      const { SCHEMA_STATEMENTS } = (await import(sharedModuleUrl(COMPONENT))) as {
        SCHEMA_STATEMENTS: string[]
      }
      expect(SCHEMA_STATEMENTS.length).toBeGreaterThan(0)

      const sql = readFileSync(TICKET_MIGRATION, 'utf8')

      // ── (a) compared WHOLE, not by table name ──────────────────────────────
      // A check that only looked for `CREATE TABLE … tickets` would keep passing
      // after upstream added a column, which is precisely the drift this exists
      // to catch.
      expect(missingFromMigration(sql, SCHEMA_STATEMENTS)).toEqual([])

      // ── (b) whitespace and formatting are not disagreement ─────────────────
      const reflowed = SCHEMA_STATEMENTS.map((s) => `\n  ${s.replace(/\s+/g, '\n      ')}\n`)
      expect(missingFromMigration(sql, reflowed)).toEqual([])

      // ── (c) a statement the step lacks fails the check, and is NAMED ───────
      // Exercised by removing one from the migration rather than by trusting the
      // comparison: a check that cannot report what is missing leaves a deployed
      // database a version behind with nothing saying so.
      const dropped = SCHEMA_STATEMENTS[SCHEMA_STATEMENTS.length - 1]
      const mutilated = flat(sql).replace(flat(dropped), '')
      const missing = missingFromMigration(mutilated, SCHEMA_STATEMENTS)
      expect(missing).toEqual([dropped])
      expect(flat(missing[0])).toContain('counters')

      // ── (d) exactly one part of the step is not a transcription ────────────
      const published = new Set(SCHEMA_STATEMENTS.map(flat))
      const local = statementsOf(sql).filter((s) => !published.has(s))
      expect(local, 'only the shared registry reconciliation is locally authored').toEqual([
        'ALTER TABLE tenants ADD COLUMN config TEXT NOT NULL DEFAULT \'{}\'',
      ])
    },
  )
})

// This check is only meaningful when the component is available. When it is not
// it reports a NAMED skip — never a silent pass and never an obscure failure
// about an undefined value — while every check over this repository's own files
// (AC-1476 above) still runs. What that message says in each unavailable state is
// asserted against real fixtures in AC-1485 below.
if (!TICKETING_INSTALLED) {
  // eslint-disable-next-line no-console
  console.warn(`AC-1477 schema-agreement check skipped: ${TICKETING_SKIP_REASON}`)
}

// ── AC-1485: the component resolves from any checkout, and is reported ───────

/**
 * A fixture checkout with a stand-in component store beneath it.
 *
 * `capability` decides which of the three states it reproduces: a working
 * install, a STALE one (present, but predating the attachment capability this
 * store requires), or nothing installed at all. The files exercised are the
 * shipped `webui.ts` and `ticketing-installed.ts`, copied byte-for-byte and run
 * by a real `node`, so nothing here stands in for the code under test.
 */
function plantProbe(name: string, install: 'working' | 'stale' | 'absent'): string {
  const root = path.join(scratch, name)
  mkdirSync(path.join(root, '.git'), { recursive: true })
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name, type: 'module' }))

  for (const rel of [
    path.join('tools', 'generate', 'src', 'cli', 'webui.ts'),
    path.join('tests', 'support', 'ticketing-installed.ts'),
  ]) {
    const dest = path.join(root, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(path.join(REPO, rel), dest)
    expect(
      readFileSync(dest, 'utf8'),
      'the fixture must exercise the shipped file, unmodified',
    ).toBe(readFileSync(path.join(REPO, rel), 'utf8'))
  }

  if (install !== 'absent') {
    const dir = path.join(root, 'node_modules', WEBUI_SCOPE, COMPONENT)
    mkdirSync(path.join(dir, 'src'), { recursive: true })
    writeFileSync(
      path.join(dir, 'package.json'),
      // The version every install carries — see the assertion below on why a
      // version comparison could not tell these two copies apart.
      JSON.stringify({
        name: `${WEBUI_SCOPE}/${COMPONENT}`,
        version: '0.0.0',
        type: 'module',
        exports: { '.': './src/index.js' },
      }),
    )
    writeFileSync(path.join(dir, 'src', 'index.js'), 'export const SCHEMA_STATEMENTS = []\n')
    if (install === 'working') writeFileSync(path.join(dir, 'src', 'blob_store.js'), 'export {}\n')
  }

  const probe = path.join(root, 'probe.mjs')
  writeFileSync(
    probe,
    [
      // The planted files are byte-for-byte the shipped ones, and the shipped
      // ones import each other without a file extension — which the bundler
      // resolves and plain `node` does not. The hook supplies only that
      // extension, so the code being exercised is unmodified production code.
      "import { registerHooks } from 'node:module'",
      'registerHooks({',
      '  resolve(specifier, context, next) {',
      "    if (specifier.startsWith('.') && !/\\.[cm]?[jt]s$/.test(specifier)) {",
      "      return next(specifier + '.ts', context)",
      '    }',
      '    return next(specifier, context)',
      '  },',
      '})',
      "const m = await import('./tests/support/ticketing-installed.ts')",
      'process.stdout.write(',
      '  JSON.stringify({ installed: m.TICKETING_INSTALLED, reason: m.TICKETING_SKIP_REASON }),',
      ')',
      '',
    ].join('\n'),
  )
  return probe
}

/** What the shipped presence check reports, run in a real `node` in that fixture. */
function reportedBy(probe: string): { installed: boolean; reason: string } {
  const out = execFileSync(
    process.execPath,
    ['--experimental-transform-types', '--no-warnings', probe],
    { cwd: path.dirname(probe), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  return JSON.parse(out) as { installed: boolean; reason: string }
}

describe('story-ab1ecd62 — the shared component resolves, is reported, and its absence is named', () => {
  it('test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install', () => {
    // ── (a) a stale install does not report as a working one ───────────────
    // The state that actually blocked this work: present, imports cleanly, and
    // `R2BlobStore` is `undefined`. Reported as a named skip stating the reason
    // and carrying the command that fixes it — never an obscure failure about an
    // undefined value.
    const stale = reportedBy(plantProbe('stale-install', 'stale'))
    expect(stale.installed).toBe(false)
    expect(stale.reason).toContain(`${WEBUI_SCOPE}/${COMPONENT}`)
    expect(stale.reason).toMatch(/predates the BlobStore port/)
    expect(stale.reason).toContain(`bin/install --lang js --component ${COMPONENT}`)

    // Absent is an ordinary state on a fresh clone, and it is a DIFFERENT
    // message — the whole point of detecting staleness separately.
    const absent = reportedBy(plantProbe('absent-install', 'absent'))
    expect(absent.installed).toBe(false)
    expect(absent.reason).toContain('is not installed')
    expect(absent.reason).toContain(`bin/install --lang js --component ${COMPONENT}`)
    expect(absent.reason).not.toBe(stale.reason)

    // Non-vacuity: the same fixture with the capability file present reports a
    // working install, so the two refusals above are the capability check and
    // not the fixture failing to resolve at all.
    const working = reportedBy(plantProbe('working-install', 'working'))
    expect(working).toEqual({ installed: true, reason: '' })

    // ── (b) decided by the capability, never by a version ──────────────────
    // The package is `0.0.0` and stays `0.0.0` across every install, so a
    // version comparison cannot answer this question — which is why presence is
    // decided by the file the capability lives in.
    // The same three states, as this machine actually reports them: the shipped
    // constants agree with whichever fixture characterises the state it is in.
    if (TICKETING_INSTALLED) {
      expect(TICKETING_SKIP_REASON).toBe(working.reason)
      const real = path.dirname(path.dirname(sharedModulePath(COMPONENT)))
      const version = (
        JSON.parse(readFileSync(path.join(real, 'package.json'), 'utf8')) as { version: string }
      ).version
      expect(version).toBe('0.0.0')
      expect(existsSync(path.join(real, 'src', 'blob_store.js'))).toBe(true)
    } else {
      expect(TICKETING_SKIP_REASON).toContain(
        `bin/install --lang js --component ${COMPONENT}`,
      )
    }

    // ── (c) generation runs before the typecheck ───────────────────────────
    // A fresh checkout builds without a manual step: the generated directory is
    // not committed, so the emit has to happen first or nothing typechecks.
    // Read as EXECUTED steps, not as text: the usage banner mentions both
    // stages in prose, and matching that would pass whatever the real order was.
    const build = readFileSync(path.join(REPO, 'bin', 'build'), 'utf8')
    const assetsStep = build.indexOf('step "Control-app assets"')
    const typecheckStep = build.indexOf('step "Typecheck')
    expect(assetsStep).toBeGreaterThan(-1)
    expect(typecheckStep).toBeGreaterThan(assetsStep)
    const emit = build.indexOf('1c" assets', assetsStep)
    const typecheck = build.indexOf('pnpm -r build', typecheckStep)
    expect(emit).toBeGreaterThan(assetsStep)
    expect(emit).toBeLessThan(typecheckStep)
    expect(typecheck).toBeGreaterThan(emit)
    const tracked = spawnSync('git', ['ls-files', 'apps/control-app/src/generated/'], {
      cwd: REPO,
      encoding: 'utf8',
    })
    expect(tracked.status).toBe(0)
    expect(tracked.stdout.trim()).toBe('')

    if (!WEBUI_INSTALLED || !TICKETING_INSTALLED) {
      // The build copies the shared components, so it cannot run where they are
      // absent — the same visible skip the sibling suites use, rather than a
      // green run that silently proved nothing.
      expect(WEBUI_INSTALLED ? TICKETING_SKIP_REASON : WEBUI_SKIP_REASON).not.toBe('')
      return
    }

    // ── (d) the build emits the re-export, BY ABSOLUTE LOCATION ────────────
    // Run against a MIRROR root, never this checkout: `1c assets` empties
    // `dist-assets`, and sibling suites serve the real one over a live builder
    // origin. The mirror symlinks every directory the build READS and owns every
    // path it WRITES, so the command is the real one and this checkout is
    // untouched.
    const mirror = path.join(scratch, 'mirror')
    mkdirSync(mirror, { recursive: true })
    const link = (rel: string): void => {
      const dest = path.join(mirror, rel)
      mkdirSync(path.dirname(dest), { recursive: true })
      symlinkSync(path.join(REPO, rel), dest)
    }
    link(path.join('packages', 'site-schema'))
    link(path.join('packages', 'framework', 'src', 'l1'))
    link(path.join('apps', 'control-app', 'src', 'builder'))
    const modules = path.join('packages', 'framework', 'src', 'modules')
    mkdirSync(path.join(mirror, modules), { recursive: true })
    for (const entry of readdirSync(path.join(REPO, modules))) {
      if (entry === 'module-assets.ts') continue
      symlinkSync(path.join(REPO, modules, entry), path.join(mirror, modules, entry))
    }

    const json = spawnSync('node', [BIN, 'assets', '--json'], { cwd: mirror, encoding: 'utf8' })
    expect(json.status, json.stderr).toBe(0)
    const report = JSON.parse(json.stdout) as { ticketingEntry: string; aiWorkersEntry: string }

    // Resolved once at build time, through the single resolution point.
    expect(path.isAbsolute(report.ticketingEntry)).toBe(true)
    expect(report.ticketingEntry).toBe(sharedModulePath(COMPONENT))
    expect(existsSync(report.ticketingEntry)).toBe(true)

    // The emitted module carries that absolute path verbatim. A bare specifier
    // resolved at bundling time would find the store from the primary checkout
    // and find NOTHING from a linked working tree; this is what removes the
    // difference — and the store genuinely lies outside this checkout, so there
    // is a difference to remove.
    const generated = path.join(mirror, 'apps', 'control-app', 'src', 'generated')
    const shim = readFileSync(path.join(generated, 'ticketing.js'), 'utf8')
    expect(shim).toContain(`export * from ${JSON.stringify(report.ticketingEntry)}`)
    expect(report.ticketingEntry.startsWith(REPO + path.sep)).toBe(false)

    // Non-vacuity for the linked-working-tree case: where this run IS a linked
    // working tree, ordinary upward resolution from the checkout finds nothing,
    // and the generated absolute path is the only reason the build works at all.
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim()
    if (path.resolve(REPO, common) !== path.join(REPO, '.git')) {
      expect(() =>
        createRequire(path.join(REPO, 'package.json')).resolve(`${WEBUI_SCOPE}/${COMPONENT}`),
      ).toThrow()
    }

    // ── (e) it is its own named line in the build report, naming the location ──
    const human = spawnSync('node', [BIN, 'assets'], { cwd: mirror, encoding: 'utf8' })
    expect(human.status, human.stderr).toBe(0)
    const line = human.stdout.split('\n').find((l) => l.startsWith(COMPONENT))
    expect(line, 'the report names the emitted module on a line of its own').toBeDefined()
    expect(line).toContain(report.ticketingEntry)
    // Alongside the other generated artifacts rather than folded into one of
    // them — the AI shim keeps its own line too.
    expect(human.stdout).toMatch(/^ai\s+\//m)

    // ── (f) the type declaration enumerates names, never a wildcard ────────
    // A rename upstream must fail the typecheck rather than surface as an
    // undefined value at first use.
    const dts = readFileSync(path.join(generated, 'ticketing.d.ts'), 'utf8')
    expect(dts).not.toContain('export *')
    const names = [...dts.matchAll(/^export const (\w+)/gm)].map((m) => m[1])
    expect(names.length).toBeGreaterThan(0)
    expect(names).toEqual(
      expect.arrayContaining([
        'ATTACHMENT_SCHEMA',
        'ATTACHMENT_TYPE',
        'Accessor',
        'MultiTenantTicketStore',
        'R2BlobStore',
        'TypePack',
      ]),
    )
    // Every name the application actually imports is on the list.
    const source = readFileSync(path.join(APP, 'src', 'tickets.ts'), 'utf8')
    const imported = /import\s*\{([^}]+)\}\s*from '\.\/generated\/ticketing'/
      .exec(source)![1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    expect(names).toEqual(expect.arrayContaining(imported))
  })
})
