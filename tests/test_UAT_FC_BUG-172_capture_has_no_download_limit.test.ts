import { describe, expect, it } from 'vitest'
import { leasedDriverFactory } from '../tools/generate/src/cli/capture/cf-driver'
import { egressGuard } from '../tools/generate/src/cli/capture/egress-guard'
import { RESPONSIVE_VIEWPORTS } from '../tools/generate/src/cli/capture/values-diff'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * BUG-172 — **a capture has no download limit.**
 *
 * WHAT WENT WRONG. The egress guard carried a 32 MiB allowance for a whole
 * capture, counted by the driver off every response body and latched once
 * spent. One `capture_site` loads the page once per width on the ladder over
 * one guard, so a page with a few large photographs crossed it a few widths in;
 * from then on every pass had its page answered `403 refused by egress policy`,
 * and the capture was refused outright — reported as "the capture had already
 * delivered more than 33554432 bytes when this page was requested" on the first
 * capture of a fresh session.
 *
 * WHY THERE IS NO LIMIT NOW, rather than a bigger one. Capture is mechanical and
 * cheap; bytes pulled by a browser are not what this product pays for. The
 * guard's remaining job is the address rules and the redirect-loop stop.
 *
 * WHAT IS REAL HERE. The production Browser Rendering driver and the production
 * guard, one guard shared by every pass exactly as `capture_site` shares it. The
 * browser is the boundary double from REQ-154, serving the page and its
 * pictures from "the network" and reporting each response the way puppeteer
 * does — which is the seam the old cap counted at.
 */

const PAGE = 'https://heavy.example.test/'
/** Three photographs, each 12 MiB: one pass alone is over the old 32 MiB cap. */
const PHOTO_BYTES = 12 * 1024 * 1024
const PHOTOS = [1, 2, 3].map((n) => `https://images.example.test/photo-${n}.jpg`)

function heavySite() {
  const photo = new Uint8Array(PHOTO_BYTES)
  const html = `<html><body>${PHOTOS.map((src) => `<img src="${src}">`).join('')}</body></html>`
  return fakeBrowser({
    network: {
      [PAGE]: { body: html, contentType: 'text/html' },
      ...Object.fromEntries(PHOTOS.map((url) => [url, { body: photo, contentType: 'image/jpeg' }])),
    },
  })
}

describe('BUG-172 — a capture is never refused for how much it downloaded', () => {
  it('test_UAT_FC_BUG_172_every_pass_of_a_heavy_page_is_allowed_and_mirrored', async () => {
    const browser = heavySite()
    const guard = egressGuard()
    const factory = leasedDriverFactory(browser.launch, { guard })

    // Every width on the ladder, over the one guard — 36 MiB a pass, well past
    // the old allowance on the first pass and many times it by the last.
    for (const viewport of RESPONSIVE_VIEWPORTS) {
      const driver = await factory()
      try {
        await driver.navigate(PAGE, viewport)
        // The page and every photograph came back whole, on this pass too.
        const mirrored = new Map(driver.responses().map((r) => [r.url, r.body.byteLength]))
        expect(mirrored.get(PAGE), `page at ${viewport.width}px`).toBeGreaterThan(0)
        for (const url of PHOTOS) {
          expect(mirrored.get(url), `${url} at ${viewport.width}px`).toBe(PHOTO_BYTES)
        }
      } finally {
        await driver.close()
      }
    }

    // Nothing was refused: no page, no picture, no "(total)" record.
    expect(guard.refusals).toEqual([])
    expect(guard.documentRefused).toBe(false)
    expect(browser.log.fulfilled.filter((f) => f.status === 403)).toEqual([])
    // And every one of those requests went to the network rather than being
    // answered in-process with the refusal text.
    expect(browser.log.continued.filter((u) => u === PAGE)).toHaveLength(RESPONSIVE_VIEWPORTS.length)
  })
})
