/**
 * REQ-44 — the `1c` install preflight.
 *
 * `sharp` was added to `tools/generate/package.json` and the lockfile by a
 * workflow commit, and no install followed. `node_modules` fell behind the
 * lockfile; a later prune removed `playwright` — a package the manifests still
 * *declared* — and every browser command died deep inside its own launch with
 * `Cannot find module 'playwright'`. The manifests had been right the whole
 * time; only the install was stale. A `pnpm install` fixed it and changed no
 * tracked file.
 *
 * These UATs pin the ticket's acceptance: a declared package that does not
 * resolve is caught before the browser starts; a tree whose install lags the
 * lockfile is caught *while the commands still work*, because that is the state
 * the next prune turns into the crash above; both arrive as one refusal naming
 * the remedy; and the gate is scoped — an offline verb is never blocked by a
 * dependency it does not load.
 *
 * The install is probed through injected seams (a synthetic repo root, a fake
 * resolver), so the suite never mutates a real `node_modules`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  assertInstall,
  checkInstall,
  COMMAND_DEPS,
  INSTALLED_LOCKFILE_REL,
  LOCKFILE_REL,
  type Resolver,
} from '../tools/generate/src/cli/preflight'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'

const LOCK = "lockfileVersion: '9.0'\nimporters:\n  .: {}\n"

let root: string

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'req44-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

/** Write the committed lockfile, and optionally the copy pnpm leaves after an install. */
function lockfiles(committed: string, installed?: string): void {
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

/** The healthy baseline: install matches the lockfile, everything resolves. */
function installedTree(): void {
  lockfiles(LOCK, LOCK)
}

describe('REQ-44 — install preflight', () => {
  it('test_UAT_FC_REQ-44_clean_install_passes', () => {
    installedTree()
    const report = checkInstall({
      repoRoot: root,
      required: ['playwright', 'sharp'],
      resolve: resolves('playwright', 'sharp'),
    })
    expect(report.ok).toBe(true)
    expect(report.findings).toEqual([])
  })

  it('test_UAT_FC_REQ-44_pruned_declared_dependency_is_caught', () => {
    // The observed failure: the lockfile is current, but a prune took a package
    // the manifests still declare. Nothing about the manifests reveals this —
    // only asking the disk does.
    installedTree()
    const report = checkInstall({
      repoRoot: root,
      required: ['playwright', 'sharp'],
      resolve: resolves('sharp'),
    })
    expect(report.ok).toBe(false)
    expect(report.findings).toHaveLength(1)
    const [finding] = report.findings
    expect(finding.kind).toBe('missing-dep')
    expect(finding.packages).toEqual(['playwright'])
    // The package is named, so the reader is not left to guess which one went.
    expect(finding.detail).toContain('playwright')
    expect(finding.detail).not.toContain('sharp')
  })

  it('test_UAT_FC_REQ-44_lockfile_drift_fails_while_deps_still_resolve', () => {
    // The precise state that produced the bug: every dependency still loads, so
    // nothing is visibly broken — and the tree is already not the one the
    // lockfile describes. Reporting it here is what makes the check preventive
    // rather than a post-mortem.
    lockfiles(LOCK + "  tools/generate: { sharp: '0.35.0' }\n", LOCK)
    const report = checkInstall({
      repoRoot: root,
      required: ['playwright'],
      resolve: resolves('playwright'),
    })
    expect(report.ok).toBe(false)
    expect(report.findings.map((f) => f.kind)).toEqual(['lockfile-drift'])
    expect(report.findings[0].detail).toContain(LOCKFILE_REL)
  })

  it('test_UAT_FC_REQ-44_never_installed_tree_is_drift', () => {
    // No `node_modules/.pnpm/lock.yaml` at all — pnpm has never run here. Same
    // remedy, so it is the same finding rather than a separate special case.
    lockfiles(LOCK)
    const report = checkInstall({ repoRoot: root, required: [], resolve: resolves() })
    expect(report.ok).toBe(false)
    expect(report.findings.map((f) => f.kind)).toEqual(['lockfile-drift'])
  })

  it('test_UAT_FC_REQ-44_both_faults_reported_together', () => {
    // A stale tree usually presents both at once. They are independent facts and
    // both are reported, so one `pnpm install` clears everything the operator was
    // told about — no second round trip.
    lockfiles(LOCK + 'drifted\n', LOCK)
    const report = checkInstall({
      repoRoot: root,
      required: ['playwright', 'sharp'],
      resolve: resolves(),
    })
    expect(report.ok).toBe(false)
    expect(report.findings.map((f) => f.kind).sort()).toEqual(['lockfile-drift', 'missing-dep'])
    expect(report.findings.find((f) => f.kind === 'missing-dep')?.packages).toEqual([
      'playwright',
      'sharp',
    ])
  })

  it('test_UAT_FC_REQ-44_no_lockfile_is_not_drift', () => {
    // Without a committed lockfile there is no oracle to compare against. That
    // is a different project shape, not a drifted install, and the check keeps
    // its hands off it — an invented failure here would be exactly the kind of
    // false gate that gets preflights disabled.
    const report = checkInstall({
      repoRoot: root,
      required: ['playwright'],
      resolve: resolves('playwright'),
    })
    expect(report.ok).toBe(true)
  })
})

describe('REQ-44 — the gate on commands', () => {
  it('test_UAT_FC_REQ-44_browser_command_refuses_with_environment_code', () => {
    lockfiles(LOCK, LOCK)
    let caught: unknown
    try {
      assertInstall('shot', { repoRoot: root, resolve: resolves('sharp') })
    } catch (err) {
      caught = err
    }
    // The CLI's existing failure contract, so an AI caller branches on the code
    // rather than reading prose: ENVIRONMENT, exit 6, and a `{ok:false,error}`
    // envelope under --json.
    expect(caught).toBeInstanceOf(CommandError)
    const err = caught as CommandError
    expect(err.code).toBe('ENVIRONMENT')
    expect(EXIT_CODES[err.code]).toBe(6)
    expect(err.message).toContain('1c shot')
    expect(err.message).toContain('playwright')
    // The remedy is the literal command to run, not a description of one.
    expect(err.hint).toContain('pnpm install')
    expect(err.toEnvelope()).toMatchObject({ code: 'ENVIRONMENT' })
  })

  it('test_UAT_FC_REQ-44_offline_commands_are_not_gated', () => {
    // `render`, `repro`, `l1-gate` and the structured-edit verbs read and write
    // files. Blocking them on a browser dependency they never load would make the
    // preflight the obstacle it was written to remove — so a tree with no
    // playwright, no sharp and no install at all still runs them.
    for (const command of ['render', 'builder', 'repro', 'refold', 'l1-gate', 'responsive-diff', 'page', 'config', 'status']) {
      expect(() => assertInstall(command, { repoRoot: root, resolve: resolves() })).not.toThrow()
    }
  })

  it('test_UAT_FC_REQ-44_each_command_requires_only_what_it_loads', () => {
    // Each gate is the command's actual load set — which REQ-156 shrank to one
    // package. `sharp` was the imaging half and is gone; the codec is ordinary
    // source now, so `1c crop` loads nothing that can be absent and is not gated
    // at all, while the diff verbs are gated on the browser alone.
    lockfiles(LOCK, LOCK)
    expect(() => assertInstall('crop', { repoRoot: root, resolve: resolves() })).not.toThrow()
    expect(() => assertInstall('shot', { repoRoot: root, resolve: resolves('playwright') })).not.toThrow()
    expect(() => assertInstall('diff', { repoRoot: root, resolve: resolves('playwright') })).not.toThrow()
    expect(() => assertInstall('diff', { repoRoot: root, resolve: resolves() })).toThrow(/playwright/)
  })

  it('test_UAT_FC_REQ-44_gated_set_is_exactly_the_browser_and_imaging_verbs', () => {
    // Pinned as a set: adding a command that launches a browser without adding it
    // here silently reopens the hole this ticket closed.
    //
    // `crop` LEFT THE SET under REQ-156, which replaced `sharp` with a PNG codec
    // written into this repo. It opens no browser, so `sharp` was its only entry;
    // with nothing left that can be absent, a gate on it could only ever produce
    // a false refusal. Every remaining member is here for `playwright`.
    expect(Object.keys(COMMAND_DEPS).sort()).toEqual([
      'adopt-gaps',
      'aligned-crops',
      'capture',
      'diff',
      'gate',
      'shot',
      'values-diff',
    ])
    expect([...new Set(Object.values(COMMAND_DEPS).flat())]).toEqual(['playwright'])
  })

  it('test_UAT_FC_REQ-44_this_repos_own_install_is_healthy', () => {
    // The check against the real tree, with real Node resolution — the one that
    // would have failed on the day the bug was found. It is also the guard that
    // keeps the synthetic seams above honest: they can only test the logic, not
    // that the logic is pointed at the right files.
    const report = checkInstall({ repoRoot: process.cwd(), required: ['playwright'] })
    expect(report.findings).toEqual([])
  })
})
