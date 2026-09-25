import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * A harness for `bin/deploy.d/migrate/10-d1-site-store` ([[REQ-291]]).
 *
 * WHY A STUB `npx`. The hook asks the deployed database which migrations it has
 * applied. Put a stub of that name first on PATH and the answer becomes the
 * test's to dictate — which is the only way to construct the state this check
 * exists for: an environment that applied a file weeks ago, and a checkout in
 * which that file's bytes have since changed. It is also the only way to reach
 * the branches that matter without a network, an account, or a real database.
 *
 * WHY A WHOLE TEMPORARY REPO. The hook resolves `bin/migration-manifest` through
 * `DEPLOY_REPO_ROOT` and the script resolves the migrations through the app's
 * `wrangler.toml`, so a checkout is exactly what the two of them read. Building
 * one here — a `wrangler.toml` with the one key they need, a migrations
 * directory, a manifest — lets a test say "production applied the baseline, and
 * the baseline on disk is not the one it applied" as data rather than as prose.
 * `bin/migration-manifest` is the SHIPPED file, symlinked in, because a copy
 * would be a second implementation that could pass while the real one failed.
 *
 * `node` IS NOT STUBBED, for the same reason: what is under test is the script's
 * decision, not the hook's ability to spawn something.
 *
 * The child NEVER inherits the developer's own shell, so nothing about the real
 * repository can leak into a case.
 */

const REPO = resolve(import.meta.dirname, '..', '..')
const HOOK = join(REPO, 'bin', 'deploy.d', 'migrate', '10-d1-site-store')

/**
 * The stub stands in for `npx wrangler`.
 *
 * Two verbs are reachable: `d1 execute`, which answers with the JSON document
 * the harness was given (or fails with the message it was given), and
 * `d1 migrations apply|list`, which records that it was reached. That record is
 * half the claim — a check that printed a refusal and then applied the
 * migrations anyway is indistinguishable from one that refused, unless somebody
 * looks at what ran afterwards.
 */
const NPX_STUB = `#!/usr/bin/env bash
set -euo pipefail
# invoked as: npx wrangler d1 <verb> ...
if [[ "\${3:-}" == "execute" ]]; then
  [[ -n "\${STUB_EXECUTE_CHATTER:-}" ]] && echo "\$STUB_EXECUTE_CHATTER" >&2
  if [[ -n "\${STUB_EXECUTE_ERROR:-}" ]]; then
    echo "\$STUB_EXECUTE_ERROR" >&2
    exit 1
  fi
  cat "\$STUB_EXECUTE_JSON"
  exit 0
fi
if [[ "\${3:-}" == "migrations" ]]; then
  printf '%s\\n' "\${*:4}" >> "\$STUB_MIGRATIONS_RECORD"
  echo "stub: migrations \${4:-}"
  exit 0
fi
echo "stub: unexpected argv: \$*" >&2
exit 99
`

export interface MigrateHookRun {
  /** Migration filename → the bytes this checkout has for it. */
  files: Record<string, string>
  /**
   * Migration filename → the hash the manifest records. `true` means "the hash
   * of the bytes above", which is the ordinary, current case.
   */
  manifest?: Record<string, string | true> | null
  /** What the environment reports in `d1_migrations`, oldest first. */
  applied: string[]
  /** The environment could not be read at all; this is the error it printed. */
  executeError?: string
  /** Something wrangler said on its way to answering, on stderr. */
  chatter?: string
  dryRun?: boolean
  app?: string
  env?: string
  /**
   * Which row of `bin/deploy`'s target table was selected ([[REQ-318]]) —
   * `cloud` reaches Cloudflare's D1 with `--remote`, `local` reaches
   * `.wrangler/state`. Defaults to the cloud target, which is what an omitted
   * `DEPLOY_TARGET` means to the hook itself.
   */
  target?: 'cloud' | 'local'
}

export interface MigrateHookResult {
  code: number | null
  /** stdout and stderr together — a refusal may be reported on either. */
  out: string
  /**
   * Every `wrangler d1 migrations …` invocation, as `<verb> <args…>`. Empty
   * means the hook stopped before it could have changed anything.
   */
  migrations: string[]
}

export interface MigrateHookHarness {
  run(options: MigrateHookRun): MigrateHookResult
  dispose(): void
}

