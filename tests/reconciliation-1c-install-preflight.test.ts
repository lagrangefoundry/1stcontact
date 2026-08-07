/**
 * Reconciliation UATs for story-e15a19ef — "1c CLI: flags parse correctly,
 * propagate into sub-commands, and --json emits a clean scriptable document".
 *
 * Guarantee 5, reconciled from bundle-15c1f647 (BUNDLE-16), plan item 6
 * (REQ-44): a command that loads a declared runtime dependency probes the
 * installed tree *before* doing any work, and refuses rather than dying deep
 * inside a browser launch with `Cannot find module 'playwright'`.
 *
 *   • AC-1013 — a gated command refuses, ahead of its own work, when a declared
 *     package does not resolve; the refusal names the command, the package, and
 *     the literal install command.
 *   • AC-1014 — lockfile drift is a fault in its own right, reported even while
 *     every dependency still resolves; byte-inequality is the oracle, and the
 *     two boundary shapes (never installed / no committed lockfile) are pinned.
 *   • AC-1015 — both faults arrive in one refusal, not one at a time.
 *   • AC-1016 — the refusal travels the CLI's structured-failure contract:
 *     `ENVIRONMENT`, exit 6, and the `{ok:false,error:{code,message,hint}}`
 *     envelope under `--json`.
 *   • AC-1017 — gating is per command, on exactly what that command loads; the
 *     offline verbs are never gated, and the gated set is pinned as a whole.
 *
 * Two boundaries are used, deliberately:
 *
 *   - the CLI entry point `run()`, driven from an *isolated* working directory
 *     that is not installed. `run()` gates on `process.cwd()`, so the refusal is
 *     the real one a caller would see — envelope, exit code, and the fact that
 *     no work precedes it. The fault staged there is the lockfile one, because
 *     it is decided from files alone: under vitest `NODE_PATH` points at pnpm's
 *     hoisted store, so *every* package resolves from any directory and the
 *     resolution fault cannot be staged through the real resolver without
 *     mutating the process's module paths.
 *   - `assertInstall`/`checkInstall` — the exact calls dispatch makes — against
 *     synthetic trees with an injected resolver, for the shapes a live cwd
 *     cannot express: a package that does not resolve, and a tree where every
 *     package *does* resolve while the lockfile has drifted.
 *
 * Nothing here touches the repo's own `node_modules` or its lockfile.
 *
 * The sibling criteria of this story (AC-656/657/658/659, AC-720, AC-738/739)
 * are covered in `reconciliation-1c-cli-output-hygiene.test.ts`,
 * `reconciliation-1c-aligned-crops-sandbox-routing.test.ts` and
 * `reconciliation-1c-astro-free-render.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  assertInstall,
  checkInstall,
  COMMAND_DEPS,
  INSTALL_COMMAND,
  INSTALLED_LOCKFILE_REL,
  LOCKFILE_REL,
  run,
} from '../tools/generate/src/cli'
import type { Resolver } from '../tools/generate/src/cli'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'

const LOCK = "lockfileVersion: '9.0'\nimporters:\n  .: {}\n"

let cwd: string
let origCwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-e15a19ef-preflight-'))
  origCwd = process.cwd()
  // The dispatch gate probes process.cwd(); chdir so the CLI-level tests see an
  // uninstalled workspace rather than this repo's healthy one.
  process.chdir(cwd)
})
afterEach(() => {
  process.chdir(origCwd)
  rmSync(cwd, { recursive: true, force: true })
})

/** Write the committed lockfile into `root`, and optionally pnpm's install-time copy. */
function lockfiles(root: string, committed: string, installed?: string): void {
  writeFileSync(path.join(root, LOCKFILE_REL), committed)
  if (installed !== undefined) {
    const dest = path.join(root, INSTALLED_LOCKFILE_REL)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, installed)
  }
}

/** A resolver that finds exactly the named packages and nothing else. */
function resolves(...present: string[]): Resolver {
  return (pkg) => (present.includes(pkg) ? `/fake/node_modules/${pkg}/index.js` : undefined)
}

/** Every relative path under `root`, sorted — a tree fingerprint. */
function tree(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string, rel: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel === '' ? entry.name : `${rel}/${entry.name}`
      out.push(r)
      if (entry.isDirectory()) walk(path.join(dir, entry.name), r)
    }
  }
  walk(root, '')
  return out
}

