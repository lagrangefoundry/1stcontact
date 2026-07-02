// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MOTION_CSS, MOTION_SCRIPT, wrapWithMotion } from '../packages/framework/src/modules/motion'

/**
 * UAT for REQ-16 — the scroll-reveal island (`MOTION_SCRIPT`).
 *
 * The island logic is exercised against a real DOM (JSDOM) by executing the
 * *actual shipped* script string, independent of the Astro build — mirroring
 * the contact-form client UAT. Imported from the leaf `motion` module (not the
 * framework index barrel) so no Astro/esbuild is pulled into the jsdom
 * environment, which esbuild cannot run in.
 */

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('REQ-16 — scroll-reveal island', () => {
  it('test_UAT_FC_REQ-16_scroll_reveal_hydrates', () => {
    // The framework marks a scroll motion with the island hook and starts it
    // hidden (opacity:0) until revealed.
    const html = wrapWithMotion('<section>host</section>', { type: 'slide', trigger: 'scroll' })
    expect(html).toContain('fc-motion--scroll fc-motion--slide')
    expect(html).toContain('data-fc-motion-scroll')
    expect(MOTION_CSS).toContain('.fc-motion--scroll { opacity: 0; }')
    expect(MOTION_CSS).toContain(
      '.fc-motion--scroll.fc-motion--visible.fc-motion--slide { animation-name: fc-motion-slide; }',
    )

    // Mount the rendered element and run the actual island script against a
    // stubbed IntersectionObserver that reports the element visible.
    document.body.innerHTML = html
    const el = document.querySelector<HTMLElement>('[data-fc-motion-scroll]')!
    expect(el.classList.contains('fc-motion--visible')).toBe(false)

    let observed: Element | undefined
    const unobserve = vi.fn()
    class FakeIO {
      constructor(private cb: (entries: { isIntersecting: boolean; target: Element }[]) => void) {}
      observe(target: Element) {
        observed = target
        // Simulate the element scrolling into view.
        this.cb([{ isIntersecting: true, target }])
      }
      unobserve = unobserve
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', FakeIO)

    // eslint-disable-next-line no-new-func
    new Function(MOTION_SCRIPT)()

    // The island observed the element, revealed it, and stopped observing it.
    expect(observed).toBe(el)
    expect(el.classList.contains('fc-motion--visible')).toBe(true)
    expect(unobserve).toHaveBeenCalledWith(el)
  })

  it('test_UAT_FC_REQ-16_scroll_reveal_degrades_without_observer', () => {
    // Where IntersectionObserver is unavailable, content is revealed
    // immediately rather than trapped behind the missing API.
    document.body.innerHTML = wrapWithMotion('<section>host</section>', {
      type: 'fade',
      trigger: 'scroll',
    })
    const el = document.querySelector<HTMLElement>('[data-fc-motion-scroll]')!
    vi.stubGlobal('IntersectionObserver', undefined)

    // eslint-disable-next-line no-new-func
    new Function(MOTION_SCRIPT)()

    expect(el.classList.contains('fc-motion--visible')).toBe(true)
  })
})
