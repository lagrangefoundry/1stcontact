/**
 * REQ-254 — the reproduction console.
 *
 * A localhost-only dev console that runs one reproduction round end to end and
 * puts the three artifacts one click apart ([[EPIC-12]] §8.1).
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The console, its HTTP surface, its
 * iteration sequencing and everything it serves are the real thing: a real
 * `node:http` server on loopback, driven with real `fetch`, serving real bytes
 * off disk. What is substituted is the ONE thing a test cannot have — a
 * headless browser reaching the public internet. `1c` is reached through an
 * injected `StepRunner`, which is the same seam the console's own production
 * runner plugs into, and the substitute writes the artifacts a real
 * `1c render` / `1c diff` would write, so every link on the page is followed to
 * real bytes rather than to a stub.
 *
 * The real runner IS exercised, unmocked and against the real CLI, in
 * `test_UAT_FC_REQ_254_a_step_is_a_fresh_1c_process`.
 */
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import {
  parseCaptureReport,
  reproductionSteps,
  spawnStepRunner,
  type IterationStep,
  type StepResult,
  type StepRunner,
} from '../tools/repro-console/src/iteration'
import { CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Everything one test spun up, torn down in `afterEach` whatever happened. */
const openHandles: ConsoleHandle[] = []
const scratchDirs: string[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
  while (scratchDirs.length) rmSync(scratchDirs.pop()!, { recursive: true, force: true })
})

/** The `--out` directory a step was told to write into. */
function outOf(step: IterationStep): string {
  return step.argv[step.argv.indexOf('--out') + 1]
}

interface FakeOptions {
  /** Step to fail at, and how. `once` fails the first attempt only. */
  failAt?: { step: IterationStep['name']; code: number; stderr: string; once?: boolean }
  /** `1c diff` exits non-zero whenever it finds a region; it still writes its report. */
  diffExitCode?: number
  /** Awaited before each step returns, so a test can hold a run open. */
  gate?: () => Promise<void>
}

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * Every artifact it emits carries the iteration's own `--out` directory in its
 * bytes, which is what lets a test prove that iteration 1's links still serve
 * iteration 1's artifacts after iteration 3 has run.
 */
