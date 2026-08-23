import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// The hook talks to Cloudflare through `npx wrangler`. Put a stub of that name
// first on PATH and the hook's decision table becomes testable without a
// network, a Worker, or a real credential — which is the only way to exercise
// the branch that matters here (the value is absent locally and present
// remotely), since a test can never legitimately hold the real key.
const HOOK = resolve('bin/deploy.d/secrets/10-anthropic-api-key')

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

let dir: string
let putRecord: string
let listJson: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'req149-secret-hook-'))
  mkdirSync(join(dir, 'bin'))
  mkdirSync(join(dir, 'app'))
  writeFileSync(join(dir, 'bin', 'npx'), STUB)
  chmodSync(join(dir, 'bin', 'npx'), 0o755)
  putRecord = join(dir, 'put-record')
  listJson = join(dir, 'list.json')
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

type Opts = {
  key?: string          // ANTHROPIC_API_KEY in the operator's shell
  stored?: string[]     // secret names the Worker already holds
  listFails?: boolean   // the store could not be read at all
  dryRun?: boolean
  app?: string
}

function runHook(o: Opts) {
  rmSync(putRecord, { force: true })
  writeFileSync(listJson, JSON.stringify((o.stored ?? []).map((name) => ({ name, type: 'secret_text' })), null, 2))

  const env: Record<string, string> = {
    PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
    HOME: dir,
    STUB_LIST_JSON: listJson,
    STUB_PUT_RECORD: putRecord,
    STUB_LIST_FAILS: o.listFails ? '1' : '0',
    DEPLOY_APP: o.app ?? 'control-app',
    DEPLOY_APP_DIR: join(dir, 'app'),
    DEPLOY_ENV: 'production',
    DEPLOY_WORKER_NAME: '1stcontact-control-app',
    DEPLOY_DRY_RUN: o.dryRun ? '1' : '0',
    DEPLOY_REPO_ROOT: dir,
  }
  // ANTHROPIC_API_KEY is added only when the case says so — the child never
  // inherits the developer's own shell, so "absent" means absent.
  if (o.key !== undefined) env.ANTHROPIC_API_KEY = o.key

  const r = spawnSync('bash', [HOOK], { env, encoding: 'utf8' })
  return {
    code: r.status,
    out: `${r.stdout}${r.stderr}`,
    pushed: existsSync(putRecord) ? readFileSync(putRecord, 'utf8') : null,
  }
}

describe('REQ-149 — the deploy secret hook asks the store, not only the shell', () => {
  it('test_UAT_FC_REQ-149_secret_hook_keeps_a_secret_already_in_place', () => {
    // The regression this ticket fixes: nothing exported, but Cloudflare has
    // held the value since an earlier deploy. That must not stop the deploy.
    const r = runHook({ stored: ['ANTHROPIC_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.out).toMatch(/already on 1stcontact-control-app/)
    expect(r.out).toMatch(/left alone/)
    expect(r.pushed).toBeNull() // nothing was overwritten
  })

  it('test_UAT_FC_REQ-149_secret_hook_pushes_when_the_operator_supplies_a_value', () => {
    // Supplying a value is how a rotation is expressed, so it still pushes —
    // even when the name is already there.
    const r = runHook({ key: 'sk-ant-rotated', stored: ['ANTHROPIC_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.pushed).toBe('sk-ant-rotated') // exact: no trailing newline
    expect(r.out).toMatch(/pushed ANTHROPIC_API_KEY/)
  })

  it('test_UAT_FC_REQ-149_secret_hook_fails_when_the_key_exists_nowhere', () => {
    // The guard the original hook was written for is intact.
    const r = runHook({ stored: [] })

    expect(r.code).toBe(1)
    expect(r.out).toMatch(/ANTHROPIC_API_KEY is not set in your environment/)
    expect(r.out).toMatch(/the Worker has no ANTHROPIC_API_KEY either/)
    expect(r.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-149_secret_hook_fails_when_the_store_cannot_be_read', () => {
    // Only a positive read satisfies the guard. An unanswered question is not
    // a yes — a first deploy, a dead network and a token missing Workers
    // Scripts read all land here rather than skipping confidently.
    const r = runHook({ listFails: true })

    expect(r.code).toBe(1)
    expect(r.out).toMatch(/could not be read to check/)
    expect(r.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-149_secret_hook_rehearses_the_same_decision', () => {
    // --dry-run reports the decision it would have acted on, and changes
    // nothing. Both outcomes, plus the failure, must survive the rehearsal.
    const keep = runHook({ stored: ['ANTHROPIC_API_KEY'], dryRun: true })
    expect(keep.code).toBe(0)
    expect(keep.out).toMatch(/would leave it/)
    expect(keep.pushed).toBeNull()

    const push = runHook({ key: 'sk-ant-x', stored: [], dryRun: true })
    expect(push.code).toBe(0)
    expect(push.out).toMatch(/would push ANTHROPIC_API_KEY/)
    expect(push.pushed).toBeNull() // a rehearsal uploads nothing

    // A rehearsal that passed while the real deploy would abort is not a
    // rehearsal, so the missing-everywhere case fails here too.
    const gone = runHook({ stored: [], dryRun: true })
    expect(gone.code).toBe(1)
  })

  it('test_UAT_FC_REQ-149_secret_hook_never_prints_the_value', () => {
    // The standing rule for every hook in this directory: report the name and
    // the destination, never the value — not even truncated.
    const value = 'sk-ant-super-secret-do-not-print'
    const r = runHook({ key: value, stored: [] })

    expect(r.code).toBe(0)
    expect(r.out).not.toContain(value)
    expect(r.out).not.toContain(value.slice(0, 12))
  })

  it('test_UAT_FC_REQ-149_secret_hook_leaves_the_public_site_alone', () => {
    // public-site serves rendered bytes and must never carry a model
    // credential — it exits before it even looks at the store.
    const r = runHook({ app: 'public-site', stored: [] })

    expect(r.code).toBe(0)
    expect(r.pushed).toBeNull()
    expect(r.out.trim()).toBe('')
  })
})
