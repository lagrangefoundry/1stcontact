/**
 * [[REQ-393]] — `bin/deploy --secrets-file` and `bin/build --secrets-file`.
 *
 * The deploy's hooks and wrangler read only the process environment, and the
 * operator's credentials live in one dotenv file. The flag loads that file into
 * the deploy's (or build's) own environment and nothing else.
 *
 * HOW THESE RUN. The real `bin/deploy` and `bin/build`, from the top, with the
 * process boundary stubbed: `npx` (wrangler, which would reach Cloudflare),
 * `pnpm`, and `node` for every script EXCEPT the loader under test — so `1c`,
 * `probe.mjs` and `migration-manifest` record what they were asked and exit 0,
 * while `env-file.mjs` runs for real. The environment is built from nothing, so
 * "absent" means absent. The `[vars]` case is the exception: it runs the real
 * wrangler, because the claim is about what wrangler uploads.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const REPO = path.resolve(import.meta.dirname, '..')
const DEPLOY = path.join(REPO, 'bin', 'deploy')
const BUILD = path.join(REPO, 'bin', 'build')
const LOADER = path.join(REPO, 'tools', 'generate', 'bin', 'env-file.mjs')

// Distinctive, so a leak anywhere in the output is unambiguous.
const FILE_KEY = 'sk-ant-uat-req393-from-the-file'
const SHELL_KEY = 'sk-ant-uat-req393-from-the-shell'
const FILE_TOKEN = 'cf-uat-req393-token-value'

const NPX_STUB = `#!/usr/bin/env bash
# invoked as: npx wrangler <verb> ...
if [[ "\${2:-} \${3:-}" == "secret list" ]]; then cat "$STUB_LIST_JSON"; exit 0; fi
if [[ "\${2:-} \${3:-}" == "secret put" ]]; then
  cat > "$STUB_PUT_DIR/\${4}"   # the value arrives on stdin
  echo "Success! Uploaded secret \${4}"
  exit 0
fi
echo "stub npx: $*"
`

const NODE_STUB = `#!/usr/bin/env bash
# The loader is the code under test: it runs for real.
case "\${1:-}" in */env-file.mjs) exec "$REAL_NODE" "$@" ;; esac
script="$(basename "\${1:-}")"
[[ "$script" == migration-manifest ]] && cat >/dev/null
printf '%s %s token=%s\\n' "$script" "\${*:2}" "\${CLOUDFLARE_API_TOKEN:+set}" >> "$STUB_NODE_RECORD"
if [[ "$script" == probe.mjs && "\${2:-}" == probe ]]; then echo "    \${3}: stub verdict 0"; fi
exit 0
`

let dir: string
let putDir: string
let nodeRecord: string

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'req393-'))
  mkdirSync(path.join(dir, 'bin'))
  putDir = path.join(dir, 'put')
  nodeRecord = path.join(dir, 'node-record')
  for (const [name, body] of [
    ['npx', NPX_STUB],
    ['node', NODE_STUB],
    ['pnpm', '#!/usr/bin/env bash\necho "stub pnpm: $*"\n'],
  ]) {
    writeFileSync(path.join(dir, 'bin', name), body)
    chmodSync(path.join(dir, 'bin', name), 0o755)
  }
  // The OTHER credentials are already stored, so their hooks leave them alone
  // and only ANTHROPIC_API_KEY's route is in question.
  writeFileSync(
    path.join(dir, 'list.json'),
    JSON.stringify(['RESEND_API_KEY', 'OPENAI_API_KEY', 'CLOUDFLARE_DNS_TOKEN'].map((name) => ({ name }))),
  )
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

function secretsFile(name: string, text: string): string {
  const file = path.join(dir, name)
  writeFileSync(file, text)
  return file
}

/** Run a release script from scratch: no inherited credential of any kind. */
function run(script: string, args: string[], extra: Record<string, string> = {}) {
  rmSync(putDir, { recursive: true, force: true })
  mkdirSync(putDir)
  writeFileSync(nodeRecord, '')
  const r = spawnSync('bash', [script, ...args], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 120_000,
    env: {
      PATH: `${path.join(dir, 'bin')}:/usr/bin:/bin:/usr/sbin:/sbin`,
      HOME: dir,
      TMPDIR: dir,
      REAL_NODE: process.execPath,
      STUB_LIST_JSON: path.join(dir, 'list.json'),
      STUB_PUT_DIR: putDir,
      STUB_NODE_RECORD: nodeRecord,
      ...extra,
    },
  })
  const pushed = (name: string) =>
    existsSync(path.join(putDir, name)) ? readFileSync(path.join(putDir, name), 'utf8') : null
  return {
    code: r.status,
    out: `${r.stdout}${r.stderr}`,
    pushed,
    calls: readFileSync(nodeRecord, 'utf8').split('\n').filter(Boolean),
  }
}

const KEY_FILE = () =>
  secretsFile(
    'deploy.env',
    `# the operator's file\n\nANTHROPIC_API_KEY="${FILE_KEY}"\nexport EXTRA_UAT_NAME='uat-req393-extra-value' # trailing comment\n`,
  )

