import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  FONT_BARRIER,
  FONTS_READY,
  IMAGES_DECODED,
  SETTLE_CSS,
  SETTLE_SCROLL,
} from '../tools/generate/src/cli/capture/page-scripts'

/**
 * REQ-154 — the capture preconditions, executed.
 *
 * WHY THIS EXISTS. The settle and font-barrier scripts moved out of the
 * Playwright driver so a second driver could share them rather than grow a
 * second copy, and in moving they changed form: two of them were inline typed
 * arrow functions and are now source strings. The mechanism is not new —
 * `FONT_BARRIER` has always been a string and shipped that way since BUG-16, and
 * Playwright evaluates a string as an expression and awaits a returned promise
 * exactly as it calls a function. But the transliteration is hand-written, and a
 * script with a syntax error would not fail loudly: every call site wraps these
 * in `.catch(() => undefined)`, on purpose, because a page missing an API must
 * not fail a capture. A broken script would therefore be silently skipped and
 * the capture would succeed while measuring an unsettled page.
 *
 * So they are run here, against a real DOM, and their EFFECTS are asserted. This
 * is not a browser and does not pretend to be one — what it proves is that the
 * source parses, evaluates, resolves, and does the thing it claims.
 */

/** Evaluate a page script the way a driver's `evaluate(string)` does. */
async function evaluate(dom: JSDOM, script: string): Promise<unknown> {
  const runner = dom.window.eval(`(async () => (${script}))`) as () => Promise<unknown>
  return runner()
}

function page(body: string): JSDOM {
  const dom = new JSDOM(`<!doctype html><html><body>${body}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  // jsdom has no layout, so scrolling is a no-op it warns about. The scripts
  // only care that it does not throw.
  Object.defineProperty(dom.window, 'scrollTo', { value: () => {}, writable: true })
  Object.defineProperty(dom.window, 'innerHeight', { value: 600, writable: true })
  return dom
}

describe('REQ-154 — the shared page scripts run', () => {
  it('test_UAT_FC_REQ_154_settle_scroll_promotes_lazy_images', async () => {
    const dom = page(
      '<img id="a" data-src="/hero.png"><img id="b" src="/already.png" loading="lazy">',
    )
    expect(await evaluate(dom, SETTLE_SCROLL)).toBe(true)

    const a = dom.window.document.getElementById('a') as HTMLImageElement
    const b = dom.window.document.getElementById('b') as HTMLImageElement
    // REQ-36's whole point: an image the page deferred is requested before the
    // screenshot, or it is captured blank and nothing flags the gap.
    expect(a.getAttribute('src')).toBe('/hero.png')
    // The IDL property, not the attribute: a browser reflects one to the other
    // and jsdom does not implement `loading` at all, so reading the attribute
    // here would assert jsdom's gap rather than the script's behaviour.
    expect(a.loading).toBe('eager')
    expect(b.loading).toBe('eager')
  })

  it('test_UAT_FC_REQ_154_settle_scroll_survives_a_page_with_no_images', async () => {
    const dom = page('<h1>Nothing deferred here</h1>')
    expect(await evaluate(dom, SETTLE_SCROLL)).toBe(true)
  })

  it('test_UAT_FC_REQ_154_image_decode_waits_and_then_resolves', async () => {
    const dom = page('<img id="a" src="/hero.png">')
    const img = dom.window.document.getElementById('a') as HTMLImageElement
    Object.defineProperty(img, 'complete', { value: false, configurable: true })

    let settled = false
    const wait = evaluate(dom, IMAGES_DECODED).then((v) => {
      settled = true
      return v
    })
    await Promise.resolve()
    // An incomplete image holds the barrier — that is the barrier's job.
    expect(settled).toBe(false)

    img.dispatchEvent(new dom.window.Event('load'))
    expect(await wait).toBe(true)
  })

  it('test_UAT_FC_REQ_154_image_decode_does_not_hang_on_a_broken_image', async () => {
    const dom = page('<img id="a" src="/gone.png">')
    const img = dom.window.document.getElementById('a') as HTMLImageElement
    Object.defineProperty(img, 'complete', { value: false, configurable: true })
    const wait = evaluate(dom, IMAGES_DECODED)
    img.dispatchEvent(new dom.window.Event('error'))
    // A 404 must not hang the capture — the screenshot is still worth taking.
    expect(await wait).toBe(true)
  })

  it('test_UAT_FC_REQ_154_font_scripts_degrade_where_there_is_no_font_api', async () => {
    // jsdom has no FontFaceSet, which is exactly the "engine without the API"
    // case both scripts are written to tolerate rather than throw on.
    const dom = page('<h1 style="font-family: Inter">Hello</h1>')
    expect(await evaluate(dom, FONTS_READY)).toBe(true)
    expect(await evaluate(dom, FONT_BARRIER)).toBe(true)
  })

  it('test_UAT_FC_REQ_154_font_barrier_loads_each_visible_run_exact_face', async () => {
    const dom = page(
      '<h1 style="font-family: Inter; font-weight: 700">Visible</h1>' +
        '<p style="display:none; font-family: Inter">Hidden</p>',
    )
    const asked: Array<[string, string]> = []
    Object.defineProperty(dom.window.document, 'fonts', {
      value: {
        ready: Promise.resolve(),
        load: (shorthand: string, text: string) => {
          asked.push([shorthand, text])
          return Promise.resolve([])
        },
      },
      configurable: true,
    })

    expect(await evaluate(dom, FONT_BARRIER)).toBe(true)
    // BUG-16: the face is requested with the run's OWN text, so a subsetted
    // webfont fetches the subset it actually paints.
    expect(asked.map(([, text]) => text)).toEqual(['Visible'])
    expect(asked[0][0]).toContain('Inter')
    // A hidden run is not painted, so loading its face would be work that
    // measures nothing.
    expect(asked.map(([, text]) => text)).not.toContain('Hidden')
  })

  it('test_UAT_FC_REQ_154_settle_css_lands_animations_and_reveals_hidden_blocks', () => {
    // Not executable — it is a stylesheet — so its two obligations are read off
    // it directly: collapse motion to its end state, and reveal the
    // pre-animation hidden state a scroll-triggered block starts in.
    expect(SETTLE_CSS).toContain('animation-duration:0s!important')
    expect(SETTLE_CSS).toContain('transition-duration:0s!important')
    expect(SETTLE_CSS).toContain('.elementor-invisible')
    expect(SETTLE_CSS).toContain('opacity:1!important')
  })
})
