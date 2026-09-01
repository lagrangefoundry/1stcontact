/**
 * REQ-88 — the operator-facing L1 reproduction pipeline (UATs).
 *
 * Drives the two new verbs against fixture capture bundles:
 *   - `1c repro`   — import a folded `l1.json` as a raw-L1 page site, then render
 *                    it through the ordinary pipeline → a servable `index.html`.
 *   - `1c l1-gate` — the mechanical 3-probe acceptance gate on the bundle oracle.
 *
 * The pinned 3-run oracle is the REQ-86 discriminator fixture: fidelity + off-
 * sample pass on the absolute base, but content-robustness fails until
 * `promoteToFlow` recovers it — so the gate verb both *surfaces* and *closes* the
 * residual. A single-run oracle needs no recovery (the clean-pass case).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultTokens } from '../packages/framework/src/index'
import { validateSite } from '../packages/site-schema/src/index'
import { foldToL1 } from '../tools/generate/src'
import { writeL1, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro, cmdL1Gate } from '../tools/generate/src/cli/repro'
import { cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function text(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/** The REQ-86 pinned 3-run stack: clean at rest, overruns under 2.5× content. */
const HEADLINE = 'Front door heading'
function pinnedOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 }),
        text('Body copy line', { x: 20, y: 170, width: width - 40, height: 48 }),
        text('Caption row', { x: 20, y: 240, width: width - 40, height: 48 }),
      ],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A single run — nothing below it to overrun, so no recovery is ever needed. */
function cleanOracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [text(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req88-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a fixture capture bundle carrying an l1.json (+ optionally multistate). */
async function bundleWith(opts: { l1?: MultiStateCapture; multistate?: MultiStateCapture }): Promise<string> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(dir, { recursive: true })
  if (opts.l1) await writeL1(fsReferenceBundle(dir), foldToL1(opts.l1))
  if (opts.multistate) await writeMultiState(fsReferenceBundle(dir), opts.multistate)
  return dir
}

describe('REQ-88 — L1 reproduction pipeline', () => {
  it('test_UAT_FC_REQ-88_repro_import_renders_l1_page', async () => {
    const ref = await bundleWith({ l1: pinnedOracle() })
    const result = await cmdRepro('gigabyte', { cwd, ref })

    // The import produced a schema-valid site whose home page IS a raw L1
    // document (no behavior-module stack).
    expect(result.nodeCount).toBeGreaterThan(0)
    const loaded = loadSite({ cwd, root: 'sites' }, 'gigabyte', 'draft')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) throw new Error('load failed')
    const home = loaded.value.site.pages.find((p) => p.slug === 'home')
    expect(home?.l1).toBeDefined()
    expect(home?.modules).toEqual([])

    // Rendered through the ordinary pipeline → a servable index.html carrying the
    // L1 body content, not a module hook.
    const { outDir } = await cmdRender('gigabyte', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain(HEADLINE)
    expect(html).not.toContain('data-fc-type')
  })

  it('test_UAT_FC_REQ-88_repro_is_idempotent_rebuild', async () => {
    const ref = await bundleWith({ l1: pinnedOracle() })
    const first = await cmdRepro('gigabyte', { cwd, ref })
    // Re-import overwrites cleanly (the "delete + rebuild" loop) — same result,
    // no "already exists" throw.
    const second = await cmdRepro('gigabyte', { cwd, ref })
    expect(second.nodeCount).toBe(first.nodeCount)
    const loaded = loadSite({ cwd, root: 'sites' }, 'gigabyte', 'draft')
    expect(loaded.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-88_l1_gate_passes_clean_bundle', async () => {
    const ref = await bundleWith({ multistate: cleanOracle() })
    const report = await cmdL1Gate(fsReferenceBundle(ref))

    expect(report.pass).toBe(true)
    expect(report.promoted).toEqual([]) // nothing to overrun → no recovery
    expect(report.sampleFidelity.pass).toBe(true)
    expect(report.sampleFidelity.residuals).toEqual([])
    expect(report.sampleFidelity.unmatched).toEqual([])
    expect(report.offSample.pass).toBe(true)
    expect(report.contentRobustness.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-88_l1_gate_surfaces_and_recovers_pinned_residual', async () => {
    const ref = await bundleWith({ multistate: pinnedOracle() })
    const report = await cmdL1Gate(fsReferenceBundle(ref))

    // The gate SURFACES the content-robustness residual (that is why promotion
    // ran) and its demand-driven recovery CLOSES it — the discriminator behavior.
    expect(report.promoted.length).toBeGreaterThan(0)
    expect(report.contentRobustness.pass).toBe(true)
    expect(report.sampleFidelity.pass).toBe(true)
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-88_l1_gate_requires_recaptured_bundle', async () => {
    // A bundle predating multi-state capture has no oracle to gate against — the
    // verb must fail-fast with a re-capture instruction, not a cryptic crash.
    const ref = await bundleWith({}) // empty bundle
    await expect(cmdL1Gate(fsReferenceBundle(ref))).rejects.toThrow(/re-capture/)
  })

  it('test_UAT_FC_REQ-88_schema_page_l1_admits_no_second_body', () => {
    const l1 = foldToL1(pinnedOracle())
    const base = {
      id: 'gigabyte',
      config: { businessName: 'Gigabyte', tagline: '' },
      theme: defaultTokens,
      nav: { pattern: 'top-tabs', entries: [] },
      assets: [],
    }
    // A raw-L1 page is accepted.
    const l1Page = { id: 'home', slug: 'home', title: 'Home', l1 }
    expect(validateSite({ ...base, pages: [l1Page] }).ok).toBe(true)

    // A behavior-module page is accepted.
    const modulePage = {
      id: 'home',
      slug: 'home',
      title: 'Home',
      modules: [{ id: 'c1', type: 'carousel', version: 1 }],
    }
    expect(validateSite({ ...base, pages: [modulePage] }).ok).toBe(true)

    // A page carrying an L1 document AND a module that claims to be a second page
    // body is rejected. REQ-93 narrowed the rule from "never both" to "a module
    // may accompany `l1` only when it is BOUND to a slot in that tree" — the XOR's
    // real intent (no two competing page bodies) is what survives, and an UNBOUND
    // module is exactly what that intent forbids.
    const bothPage = {
      id: 'home',
      slug: 'home',
      title: 'Home',
      l1,
      modules: [{ id: 'c1', type: 'carousel', version: 1 }],
    }
    const both = validateSite({ ...base, pages: [bothPage] })
    expect(both.ok).toBe(false)
    if (!both.ok) {
      expect(both.errors.some((e) => /must name the L1 slot it mounts into/.test(e.message))).toBe(true)
    }
  })
})
