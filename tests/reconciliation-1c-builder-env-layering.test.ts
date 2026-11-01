import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Story story-e15a19ef, guarantee 8 — the builder dev server starts with one
 * environment however it is launched (BUG-50).
 *
 * `run(['builder'])` is the real entry point: real flag parsing, the real
 * `case 'builder'` composition and the real `devEnvLayering`. Two process
 * boundaries are replaced and nothing else:
 *
 * - `spawn`, which would start a real `wrangler dev` and bind a port; the
 *   assertion is on the argv and cwd handed across it.
 * - `existsSync`, for exactly one path — the control app's `.dev.vars` — and only
 *   when a test asks for it. That file is untracked and lives at a repo-anchored
 *   path, so a test cannot remove it from a working checkout without destroying
 *   an operator's local config; every other path delegates to the real
 *   filesystem, so the secrets-file cases are driven by real scratch files.
 */

const { events, devVarsOverride } = vi.hoisted(() => ({
  events: [] as Array<
    | { kind: 'spawn'; cmd: string; args: string[]; cwd?: string }
    | { kind: 'log' | 'warn'; text: string }
  >,
  devVarsOverride: { absent: false },
}))

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  const spawn = (cmd: string, args: string[], opts: { cwd?: string }) => {
    events.push({ kind: 'spawn', cmd, args, cwd: opts.cwd })
    const child = new EventEmitter()
    queueMicrotask(() => child.emit('exit', 0))
    return child as unknown as ReturnType<typeof actual.spawn>
  }
  return { ...actual, spawn, default: { ...actual.default, spawn } }
})

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const existsSync = (p: import('node:fs').PathLike): boolean => {
    if (devVarsOverride.absent && /apps[/\\]control-app[/\\]\.dev\.vars$/.test(String(p))) return false
    return actual.existsSync(p)
  }
  return { ...actual, existsSync, default: { ...actual.default, existsSync } }
})

const { run } = await import('../tools/generate/src/cli')
const { repoRoot } = await import('../tools/generate/src/cli/webui')

const restore: Array<() => void> = []

afterEach(() => {
  for (const r of restore.splice(0)) r()
  events.length = 0
  devVarsOverride.absent = false
  process.exitCode = undefined
})

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

/** console.log is stdout and console.warn is stderr; both recorded in order with spawn. */
function captureConsole(): void {
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    events.push({ kind: 'log', text: a.join(' ') })
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    events.push({ kind: 'warn', text: a.join(' ') })
  })
  restore.push(() => {
    log.mockRestore()
    warn.mockRestore()
  })
}

function spawns() {
  return events.filter((e): e is Extract<(typeof events)[number], { kind: 'spawn' }> => e.kind === 'spawn')
}

function stderr(): string {
  return events.filter((e) => e.kind === 'warn').map((e) => (e as { text: string }).text).join('\n')
}

function envFilesOf(args: string[]): string[] {
  const files: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--env-file') files.push(args[i + 1])
  return files
}

async function scratchSecrets(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'ac2163-'))
  const secrets = path.join(dir, '1c.dev.env')
  await writeFile(secrets, 'ANTHROPIC_API_KEY=sk-not-a-real-key\n')
  return secrets
}