/** Drive the real CLI entry point, capturing stdout, stderr and the exit code. */
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
  // Never leave the vitest process itself carrying the CLI's exit code.
  process.exitCode = 0
  return { out: logs.join('\n'), err: errs.join('\n'), code }
}

/** Capture the CommandError a gated command refuses with. */
function refusalOf(command: string, opts: { repoRoot: string; resolve?: Resolver }): CommandError {
  try {
    assertInstall(command, opts)
  } catch (err) {
    expect(err).toBeInstanceOf(CommandError)
    return err as CommandError
  }
  throw new Error(`expected '1c ${command}' to refuse, but it passed the preflight`)
}

// ── AC-1013: refuse before doing any work when a declared dep does not resolve ─

describe('story-e15a19ef — a gated command refuses on an unresolvable declared dependency', () => {
  it('test_UAT_AC1013_gated_command_refuses_before_doing_any_work', async () => {
    // The observed failure, staged faithfully: the tree is installed *at* its
    // committed lockfile (so drift is not the fault here — resolution is), and a
    // package the manifests still declare is simply not on disk. `1c shot` must
    // say so up front rather than dying inside a browser launch.
    const pruned = path.join(cwd, 'pruned')
    mkdirSync(pruned, { recursive: true })
    lockfiles(pruned, LOCK, LOCK)

    const err = refusalOf('shot', { repoRoot: pruned, resolve: resolves('sharp') })

    // The refusal names the command …
    expect(err.message).toContain("'1c shot' cannot run")
    // … and the package that failed to resolve, so the reader is not left
    // guessing which one went. `sharp` still resolves, so it is not implicated.
    expect(err.message).toContain('playwright')
    expect(err.message).toContain('does not resolve')
    expect(err.message).not.toContain("'sharp'")
    // …stated as declared-but-absent, not as an undeclared import.
    expect(err.message).toContain(path.join('tools', 'generate', 'package.json'))
    expect(err.message).toContain('not present in node_modules/')
    // The remedy is the literal command to run, not a description of one.
    expect(err.hint).toContain(INSTALL_COMMAND)
    expect(INSTALL_COMMAND).toBe('pnpm install')

    // "Ahead of the command's own work" — verified through the real entry point,
    // whose gate sits before the command switch. `1c shot` would render the site
    // and launch a browser; instead the workspace it was pointed at is left
    // byte-for-byte as we found it, and nothing reached stdout.
    lockfiles(cwd, LOCK)
    const before = tree(cwd)
    const cli = await runCli(['shot', 'demo'])
    expect(cli.code).toBe(EXIT_CODES.ENVIRONMENT)
    expect(cli.err).toContain("'1c shot' cannot run")
    // No render ran, no browser launched, no file was written.
    expect(tree(cwd)).toEqual(before)
    // The human refusal is stderr's business; stdout stays clean.
    expect(cli.out).toBe('')
  })
})

// ── AC-1014: drift is reported even when every dependency still resolves ─────

describe('story-e15a19ef — an install that lags the committed lockfile is its own fault', () => {
  it('test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve', () => {
    // Three synthetic trees, every required package resolvable in all three —
    // so nothing here can be explained by a missing dependency.
    const root = (name: string): string => {
      const dir = path.join(cwd, name)
      mkdirSync(dir, { recursive: true })
      return dir
    }
    const all = resolves('playwright', 'sharp')

    // 1. Committed lockfile ≠ the snapshot pnpm wrote at install: the tree is
    //    not the one the lockfile describes. Reported *now*, while the commands
    //    still work, because this is the state the next prune turns into a crash.
    const drifted = root('drifted')
    lockfiles(drifted, LOCK + "  tools/generate: { sharp: '0.35.0' }\n", LOCK)
    const driftErr = refusalOf('shot', { repoRoot: drifted, resolve: all })
    expect(driftErr.code).toBe('ENVIRONMENT')
    expect(driftErr.message).toContain(LOCKFILE_REL)
    expect(driftErr.message).toContain('behind the committed lockfile')
    // Resolution is clean, so drift is the *only* finding.
    expect(checkInstall({ repoRoot: drifted, required: ['playwright'], resolve: all }).findings.map((f) => f.kind)).toEqual([
      'lockfile-drift',
    ])

    // 2. No install-time snapshot at all — pnpm has never run here. Same remedy,
    //    so the same fault rather than a special case.
    const never = root('never-installed')
    lockfiles(never, LOCK)
    const neverErr = refusalOf('shot', { repoRoot: never, resolve: all })
    expect(neverErr.code).toBe('ENVIRONMENT')
    expect(neverErr.message).toContain(INSTALLED_LOCKFILE_REL)
    expect(neverErr.message).toContain('never been installed')

    // 3. No committed lockfile at all — a different project shape, not a drifted
    //    install. Inventing a failure here is exactly the false gate that gets
    //    preflights switched off, so the check keeps its hands off it.
    const unlocked = root('no-lockfile')
    expect(() => assertInstall('shot', { repoRoot: unlocked, resolve: all })).not.toThrow()

    // The oracle is byte-inequality, not a timestamp: a merely *touched* file —
    // identical bytes, a newer mtime — is not drift.
    const touched = root('touched')
    lockfiles(touched, LOCK, LOCK)
    const snapshot = path.join(touched, INSTALLED_LOCKFILE_REL)
    const future = new Date(statSync(snapshot).mtime.getTime() + 60_000)
    utimesSync(snapshot, future, future)
    expect(() => assertInstall('shot', { repoRoot: touched, resolve: all })).not.toThrow()
  })
})

