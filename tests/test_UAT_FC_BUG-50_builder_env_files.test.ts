import { EventEmitter } from 'node:events'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * BUG-50 — `1c builder` and `pnpm dev:control` start the same server.
 *
 * WHAT IS STUBBED AND WHY IT IS ONLY THIS. `run(['builder'])` is the real entry
 * point, the real argument parsing and the real composition; the one thing
 * replaced is `spawn`, which launches an actual `wrangler dev` and binds a port.
 * That is a genuine external boundary rather than a seam invented to make the
 * test pass — the assertion is on the argv handed ACROSS it, which is precisely
 * the artefact this bug is about. A test that instead called an exported
 * `composeArgs` helper could pass while `case 'builder'` spawned something else
 * entirely, which is the failure that happened here in the first place.
 *
 * `importOriginal` and a spread rather than a bare factory: `kb.ts` imports
 * `execFileSync` from this same module, so a replacement that returned only
 * `spawn` would break the import graph and fail for a reason unrelated to the
 * behaviour under test.
 */

const { spawnCalls } = vi.hoisted(() => ({
  spawnCalls: [] as Array<{ cmd: string; args: string[]; opts: { cwd?: string } }>,
}))

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  const spawn = (cmd: string, args: string[], opts: { cwd?: string }) => {
    spawnCalls.push({ cmd, args, opts })
    const child = new EventEmitter()
    // A clean exit, so `run` resolves rather than raising the ENVIRONMENT error
    // the real wrangler's non-zero exit is meant to produce.
    queueMicrotask(() => child.emit('exit', 0))
    return child as unknown as ReturnType<typeof actual.spawn>
  }
  return { ...actual, spawn, default: { ...actual.default, spawn } }
})

const { run } = await import('../tools/generate/src/cli')

const restore: Array<() => void> = []

afterEach(() => {
  for (const r of restore.splice(0)) r()
  spawnCalls.length = 0
  process.exitCode = undefined
})

/** Set an env var for one test, including deleting it. */
function withEnv(name: string, value: string | undefined): void {
  const had = Object.prototype.hasOwnProperty.call(process.env, name)
  const previous = process.env[name]
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
  restore.push(() => {
    if (had) process.env[name] = previous
    else delete process.env[name]
  })
}

function captureWarnings(): string[] {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')))
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  restore.push(() => {
    spy.mockRestore()
    log.mockRestore()
  })
  return lines
}

/** The `--env-file` values, in the order wrangler will load them. */
function envFilesOf(args: string[]): string[] {
  const files: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--env-file') files.push(args[i + 1])
  return files
}