describe('REQ-393 — --secrets-file', () => {
  it('test_UAT_FC_REQ-393_a_secret_only_in_the_file_is_probed_and_pushed', () => {
    const file = KEY_FILE()

    // Without the flag the hook finds nothing and the deploy stops — the
    // baseline that makes the next assertion mean something.
    const without = run(DEPLOY, ['--env', 'production', 'control-app'])
    expect(without.code, without.out).not.toBe(0)
    expect(without.pushed('ANTHROPIC_API_KEY')).toBeNull()

    const r = run(DEPLOY, ['--env', 'production', '--secrets-file', file, 'control-app'])
    expect(r.code, r.out).toBe(0)
    expect(r.calls).toContain('probe.mjs probe ANTHROPIC_API_KEY token=')
    expect(r.pushed('ANTHROPIC_API_KEY')).toBe(FILE_KEY)
    expect(r.out).toContain('pushed ANTHROPIC_API_KEY')

    // A rehearsal loads it too, and so reaches the same decision.
    const dry = run(DEPLOY, ['--dry-run', '--env', 'production', '--secrets-file', file, 'control-app'])
    expect(dry.code, dry.out).toBe(0)
    expect(dry.calls).toContain('probe.mjs probe ANTHROPIC_API_KEY token=')
    expect(dry.out).toContain('would push ANTHROPIC_API_KEY')
    expect(dry.pushed('ANTHROPIC_API_KEY')).toBeNull()
  }, 240_000)

  it('test_UAT_FC_REQ-393_a_value_exported_in_the_shell_wins_over_the_file', () => {
    const r = run(DEPLOY, ['--env', 'production', '--secrets-file', KEY_FILE(), 'control-app'], {
      ANTHROPIC_API_KEY: SHELL_KEY,
    })
    expect(r.code, r.out).toBe(0)
    expect(r.pushed('ANTHROPIC_API_KEY')).toBe(SHELL_KEY)
    expect(r.out).toMatch(/kept from your environment: ANTHROPIC_API_KEY/)
  }, 120_000)

  it('test_UAT_FC_REQ-393_a_missing_or_empty_file_stops_before_any_hook', () => {
    const missing = path.join(dir, 'no-such.env')
    const empty = secretsFile('empty.env', '# nothing assigned here\n\n')
    for (const script of [DEPLOY, BUILD]) {
      for (const file of [missing, empty]) {
        const args = script === DEPLOY ? ['--env', 'production', '--secrets-file', file] : ['--secrets-file', file]
        const r = run(script, args)
        expect(r.code, r.out).not.toBe(0)
        expect(r.out).toContain(file)
        expect(r.out).not.toContain('hook ')
        expect(r.out).not.toContain('==>')
        expect(r.calls).toEqual([])
      }
    }
  }, 120_000)

  it('test_UAT_FC_REQ-393_the_report_names_keys_and_never_values', () => {
    const file = KEY_FILE()
    const r = run(DEPLOY, ['--env', 'production', '--secrets-file', file, 'control-app'])
    expect(r.code, r.out).toBe(0)
    expect(r.out).toContain(`secrets file: ${file}`)
    expect(r.out).toMatch(/took: {2}ANTHROPIC_API_KEY, EXTRA_UAT_NAME/)
    expect(r.out).not.toContain(FILE_KEY)
    expect(r.out).not.toContain('uat-req393-extra-value')
  }, 120_000)

  it('test_UAT_FC_REQ-393_bin_build_supplies_the_kb_stage_its_token', () => {
    const kb = (calls: string[]) => calls.find((c) => c.startsWith('1c.mjs kb ensure'))

    const without = run(BUILD, ['--skip-preflight'])
    expect(without.code, without.out).toBe(0)
    expect(kb(without.calls)).toBe('1c.mjs kb ensure token=')

    const file = secretsFile('build.env', `CLOUDFLARE_API_TOKEN=${FILE_TOKEN}\n`)
    const r = run(BUILD, ['--skip-preflight', '--secrets-file', file])
    expect(r.code, r.out).toBe(0)
    expect(kb(r.calls)).toBe('1c.mjs kb ensure token=set')
    expect(r.out).toContain('took:  CLOUDFLARE_API_TOKEN')
    expect(r.out).not.toContain(FILE_TOKEN)
  }, 240_000)

  /**
   * The dev-only Access vars in the operator's file reach the deploy process.
   * They must not reach the deployed Worker: production's Access configuration
   * is `wrangler.toml`'s. Pinned against the real wrangler, over a copy of the
   * control app's real config, through the real loader.
   */
  it('test_UAT_FC_REQ-393_loading_the_file_leaves_deployed_vars_unchanged', () => {
    const app = mkdtempSync(path.join(dir, 'app-'))
    copyFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), path.join(app, 'wrangler.toml'))
    mkdirSync(path.join(app, 'src'))
    mkdirSync(path.join(app, 'dist-assets'))
    writeFileSync(
      path.join(app, 'src', 'worker.ts'),
      'export class SessionJunction {}\nexport default { fetch() { return new Response("") } }\n',
    )
    const file = secretsFile(
      'access.env',
      'ACCESS_TEAM_DOMAIN=uat-req393.example\nACCESS_AUD=uat-req393-aud\n' +
        'SERVICE_TOKEN_IDENTITIES=uat-req393=nobody@example.test\n',
    )
    const wrangler = path.join(REPO, 'node_modules', '.bin', 'wrangler')
    const deploy = ['deploy', '--env', 'production', '--dry-run']
    const bindings = (out: string) => out.split('\n').filter((line) => line.startsWith('env.'))

    const plain = spawnSync(wrangler, deploy, { cwd: app, encoding: 'utf8', env: process.env })
    const loaded = spawnSync(process.execPath, [LOADER, 'exec', 'uat', file, '--', wrangler, ...deploy], {
      cwd: app,
      encoding: 'utf8',
      env: process.env,
    })
    expect(plain.status, plain.stderr).toBe(0)
    expect(loaded.status, loaded.stderr).toBe(0)
    expect(loaded.stdout).toContain('took:  ACCESS_TEAM_DOMAIN, ACCESS_AUD, SERVICE_TOKEN_IDENTITIES')
    expect(bindings(plain.stdout).some((line) => line.startsWith('env.ACCESS_AUD'))).toBe(true)
    expect(bindings(loaded.stdout)).toEqual(bindings(plain.stdout))
    expect(loaded.stdout).not.toContain('uat-req393')
  }, 120_000)
})