// ── AC-1015: both faults reported together in one refusal ────────────────────

describe('story-e15a19ef — both install faults arrive in a single refusal', () => {
  it('test_UAT_AC1015_both_faults_reported_in_one_refusal', async () => {
    // A tree that is simultaneously missing a required package and carrying an
    // install snapshot that differs from the committed lockfile. Both are true
    // at once and both are stated, so one `pnpm install` clears everything the
    // operator was told about — no fix-one-learn-the-next round trip.
    const both = path.join(cwd, 'both-faults')
    mkdirSync(both, { recursive: true })
    lockfiles(both, LOCK + 'drifted\n', LOCK)

    const err = refusalOf('diff', { repoRoot: both, resolve: resolves() })

    // ONE refusal …
    expect(err).toBeInstanceOf(CommandError)
    // … stating both facts, each as its own line.
    const bullets = err.message.split('\n').filter((l) => l.trim().startsWith('- '))
    expect(bullets).toHaveLength(2)
    expect(err.message).toContain('playwright')
    expect(err.message).toContain('sharp')
    expect(err.message).toContain(LOCKFILE_REL)
    expect(err.message).toContain('does not match the snapshot pnpm wrote at last install')

    const report = checkInstall({ repoRoot: both, required: ['playwright', 'sharp'], resolve: resolves() })
    expect(report.ok).toBe(false)
    expect(report.findings.map((f) => f.kind).sort()).toEqual(['lockfile-drift', 'missing-dep'])
    expect(report.findings.find((f) => f.kind === 'missing-dep')?.packages).toEqual(['playwright', 'sharp'])

    // Both facts also survive into the machine-readable envelope, so a scripted
    // caller learns the whole state of the tree from one run too.
    const envelope = err.toEnvelope() as { code: string; message: string; hint: string }
    expect(envelope.code).toBe('ENVIRONMENT')
    expect(envelope.message).toContain('playwright')
    expect(envelope.message).toContain(LOCKFILE_REL)
    // One remedy clears both — that is why they are reported together.
    expect(envelope.hint).toContain(INSTALL_COMMAND)
  })
})

// ── AC-1016: ENVIRONMENT, exit 6, and the standard --json error envelope ─────