function fakeRunner(log: IterationStep['name'][], opts: FakeOptions = {}): StepRunner {
  let failed = false
  return async (step, cwd): Promise<StepResult> => {
    log.push(step.name)
    if (opts.gate) await opts.gate()
    if (opts.failAt?.step === step.name && !(opts.failAt.once && failed)) {
      failed = true
      return { code: opts.failAt.code, stdout: '', stderr: opts.failAt.stderr }
    }
    switch (step.name) {
      case 'capture': {
        const url = step.argv[2]
        const host = new URL(url).hostname
        const dir = path.join(cwd, 'storage', 'references', host, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ url }))
        return { code: 0, stdout: JSON.stringify({ url, name: `${host}/index`, dir }), stderr: '' }
      }
      case 'render': {
        const out = outOf(step)
        mkdirSync(path.join(out, 'assets'), { recursive: true })
        writeFileSync(path.join(out, 'index.html'), `<!doctype html><title>reproduction from ${out}</title>`)
        writeFileSync(path.join(out, 'assets', 'hero.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]))
        return { code: 0, stdout: `Rendered 2 file(s) → ${out}`, stderr: '' }
      }
      case 'diff': {
        const out = outOf(step)
        mkdirSync(out, { recursive: true })
        const crops = ['region-1-ref.png', 'region-1-ours.png', 'region-1-diff.png']
        for (const name of ['diff.png', 'diff-blocks.png', ...crops]) {
          writeFileSync(path.join(out, name), Buffer.from(`png from ${out} / ${name}`))
        }
        writeFileSync(
          path.join(out, 'regions.json'),
          JSON.stringify({
            meanDiff: 12.5,
            pctOverThreshold: 4.25,
            // `1c diff` records ABSOLUTE crop paths — it wrote the report for an
            // operator reading it on their own disk.
            regions: [
              { id: 1, crops: { ref: path.join(out, crops[0]), actual: path.join(out, crops[1]), diff: path.join(out, crops[2]) } },
            ],
          }),
        )
        // The real `1c diff` exits non-zero whenever it finds a region.
        return { code: opts.diffExitCode ?? 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

interface Fixture {
  handle: ConsoleHandle
  /** The scratch repo root this console runs against. */
  cwd: string
}

/** A console on an ephemeral loopback port, over its own scratch repo root. */
async function startConsole(runStep: StepRunner): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req254-'))
  scratchDirs.push(cwd)
  const handle = await startReproConsole({ cwd, runStep, port: 0 })
  openHandles.push(handle)
  return { handle, cwd }
}

const post = (f: Fixture, route: string, body = ''): Promise<Response> =>
  fetch(new URL(route, f.handle.url), {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })

const get = (f: Fixture, route: string): Promise<Response> => fetch(new URL(route, f.handle.url))
const page = async (f: Fixture): Promise<string> => (await get(f, '/')).text()

/** Press [reproduce] and wait for the run to finish. */
async function reproduce(f: Fixture, url: string): Promise<void> {
  await post(f, '/run', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

/** Press [run again] and wait. */
async function runAgain(f: Fixture): Promise<void> {
  await post(f, '/run-again')
  await f.handle.console.settled()
}

describe('REQ-254 the reproduction console', () => {
  it('test_UAT_FC_REQ_254_it_opens_blank_and_serves_only_on_loopback', async () => {
    const f = await startConsole(fakeRunner([]))

    // Requirement 1 — loopback only. `listen` is given an explicit address; the
    // default binds every interface, which would put a console that spawns
    // processes and serves this disk on the network.
    expect((f.handle.server.address() as AddressInfo).address).toBe('127.0.0.1')

    // Requirement 2 — a text box and a [reproduce] button, and nothing else.
    const html = await page(f)
    expect(html).toContain('name="url"')
    expect(html).toContain('>reproduce<')
    expect(html).not.toContain('Iteration')
    expect(html).not.toContain('run again')
  })

  it('test_UAT_FC_REQ_254_a_run_produces_an_iteration_with_three_new_tab_links', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))

    // Requirement 3 — entering an address and pressing [reproduce] captures the
    // site and reproduces it. Requirement 14 — as a sequence of `1c` steps.
    await reproduce(f, 'joyfulculinarycreations.com')
    expect(log).toEqual(['capture', 'refold', 'repro', 'render', 'diff'])

    // Requirement 4 — the heading and its three links, and requirement 5 —
    // every one of them opens in a new tab, so following one never loses the
    // console. Both are read off the same match: a link that lacked
    // `target="_blank"` would not appear in this list at all.
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    const links = [...html.matchAll(/<a href="([^"]+)" target="_blank"[^>]*>([^<]+)<\/a>/g)]
    expect(links.map((m) => m[2])).toEqual(['the original site', 'the reproduction', 'the diff images'])
    expect(links.map((m) => m[1])).toEqual([
      'https://joyfulculinarycreations.com',
      '/iteration/1/site/',
      '/iteration/1/diff/',
    ])
    expect([...html.matchAll(/<a /g)]).toHaveLength(3)
  })

  it('test_UAT_FC_REQ_254_every_link_reaches_the_real_artifact', async () => {
    const f = await startConsole(fakeRunner([]))
    await reproduce(f, 'example.com')

    // The reproduction link serves the rendered output `1c render --out` wrote.
    const repro = await get(f, '/iteration/1/site/')
    expect(repro.status).toBe(200)
    expect(await repro.text()).toContain('reproduction from')
    // …and the assets beside it, which is why the link carries a trailing slash.
    const asset = await get(f, '/iteration/1/site/assets/hero.png')
    expect(asset.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await asset.arrayBuffer())).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]))

    // The diff link serves a page of the images `1c diff --out` wrote: the
    // headline numbers, the heatmaps, then the ranked region triptychs —
    // DOC-19's worst-first reading order.
    const diffPage = await (await get(f, '/iteration/1/diff/')).text()
    expect(diffPage).toContain('12.5')
    expect(diffPage).toContain('/iteration/1/diff/diff-blocks.png')
    expect(diffPage).toContain('/iteration/1/diff/region-1-ref.png')
    expect(diffPage).toContain('/iteration/1/diff/region-1-ours.png')
    expect(diffPage).toContain('/iteration/1/diff/region-1-diff.png')

    const image = await get(f, '/iteration/1/diff/diff.png')
    expect(image.headers.get('content-type')).toBe('image/png')
    expect(await image.text()).toContain('diff.png')

    // Confinement — the served root is this iteration's own directory and
    // nothing above it. Asked through the handler rather than over the wire,
    // because WHATWG URL parsing resolves `..` out of a pathname before a
    // request is ever sent, so a traversal never reaches the handler as one
    // over HTTP; this is the guard behind that, asserted against a file that
    // really does exist just outside the served root.
    writeFileSync(path.join(f.cwd, 'secret.txt'), 'not yours')
    for (const attempt of [
      '/iteration/1/diff/../../../../secret.txt',
      '/iteration/1/site/../../../../secret.txt',
      '/iteration/1/site/..%2f..%2f..%2f..%2fsecret.txt',
    ]) {
      const escaped = await f.handle.console.handle({ method: 'GET', path: attempt })
      expect(escaped.status, attempt).toBeGreaterThanOrEqual(400)
      expect(String(escaped.body), attempt).not.toContain('not yours')
    }
    // …and an iteration that does not exist is not a hole either.
    expect((await get(f, '/iteration/9/site/')).status).toBe(404)
  })

  it('test_UAT_FC_REQ_254_run_again_appends_and_earlier_iterations_keep_their_own_artifacts', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))
    await reproduce(f, 'example.com')
    const first = await (await get(f, '/iteration/1/site/')).text()

    // Requirement 6 — [run again] appends, and earlier iterations stay.
    await runAgain(f)
    await runAgain(f)
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('<h2>Iteration 3</h2>')
    expect(html.indexOf('<h2>Iteration 1</h2>')).toBeLessThan(html.indexOf('<h2>Iteration 3</h2>'))

    // Requirement 15 — a re-run refolds the stored bundle rather than
    // re-capturing it. Re-capturing would re-roll the oracle, moving the
    // reference at the same moment the fold moved, and the iteration exists to
    // tell those two apart.
    expect(log.filter((step) => step === 'capture')).toHaveLength(1)
    expect(log.filter((step) => step === 'refold')).toHaveLength(3)

    // Requirement 17 — iteration 1's links still serve iteration 1's artifacts.
    expect(await (await get(f, '/iteration/1/site/')).text()).toBe(first)
    expect(await (await get(f, '/iteration/3/site/')).text()).not.toBe(first)
    expect(await (await get(f, '/iteration/1/diff/diff.png')).text()).toContain('iteration-1')
    expect(await (await get(f, '/iteration/3/diff/diff.png')).text()).toContain('iteration-3')
  })

  it('test_UAT_FC_REQ_254_reproduce_with_an_address_starts_a_new_list', async () => {
    // Requirement 16 — [reproduce] and [run again] are different verbs.
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))
    await reproduce(f, 'example.com')
    await runAgain(f)
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')

    await reproduce(f, 'other.example')
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('https://other.example')
    // A new address is a new capture; the second site does not reuse the first
    // site's bundle.
    expect(log.filter((step) => step === 'capture')).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_254_a_run_in_progress_says_so_and_a_second_press_starts_nothing', async () => {
    const log: IterationStep['name'][] = []
    let release = (): void => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    let gated = true
    const f = await startConsole(
      fakeRunner(log, {
        gate: async () => {
          if (gated) await held
        },
      }),
    )

    await post(f, '/run', new URLSearchParams({ url: 'example.com' }).toString())

    // Requirement 9 — while a run is in progress the page says so…
    const state = (await (await get(f, '/state')).json()) as { running: boolean; message: string }
    expect(state.running).toBe(true)
    expect(state.message).toMatch(/Running iteration 1/)
    expect(await page(f)).toMatch(/Running iteration 1/)

    // …and pressing a button again during the run does not start a second one.
    expect((await post(f, '/run-again')).status).toBe(409)
    expect((await post(f, '/run', new URLSearchParams({ url: 'other.com' }).toString())).status).toBe(409)

    gated = false
    release()
    await f.handle.console.settled()
    expect(log).toEqual(['capture', 'refold', 'repro', 'render', 'diff'])
    expect(((await (await get(f, '/state')).json()) as { running: boolean }).running).toBe(false)
  })

  it('test_UAT_FC_REQ_254_a_failed_run_names_what_failed_and_leaves_no_iteration', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(
      fakeRunner(log, {
        failAt: { step: 'repro', code: 1, stderr: 'repro: no l1.json in bundle', once: true },
      }),
    )
    await reproduce(f, 'example.com')

    // Requirement 10 — the page says WHAT failed, naming the step and carrying
    // what the process said, rather than reporting a bare non-zero exit.
    const failed = await page(f)
    expect(failed).toContain('failed at repro')
    expect(failed).toContain('no l1.json in bundle')
    // No half-built iteration is left on the page. The steps after the failure
    // never ran (requirement 14), so there is nothing half-built to show.
    expect(failed).not.toContain('<h2>Iteration 1</h2>')
    expect(log).toEqual(['capture', 'refold', 'repro'])

    // …and the console stays usable: the next press runs and produces one.
    await reproduce(f, 'example.com')
    expect(await page(f)).toContain('<h2>Iteration 1</h2>')
  })

  it('test_UAT_FC_REQ_254_a_non_empty_diff_is_a_result_not_a_failure', async () => {
    // Requirement 18 — `1c diff` exits non-zero whenever it finds a region of
    // interest, which is the normal outcome for every reproduction worth
    // looking at. Judging that step by its exit code would report every real
    // iteration as a failed run; it is judged by whether it wrote its report.
    const f = await startConsole(fakeRunner([], { diffExitCode: 1 }))
    await reproduce(f, 'example.com')
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('failed at')
    expect(html).toContain('Iteration 1 finished.')
  })

  it('test_UAT_FC_REQ_254_an_iteration_writes_only_into_scratch_space', async () => {
    // Requirement 17 — the artifacts land under `storage/tmp/`, which DOC-12
    // declares scratch and `.gitignore` keeps out of the tree.
    const f = await startConsole(fakeRunner([]))
    await reproduce(f, 'joyfulculinarycreations.com')
    expect(CONSOLE_WORKSPACE.startsWith(path.join('storage', 'tmp'))).toBe(true)
    const iteration = path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl('joyfulculinarycreations.com'), 'iteration-1')
    expect(existsSync(path.join(iteration, 'site', 'index.html'))).toBe(true)
    expect(existsSync(path.join(iteration, 'diff', 'regions.json'))).toBe(true)
  })

  it('test_UAT_FC_REQ_254_every_step_is_a_separate_invocation_pointed_at_the_bundle', async () => {
    // Requirement 7 — each step is its own `1c` invocation. `1c` compiles
    // TypeScript on the fly through a Vite SSR server (REQ-150), so a long-lived
    // server holding one module graph would keep running the code it booted
    // with: iteration N+1 would silently reproduce iteration N's result.
    const steps = reproductionSteps({
      bundleDir: 'storage/references/example.com/index',
      slug: 'repro-example-com',
      siteOut: '/scratch/iteration-2/site',
      diffOut: '/scratch/iteration-2/diff',
    })
    expect(steps.map((s) => s.name)).toEqual(['refold', 'repro', 'render', 'diff'])
    for (const step of steps) expect(step.argv[0]).toBe(step.name)
    // Every step that reads the reference points at the SAME bundle — the one
    // the capture reported, not one re-derived from the address that was typed.
    for (const step of steps.filter((s) => s.argv.includes('--ref'))) {
      expect(step.argv[step.argv.indexOf('--ref') + 1]).toBe('storage/references/example.com/index')
    }
    // The diff is graded on its report, not its exit code (requirement 18).
    expect(steps.find((s) => s.name === 'diff')!.artifact).toBe('/scratch/iteration-2/diff/regions.json')
  })

  it('test_UAT_FC_REQ_254_capture_that_reports_no_bundle_is_refused_not_guessed', async () => {
    // Requirement 19 — the console cannot derive the bundle directory: a
    // capture is named after the host that ANSWERED, which may not be the one
    // typed. If the report does not carry one, the run must stop and say so
    // rather than carry `undefined` into every later `--ref`.
    expect(parseCaptureReport('{"url":"https://a.test/","name":"a.test/index","dir":"/x/a.test/index"}')).toEqual({
      url: 'https://a.test/',
      name: 'a.test/index',
      dir: '/x/a.test/index',
    })
    expect(() => parseCaptureReport('Captured https://a.test/ → storage/references/a.test/index')).toThrow(
      /did not report where the bundle landed/,
    )
    expect(() => parseCaptureReport('{"url":"https://a.test/"}')).toThrow(/no bundle directory/)
  })
})

