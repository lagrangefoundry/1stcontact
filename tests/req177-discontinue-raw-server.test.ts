import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { run, startServe } from '../tools/generate/src/cli'

/**
 * REQ-177 — the raw-server hosting path is discontinued.
 *
 * There was exactly one raw server an operator could start as a way to look at
 * a site: `1c serve <slug>`, a `node:http` origin over `dist/<slug>/<channel>/`.
 * Nothing deployed through it and nothing depended on it, but the CLI's own help
 * advertised it as a way to view a site — so it presented a second, divergent
 * path next to the real one (`wrangler dev`, which serves through the same
 * routes, store and runtime as production).
 *
 * The distinction this ticket turns on is hosting vs tooling, and both halves
 * are pinned here. The command is gone AND the fixture under it survives:
 * `startServe` binds an ephemeral loopback origin so `1c shot`,
 * `1c aligned-crops` and the module conformance harness have somewhere to point
 * a headless browser. Removing that would break the screenshot loop, whose bytes
 * under test are static render output rather than Worker behaviour.
 */

const spies: Array<{ mockRestore: () => void }> = []

afterEach(() => {
  for (const s of spies.splice(0)) s.mockRestore()
  process.exitCode = undefined
})

function captureStderr(): string[] {
  const lines: string[] = []
  const spy = vi
    .spyOn(console, 'error')
    .mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')))
  spies.push(spy)
  return lines
}

function captureStdout(): string[] {
  const lines: string[] = []
  const spy = vi
    .spyOn(console, 'log')
    .mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')))
  spies.push(spy)
  return lines
}

describe('REQ-177 — 1c serve is discontinued', () => {
  it('test_UAT_FC_REQ-177_serve_is_no_longer_a_command', async () => {
    // The dispatch arm is gone, so `serve` falls through to the unknown-command
    // default: a refusal and a non-zero exit, not a bound port. This is the
    // whole of the behavioural change an operator can observe.
    const err = captureStderr()
    await run(['serve', 'demo'])
    expect(err.join('\n')).toContain('Unknown command: serve')
    expect(process.exitCode).toBe(1)
  })

  it('test_UAT_FC_REQ-177_help_advertises_no_raw_server', async () => {
    // The misleading part was the help text, not the code: an operator reading
    // it could reasonably conclude a node:http origin was a supported way to run
    // a site. `1c builder` (wrangler dev) is what the help now offers instead.
    const out = captureStdout()
    await run(['help'])
    const usage = out.join('\n')
    expect(usage).not.toMatch(/^\s*1c serve\b/m)
    expect(usage).toContain('1c builder')
    expect(usage).toContain('wrangler dev')
  })

  it('test_UAT_FC_REQ-177_capture_fixture_still_binds_a_loopback_origin', async () => {
    // The command is what goes; the function under it stays exported, because
    // `shot.ts`, `aligned-crops.ts` and `conformance/harness.ts` import it
    // directly. Driven over real HTTP rather than asserted as a type, so that
    // deleting the implementation and keeping the export cannot pass.
    const dir = await mkdtemp(path.join(tmpdir(), 'req177-'))
    try {
      const site = path.join(dir, 'storage', 'dist', 'sites', 'demo', 'draft')
      await mkdir(site, { recursive: true })
      await writeFile(path.join(site, 'index.html'), '<html>ROOT</html>')

      const handle = await startServe('demo', { cwd: dir, source: 'draft' })
      try {
        expect(handle.url).toMatch(/^http:\/\/localhost:\d+\/$/)
        const res = await fetch(handle.url)
        expect(res.status).toBe(200)
        expect(await res.text()).toContain('ROOT')
      } finally {
        await new Promise<void>((r) => handle.server.close(() => r()))
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
