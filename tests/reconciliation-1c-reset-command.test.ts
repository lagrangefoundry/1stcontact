import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { builderIsRunning } from '../tools/generate/src/cli/reset'

/**
 * AC-2228 — `1c reset`, driven through the command an operator types.
 *
 * WHY THE REAL BINARY, IN A COPY OF THE REPO. `1c reset` resolves the
 * directories it removes from the repository root, and it finds that root from
 * the location of its own source (`repoRoot()` in `webui.ts`), never from the
 * working directory. That is the property under test — and it also means that
 * running the command in-process from this checkout would aim `--yes` at this
 * checkout's real `.wrangler/state`. So the CLI's own sources are copied into a
 * temp repository (a `.git` marks its root, dependencies are linked, not
 * copied) and the real `tools/generate/bin/1c.mjs` is run from there as a child
 * process. What is observed is what an operator observes: the exit code, the
 * printed output, and the directories left on disk.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTROL_STATE = path.join('apps', 'control-app', '.wrangler', 'state')
const PUBLIC_STATE = path.join('apps', 'public-site', '.wrangler', 'state')
const STORAGE = ['sites', 'chat', 'references']

let fixture: string

/** A repository laid out the way this one is, with the CLI's real sources. */
function makeFixtureRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ac2228-reset-'))
  fs.mkdirSync(path.join(root, '.git'))
  const gen = path.join(root, 'tools', 'generate')
  fs.mkdirSync(gen, { recursive: true })
  for (const part of ['bin', 'src']) {
    fs.cpSync(path.join(REPO, 'tools', 'generate', part), path.join(gen, part), { recursive: true })
  }
  fs.copyFileSync(path.join(REPO, 'tools', 'generate', 'package.json'), path.join(gen, 'package.json'))
  // Dependencies and the sources the CLI imports from beyond its own tree are
  // linked: they are libraries here, and none of them decides a path.
  fs.symlinkSync(path.join(REPO, 'tools', 'generate', 'node_modules'), path.join(gen, 'node_modules'))
  for (const shared of ['node_modules', 'packages', 'package.json']) {
    fs.symlinkSync(path.join(REPO, shared), path.join(root, shared))
  }
  for (const app of ['control-app', 'public-site']) {
    fs.mkdirSync(path.join(root, 'apps', app), { recursive: true })
    fs.symlinkSync(path.join(REPO, 'apps', app, 'src'), path.join(root, 'apps', app, 'src'))
  }
  return root
}

/** Populate both state trees and the storage tree the reset must never touch. */
function populate(root: string): void {
  for (const state of [CONTROL_STATE, PUBLIC_STATE]) {
    fs.rmSync(path.join(root, state), { recursive: true, force: true })
    const d1 = path.join(root, state, 'v3', 'd1')
    fs.mkdirSync(d1, { recursive: true })
    fs.writeFileSync(path.join(d1, 'db.sqlite'), 'x'.repeat(2048))
    fs.writeFileSync(path.join(d1, 'db.sqlite-wal'), 'y'.repeat(1024))
  }
  for (const dir of STORAGE) {
    fs.mkdirSync(path.join(root, 'storage', dir), { recursive: true })
    fs.writeFileSync(path.join(root, 'storage', dir, 'keep.json'), `{"dir":"${dir}"}`)
  }
}

function storageIntact(root: string): void {
  for (const dir of STORAGE) {
    expect(fs.readFileSync(path.join(root, 'storage', dir, 'keep.json'), 'utf8')).toBe(
      `{"dir":"${dir}"}`,
    )
  }
}

/** Run the real `1c` from the fixture, in `cwd`. */
function oneC(
  args: string[],
  cwd: string = fixture,
): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(fixture, 'tools', 'generate', 'bin', '1c.mjs'), ...args],
      { cwd, env: { ...process.env } },
    )
    let out = ''
    let err = ''
    child.stdout.on('data', (b: Buffer) => (out += b.toString()))
    child.stderr.on('data', (b: Buffer) => (err += b.toString()))
    child.once('error', reject)
    child.once('close', (code) => resolve({ code: code ?? -1, out, err }))
  })
}

/** A port nothing is listening on: bound, read, released. */
async function freePort(): Promise<number> {
  const server = net.createServer()
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as net.AddressInfo).port
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return port
}

beforeAll(() => {
  fixture = makeFixtureRepo()
})

afterAll(() => {
  fs.rmSync(fixture, { recursive: true, force: true })
})

beforeEach(() => {
  populate(fixture)
})