// ── the real runner, against the real CLI ────────────────────────────────────

describe('REQ-254 the runner spawns the real `1c`', () => {
  it(
    'test_UAT_FC_REQ_254_a_step_is_a_fresh_1c_process',
    async () => {
      // The production `spawnStepRunner`, unmocked, running a real `1c` from the
      // repo root. What is under test is that a step really is a separate
      // process that boots the CLI — so the command is chosen to be offline,
      // ungated and a pure function of the source: `help` prints the CLI's own
      // usage, which two invocations agree on even while the rest of the suite
      // is writing to the stores every other command reads. (`name` only labels
      // a failure line; it does not select the command.)
      const runner = spawnStepRunner()
      const first = await runner({ name: 'render', argv: ['help'] }, REPO_ROOT)
      expect(first.code).toBe(0)
      expect(first.stdout).toContain('1c — file-backed site storage')
      // A second step is a second process: it boots its own Vite server and
      // loads the CLI again, which is what makes "run it again with the fix in"
      // true rather than aspirational.
      const second = await runner({ name: 'render', argv: ['help'] }, REPO_ROOT)
      expect(second.code).toBe(0)
      expect(second.stdout).toBe(first.stdout)
    },
    180_000,
  )
})

// ── `1c capture page --json`, against a real browser ─────────────────────────

const itB = it.runIf(await chromiumAvailable())

describe('REQ-254 `1c capture page --json` reports where the bundle landed', () => {
  itB(
    'test_UAT_FC_REQ_254_capture_reports_its_bundle_machine_readably',
    async () => {
      const server: Server = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<!doctype html><html><head><title>t</title></head><body><h1>Hello</h1></body></html>')
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
      let bundleDir: string | undefined
      try {
        const result = await spawnStepRunner()({ name: 'capture', argv: ['capture', 'page', url, '--json'] }, REPO_ROOT)
        expect(result.code).toBe(0)
        const report = parseCaptureReport(result.stdout)
        bundleDir = report.dir
        // The bundle it named is the bundle it wrote — which is the whole point:
        // every later step points `--ref` at exactly this directory.
        expect(existsSync(path.join(report.dir, 'capture.json'))).toBe(true)
        expect(report.name).toContain('127.0.0.1')
        expect(JSON.parse(readFileSync(path.join(report.dir, 'capture.json'), 'utf8')).url).toContain('127.0.0.1')
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()))
        if (bundleDir) rmSync(path.dirname(bundleDir), { recursive: true, force: true })
      }
    },
    300_000,
  )
})
