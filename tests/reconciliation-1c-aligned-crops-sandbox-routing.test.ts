import { describe, expect, it } from 'vitest'
import { subRenderOptions, type AlignedCropsOptions } from '../tools/generate/src/cli'

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
 * The AC's verification is exactly "the options handed to its render and serve" —
 * i.e. the `subRenderOptions` return value. That is the store-routing seam and the
 * verifiable boundary; the browser + sharp crop pipeline downstream of it is the
 * orchestrator (the commit's end-to-end check — 7 crop pairs from a rendered sandbox
 * reproduction — is manual). No browser, no Astro, no third-party site here.
 */

// ── AC-720: --sandbox forwards the store tree to render+serve; else sites/ ────

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
