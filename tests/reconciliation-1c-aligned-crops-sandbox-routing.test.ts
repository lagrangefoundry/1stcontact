import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  chromiumAvailable,
  cmdAlignedCrops,
  subRenderOptions,
  type AlignedCropsOptions,
} from '../tools/generate/src/cli'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import type { L1Document } from '../packages/site-schema/src/index'
import type { Capture } from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UAT for story-e15a19ef (guarantee 3) — "aligned-crops --sandbox
 * renders, serves, and crops the sandbox reproduction, not the sites/ build".
 *
 * Reconciled from bundle-31e474b9 (BUNDLE-7), commit 09fa7cf5. `cmdAlignedCrops`
 * previously rendered and served from `sites/` even under `--sandbox`, so a sandbox
 * reproduction was diffed against an absent/stale site and produced no crops. The
 * store selection (`sandbox` + `cwd`) plus `source` is now forwarded — via the pure
 * `subRenderOptions` seam — to both the render (`cmdRender`) and the serve
 * (`startServe`) the command triggers.
 *
 * AC-720 closes on TWO observables and this file carries one leg for each:
 *
 *  • **Part A — the routing seam, browser-free.** "the options handed to its render
 *    and serve" is exactly the `subRenderOptions` return value; three invocation
 *    shapes pin `sandbox` / `cwd` / `source` across it.
 *
 *  • **Part B — the end-to-end observable, browser-gated.** The AC's Criterion
 *    bullet 1 and its Verification both close on "a non-empty set of crop pairs is
 *    produced" from the sandbox build, and Part A structurally cannot see that:
 *    `subRenderOptions` can return a perfectly-shaped object that `cmdAlignedCrops`
 *    then ignores, and the regression AC-720 exists to prevent is *defined* by crop
 *    emptiness. Part B therefore drives the real `cmdRepro --sandbox` → real
 *    `cmdAlignedCrops --sandbox` chain against a committed-shape reference bundle
 *    built in a temp dir, and asserts the crop pairs exist on disk.
 *
 *    `cmdAlignedCrops` launches Chromium directly (`aligned-crops.ts:199-200`) — it
 *    has no injectable driver seam, unlike `cmdDiff`/`cmdValuesDiff` — so Part B is
 *    gated on a real browser with `it.runIf(browserOk)`, the repo idiom (see
 *    `tests/req58-wrapper-treatments.test.ts:32`, `tests/bug27-nested-backdrop-capture.test.ts:92`).
 *    An absent browser reports SKIPPED rather than passing over zero assertions.
 *    Nothing here contacts a third-party site: the reference bundle, the sandbox
 *    reproduction and the served render are all local.
 */

// ── Part A — AC-720: --sandbox forwards the store tree to render+serve ────────

describe('story-e15a19ef — aligned-crops forwards --sandbox store routing to its sub-commands', () => {
  const baseOpts = (over: Partial<AlignedCropsOptions>): AlignedCropsOptions => ({
    slug: 'joyfulculinary',
    refBundleDir: '/tmp/ref',
    viewportWidth: 1280,
    outDir: '/tmp/out',
    ...over,
  })

  it('test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve', () => {
    // Each variant is one invocation shape; the sub-command options are the object
    // aligned-crops hands identically to both cmdRender and startServe.
    const cases: {
      label: string
      opts: AlignedCropsOptions
      expected: { source: 'draft' | 'published'; sandbox?: boolean; cwd?: string }
    }[] = [
      {
        // --sandbox with a working dir and default source: the store tree
        // (sandbox + cwd) is forwarded so the repro renders/serves from sandbox/,
        // and source defaults to 'draft'.
        label: '--sandbox, default source',
        opts: baseOpts({ sandbox: true, cwd: '/work' }),
        expected: { sandbox: true, cwd: '/work', source: 'draft' },
      },
      {
        // --sandbox alongside an explicit source: sandbox routing AND the selected
        // source both propagate.
        label: '--sandbox, source=published',
        opts: baseOpts({ sandbox: true, cwd: '/work', source: 'published' }),
        expected: { sandbox: true, cwd: '/work', source: 'published' },
      },
      {
        // No --sandbox: the command falls through to the sites/ tree (no sandbox
        // routing) while still preserving the selected source.
        label: 'no --sandbox, source=published',
        opts: baseOpts({ source: 'published' }),
        expected: { sandbox: undefined, cwd: undefined, source: 'published' },
      },
    ]

    for (const { label, opts, expected } of cases) {
      const sub = subRenderOptions(opts)
      // The store-selection flag reaches the render/serve exactly as invoked:
      // present-and-true under --sandbox, absent (no routing) without it.
      expect(sub.sandbox, label).toBe(expected.sandbox)
      // The working directory travels with the sandbox routing.
      expect(sub.cwd, label).toBe(expected.cwd)
      // The source selection (default 'draft') is preserved in every case.
      expect(sub.source, label).toBe(expected.source)
    }
  })
})

