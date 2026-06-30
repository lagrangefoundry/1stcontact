import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import {
  editAssetAdd,
  editAssetGet,
  editAssetRm,
  editConfigGet,
  editConfigSet,
  editPageAdd,
  editPageGet,
  editPageList,
  editPageRm,
  editPageUpdate,
  editStatus,
} from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { run } from '../tools/generate/src/cli'
import { listFilesRel } from '../tools/generate/src/store'

/**
 * UATs for REQ-11 — the `1c` structured-edit command surface: validated,
 * AI-legible page/config/asset CRUD + `status`. Tests drive the command
 * handlers directly against an isolated temp working dir (behaviour), and drive
 * the CLI `run()` dispatcher (exit codes + `--json` envelopes). Nothing touches
 * the repo's real sites/ tree.
 */

let cwd: string
let origCwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req11-'))
  origCwd = process.cwd()
  // run() resolves against process.cwd(); chdir so CLI-level tests target temp.
  process.chdir(cwd)
})
afterEach(() => {
  process.chdir(origCwd)
  rmSync(cwd, { recursive: true, force: true })
})

const draftPath = (slug: string, ...parts: string[]) =>
  path.join(cwd, 'sites', slug, 'draft', ...parts)

/** Capture a draft tree as a rel→bytes map, for byte-identity assertions. */
function snapshotDraft(slug: string): Map<string, string> {
  const root = draftPath(slug)
  const m = new Map<string, string>()
  for (const rel of listFilesRel(root)) {
    m.set(rel, readFileSync(path.join(root, rel), 'latin1'))
  }
  return m
}

function draftsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false
  for (const [k, v] of a) if (b.get(k) !== v) return false
  return true
}

/** Run the CLI, capturing stdout/stderr and the resulting exit code. */
async function runCli(args: string[]): Promise<{ out: string; err: string; code: number }> {
  const logs: string[] = []
  const errs: string[] = []
  const origLog = console.log
  const origErr = console.error
  console.log = (...a: unknown[]) => logs.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => errs.push(a.map(String).join(' '))
  process.exitCode = 0
  try {
    await run(args)
  } finally {
    console.log = origLog
    console.error = origErr
  }
  const code = process.exitCode ?? 0
  process.exitCode = 0
  return { out: logs.join('\n'), err: errs.join('\n'), code }
}

