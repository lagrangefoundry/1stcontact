import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * A harness for `bin/deploy.d/secrets/*` hooks ([[REQ-149]], generalised by
 * [[REQ-196]], given a capability probe by [[REQ-264]]).
 *
 * WHY A STUB `npx`. A hook talks to Cloudflare through `npx wrangler`. Put a
 * stub of that name first on PATH and the hook's decision table becomes testable
 * without a network, a Worker, or a real credential — which is the only way to
 * exercise the branch that matters (the value is absent locally and present
 * remotely), since a test can never legitimately hold a real key.
 *
 * WHY IT IS SHARED. It was REQ-149's, written for one hook. There are two now
 * and the contract is the directory's rather than either hook's — same decision
 * table, same dry-run rule, same never-print-the-value rule — so a second copy
 * would be two descriptions of one contract, free to disagree about which one
 * the README means.
 *
 * WHY A STUB `node` TOO ([[REQ-264]]). A hook now PROBES a supplied credential
 * by running `bin/deploy.d/lib/probe.mjs`, and what belongs to the hook is the
 * POLICY — which verdict is a warning and which is a refusal — not the HTTP. So
 * `node` is stubbed the same way `npx` is: the harness dictates the verdict, and
 * the hook's mapping from verdict to outcome is what gets exercised. The probes
 * themselves are proven separately, against a fake `fetch`, where every branch
 * is reachable and no suite ever holds a real key.
 *
 * The stub also RECORDS ITS ARGUMENTS, which is how the other half of the claim
 * is checked: a hook that skipped the probe, or that wrote no row into the
 * capability report, is indistinguishable from one that did unless somebody
 * looks at what it actually invoked.
 *
 * The child NEVER inherits the developer's own shell, so "absent" means absent:
 * the environment below is constructed from nothing.
 */

const STUB = `#!/usr/bin/env bash
set -euo pipefail
# invoked as: npx wrangler secret <verb> ...
if [[ "\${3:-}" == "list" ]]; then
  [[ "\${STUB_LIST_FAILS:-0}" == "1" ]] && { echo "could not reach the API" >&2; exit 1; }
  cat "\$STUB_LIST_JSON"
  exit 0
fi
if [[ "\${3:-}" == "put" ]]; then
  cat > "\$STUB_PUT_RECORD"     # the value arrives on stdin
  echo "Success! Uploaded secret \${4:-}"
  exit 0
fi
echo "stub: unexpected argv: \$*" >&2
exit 99
`

export interface HookHarness {
  /** Run the hook once, under a constructed environment. */
  run(options: HookRun): HookResult
  /** Tear the temporary tree down. */
  dispose(): void
}

/**
 * The stub stands in for `node` and therefore for `probe.mjs`.
 *
 * It prints the line the real probe prints, exits with the verdict it was told
 * to, and appends its argv to a file so the harness can see WHICH command ran.
 * `record` always exits 0, as the real one does — a report row that failed to
 * write must never fail a deploy.
 */
const NODE_STUB = `#!/usr/bin/env bash
set -euo pipefail
# invoked as: node <path-to-probe.mjs> <probe|record|report> <args...>
printf '%s\\n' "\${*:2}" >> "\$STUB_NODE_RECORD"
if [[ "\${2:-}" == "probe" ]]; then
  echo "    \${3:-}: stub verdict \${STUB_PROBE_EXIT:-0}"
  exit "\${STUB_PROBE_EXIT:-0}"
fi
exit 0
`

export interface HookRun {
  /** The credential in the operator's shell. Omitted means genuinely absent. */
  value?: string
  /** Secret names the Worker already holds. */
  stored?: string[]
  /** The store could not be read at all. */
  listFails?: boolean
  dryRun?: boolean
  /** Which app is being deployed; hooks are one-app-each. */
  app?: string
  /**
   * What the capability probe answers: 0 capable, 2 insufficient, 3 invalid,
   * anything else unproven. Defaults to capable, so every pre-[[REQ-264]] case
   * keeps testing what it was written to test.
   */
  probeExit?: number
}

export interface HookResult {
  code: number | null
  /** stdout and stderr together — a hook's decision may be reported on either. */
  out: string
  /** Exactly what was piped to `wrangler secret put`, or null if nothing was. */
  pushed: string | null
  /**
   * Every `probe.mjs` invocation the hook made, as `<command> <args...>` — so a
   * hook that never probed, or never recorded, is visible as an absence.
   */
  probes: string[]
}

/**
 * Build a harness for one hook and one environment variable name.
 *
 * @param hookPath repo-relative path, e.g. `bin/deploy.d/secrets/20-resend-api-key`
 * @param varName  the environment variable the hook reads, e.g. `RESEND_API_KEY`
 */
export function secretHookHarness(hookPath: string, varName: string): HookHarness {
  const hook = resolve(hookPath)
  const dir = mkdtempSync(join(tmpdir(), 'secret-hook-'))
  mkdirSync(join(dir, 'bin'))
  mkdirSync(join(dir, 'app'))
  writeFileSync(join(dir, 'bin', 'npx'), STUB)
  chmodSync(join(dir, 'bin', 'npx'), 0o755)
  writeFileSync(join(dir, 'bin', 'node'), NODE_STUB)
  chmodSync(join(dir, 'bin', 'node'), 0o755)
  const putRecord = join(dir, 'put-record')
  const listJson = join(dir, 'list.json')
  const nodeRecord = join(dir, 'node-record')

  return {
    dispose: () => rmSync(dir, { recursive: true, force: true }),
    run(options) {
      rmSync(putRecord, { force: true })
      rmSync(nodeRecord, { force: true })
      writeFileSync(nodeRecord, '')
      writeFileSync(
        listJson,
        JSON.stringify(
          (options.stored ?? []).map((name) => ({ name, type: 'secret_text' })),
          null,
          2,
        ),
      )

      const env: Record<string, string> = {
        PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        HOME: dir,
        STUB_LIST_JSON: listJson,
        STUB_PUT_RECORD: putRecord,
        STUB_LIST_FAILS: options.listFails ? '1' : '0',
        STUB_NODE_RECORD: nodeRecord,
        STUB_PROBE_EXIT: String(options.probeExit ?? 0),
        DEPLOY_APP: options.app ?? 'control-app',
        DEPLOY_APP_DIR: join(dir, 'app'),
        DEPLOY_ENV: 'production',
        DEPLOY_WORKER_NAME: '1stcontact-control-app',
        DEPLOY_DRY_RUN: options.dryRun ? '1' : '0',
        DEPLOY_REPO_ROOT: dir,
      }
      if (options.value !== undefined) env[varName] = options.value

      const r = spawnSync('bash', [hook], { env, encoding: 'utf8' })
      return {
        code: r.status,
        out: `${r.stdout}${r.stderr}`,
        pushed: existsSync(putRecord) ? readFileSync(putRecord, 'utf8') : null,
        probes: (existsSync(nodeRecord) ? readFileSync(nodeRecord, 'utf8') : '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== ''),
      }
    },
  }
}