describe('story-e15a19ef guarantee 8 — one environment for the builder dev server', () => {
  it('test_UAT_AC2162_builder_and_dev_control_share_one_env_file_layering', async () => {
    captureConsole()
    const home = await mkdtemp(path.join(tmpdir(), 'ac2162-home-'))
    withEnv('HOME', home)

    // No override: the secrets file is the $HOME default, after .dev.vars.
    withEnv('ONECONTACT_SECRETS', undefined)
    await run(['builder'])
    const defaultSecrets = path.join(home, 'Documents', 'secrets', '1c.dev.env')
    expect(spawns()).toHaveLength(1)
    expect(spawns()[0].cmd).toBe('npx')
    expect(spawns()[0].args).toEqual([
      'wrangler', 'dev', '--port', '8788',
      '--env-file', '.dev.vars', '--env-file', defaultSecrets,
    ])

    // An empty override falls back to the same default.
    events.length = 0
    withEnv('ONECONTACT_SECRETS', '')
    await run(['builder'])
    expect(envFilesOf(spawns()[0].args)).toEqual(['.dev.vars', defaultSecrets])

    // A non-empty override is the secrets file, still loaded last.
    events.length = 0
    withEnv('ONECONTACT_SECRETS', '/some/path')
    await run(['builder'])
    expect(envFilesOf(spawns()[0].args)).toEqual(['.dev.vars', '/some/path'])

    // One entry point: the root script calls `1c builder`; the app has no dev script.
    const rootPkg = JSON.parse(await readFile(path.join(repoRoot(), 'package.json'), 'utf8'))
    expect(rootPkg.scripts['dev:control']).toMatch(/(^|[\s/])1c builder(\s|$)/)
    const appPkg = JSON.parse(await readFile(path.join(repoRoot(), 'apps', 'control-app', 'package.json'), 'utf8'))
    expect(appPkg.scripts?.dev).toBeUndefined()
  })

  it('test_UAT_AC2163_missing_env_files_are_named_with_resolved_path_and_consequence_and_server_still_starts', async () => {
    captureConsole()
    const appDir = path.join(repoRoot(), 'apps', 'control-app')

    // Secrets file absent (resolved path in a scratch dir that has no such file).
    const emptyDir = await mkdtemp(path.join(tmpdir(), 'ac2163-none-'))
    const missingSecrets = path.join(emptyDir, '1c.dev.env')
    withEnv('ONECONTACT_SECRETS', missingSecrets)
    await run(['builder'])
    let said = stderr()
    expect(said).toContain(missingSecrets)
    expect(said).toContain('the assistant cannot take a turn')
    expect(said).toContain('uploads will be refused')
    expect(spawns()).toHaveLength(1)
    expect(envFilesOf(spawns()[0].args)).toEqual(['.dev.vars', missingSecrets])
    expect(process.exitCode).toBeUndefined()
    // Order: banner (stdout), then warning (stderr), then wrangler is started.
    const firstBanner = events.findIndex((e) => e.kind === 'log' && e.text.includes('Builder (wrangler dev)'))
    const firstWarn = events.findIndex((e) => e.kind === 'warn' && e.text.includes(missingSecrets))
    const spawnAt = events.findIndex((e) => e.kind === 'spawn')
    expect(firstBanner).toBeGreaterThanOrEqual(0)
    expect(firstBanner).toBeLessThan(firstWarn)
    expect(firstWarn).toBeLessThan(spawnAt)
    const argvWhenMissing = spawns()[0].args

    // Secrets file present: neither the file nor its consequence is named, and the
    // argv differs only by the secrets path itself.
    events.length = 0
    const secrets = await scratchSecrets()
    withEnv('ONECONTACT_SECRETS', secrets)
    await run(['builder'])
    said = stderr()
    expect(said).not.toContain(secrets)
    expect(said).not.toContain('the assistant cannot take a turn')
    expect(spawns()[0].args).toEqual(argvWhenMissing.map((a) => (a === missingSecrets ? secrets : a)))

    // .dev.vars absent: named at its resolved path with its own consequence; the
    // server still starts and .dev.vars is still passed.
    events.length = 0
    devVarsOverride.absent = true
    await run(['builder'])
    said = stderr()
    expect(said).toContain(path.join(appDir, '.dev.vars'))
    expect(said).toContain('Cloudflare Access will not be open on loopback')
    expect(said).not.toContain(secrets)
    expect(spawns()).toHaveLength(1)
    expect(envFilesOf(spawns()[0].args)).toEqual(['.dev.vars', secrets])
    expect(process.exitCode).toBeUndefined()

    // Both present: no env-file warning at all.
    events.length = 0
    devVarsOverride.absent = false
    const { existsSync } = await import('node:fs')
    if (existsSync(path.join(appDir, '.dev.vars'))) {
      await run(['builder'])
      expect(stderr()).not.toMatch(/ no .* at .* — /)
    }
  })

  it('test_UAT_AC2164_builder_argv_is_cwd_independent_and_port_remote_keep_meaning', async () => {
    captureConsole()
    withEnv('ONECONTACT_SECRETS', '/nowhere/1c.dev.env')
    const cwd = process.cwd()
    restore.push(() => process.chdir(cwd))

    // --remote from the repo root, then from an unrelated directory.
    process.chdir(repoRoot())
    await run(['builder', '--remote'])
    process.chdir(await mkdtemp(path.join(tmpdir(), 'ac2164-cwd-')))
    await run(['builder', '--remote'])

    const [a, b] = spawns()
    expect(spawns()).toHaveLength(2)
    expect(a.args).toEqual(b.args)
    expect(a.cwd).toBe(b.cwd)
    expect(a.cwd).toBe(path.join(repoRoot(), 'apps', 'control-app'))
    expect(a.args).toEqual([
      'wrangler', 'dev', '--port', '8788',
      '--env-file', '.dev.vars', '--env-file', '/nowhere/1c.dev.env',
      '--remote',
    ])
    const banners = events.filter((e) => e.kind === 'log').map((e) => (e as { text: string }).text)
    expect(banners.join('\n')).toContain('store: REMOTE — this edits production data')

    // Without --remote: local store, no --remote flag; --port sets the port.
    events.length = 0
    await run(['builder', '--port', '9123'])
    expect(spawns()[0].args).not.toContain('--remote')
    expect(spawns()[0].args.slice(0, 4)).toEqual(['wrangler', 'dev', '--port', '9123'])
    const localBanner = events.filter((e) => e.kind === 'log').map((e) => (e as { text: string }).text).join('\n')
    expect(localBanner).toContain('store: local')
    expect(localBanner).toContain('http://localhost:9123')
  })
})
