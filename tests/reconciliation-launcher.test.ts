import { describe, expect, it } from 'vitest'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Reconciliation UATs for story-5c2f2faa — the `1c` launcher (bin/1c) and its
 * collision-free SSR server. These drive the REAL shell launcher as a
 * subprocess, so they exercise its own-location resolution and CWD handling as
 * well as the mjs entrypoint's disabled HMR WebSocket — not the individual
 * command handlers (covered by their own stories).
 *
 *   AC-545 — launcher runs the CLI from any working directory
 *   AC-546 — launcher preserves the caller's working directory for path resolution
 *   AC-547 — launcher runs clean when the HMR port is already occupied
 */

const testDir = path.dirname(fileURLToPath(import.meta.url)) // <repo>/tests — a real nested subdir
const repoRoot = path.resolve(testDir, '..')
const launcher = path.join(repoRoot, 'bin', '1c') // the shell launcher under test
const cliEntry = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')
const HMR_PORT = 24678

/**
 * Strip Astro/Vite's timestamped log lines (e.g. "16:26:12 [WARN] Missing pages
 * directory: src/pages") so the substantive command output can be compared
 * deterministically — the timestamp differs run-to-run and is not command output.
 */
function stripLogNoise(s: string): string {
  return s
    .split('\n')
    .filter((line) => !/^\d{2}:\d{2}:\d{2} /.test(line))
    .join('\n')
    .trim()
}

/** Run the shell launcher `bin/1c <args>` from a given directory. */
function runLauncher(cwd: string, args: string[]): SpawnSyncReturns<string> {
  return spawnSync(launcher, args, { cwd, encoding: 'utf8' })
}

/** Run the CLI's node entrypoint directly (`node tools/generate/bin/1c.mjs`). */
function runDirect(cwd: string, args: string[]): SpawnSyncReturns<string> {
  return spawnSync('node', [cliEntry, ...args], { cwd, encoding: 'utf8' })
}

/** Bind the HMR port to reproduce a running `1c serve`; null if already held. */
function occupyHmrPort(): Promise<net.Server | null> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(null)) // already in use == same test condition
    srv.listen(HMR_PORT, () => resolve(srv))
  })
}

describe('1c launcher — location, CWD, and HMR (story-5c2f2faa)', () => {
  it(
    'test_UAT_AC545_runs_cli_from_any_working_directory',
    () => {
      // Use a CWD-independent command (`help` prints the fixed USAGE banner):
      // the AC permits any read-only command ("e.g. list") and its claim is
      // specifically that the launcher locates the CLI by its OWN on-disk
      // location, not the caller's CWD — so invoking it from the repo root and
      // from a nested subdirectory must run the SAME CLI and yield the SAME
      // output. (Data-bearing commands like `list` are deliberately CWD-relative
      // — that is AC-546's concern — so they are the wrong instrument here.)
      const fromRoot = runLauncher(repoRoot, ['help'])
      const fromNested = runLauncher(testDir, ['help'])

      // Both invocations succeed regardless of the directory they ran from.
      expect(fromRoot.status).toBe(0)
      expect(fromNested.status).toBe(0)

      const rootOut = stripLogNoise(fromRoot.stdout)
      const nestedOut = stripLogNoise(fromNested.stdout)

      // The real CLI actually ran (its USAGE banner), not an empty/errored stub.
      expect(rootOut).toContain('Usage:')
      expect(rootOut).toContain('1c — file-backed site storage')
      // ...and the output is identical whichever directory the launcher ran in.
      expect(nestedOut).toBe(rootOut)
    },
    60_000,
  )

  it(
    'test_UAT_AC546_preserves_caller_working_directory',
    () => {
      // `list` resolves sites under <cwd>/storage — a CWD-relative target. The
      // launcher must NOT cd before dispatching, so from a given directory it
      // must act on the same target as a direct node invocation from that dir.
      const launcherAtRoot = runLauncher(repoRoot, ['list'])
      const directAtRoot = runDirect(repoRoot, ['list'])

      expect(launcherAtRoot.status).toBe(0)
      expect(directAtRoot.status).toBe(0)

      const launcherOut = stripLogNoise(launcherAtRoot.stdout)
      const directOut = stripLogNoise(directAtRoot.stdout)

      // Same target resolved from the same directory: launcher vs direct node.
      expect(launcherOut).toBe(directOut)
      // Strong observable: the repo root's storage/ tree actually yielded site
      // rows (slug<TAB>revision), proving `list` read the caller-relative store.
      expect(launcherOut).toMatch(/\S+\t(r\d+|\(unpublished\))/)

      // Resolution genuinely follows the caller's CWD: from a nested
      // subdirectory with no storage/ tree, the SAME launcher command resolves
      // a different (empty) target. Had the launcher cd'd to a fixed root, this
      // would have shown the repo root's sites instead.
      const launcherAtNested = runLauncher(testDir, ['list'])
      expect(launcherAtNested.status).toBe(0)
      const nestedOut = stripLogNoise(launcherAtNested.stdout)
      expect(nestedOut).not.toBe(launcherOut)
      expect(nestedOut).toContain('(no sites)')
    },
    60_000,
  )

  it(
    'test_UAT_AC547_runs_clean_when_hmr_port_occupied',
    async () => {
      // Occupy Vite's fixed HMR port (24678), as a long-running `1c serve`
      // holds it. The launcher's SSR server disables the ws server (Vite 8 gates
      // it on `server.ws`), so any other invocation must still succeed and never
      // log a port-in-use error.
      const blocker = await occupyHmrPort()
      try {
        const res = runLauncher(repoRoot, ['list'])
        // Command succeeds despite the port being taken...
        expect(res.status).toBe(0)
        // ...and never complains about the HMR port being in use.
        expect(res.stderr).not.toContain('is already in use')
        expect(res.stderr).not.toContain('24678')
      } finally {
        blocker?.close()
      }
    },
    60_000,
  )
})
