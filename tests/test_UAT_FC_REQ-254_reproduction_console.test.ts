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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import {
  findStoredCapture,
  parseCaptureList,
  parseCaptureReport,
  readIterations,
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
  /** `1c gate` exits non-zero whenever it does not pass; it still writes its report. */
  diffExitCode?: number
  /** The verdict the stand-in `1c gate` records (REQ-256 behaviours 4 and 7). */
  verdict?: string
  /** Awaited before each step returns, so a test can hold a run open. */
  gate?: () => Promise<void>
  /** What `1c capture list --json` reports back. */
  stored?: Array<{ name: string; dir: string; url: string; capturedAt: string }>
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
  let label = 0
  return async (step, cwd): Promise<StepResult> => {
    // `capture list` is a question, not a step of an iteration — it is asked on
    // every view of the blank page, so logging it would drown the step log the
    // sequencing assertions read.
    if (!(step.name === 'capture' && step.argv[1] === 'list')) log.push(step.name)
    if (step.name === 'refold') label += 1
    if (opts.gate) await opts.gate()
    if (opts.failAt?.step === step.name && !(opts.failAt.once && failed)) {
      failed = true
      return { code: opts.failAt.code, stdout: '', stderr: opts.failAt.stderr }
    }
    switch (step.name) {
      case 'capture': {
        // `capture list` and `capture page` share a step name — the name labels
        // the failure line, the argv selects the command.
        if (step.argv[1] === 'list') {
          return { code: 0, stdout: JSON.stringify(opts.stored ?? []), stderr: '' }
        }
        const url = step.argv[2]
        const host = new URL(url).hostname
        const dir = path.join(cwd, 'storage', 'references', host, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ url }))
        return { code: 0, stdout: JSON.stringify({ url, name: `${host}/index`, dir }), stderr: '' }
      }
      case 'page': {
        // The real `1c page get … --json` PRINTS the document; the console is
        // what puts it on disk.
        return {
          code: 0,
          stdout: JSON.stringify({ ok: true, data: { page: { id: 'home', l1: { from: step.argv[2], at: label } } } }),
          stderr: '',
        }
      }
      case 'render': {
        const out = outOf(step)
        mkdirSync(path.join(out, 'assets'), { recursive: true })
        writeFileSync(path.join(out, 'index.html'), `<!doctype html><title>reproduction from ${out}</title>`)
        writeFileSync(path.join(out, 'assets', 'hero.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]))
        return { code: 0, stdout: `Rendered 2 file(s) → ${out}`, stderr: '' }
      }
      case 'gate': {
        // REQ-256 requirement 15 — `1c gate` replaced `1c diff` as the last
        // step. It writes everything the bare diff wrote, in the same place,
        // and `gate.json` and `values-diff.json` beside them.
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
            dims: { w: 1280, h: 900 },
            blockPx: 16,
            rankedBy: 'score',
            // BUG-99 — THIS STUB CARRIES THE REAL REGION SHAPE, and it is not a
            // detail. It previously wrote `{id, crops}` alone, because that is
            // all the crop-serving path under test reads. A diagnosing round was
            // then pointed at a sandbox backed by this stub, read the region
            // record, and filed BUG-99 against the engine for discarding
            // geometry the engine has never discarded — the geometry was missing
            // from the fixture, not from `regions.json`.
            //
            // A fixture stands in for the thing it fakes. One that carries less
            // than its subject is not a smaller fixture, it is a false statement
            // about the artifact, and it costs whoever believes it a round. So
            // this mirrors `PerceptualDiffReport`: bbox, score, mean, area, the
            // node leads, and the ABSOLUTE crop paths `1c diff` records because
            // it wrote the report for an operator reading it on their own disk.
            regions: [
              {
                id: 1,
                bbox: { x: 96, y: 240, w: 320, h: 64 },
                score: 246.4,
                meanDiff: 30.8,
                area: 20480,
                nodes: {
                  ref: [
                    {
                      kind: 'element',
                      index: 3,
                      text: 'Example Domain',
                      role: 'heading',
                      box: { x: 96, y: 240, w: 320, h: 48 },
                      overlap: { ofRegion: 0.75, ofNode: 1 },
                    },
                  ],
                  actual: [],
                },
                crops: { ref: path.join(out, crops[0]), actual: path.join(out, crops[1]), diff: path.join(out, crops[2]) },
              },
            ],
          }),
        )
        writeFileSync(
          path.join(out, 'values-diff.json'),
          JSON.stringify({ deltas: [{ selector: 'h1', field: 'color', ref: '#111', actual: '#222' }] }),
        )
        writeFileSync(
          path.join(out, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: opts.verdict ?? 'reproduction-wrong',
            diagnosis: 'the pixels disagree and the capture looks complete',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 12.5, pctOverThreshold: 4.25, regions: 1 },
            values: { deltas: 1 },
            coverage: { unreferencedImages: [] },
          }),
        )
        // The real `1c gate` exits non-zero whenever it does not pass.
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

