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
import { execFile, spawnSync } from 'node:child_process'
import http from 'node:http'
import { promisify } from 'node:util'
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ACCESS_SIM_ORIGIN, ACCESS_SIM_PAIR, LOCAL_ORIGIN } from '../tools/generate/src/cli/copy'
import { DEV_SERVE_PORT } from '../tools/generate/src/cli/dev-snapshot'

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
    const wrangler = path.join(REPO, 'node_modules', '.bin', 'wrangler')
    const script = path.join(app, 'deploy.sh')
    writeFileSync(script, `exec "${wrangler}" deploy --env production --dry-run\n`)
    const file = secretsFile(
      'access.env',
      'ACCESS_TEAM_DOMAIN=uat-req393.example\nACCESS_AUD=uat-req393-aud\n' +
        'SERVICE_TOKEN_IDENTITIES=uat-req393=nobody@example.test\n',
    )
    const bindings = (out: string) => out.split('\n').filter((line) => line.startsWith('env.'))
    const viaLoader = (flags: string[]) =>
      spawnSync(process.execPath, [LOADER, 'run', 'uat', '--', script, ...flags], {
        cwd: app,
        encoding: 'utf8',
        env: { ...process.env, HOME: dir },
      })

    const plain = viaLoader(['--no-secrets-file'])
    const loaded = viaLoader(['--secrets-file', file])
    expect(plain.status, plain.stderr).toBe(0)
    expect(loaded.status, loaded.stderr).toBe(0)
    expect(loaded.stderr).toContain('took:  ACCESS_TEAM_DOMAIN, ACCESS_AUD, SERVICE_TOKEN_IDENTITIES')
    expect(bindings(plain.stdout).some((line) => line.startsWith('env.ACCESS_AUD'))).toBe(true)
    expect(bindings(loaded.stdout)).toEqual(bindings(plain.stdout))
    expect(loaded.stdout).not.toContain('uat-req393')
  }, 120_000)

  /**
   * Run through a SYMLINKED path, as every fixture tree under macOS `/tmp` is.
   * The loader once compared `import.meta.url` (symlinks resolved) with
   * `argv[1]` (not resolved), did nothing, and exited 0 — a deploy that printed
   * nothing and reported success.
   */
  it('test_UAT_FC_REQ-393_the_loader_runs_when_reached_through_a_symlink', () => {
    const link = path.join(dir, 'linked-bin')
    rmSync(link, { force: true })
    symlinkSync(path.dirname(LOADER), link)
    const script = path.join(dir, 'echo.sh')
    writeFileSync(script, 'echo "ran with ${UAT_LINK_NAME:-nothing}"\n')
    const file = secretsFile('link.env', 'UAT_LINK_NAME=loaded\n')
    const r = spawnSync(process.execPath, [path.join(link, 'env-file.mjs'), 'run', 'uat', '--', script, '--secrets-file', file], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', HOME: dir },
    })
    expect(r.status, r.stderr).toBe(0)
    expect(r.stdout).toContain('ran with loaded')
  })

  // ---- the default file, and --no-secrets-file -------------------------------

  /** The default file, where the dev servers look for it under this HOME. */
  function writeDefault(text: string): string {
    const file = path.join(dir, 'Documents', 'secrets', '1c.dev.env')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, text)
    return file
  }
  const removeDefault = () => rmSync(path.join(dir, 'Documents'), { recursive: true, force: true })

  it('test_UAT_FC_REQ-393_with_no_flag_the_default_file_is_loaded_and_reported', () => {
    const file = writeDefault(`ANTHROPIC_API_KEY=${FILE_KEY}\n`)
    try {
      const r = run(DEPLOY, ['--env', 'production', 'control-app'])
      expect(r.code, r.out).toBe(0)
      expect(r.out).toContain(`secrets file: ${file} (default`)
      expect(r.pushed('ANTHROPIC_API_KEY')).toBe(FILE_KEY)

      // ONECONTACT_SECRETS moves the default, as it does for the dev servers.
      const moved = secretsFile('moved.env', `ANTHROPIC_API_KEY=${FILE_KEY}-moved\n`)
      const m = run(DEPLOY, ['--env', 'production', 'control-app'], { ONECONTACT_SECRETS: moved })
      expect(m.code, m.out).toBe(0)
      expect(m.out).toContain(`secrets file: ${moved} (default`)
      expect(m.pushed('ANTHROPIC_API_KEY')).toBe(`${FILE_KEY}-moved`)
    } finally {
      removeDefault()
    }
  }, 240_000)

  it('test_UAT_FC_REQ-393_an_absent_default_is_skipped_but_an_explicit_missing_path_fails', () => {
    removeDefault()
    const r = run(BUILD, ['--skip-preflight'])
    expect(r.code, r.out).toBe(0)
    expect(r.out).not.toContain('secrets file:')
    expect(r.out).toContain('==> Knowledge base')

    const missing = path.join(dir, 'Documents', 'secrets', '1c.dev.env')
    const named = run(BUILD, ['--skip-preflight', '--secrets-file', missing])
    expect(named.code).not.toBe(0)
    expect(named.out).toContain(missing)
    expect(named.out).not.toContain('==>')
  }, 240_000)

  it('test_UAT_FC_REQ-393_no_secrets_file_loads_nothing', () => {
    writeDefault(`CLOUDFLARE_API_TOKEN=${FILE_TOKEN}\n`)
    try {
      const r = run(BUILD, ['--skip-preflight', '--no-secrets-file'])
      expect(r.code, r.out).toBe(0)
      expect(r.out).not.toContain('secrets file:')
      expect(r.calls.find((c) => c.startsWith('1c.mjs kb ensure'))).toBe('1c.mjs kb ensure token=')
    } finally {
      removeDefault()
    }
  }, 240_000)

  // ---- the copy pair -----------------------------------------------------------

  const exec = promisify(execFile)
  const COPY_TO = path.join(REPO, 'bin', 'copy-to-cloud')
  const COPY_FROM = path.join(REPO, 'bin', 'copy-from-cloud')
  const CLOUD = { clientId: 'uat-req393-cloud.access', clientSecret: 'uat-req393-cloud-secret' }
  const LOCAL = { clientId: 'uat-req393-local.access', clientSecret: 'uat-req393-local-secret' }
  const SITE = { slug: 'site_uat', siteJson: { config: {} }, pages: [], assets: [] }

  /**
   * A local builder behind a gate that admits exactly one pair, as
   * `bin/access-sim` does — holding one business that is NOT `TENANT_ID`'s.
   */
  async function gatedBuilder(pair: { clientId: string; clientSecret: string }, port = 0) {
    const seen: { path: string; id: string; secret: string }[] = []
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const id = String(req.headers['cf-access-client-id'] ?? '')
      const secret = String(req.headers['cf-access-client-secret'] ?? '')
      seen.push({ path: url.pathname, id, secret })
      res.setHeader('content-type', 'application/json')
      if (id !== pair.clientId || secret !== pair.clientSecret) {
        res.statusCode = 302
        res.setHeader('location', 'https://example.cloudflareaccess.com/cdn-cgi/access/login')
        res.end('')
      } else if (url.pathname === '/api/businesses') {
        res.end(JSON.stringify({
          person: null,
          businesses: [{ id: 'biz_not_the_tenant', name: 'Not The Tenant', selectable: true, lapse: null }],
        }))
      } else if (url.pathname === '/b/biz_not_the_tenant/api/export') {
        res.end(JSON.stringify(SITE))
      } else {
        res.statusCode = 500
        res.end(JSON.stringify({ error: `no ${url.pathname}` }))
      }
    })
    await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
    const addr = server.address()
    return {
      origin: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`,
      seen,
      close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
  }

  /** The real script, from an environment built from nothing but PATH and HOME. */
  async function copy(script: string, args: string[]) {
    try {
      const r = await exec(script, args, {
        cwd: REPO,
        env: { PATH: process.env.PATH ?? '', HOME: dir, TMPDIR: dir },
        timeout: 120_000,
      })
      return { ok: true, out: `${r.stdout}${r.stderr}` }
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string }
      return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
    }
  }

  const pairsFile = () =>
    secretsFile(
      'copy.env',
      `CF_ACCESS_CLIENT_ID=${CLOUD.clientId}\nCF_ACCESS_CLIENT_SECRET=${CLOUD.clientSecret}\n` +
        `LOCAL_ACCESS_CLIENT_ID=${LOCAL.clientId}\nLOCAL_ACCESS_CLIENT_SECRET=${LOCAL.clientSecret}\n`,
    )

  it('test_UAT_FC_REQ-393_the_copy_pair_reads_both_credential_pairs_from_the_file', async () => {
    const sim = await gatedBuilder(LOCAL)
    try {
      const file = pairsFile()

      // copy-from-cloud resolves its DESTINATION — the local end — first. Without
      // the file it is refused for want of the cloud pair before any request.
      const bare = await copy(COPY_FROM, ['--no-secrets-file', '--origin', sim.origin, 'Nobody'])
      expect(bare.ok).toBe(false)
      expect(bare.out).toContain('is unreachable without a credential')
      expect(sim.seen).toEqual([])

      // With it, the cloud pair is there (no refusal) and the local end is
      // reached with the LOCAL pair from the file — and the run stops at the
      // local end's answer, so nothing is sent to the real cloud.
      const loaded = await copy(COPY_FROM, ['--secrets-file', file, '--origin', sim.origin, 'Nobody'])
      expect(loaded.ok).toBe(false)
      expect(loaded.out).not.toContain('is unreachable without a credential')
      expect(loaded.out).toContain('took:  CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET, LOCAL_ACCESS_CLIENT_ID, LOCAL_ACCESS_CLIENT_SECRET')
      expect(sim.seen.length).toBeGreaterThan(0)
      for (const call of sim.seen) expect([call.id, call.secret]).toEqual([LOCAL.clientId, LOCAL.clientSecret])

      // copy-to-cloud reads the same file: a backup of the local end, through
      // the gate, with nothing exported.
      const out = path.join(dir, 'backup.json')
      const to = await copy(COPY_TO, ['--secrets-file', file, '--origin', sim.origin, '--backup', out, 'Not The Tenant'])
      expect(to.ok, to.out).toBe(true)
      expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual(SITE)
      for (const secret of [CLOUD.clientSecret, LOCAL.clientSecret]) {
        expect(loaded.out).not.toContain(secret)
        expect(to.out).not.toContain(secret)
      }
    } finally {
      await sim.close()
    }
  }, 240_000)

  it('test_UAT_FC_REQ-393_the_copy_pair_local_end_defaults_to_the_simulator', () => {
    // The default origin IS bin/access-sim's, and not the bare snapshot's —
    // which resolves only TENANT_ID's business.
    expect(LOCAL_ORIGIN).toBe(ACCESS_SIM_ORIGIN)
    expect(LOCAL_ORIGIN).toBe('http://127.0.0.1:8799')
    expect(LOCAL_ORIGIN).not.toContain(String(DEV_SERVE_PORT))
  })

  /**
   * Through the real script with no `--origin` and no credential exported: the
   * request goes to the simulator's port carrying the simulator's own pair, and
   * a business that is not `TENANT_ID`'s resolves. Needs 8799 free — when the
   * operator's own `bin/access-sim` holds it, this cannot stand in for it.
   */
  const simPortBusy =
    spawnSync(process.execPath, [
      '-e',
      "require('net').createServer().once('error',()=>process.exit(1)).listen(8799,'127.0.0.1',function(){this.close()})",
    ]).status !== 0
  it.skipIf(simPortBusy)(
    'test_UAT_FC_REQ-393_with_no_origin_the_copy_reaches_the_simulator_with_its_own_pair',
    async () => {
      const sim = await gatedBuilder(ACCESS_SIM_PAIR, 8799)
      try {
        const out = path.join(dir, 'default-backup.json')
        const r = await copy(COPY_TO, ['--no-secrets-file', '--backup', out, 'Not The Tenant'])
        expect(r.ok, r.out).toBe(true)
        expect(r.out).toContain("backed up 'Not The Tenant'")
        expect(sim.seen.map((c) => c.path)).toContain('/b/biz_not_the_tenant/api/export')
      } finally {
        await sim.close()
      }
    },
    120_000,
  )
})