export function migrateHookHarness(): MigrateHookHarness {
  const dir = mkdtempSync(join(tmpdir(), 'migrate-hook-'))
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin', 'npx'), NPX_STUB)
  chmodSync(join(dir, 'bin', 'npx'), 0o755)
  const executeJson = join(dir, 'execute.json')
  const migrationsRecord = join(dir, 'migrations-record')

  // The repo the hook is told it is deploying: apps/control-app/wrangler.toml
  // names the migrations directory, exactly as the real one does, and
  // bin/migration-manifest is the real script.
  const repo = join(dir, 'repo')
  const appDir = join(repo, 'apps', 'control-app')
  const migrationsDir = join(repo, 'db', 'migrations')
  mkdirSync(appDir, { recursive: true })
  mkdirSync(migrationsDir, { recursive: true })
  mkdirSync(join(repo, 'bin'))
  // A NAMED ENVIRONMENT'S OWN BLOCK, because that is what the hook reads
  // ([[REQ-318]]). It used to declare only the top level, which was enough while
  // the hook named the database literally; now that the name is resolved from
  // `[[env.<name>.d1_databases]]`, a fixture without one is a `wrangler.toml` the
  // real deploy would also refuse. The two environments name DIFFERENT databases
  // on purpose: a hook that read the wrong block would otherwise pass by
  // coincidence, which is the §J3 hazard this resolution exists to close.
  writeFileSync(
    join(appDir, 'wrangler.toml'),
    [
      '[[d1_databases]]',
      'binding = "DB"',
      'database_name = "1stcontact"',
      'migrations_dir = "../../db/migrations"',
      '[[env.production.d1_databases]]',
      'binding = "DB"',
      'database_name = "1stcontact"',
      'migrations_dir = "../../db/migrations"',
      '[[env.dev.d1_databases]]',
      'binding = "DB"',
      'database_name = "1stcontact-dev"',
      'migrations_dir = "../../db/migrations"',
      '',
    ].join('\n'),
  )
  symlinkSync(join(REPO, 'bin', 'migration-manifest'), join(repo, 'bin', 'migration-manifest'))

  return {
    dispose: () => rmSync(dir, { recursive: true, force: true }),
    run(options) {
      rmSync(migrationsDir, { recursive: true, force: true })
      mkdirSync(migrationsDir, { recursive: true })
      rmSync(migrationsRecord, { force: true })
      writeFileSync(migrationsRecord, '')

      for (const [name, body] of Object.entries(options.files)) {
        writeFileSync(join(migrationsDir, name), body)
      }
      if (options.manifest !== null) {
        const entries = options.manifest ?? Object.fromEntries(
          Object.keys(options.files).map((name) => [name, true as const]),
        )
        const resolved: Record<string, string> = {}
        for (const [name, value] of Object.entries(entries)) {
          resolved[name] = value === true ? sha256(options.files[name] ?? '') : value
        }
        writeFileSync(join(migrationsDir, 'manifest.json'), `${JSON.stringify(resolved, null, 2)}\n`)
      }

      writeFileSync(
        executeJson,
        JSON.stringify([{ results: options.applied.map((name) => ({ name })), success: true }], null, 2),
      )

      const env: Record<string, string> = {
        PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        HOME: dir,
        STUB_EXECUTE_JSON: executeJson,
        STUB_MIGRATIONS_RECORD: migrationsRecord,
        DEPLOY_APP: options.app ?? 'control-app',
        DEPLOY_APP_DIR: appDir,
        DEPLOY_ENV: options.env ?? 'production',
        DEPLOY_WORKER_NAME: '1stcontact-control-app',
        DEPLOY_DRY_RUN: options.dryRun ? '1' : '0',
        DEPLOY_REPO_ROOT: repo,
        DEPLOY_TARGET: options.target ?? 'cloud',
      }
      if (options.executeError !== undefined) env.STUB_EXECUTE_ERROR = options.executeError
      if (options.chatter !== undefined) env.STUB_EXECUTE_CHATTER = options.chatter

      const r = spawnSync('bash', [HOOK], { env, encoding: 'utf8' })
      return {
        code: r.status,
        out: `${r.stdout}${r.stderr}`,
        migrations: readFileSync(migrationsRecord, 'utf8')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== ''),
      }
    },
  }
}

/** The same digest `bin/migration-manifest` takes, so a case can say "unchanged". */
export function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text)).digest('hex')
}