describe('AC-2228 — 1c reset, through the command surface', () => {
  it('test_UAT_AC2228_preview_names_the_control_app_store_and_deletes_nothing', async () => {
    const res = await oneC(['reset'])

    expect(res.code, res.err).toBe(0)
    // The control-app directory, by its absolute repo-root path, with its scale.
    expect(res.out).toContain(path.join(fixture, CONTROL_STATE))
    expect(res.out).toContain('2 file(s), 3.0 KB')
    // Not asked for, so not listed.
    expect(res.out).not.toContain(path.join('apps', 'public-site'))
    // The promise about storage/ is printed, not merely kept.
    expect(res.out).toContain('Never touched: storage/sites, storage/chat, storage/references')
    expect(res.out).toContain('Nothing was deleted')

    expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(true)
    expect(fs.existsSync(path.join(fixture, PUBLIC_STATE))).toBe(true)
    storageIntact(fixture)
  })

  it('test_UAT_AC2228_yes_removes_only_the_control_app_store_and_never_storage', async () => {
    const res = await oneC(['reset', '--yes', '--port', String(await freePort())])

    expect(res.code, res.err).toBe(0)
    expect(res.out).toContain('Emptied the local dev store')
    expect(res.out).toContain(path.join('apps', 'control-app', '.wrangler', 'state'))
    expect(res.out).toContain('bin/publish')

    expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(false)
    expect(fs.readFileSync(path.join(fixture, PUBLIC_STATE, 'v3', 'd1', 'db.sqlite'), 'utf8')).toBe(
      'x'.repeat(2048),
    )
    storageIntact(fixture)
  })

  it('test_UAT_AC2228_include_public_also_removes_the_public_site_store', async () => {
    const preview = await oneC(['reset', '--include-public'])
    expect(preview.code, preview.err).toBe(0)
    expect(preview.out).toContain(path.join(fixture, PUBLIC_STATE))

    const res = await oneC(['reset', '--yes', '--include-public', '--port', String(await freePort())])

    expect(res.code, res.err).toBe(0)
    expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(false)
    expect(fs.existsSync(path.join(fixture, PUBLIC_STATE))).toBe(false)
    storageIntact(fixture)
  })

  it('test_UAT_AC2228_a_listening_port_is_refused_and_nothing_is_deleted', async () => {
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as net.AddressInfo).port
    try {
      // The probe the command relies on answers true for a listener…
      expect(await builderIsRunning(port)).toBe(true)

      const res = await oneC(['reset', '--yes', '--include-public', '--port', String(port)])

      expect(res.code).not.toBe(0)
      expect(res.err).toContain(`Something is listening on port ${port}`)
      expect(res.err).toContain('corrupts the store')
      expect(res.err).toContain('Nothing was deleted')
      expect(res.err).toContain('--port')
      expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(true)
      expect(fs.existsSync(path.join(fixture, PUBLIC_STATE))).toBe(true)
      storageIntact(fixture)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
    // …and false once nothing is.
    expect(await builderIsRunning(port)).toBe(false)
  })

  it('test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error', async () => {
    for (const bad of ['0', '-5', 'eighty']) {
      const res = await oneC(['reset', '--yes', '--port', bad])
      expect(res.code, bad).not.toBe(0)
      expect(res.err, bad).toContain(`--port must be a port number, not '${bad}'`)
    }
    expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(true)
  })

  it('test_UAT_AC2228_an_absent_store_is_already_empty_and_a_success', async () => {
    fs.rmSync(path.join(fixture, CONTROL_STATE), { recursive: true, force: true })

    const preview = await oneC(['reset'])
    expect(preview.code, preview.err).toBe(0)
    expect(preview.out).toContain('(already empty)')

    const res = await oneC(['reset', '--yes', '--port', String(await freePort())])
    expect(res.code, res.err).toBe(0)
    expect(res.out).toContain('The local dev store was already empty.')
    expect(fs.existsSync(path.join(fixture, PUBLIC_STATE))).toBe(true)
    storageIntact(fixture)
  })

  it('test_UAT_AC2228_paths_resolve_from_the_repo_root_whatever_the_working_directory', async () => {
    const sub = path.join(fixture, 'storage', 'sites')
    const fromRoot = await oneC(['reset'])
    const fromSub = await oneC(['reset'], sub)

    expect(fromSub.code, fromSub.err).toBe(0)
    expect(fromSub.out).toBe(fromRoot.out)
    expect(fromSub.out).toContain(path.join(fixture, CONTROL_STATE))
    expect(fromSub.out).not.toContain(path.join(sub, 'apps'))

    const res = await oneC(['reset', '--yes', '--port', String(await freePort())], sub)
    expect(res.code, res.err).toBe(0)
    expect(fs.existsSync(path.join(fixture, CONTROL_STATE))).toBe(false)
    storageIntact(fixture)
  })
})
