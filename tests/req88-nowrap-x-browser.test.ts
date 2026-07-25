/**
 * REQ-88 (round 6) — the **cross-engine** half of the unbreakable-run fix.
 *
 * The wrapping this axis prevents was invisible to every gate the project had,
 * and the reason is structural rather than an oversight of thresholds:
 *
 *   - `values-diff` and the perceptual `diff` shoot **Chromium only**, and in
 *     Chromium nothing wrapped. The reproduction was, by its own gates, exact.
 *   - `l1-gate`'s off-sample probe is **analytic** — it evaluates the geometry
 *     model with no font metrics at all, so it cannot observe a line break even
 *     in principle.
 *
 * So the defect lived precisely in the gap between them: a run whose box clears
 * its own glyphs by 0.12–0.81px in Blink and fails to in Gecko. Six checklist
 * items, the send-message CTA and the footer wrapped in Firefox and overprinted
 * the absolutely-positioned run below — while the scoreboard read clean.
 *
 * This UAT closes that gap the only way it can be closed: by rendering a folded
 * document in every available engine and asserting the reference's own line count
 * survives. It is the DOC-20 x-browser dimension applied to L1 output.
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document } from '../packages/site-schema/src/index'
import { createEngineDriver, engineAvailable } from '../tools/generate/src'

type Engine = 'chromium' | 'webkit' | 'firefox'
const ENGINES: Engine[] = ['chromium', 'webkit', 'firefox']

const available: Engine[] = []
for (const e of ENGINES) if (await engineAvailable(e)) available.push(e)
const itReal = it.runIf(available.length >= 2)

/**
 * A run pinned at the width its glyphs measure in Chromium, to a whole pixel —
 * the shrink-to-fit shape the fold produces, and the one whose slack is small
 * enough for a different engine's metrics to overflow it.
 */
function tightDoc(pin: boolean): L1Document {
  return {
    widths: [1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          id: 'tight',
          text: 'Designed for developers building AI-enhanced workflows',
          axes: {
            color: '#111111',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSizePx: 16,
            fontWeight: 400,
            lineHeightPx: 24,
            ...(pin ? { nowrapFromPx: 1280 } : {}),
          },
          geometry: { keyframes: [{ at: 1280, x: 24, y: 40, width: 414 }] },
        },
      ],
    },
  }
}

/** Render a document to a temp file and report each engine's line count for `#tight`. */
async function lineCountsPerEngine(doc: L1Document): Promise<Record<string, number>> {
  const { html, css } = renderL1Document(doc)
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'req88-nowrap-')), 'page.html')
  writeFileSync(file, page)
  const url = pathToFileURL(file).href

  // The number of client rects a Range over the run's text spans IS its rendered
  // line count — measured, not inferred from the box height. Driven through the
  // project's own driver so each engine is launched exactly as capture launches it.
  const probe = `(() => {
    var els = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (n) {
      return !n.children.length && (n.textContent || '').indexOf('Designed for developers') === 0;
    });
    var r = document.createRange();
    r.selectNodeContents(els[0]);
    return { lines: r.getClientRects().length };
  })()`

  const out: Record<string, number> = {}
  for (const engine of available) {
    const driver = await createEngineDriver(engine)()
    try {
      await driver.navigate(url, { width: 1280, height: 900 })
      out[engine] = (await driver.query<{ lines: number }>(probe)).lines
    } finally {
      await driver.close()
    }
  }
  return out
}

describe('REQ-88 — an unbreakable run holds its line count across engines', () => {
  itReal(
    'test_UAT_FC_REQ-88_nowrap_run_stays_on_one_line_in_every_available_engine',
    async () => {
      const counts = await lineCountsPerEngine(tightDoc(true))
      expect(Object.keys(counts).length).toBeGreaterThanOrEqual(2)
      for (const [engine, n] of Object.entries(counts)) {
        expect(n, `${engine} broke a run the reference set on one line`).toBe(1)
      }
    },
    300000,
  )

  itReal(
    'test_UAT_FC_REQ-88_the_same_run_without_the_axis_is_at_the_mercy_of_the_engine',
    async () => {
      // The calibration half: proves the UAT above is measuring something real
      // rather than passing because the fixture is comfortably wide. Without the
      // axis, at least one engine must disagree with Chromium about this box —
      // which is exactly the operator-visible breakage, and exactly what no
      // Chromium-only gate can see.
      const counts = await lineCountsPerEngine(tightDoc(false))
      const distinct = new Set(Object.values(counts))
      expect(
        distinct.size > 1 || [...distinct][0] > 1,
        `every engine agreed (${JSON.stringify(counts)}) — the fixture is no longer tight enough to ` +
          'discriminate; re-tighten the pinned width against current Chromium metrics',
      ).toBe(true)
    },
    300000,
  )
})