describe('BUG-50 — one definition of the env-file layering', () => {
  it('test_UAT_FC_BUG-50_builder_names_both_env_files_in_load_order', async () => {
    // The whole bug in one assertion: the composed argv used to carry NO
    // `--env-file` at all, so wrangler fell back to its default `.dev.vars`
    // lookup and the key was never loaded. Order is asserted because wrangler
    // parses these with `override: true` — the secrets file must come last or
    // `.dev.vars` would win and the key would be lost a second way.
    captureWarnings()
    withEnv('ONECONTACT_SECRETS', '/nowhere/1c.dev.env')
    await run(['builder'])

    expect(spawnCalls).toHaveLength(1)
    expect(envFilesOf(spawnCalls[0].args)).toEqual(['.dev.vars', '/nowhere/1c.dev.env'])
  })

  it('test_UAT_FC_BUG-50_secrets_path_defaults_under_home_and_ONECONTACT_SECRETS_overrides_it', async () => {
    // `${ONECONTACT_SECRETS:-$HOME/Documents/secrets/1c.dev.env}` is what the
    // package script expanded through a shell; both halves of it survive the
    // move into the CLI, including that an EMPTY override falls back — `:-`
    // treats an exported-but-blank variable as unset, and so does this.
    captureWarnings()
    withEnv('HOME', '/home/tester')
    withEnv('ONECONTACT_SECRETS', undefined)
    await run(['builder'])
    expect(envFilesOf(spawnCalls[0].args)[1]).toBe(path.join('/home/tester', 'Documents', 'secrets', '1c.dev.env'))

    spawnCalls.length = 0
    withEnv('ONECONTACT_SECRETS', '')
    await run(['builder'])
    expect(envFilesOf(spawnCalls[0].args)[1]).toBe(path.join('/home/tester', 'Documents', 'secrets', '1c.dev.env'))

    spawnCalls.length = 0
    withEnv('ONECONTACT_SECRETS', '/elsewhere/keys.env')
    await run(['builder'])
    expect(envFilesOf(spawnCalls[0].args)[1]).toBe('/elsewhere/keys.env')
  })

  it('test_UAT_FC_BUG-50_absent_secrets_file_is_named_with_its_consequence_and_the_server_still_starts', async () => {
    // A missing key is an ordinary runtime state in this codebase — REQ-173 has
    // the Worker open, serve and say so — which is why this warns rather than
    // refusing. The path is printed because "no secrets file" without one leaves
    // the operator guessing which directory was searched, and the flag is passed
    // to wrangler anyway: it tolerates a named file that does not exist.
    const warnings = captureWarnings()
    withEnv('ONECONTACT_SECRETS', '/nowhere/1c.dev.env')
    await run(['builder'])

    const said = warnings.join('\n')
    expect(said).toContain('/nowhere/1c.dev.env')
    expect(said).toContain('the assistant cannot take a turn')
    expect(said).toContain('uploads will be refused')
    expect(spawnCalls).toHaveLength(1)
    expect(envFilesOf(spawnCalls[0].args)).toContain('/nowhere/1c.dev.env')
    expect(process.exitCode).toBeUndefined()
  })

  it('test_UAT_FC_BUG-50_present_secrets_file_warns_about_nothing', async () => {
    // The other side of the previous test, so that a warning printed
    // unconditionally could not pass it. Driven with a real file, because the
    // check this pins is an existence check.
    const dir = await mkdtemp(path.join(tmpdir(), 'bug50-'))
    const secrets = path.join(dir, '1c.dev.env')
    await writeFile(secrets, 'ANTHROPIC_API_KEY=sk-not-a-real-key\n')

    const warnings = captureWarnings()
    withEnv('ONECONTACT_SECRETS', secrets)
    await run(['builder'])

    expect(warnings.join('\n')).not.toContain(secrets)
    expect(envFilesOf(spawnCalls[0].args)).toContain(secrets)
  })

  it('test_UAT_FC_BUG-50_absent_dev_vars_is_named_too_because_access_would_close', async () => {
    // `.dev.vars` is not a tracked file, so a fresh clone has none — and
    // `isUnconfiguredLocalDev` needs BOTH Access vars empty while
    // `wrangler.toml [vars]` fills both in. The builder then refuses every
    // loopback request, presenting as an Access misconfiguration rather than as
    // a missing file. Naming it is what makes that difference visible.
    const warnings = captureWarnings()
    withEnv('ONECONTACT_SECRETS', '/nowhere/1c.dev.env')
    await run(['builder'])

    const said = warnings.join('\n')
    const devVarsMissing = said.includes('.dev.vars')
    // Conditional on the checkout, deliberately: the file is untracked, so it is
    // present on a working laptop and absent on a fresh clone, and BOTH are
    // states this must handle. The assertion is that the two agree — a warning
    // exactly when the file is missing, never a warning when it is there.
    const { existsSync } = await import('node:fs')
    const { repoRoot } = await import('../tools/generate/src/cli/webui')
    const present = existsSync(path.join(repoRoot(), 'apps', 'control-app', '.dev.vars'))
    expect(devVarsMissing).toBe(!present)
    if (devVarsMissing) expect(said).toContain('Cloudflare Access will not be open on loopback')
  })

  it('test_UAT_FC_BUG-50_remote_survives_and_the_layering_does_not_depend_on_cwd', async () => {
    // `--remote` is untouched by this ticket and keeps its meaning, and the argv
    // is repo-anchored: `dev:control` now calls this command, so a composition
    // that varied with the working directory would make the package script's
    // behaviour depend on where pnpm happened to put it.
    captureWarnings()
    withEnv('ONECONTACT_SECRETS', '/nowhere/1c.dev.env')
    const cwd = process.cwd()
    restore.push(() => process.chdir(cwd))

    await run(['builder', '--remote'])
    process.chdir(tmpdir())
    await run(['builder', '--remote'])

    expect(spawnCalls).toHaveLength(2)
    expect(spawnCalls[0].args).toEqual(spawnCalls[1].args)
    // Named, not merely equal: two `undefined`s would satisfy equality while
    // wrangler ran against whatever directory the caller happened to be in.
    expect(spawnCalls[0].opts.cwd).toBe(spawnCalls[1].opts.cwd)
    expect(spawnCalls[0].opts.cwd).toMatch(/apps[/\\]control-app$/)
    expect(spawnCalls[0].args).toContain('--remote')
    expect(envFilesOf(spawnCalls[0].args)).toEqual(['.dev.vars', '/nowhere/1c.dev.env'])
  })
})