describe('1c structured-edit command surface (REQ-11)', () => {
  it('test_UAT_FC_REQ-11_page_get_returns_definition', async () => {
    cmdNew('acme', { cwd })
    const out = editPageGet('acme', 'home', { cwd })
    const data = out.data as { page: { id: string; slug: string; modules: unknown[] } }
    expect(data.page.id).toBe('home')
    expect(data.page.slug).toBe('home')
    expect(Array.isArray(data.page.modules)).toBe(true)
    // --json emits a well-formed { ok: true, data: { page } } envelope.
    const envelope = JSON.parse((await runCli(['page', 'get', 'acme', 'home', '--json'])).out)
    expect(envelope.ok).toBe(true)
    expect(envelope.data.page.id).toBe('home')
  })

  it('test_UAT_FC_REQ-11_get_missing_returns_not_found', async () => {
    cmdNew('acme', { cwd })

    // Handler raises a typed NOT_FOUND.
    expect(() => editPageGet('acme', 'nope', { cwd })).toThrow(CommandError)
    try {
      editAssetGet('acme', 'nope', { cwd })
    } catch (e) {
      expect((e as CommandError).code).toBe('NOT_FOUND')
    }

    // CLI maps NOT_FOUND → exit 3, with a clear message.
    const page = await runCli(['page', 'get', 'acme', 'nope'])
    expect(page.code).toBe(3)
    expect(page.err).toContain('NOT_FOUND')
    const asset = await runCli(['asset', 'get', 'acme', 'nope'])
    expect(asset.code).toBe(3)
  })

  it('test_UAT_FC_REQ-11_page_add_validates_schema', async () => {
    cmdNew('acme', { cwd })
    // Corrupt an existing page so the *resulting* definition is invalid: any
    // write command must reject before touching disk, with a JSON-pointer path.
    const homePath = draftPath('acme', 'pages', 'home.json')
    const home = JSON.parse(readFileSync(homePath, 'utf8'))
    home.modules[1].version = 'one' // version must be a positive integer
    writeFileSync(homePath, JSON.stringify(home, null, 2))

    const before = snapshotDraft('acme')
    try {
      editPageAdd('acme', 'about', { cwd })
      throw new Error('expected SCHEMA_INVALID')
    } catch (e) {
      const ce = e as CommandError
      expect(ce.code).toBe('SCHEMA_INVALID')
      expect(ce.path).toMatch(/\/pages\/\d+\/modules\/\d+\/version/)
    }
    // No about.json was written; draft is byte-identical.
    expect(draftsEqual(before, snapshotDraft('acme'))).toBe(true)

    const cli = await runCli(['page', 'add', 'acme', 'about'])
    expect(cli.code).toBe(2)
  })

  it('test_UAT_FC_REQ-11_page_add_rejects_duplicate', async () => {
    cmdNew('acme', { cwd })
    editPageAdd('acme', 'about', { cwd, path: 'about' })

    // Duplicate pageId.
    try {
      editPageAdd('acme', 'about', { cwd, path: 'team' })
    } catch (e) {
      expect((e as CommandError).code).toBe('CONFLICT')
    }
    // Duplicate path (home page already owns slug 'home').
    try {
      editPageAdd('acme', 'landing', { cwd, path: 'home' })
    } catch (e) {
      expect((e as CommandError).code).toBe('CONFLICT')
    }

    const cli = await runCli(['page', 'add', 'acme', 'about'])
    expect(cli.code).toBe(5)
  })

  it('test_UAT_FC_REQ-11_page_rm_blocked_by_nav', () => {
    cmdNew('acme', { cwd })
    editPageAdd('acme', 'about', { cwd, path: 'about' })
    editConfigSet(
      'acme',
      'nav.entries',
      JSON.stringify([{ label: 'About Us', target: { kind: 'page', pageId: 'about' } }]),
      { cwd },
    )

    // Blocked: the integrity error names the offending nav entry.
    try {
      editPageRm('acme', 'about', { cwd })
      throw new Error('expected REFERENTIAL_INTEGRITY')
    } catch (e) {
      const ce = e as CommandError
      expect(ce.code).toBe('REFERENTIAL_INTEGRITY')
      expect(ce.message).toContain('About Us')
    }

    // --force removes the page AND cleans the nav entry.
    const out = editPageRm('acme', 'about', { cwd, force: true })
    expect((out.data as { navEntriesRemoved: number }).navEntriesRemoved).toBe(1)
    const nav = editConfigGet('acme', 'nav.entries', { cwd }).data as { value: unknown[] }
    expect(nav.value).toEqual([])
    expect(() => editPageGet('acme', 'about', { cwd })).toThrow(CommandError)
  })

  it('test_UAT_FC_REQ-11_asset_rm_blocked_by_reference', () => {
    cmdNew('acme', { cwd })
    const src = path.join(cwd, 'logo.svg')
    writeFileSync(src, '<svg/>')
    editAssetAdd('acme', src, { cwd, as: 'logo.svg' })

    // Reference the asset inline from the hero module's content.
    const homePath = draftPath('acme', 'pages', 'home.json')
    const home = JSON.parse(readFileSync(homePath, 'utf8'))
    home.modules[1].content.image = { id: 'logo.svg', src: 'logo.svg', alt: 'Logo' }
    writeFileSync(homePath, JSON.stringify(home, null, 2))

    try {
      editAssetRm('acme', 'logo.svg', { cwd })
      throw new Error('expected REFERENTIAL_INTEGRITY')
    } catch (e) {
      const ce = e as CommandError
      expect(ce.code).toBe('REFERENTIAL_INTEGRITY')
      // Names the referrer: page 'home', module 'hero', field 'image'.
      expect(ce.message).toContain('home')
      expect(ce.message).toContain('hero')
      expect(ce.message).toContain('image')
    }

    // --force removes it from the registry despite the dangling reference.
    editAssetRm('acme', 'logo.svg', { cwd, force: true })
    expect(() => editAssetGet('acme', 'logo.svg', { cwd })).toThrow(CommandError)
  })

  it('test_UAT_FC_REQ-11_config_set_validates', async () => {
    cmdNew('acme', { cwd })
    const before = snapshotDraft('acme')

    // businessName must be a string; a numeric JSON value is schema-invalid.
    try {
      editConfigSet('acme', 'config.businessName', '123', { cwd })
      throw new Error('expected SCHEMA_INVALID')
    } catch (e) {
      const ce = e as CommandError
      expect(ce.code).toBe('SCHEMA_INVALID')
      expect(ce.path).toBe('/config/businessName')
    }
    expect(draftsEqual(before, snapshotDraft('acme'))).toBe(true)

    const cli = await runCli(['config', 'set', 'acme', 'config.businessName', '123'])
    expect(cli.code).toBe(2)

    // A valid set succeeds and round-trips through config get.
    editConfigSet('acme', 'config.tagline', 'We deliver', { cwd })
    expect((editConfigGet('acme', 'config.tagline', { cwd }).data as { value: string }).value).toBe(
      'We deliver',
    )
  })

  it('test_UAT_FC_REQ-11_status_derives_pending_changes', async () => {
    cmdNew('acme', { cwd })
    await cmdPublish('acme', { cwd, message: 'r1' })

    // A clean draft (just published) has no pending changes.
    const clean = editStatus('acme', { cwd }).data as {
      baseRevision: number
      added: string[]
      modified: string[]
      removed: string[]
    }
    expect(clean.baseRevision).toBe(1)
    expect(clean.added.concat(clean.modified, clean.removed)).toEqual([])

    // Edit the draft, then status reports the modification against r1.
    editPageUpdate('acme', 'home', { cwd, title: 'Home (edited)' })
    const revsBefore = listFilesRel(path.join(cwd, 'sites', 'acme', 'revisions')).length
    const historyBefore = readFileSync(path.join(cwd, 'sites', 'acme', 'history.json'), 'utf8')

    const status = editStatus('acme', { cwd }).data as { modified: string[] }
    expect(status.modified).toContain('pages/home.json')

    // status creates no revision and writes nothing.
    expect(listFilesRel(path.join(cwd, 'sites', 'acme', 'revisions')).length).toBe(revsBefore)
    expect(readFileSync(path.join(cwd, 'sites', 'acme', 'history.json'), 'utf8')).toBe(historyBefore)
  })

  it('test_UAT_FC_REQ-11_failed_command_is_atomic', () => {
    cmdNew('acme', { cwd })
    const before = snapshotDraft('acme')

    // Several distinct failures must each leave the draft byte-identical.
    expect(() => editConfigSet('acme', 'nav.pattern', 'bogus-pattern', { cwd })).toThrow(CommandError)
    expect(() => editPageAdd('acme', 'home', { cwd })).toThrow(CommandError) // duplicate
    expect(() => editPageRm('acme', 'missing', { cwd })).toThrow(CommandError) // not found

    expect(draftsEqual(before, snapshotDraft('acme'))).toBe(true)
  })

  it('test_UAT_FC_REQ-11_json_envelope_shape', async () => {
    cmdNew('acme', { cwd })

    // Every structured-edit command, in --json mode, emits a single { ok, ... } line.
    const success = [
      ['status', 'acme'],
      ['page', 'list', 'acme'],
      ['page', 'get', 'acme', 'home'],
      ['config', 'get', 'acme'],
      ['config', 'get', 'acme', 'config.businessName'],
      ['asset', 'list', 'acme'],
    ]
    for (const args of success) {
      const { out, code } = await runCli([...args, '--json'])
      const env = JSON.parse(out)
      expect(env.ok).toBe(true)
      expect(env).toHaveProperty('data')
      expect(code).toBe(0)
    }

    // Failures carry a structured error with code + message.
    const failure = await runCli(['page', 'get', 'acme', 'ghost', '--json'])
    const env = JSON.parse(failure.out)
    expect(env.ok).toBe(false)
    expect(env.error.code).toBe('NOT_FOUND')
    expect(typeof env.error.message).toBe('string')
    expect(failure.code).toBe(3)
  })
})