// ── Part B — AC-720 end-to-end: crop pairs come out of the sandbox build ──────

/** Whether a real Chromium can be launched, resolved once so the gated leg
 *  reports SKIPPED rather than passing with zero assertions. */
const browserOk = await chromiumAvailable()

/** The anchor text: it is the ref bundle's heading AND the reproduction's only
 *  text node, so the ref↔ours pairing has exactly one unambiguous match. */
const ANCHOR = 'Seasonal Tasting Menu'

describe('story-e15a19ef — aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium)', () => {
  let cwd: string
  const tmpDirs: string[] = []

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac720-'))
    tmpDirs.push(cwd)
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })
  afterAll(() => {
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  /** A flowed one-heading document — the shape `1c new` scaffolds, so the render
   *  needs no keyframe track and the heading is the page's only run. */
  const refDoc = (): L1Document =>
    ({
      widths: [...STARTER_WIDTHS],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        align: 'center',
        distribution: 'center',
        padding: { topPx: 96, rightPx: 24, bottomPx: 96, leftPx: 24 },
        children: [
          {
            kind: 'text',
            id: 'anchor',
            text: ANCHOR,
            axes: {
              color: '#111827',
              fontSizePx: 48,
              fontWeight: 700,
              lineHeightPx: 56,
              textAlign: 'center',
            },
          },
        ],
      },
    }) as unknown as L1Document

  /**
   * Write the reference bundle `cmdAlignedCrops` reads: the folded document
   * (`1c repro`'s input), the asset map, the `multistate.json` the anchors come
   * from, and the per-width reference screenshot the ref crops are cut out of.
   */
  async function refBundle(): Promise<string> {
    const dir = path.join(cwd, 'ref')
    mkdirSync(dir, { recursive: true })
    writeL1(dir, refDoc())
    writeFileSync(
      path.join(dir, 'capture.json'),
      JSON.stringify({ url: 'https://example.invalid/', host: 'example.invalid', assets: [] } as unknown as Capture),
    )
    // refAnchorsAt reads the 1280px `rest` projection; role 'heading' is what
    // pickAnchors selects on when no --areas is given.
    writeFileSync(
      path.join(dir, 'multistate.json'),
      JSON.stringify({
        projections: [
          {
            state: 'rest',
            viewport: { width: 1280, height: 800 },
            manifest: {
              source: 'ref',
              sections: [],
              elements: [{ text: ANCHOR, role: 'heading', box: { x: 0, y: 220, width: 1280, height: 56 } }],
            },
          },
        ],
      }),
    )
    // A real PNG large enough that the 1280x460 ref window is fully inside it —
    // cropTo skips (writes nothing) when the window falls off the image, so an
    // undersized shot would be indistinguishable from the routing bug.
    const sharp = (await import('sharp')).default
    await sharp({ create: { width: 1280, height: 1200, channels: 3, background: '#e8dfd3' } })
      .png()
      .toFile(path.join(dir, 'screenshot-1280.png'))
    return dir
  }

  it.runIf(browserOk)(
    'test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs',
    async () => {
      const ref = await refBundle()

      // The reproduction lands under storage/sandbox/, not storage/sites/ — the
      // tree the render and serve must be routed to.
      const repro = cmdRepro('tastingmenu', { cwd, ref, sandbox: true })
      expect(repro.draftDir, 'reproduction imported into the sandbox tree').toContain(
        path.join('storage', 'sandbox'),
      )
      expect(existsSync(path.join(cwd, 'storage', 'sites', 'tastingmenu')), 'nothing in sites/').toBe(false)

      const outDir = path.join(cwd, 'crops')
      const { areas, indexPath } = await cmdAlignedCrops({
        slug: 'tastingmenu',
        cwd,
        sandbox: true,
        refBundleDir: ref,
        viewportWidth: 1280,
        outDir,
      })

      // The AC's own closing observable. Pre-fix this was EMPTY: the render and
      // serve went to sites/, which has no such site, so no anchor of ours could
      // ever pair with a reference anchor and every area was dropped.
      expect(areas.length, 'crop pairs produced from the sandbox build').toBeGreaterThan(0)
      expect(areas.map((a) => a.anchor)).toContain(ANCHOR)

      // Pairs, not just bookkeeping: both halves of every area are real files, so
      // the ref screenshot and OUR sandbox render were each actually cropped.
      for (const a of areas) {
        expect(existsSync(path.join(outDir, `${a.name}-ref.png`)), `${a.name}-ref.png`).toBe(true)
        expect(existsSync(path.join(outDir, `${a.name}-ours.png`)), `${a.name}-ours.png`).toBe(true)
      }
      expect(readFileSync(indexPath, 'utf8')).toContain(ANCHOR)
    },
    240000,
  )
})