describe('story-e15a19ef — the refusal travels the CLI failure contract', () => {
  it('test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope', async () => {
    // A workspace carrying a committed lockfile it was never installed at — a
    // real preflight failure, decided from files alone, so the whole contract is
    // exercised through the CLI entry point rather than asserted about it.
    lockfiles(cwd, LOCK)

    // `ENVIRONMENT` maps to exit 6, and is distinct from every input-shaped code
    // and from INTERNAL: neither the command nor its input was wrong, so the
    // caller should re-install and retry rather than re-form the request.
    expect(EXIT_CODES.ENVIRONMENT).toBe(6)
    for (const other of ['SCHEMA_INVALID', 'NOT_FOUND', 'REFERENTIAL_INTEGRITY', 'CONFLICT', 'INTERNAL'] as const) {
      expect(EXIT_CODES[other]).not.toBe(EXIT_CODES.ENVIRONMENT)
    }

    // Human mode: the code, and exit 6.
    const human = await runCli(['values-diff', 'demo'])
    expect(human.code).toBe(6)
    expect(human.err).toContain('ENVIRONMENT')
    expect(human.err).toContain(INSTALL_COMMAND)

    // `--json` mode: exactly one document, the standard failure envelope, the
    // same exit code, and the same message + literal install hint.
    const json = await runCli(['values-diff', 'demo', '--json'])
    expect(json.code).toBe(6)
    const envelope = JSON.parse(json.out) as {
      ok: boolean
      error: { code: string; message: string; hint: string }
    }
    expect(envelope.ok).toBe(false)
    expect(envelope.error.code).toBe('ENVIRONMENT')
    expect(envelope.error.message).toContain("'1c values-diff' cannot run")
    // The literal install command, identical to the human rendering.
    expect(envelope.error.hint).toContain(INSTALL_COMMAND)
    // Same message either way — the JSON caller is not told a different story.
    expect(human.err).toContain(envelope.error.message.split('\n')[0])
  })
})

// ── AC-1017: gated on exactly what each command loads; offline verbs never ───

describe('story-e15a19ef — the gate is scoped to what each command loads', () => {
  it('test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads', async () => {
    const installed = path.join(cwd, 'installed')
    mkdirSync(installed, { recursive: true })
    lockfiles(installed, LOCK, LOCK)

    const onlyBrowser = { repoRoot: installed, resolve: resolves('playwright') }
    const onlyImaging = { repoRoot: installed, resolve: resolves('sharp') }

    // The browser-driving verbs are gated on the browser dependency only: they
    // run on a tree with no `sharp`, and refuse naming `playwright` without it.
    for (const command of ['capture', 'shot', 'values-diff', 'adopt-gaps']) {
      expect(() => assertInstall(command, onlyBrowser), command).not.toThrow()
      expect(refusalOf(command, onlyImaging).message, command).toContain('playwright')
      expect(refusalOf(command, onlyImaging).message, command).not.toContain("'sharp'")
    }

    // `1c crop` decodes an image and never opens a browser: the imaging
    // dependency only, so a tree without playwright does not block it.
    expect(() => assertInstall('crop', onlyImaging)).not.toThrow()
    expect(refusalOf('crop', onlyBrowser).message).toContain('sharp')
    expect(refusalOf('crop', onlyBrowser).message).not.toContain("'playwright'")

    // The verbs that need both eyes refuse when *either* is absent, naming the
    // one that is missing.
    for (const command of ['diff', 'gate', 'aligned-crops']) {
      expect(() => assertInstall(command, { repoRoot: installed, resolve: resolves('playwright', 'sharp') }), command).not.toThrow()
      expect(refusalOf(command, onlyBrowser).message, command).toContain('sharp')
      expect(refusalOf(command, onlyImaging).message, command).toContain('playwright')
    }

    // The offline verbs read and write files only. On a tree with neither
    // dependency present and no install at all, they are never gated — blocking
    // them would make the preflight the obstacle it was written to remove.
    const bare = path.join(cwd, 'bare')
    mkdirSync(bare, { recursive: true })
    for (const command of [
      'render',
      'serve',
      'builder',
      'repro',
      'refold',
      'l1-gate',
      'responsive-diff',
      'page',
      'config',
      'asset',
      'status',
    ]) {
      expect(() => assertInstall(command, { repoRoot: bare, resolve: resolves() }), command).not.toThrow()
    }

    // End-to-end proof that an offline verb gets past the gate in a workspace
    // with nothing installed: it fails on its *own* terms (a reference bundle
    // with no capture in it), not with an ENVIRONMENT refusal.
    const emptyRef = path.join(cwd, 'ref')
    mkdirSync(emptyRef, { recursive: true })
    await expect(run(['responsive-diff', '--ref', emptyRef])).rejects.toThrow(/multistate\.json[\s\S]*re-capture/i)

    // The gated set is pinned as a whole: adding a command that launches a
    // browser without gating it is a visible failure here, rather than a silent
    // reopening of the gap this guarantee closed.
    expect(Object.keys(COMMAND_DEPS).sort()).toEqual([
      'adopt-gaps',
      'aligned-crops',
      'capture',
      'crop',
      'diff',
      'gate',
      'shot',
      'values-diff',
    ])
  })
})