/**
 * A console on an ephemeral loopback port, over its own scratch repo root.
 *
 * The AI round and the rail are stubbed out here ([[REQ-256]] added both): this
 * file is about what the console does AROUND a round, and a suite that spawned
 * a real `claude` per test would spend tokens to assert nothing about it.
 * [[REQ-256]]'s own suite drives those seams.
 */
async function startConsole(runStep: StepRunner): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req254-'))
  scratchDirs.push(cwd)
  const handle = await startReproConsole({
    cwd,
    runStep,
    runAi: async () => ({ status: 'no-gap', summary: 'stubbed' }),
    runCommand: async () => ({ code: 1, stdout: '', stderr: '' }),
    env: {},
    port: 0,
  })
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

/**
 * Press [recapture] and wait for the run to finish.
 *
 * [[REQ-299]] part 1 retired [reproduce] and [run again]: one verb is left, it
 * always carries an address, and what the address names decides whether the
 * press begins a list or appends to the one on screen. Both of this file's
 * presses are therefore the same POST, and the helpers differ only in which
 * address they send.
 */
async function recapture(f: Fixture, url: string): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

/** Press [recapture] under the iteration list — the address already loaded. */
const again = recapture

describe('REQ-254 the reproduction console', () => {
  it('test_UAT_FC_REQ_254_it_opens_blank_and_serves_only_on_loopback', async () => {
    const f = await startConsole(fakeRunner([]))

    // Requirement 1 — loopback only. `listen` is given an explicit address; the
    // default binds every interface, which would put a console that spawns
    // processes and serves this disk on the network.
    expect((f.handle.server.address() as AddressInfo).address).toBe('127.0.0.1')

    // Requirement 2 — a text box and a [recapture] button, and nothing else.
    // [[REQ-299]] part 1 renamed the button in this position without changing
    // what requirement 2 asks of the page; part 2 adds one more thing that must
    // not be on it, because the blank state is the state clearing returns to and
    // a control for a history that does not exist would be a control for
    // nothing.
    const html = await page(f)
    expect(html).toContain('name="url"')
    expect(html).toContain('>recapture<')
    expect(html).not.toContain('Iteration')
    expect(html).not.toContain('run again')
    expect(html).not.toContain('clear history')
  })

  it('test_UAT_FC_REQ_254_a_run_produces_an_iteration_with_three_new_tab_links', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))

    // Requirement 3 — entering an address and pressing [reproduce] captures the
    // site and reproduces it. Requirement 14 — as a sequence of `1c` steps.
    await recapture(f, 'joyfulculinarycreations.com')
    expect(log).toEqual(['capture', 'refold', 'repro', 'page', 'render', 'gate'])

    // Requirement 4 — the heading and its three links, and requirement 5 —
    // every one of them opens in a new tab, so following one never loses the
    // console. Both are read off the same match: a link that lacked
    // `target="_blank"` would not appear in this list at all.
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    const links = [...html.matchAll(/<a href="([^"]+)" target="_blank"[^>]*>([^<]+)<\/a>/g)]
    expect(links.map((m) => m[2])).toEqual([
      'the original site',
      'the reproduction',
      'the diff images',
      'the L1 document',
    ])
    expect(links.map((m) => m[1])).toEqual([
      'https://joyfulculinarycreations.com',
      '/iteration/1/site/',
      '/iteration/1/diff/',
      '/iteration/1/page',
    ])
    expect([...html.matchAll(/<a /g)]).toHaveLength(4)
  })

  it('test_UAT_FC_REQ_254_every_link_reaches_the_real_artifact', async () => {
    const f = await startConsole(fakeRunner([]))
    await recapture(f, 'example.com')

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
    // BUG-99 — each triptych is CAPTIONED with the region's own geometry and the
    // best lead from each side. Three unlabelled images say *that* something
    // differs; the caption says where, how hard, and what is under it, which is
    // the difference between a picture to interpret and a fact to quote.
    expect(diffPage).toContain('96,240 320×64')
    expect(diffPage).toContain('score 246.4')
    expect(diffPage).toContain('Example Domain')
    // A region the reference has a node under and the reproduction does not is
    // something we failed to draw — the asymmetry is the finding, so it is said.
    expect(diffPage).toContain('ours: nothing')
    expect(diffPage).toContain('ranked by')

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

  it('test_UAT_FC_REQ_254_the_continuation_appends_and_earlier_iterations_keep_their_own_artifacts', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))
    await recapture(f, 'example.com')
    const first = await (await get(f, '/iteration/1/site/')).text()

    // Requirement 6 — the continuation appends, and earlier iterations stay.
    // The verb that continues is [recapture] now ([[REQ-299]] part 1); what
    // requirement 6 is about — that continuing does not throw away what is
    // already on the page — is untouched by which verb does it.
    await again(f, 'example.com')
    await again(f, 'example.com')
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('<h2>Iteration 3</h2>')
    expect(html.indexOf('<h2>Iteration 1</h2>')).toBeLessThan(html.indexOf('<h2>Iteration 3</h2>'))

    // Requirement 15 is RETIRED by [[REQ-299]] part 1, and this is where it
    // shows. A re-run used to refold the stored bundle so that the oracle did
    // not move at the same moment the fold did — but whether that is the right
    // trade depends on the schema the stored bundle was written at, which the
    // page does not carry, so the console no longer offers the press that makes
    // it. Every continuation re-captures: three presses, three captures.
    expect(log.filter((step) => step === 'capture')).toHaveLength(3)
    expect(log.filter((step) => step === 'refold')).toHaveLength(3)

    // Requirement 17 — iteration 1's links still serve iteration 1's artifacts.
    expect(await (await get(f, '/iteration/1/site/')).text()).toBe(first)
    expect(await (await get(f, '/iteration/3/site/')).text()).not.toBe(first)
    expect(await (await get(f, '/iteration/1/diff/diff.png')).text()).toContain('iteration-1')
    expect(await (await get(f, '/iteration/3/diff/diff.png')).text()).toContain('iteration-3')
  })

  it('test_UAT_FC_REQ_254_a_different_address_starts_a_new_list', async () => {
    // Requirement 16 — beginning a list and continuing one are different acts.
    // [[REQ-299]] part 1 collapsed the two VERBS into one, so what tells them
    // apart is no longer which button was pressed but which address it carried:
    // the site on the page continues it, a different site starts over at 1.
    const log: IterationStep['name'][] = []
    const f = await startConsole(fakeRunner(log))
    await recapture(f, 'example.com')
    await again(f, 'example.com')
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')

    await recapture(f, 'other.example')
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('https://other.example')
    // A new address is a new capture; the second site does not reuse the first
    // site's bundle. (Three presses, three captures — [[REQ-299]] part 1.)
    expect(log.filter((step) => step === 'capture')).toHaveLength(3)
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

    await post(f, '/recapture', new URLSearchParams({ url: 'example.com' }).toString())

    // Requirement 9 — while a run is in progress the page says so…
    const state = (await (await get(f, '/state')).json()) as { running: boolean; message: string }
    expect(state.running).toBe(true)
    expect(state.message).toMatch(/Running iteration 1/)
    expect(await page(f)).toMatch(/Running iteration 1/)

    // …and pressing a button again during the run does not start a second one,
    // from either position [recapture] occupies ([[REQ-299]] part 1).
    expect((await post(f, '/recapture', new URLSearchParams({ url: 'example.com' }).toString())).status).toBe(409)
    expect((await post(f, '/recapture', new URLSearchParams({ url: 'other.com' }).toString())).status).toBe(409)

    gated = false
    release()
    await f.handle.console.settled()
    expect(log).toEqual(['capture', 'refold', 'repro', 'page', 'render', 'gate'])
    expect(((await (await get(f, '/state')).json()) as { running: boolean }).running).toBe(false)
  })

  it('test_UAT_FC_REQ_254_a_failed_run_names_what_failed_and_leaves_no_iteration', async () => {
    const log: IterationStep['name'][] = []
    const f = await startConsole(
      fakeRunner(log, {
        failAt: { step: 'repro', code: 1, stderr: 'repro: no l1.json in bundle', once: true },
      }),
    )
    await recapture(f, 'example.com')

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
    await recapture(f, 'example.com')
    expect(await page(f)).toContain('<h2>Iteration 1</h2>')
  })

  it('test_UAT_FC_REQ_254_a_non_empty_diff_is_a_result_not_a_failure', async () => {
    // Requirement 18 — `1c diff` exits non-zero whenever it finds a region of
    // interest, which is the normal outcome for every reproduction worth
    // looking at. Judging that step by its exit code would report every real
    // iteration as a failed run; it is judged by whether it wrote its report.
    const f = await startConsole(fakeRunner([], { diffExitCode: 1 }))
    await recapture(f, 'example.com')
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('failed at')
    expect(html).toContain('Iteration 1 finished')
  })

  it('test_UAT_FC_REQ_254_an_iteration_writes_only_into_scratch_space', async () => {
    // Requirement 17 — the artifacts land under `storage/tmp/`, which DOC-12
    // declares scratch and `.gitignore` keeps out of the tree.
    const f = await startConsole(fakeRunner([]))
    await recapture(f, 'joyfulculinarycreations.com')
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
      pageOut: '/scratch/iteration-2/page.json',
    })
    expect(steps.map((s) => s.name)).toEqual(['refold', 'repro', 'page', 'render', 'gate'])
    for (const step of steps) expect(step.argv[0]).toBe(step.name)
    // Every step that reads the reference points at the SAME bundle — the one
    // the capture reported, not one re-derived from the address that was typed.
    for (const step of steps.filter((s) => s.argv.includes('--ref'))) {
      expect(step.argv[step.argv.indexOf('--ref') + 1]).toBe('storage/references/example.com/index')
    }
    // The gate is graded on its report, not its exit code (requirement 18).
    expect(steps.find((s) => s.name === 'gate')!.artifact).toBe('/scratch/iteration-2/diff/gate.json')
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

  it('test_UAT_FC_REQ_254_a_stored_capture_is_adopted_for_free_and_retaken_on_the_next_press', async () => {
    // Requirement 29's REUSE IS RETIRED ([[REQ-299]] part 1). It made the press
    // skip the capture so the oracle would not move at the same instant the fold
    // did — but a fold against a stored bundle is measured at whatever schema
    // that bundle was written at, and the page does not carry that fact, so the
    // press that reuses is gone and every press re-rolls.
    //
    // WHAT SURVIVES IS THE FREE HALF. Adopting a stored capture still runs
    // nothing at all — requirement 31's list is still one click and still costs
    // no capture — and this test reads both halves off one console, because
    // either alone would pass against a page that had lost the other.
    const log: IterationStep['name'][] = []
    const f = await startConsole(
      fakeRunner(log, {
        stored: [
          {
            name: 'example.com/index',
            dir: '/stored/example.com/index',
            url: 'https://example.com/',
            capturedAt: '2026-09-16T10:00:00.000Z',
          },
        ],
      }),
    )
    await page(f) // the blank page is what lists what is on disk

    // Adopting: no steps at all, and the site is loaded.
    await post(f, '/open', new URLSearchParams({ url: 'example.com' }).toString())
    expect(log).toEqual([])
    expect(await page(f)).toContain('https://example.com')

    // Pressing: the capture is re-taken rather than skipped.
    await recapture(f, 'example.com')
    expect(log).toEqual(['capture', 'refold', 'repro', 'page', 'render', 'gate'])
    expect(await page(f)).toContain('<h2>Iteration 1</h2>')
  })

  it('test_UAT_FC_REQ_254_the_www_pair_is_the_same_site', async () => {
    // Requirement 29 — a capture is named after the host that ANSWERED, so
    // someone who typed it bare yesterday and with `www.` today means the same
    // site. Failing to match would silently re-capture and re-roll the oracle
    // they were trying to hold still.
    const stored = [
      { name: 'www.example.com/index', dir: '/stored/www.example.com/index', url: 'https://www.example.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
    ]
    expect(findStoredCapture(stored, 'example.com')?.dir).toBe('/stored/www.example.com/index')
    expect(findStoredCapture(stored, 'https://www.example.com')?.dir).toBe('/stored/www.example.com/index')
    expect(findStoredCapture(stored, 'other.example')).toBeUndefined()
    // An unreadable answer is "nothing stored", not a refusal to start.
    expect(parseCaptureList('not json')).toEqual([])
    expect(parseCaptureList('{"not":"an array"}')).toEqual([])
  })

  it('test_UAT_FC_REQ_254_recapture_rehits_the_site_and_is_on_the_page_to_be_pressed', async () => {
    // Requirement 30 — deliberately moving the reference is a real thing to
    // want. [[REQ-299]] part 1 made it the ONLY thing the page offers rather
    // than the explicit alternative to an ordinary button, so what is left to
    // assert is that the verb still re-hits the site and is still reachable.
    const log: IterationStep['name'][] = []
    const f = await startConsole(
      fakeRunner(log, {
        stored: [
          { name: 'example.com/index', dir: '/stored/example.com/index', url: 'https://example.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
        ],
      }),
    )
    await page(f)
    await post(f, '/recapture', new URLSearchParams({ url: 'example.com' }).toString())
    await f.handle.console.settled()
    expect(log[0]).toBe('capture')
    // …and the button is on the page to be pressed, in both the positions
    // [[REQ-299]] part 1 gives it: the address row, and under the history.
    const html = await page(f)
    expect(html).toMatch(/<form method="post" action="\/recapture">\s*<input name="url"/)
    expect(html).toMatch(/<section class="continue">[\s\S]*?action="\/recapture"[\s\S]*?<\/section>/)
  })

  it('test_UAT_FC_REQ_254_the_blank_page_lists_the_captures_on_disk', async () => {
    // Requirement 31 — revisiting is one click and does not require remembering
    // how the address was typed the first time.
    const f = await startConsole(
      fakeRunner([], {
        stored: [
          { name: 'faelan.com/index', dir: '/stored/faelan.com/index', url: 'https://faelan.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
        ],
      }),
    )
    const blank = await page(f)
    expect(blank).toContain('captured already')
    expect(blank).toContain('faelan.com/index')
    expect(blank).toContain('action="/open"')

    // Clicking one loads it without running anything…
    await post(f, '/open', new URLSearchParams({ url: 'https://faelan.com/' }).toString())
    const loaded = await page(f)
    expect(loaded).toContain('Loaded https://faelan.com/')
    // …and the list is gone, because requirement 2's page is blank until there
    // is a site, and the site is now the thing on it.
    expect(loaded).not.toContain('captured already')
  })

  it('test_UAT_FC_REQ_254_iterations_come_back_from_disk_after_a_restart', async () => {
    // Requirement 33 — the console's memory of a site is the disk's, not the
    // process's. Restarting it must show the history that is on disk rather
    // than an empty page beside a full `storage/tmp/`.
    const stored = [
      { name: 'example.com/index', dir: '/stored/example.com/index', url: 'https://example.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
    ]
    const first = await startConsole(fakeRunner([], { stored }))
    await page(first)
    await recapture(first, 'example.com')
    await again(first, 'example.com')
    expect(await page(first)).toContain('<h2>Iteration 2</h2>')
    const wasIteration1 = await (await get(first, '/iteration/1/site/')).text()
    await first.handle.close()
    openHandles.length = 0

    // A NEW console process over the SAME scratch root — the restart.
    const second = await startReproConsole({
      cwd: first.cwd,
      runStep: fakeRunner([], { stored }),
      runAi: async () => ({ status: 'no-gap', summary: 'stubbed' }),
      runCommand: async () => ({ code: 1, stdout: '', stderr: '' }),
      env: {},
      port: 0,
    })
    openHandles.push(second)
    const revived: Fixture = { handle: second, cwd: first.cwd }
    await page(revived)
    await post(revived, '/open', new URLSearchParams({ url: 'https://example.com/' }).toString())

    const recovered = await page(revived)
    expect(recovered).toContain('<h2>Iteration 1</h2>')
    expect(recovered).toContain('<h2>Iteration 2</h2>')
    // The links are live, serving the same bytes the first console served.
    expect(await (await get(revived, '/iteration/1/site/')).text()).toBe(wasIteration1)
    // And the next run appends rather than starting over.
    await again(revived, 'example.com')
    expect(await page(revived)).toContain('<h2>Iteration 3</h2>')
  })

  it('test_UAT_FC_REQ_254_a_failed_run_leaves_nothing_for_disk_to_recover', async () => {
    // Requirement 33 with requirement 10 — the manifest is written LAST, so a
    // run that fell over is not a half-built iteration that comes back on the
    // next load.
    const stored = [
      { name: 'example.com/index', dir: '/stored/example.com/index', url: 'https://example.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
    ]
    const f = await startConsole(
      fakeRunner([], { stored, failAt: { step: 'render', code: 1, stderr: 'render: boom' } }),
    )
    await page(f)
    await recapture(f, 'example.com')
    expect(await page(f)).toContain('failed at render')

    const dir = path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl('example.com'), 'iteration-1')
    expect(existsSync(dir)).toBe(true) // the directory is there…
    expect(readIterations(path.dirname(dir))).toEqual([]) // …and disk reports no iteration
  })

  it('test_UAT_FC_REQ_254_each_iteration_keeps_the_reproductions_own_l1', async () => {
    // Requirement 34 — `1c repro` rebuilds the sandbox site IN PLACE, so the
    // document carrying the folded L1 is overwritten by the next iteration.
    // That document is where a fold change lives; the pixels downstream of it
    // are the symptom. Keeping only those kept the evidence and discarded the
    // cause.
    const stored = [
      { name: 'example.com/index', dir: '/stored/example.com/index', url: 'https://example.com/', capturedAt: '2026-09-16T10:00:00.000Z' },
    ]
    const f = await startConsole(fakeRunner([], { stored }))
    await page(f)
    await recapture(f, 'example.com')
    await again(f, 'example.com')

    const one = await get(f, '/iteration/1/page')
    expect(one.status).toBe(200)
    expect(one.headers.get('content-type')).toContain('application/json')
    const first = (await one.json()) as { data: { page: { l1: { at: number } } } }
    const second = (await (await get(f, '/iteration/2/page')).json()) as typeof first

    // Each iteration kept its OWN document — iteration 1's did not move when
    // iteration 2 rebuilt the sandbox site underneath it.
    expect(first.data.page.l1.at).toBe(1)
    expect(second.data.page.l1.at).toBe(2)
    // …and it really is on disk in the iteration's own directory.
    const dir = path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl('example.com'), 'iteration-1')
    expect(existsSync(path.join(dir, 'page.json'))).toBe(true)
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

  it('test_UAT_FC_REQ_254_two_consoles_must_be_pointed_at_different_sites', () => {
    // Requirement 35 — a site is ONE sandbox slug and ONE scratch directory,
    // both derived from its host and both rebuilt in place. Two consoles on the
    // same site therefore overwrite each other, and two on different sites
    // share nothing. This is asserted rather than left as advice because the
    // collision is silent: neither console errors, they just clobber.
    expect(slugForUrl('example.com')).toBe(slugForUrl('https://example.com/'))
    expect(slugForUrl('example.com')).not.toBe(slugForUrl('other.example'))
    const scratch = (url: string): string => path.join(CONSOLE_WORKSPACE, slugForUrl(url), 'iteration-1')
    expect(scratch('example.com')).toBe(scratch('https://example.com/'))
    expect(scratch('example.com')).not.toBe(scratch('other.example'))
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

// ── `1c capture list --json`, against the real CLI ───────────────────────────

describe('REQ-254 `1c capture list --json` reports the stored bundles', () => {
  it(
    'test_UAT_FC_REQ_254_capture_list_reports_what_is_on_disk',
    async () => {
      // Requirement 32 — the console cannot derive which captures exist: a
      // bundle is named after the host that ANSWERED. The engine owns that
      // layout, so the engine is what answers. Run against the real CLI, from a
      // scratch repo root, so the shape the console parses is the shape the
      // command really prints. No browser is needed — this reads a tree.
      // `realpathSync` because the child resolves its own cwd, and on macOS
      // `/tmp` is a symlink to `/private/tmp` — the paths it reports back are
      // the resolved ones.
      const cwd = realpathSync(mkdtempSync(path.join(tmpdir(), 'req254-list-')))
      scratchDirs.push(cwd)
      const bundle = path.join(cwd, 'storage', 'references', 'example.test', 'index')
      mkdirSync(bundle, { recursive: true })
      writeFileSync(
        path.join(bundle, 'capture.json'),
        JSON.stringify({
          url: 'https://example.test/',
          host: 'example.test',
          path: '/',
          title: 't',
          capturedAt: '2026-09-16T10:00:00.000Z',
          viewport: { width: 1280, height: 800 },
          theme: {},
          sections: [],
          assets: [],
        }),
      )
      // A half-written bundle really does sit in this tree — a capture is a
      // SEQUENCE of writes and is not atomic. It must be skipped, not reported
      // with empty fields, and not a reason to hide its neighbour.
      const torn = path.join(cwd, 'storage', 'references', 'torn.test', 'index')
      mkdirSync(torn, { recursive: true })
      writeFileSync(path.join(torn, 'capture.json'), 'not json at all')

      const result = await spawnStepRunner()({ name: 'capture', argv: ['capture', 'list', '--json'] }, cwd)
      expect(result.code).toBe(0)
      const listed = parseCaptureList(result.stdout)
      expect(listed.map((entry) => entry.name)).toEqual(['example.test/index'])
      expect(listed[0].dir).toBe(bundle)
      expect(listed[0].url).toBe('https://example.test/')
      // And the console finds it from the address someone would type.
      expect(findStoredCapture(listed, 'example.test')?.dir).toBe(bundle)
    },
    180_000,
  )
})
