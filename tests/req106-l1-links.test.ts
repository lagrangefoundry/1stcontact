/**
 * REQ-106 — L1's navigation role: the typed link field + DOM id emission.
 *
 * L1 could not express a link at all: no `href` in the schema, no anchor kind, and
 * `<a>` never appeared in the renderer's output. An L1 page therefore had no
 * navigation of any kind — which is a functional floor rather than an aesthetic
 * ceiling, and the only gap on REQ-95's list that no amount of design work could
 * compensate for. On xgd.dev every call-to-action and every nav item was inert.
 *
 * A link is a *role* any subtree can take, not a kind of node, so it lands as a
 * node-level field and the renderer **retags** the element the author already
 * styled. These UATs pin that, plus the two things retagging is there to protect:
 * the focus ring survives (a wrapper would move focus off the styled class), and
 * the URL sink stays as narrow as every other one.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })

const render = (root: L1Node): string => renderL1Document(doc(root)).html

const run = (text: string, link?: unknown): L1Node =>
  ({ kind: 'text', text, ...(link ? { link } : {}) }) as L1Node

describe('REQ-106 — the L1 navigation role', () => {
  it('test_UAT_FC_REQ-106_retags_a_run_as_an_anchor', () => {
    const html = render(run('Join the beta', { href: '/beta' }))
    expect(html).toContain('<a')
    // REQ-109 — an authored root-relative href emerges document-relative.
    expect(html).toContain('href="beta"')
    expect(html).toContain('Join the beta')
    // Retagged, not wrapped: the run is the anchor, so there is no <p> left.
    expect(html).not.toContain('<p ')
  })

  it('test_UAT_FC_REQ-106_retags_a_container_and_keeps_its_class', () => {
    const html = render({
      kind: 'container',
      layout: 'row',
      link: { href: 'https://example.com/paper' },
      children: [run('Read the whitepaper')],
    } as L1Node)
    // The anchor carries the SAME generated class the container would have had,
    // which is what keeps every paint axis (and REQ-99's states) attached to it.
    const anchor = /<a class="([^"]+)"[^>]*href="https:\/\/example\.com\/paper"/.exec(html)
    expect(anchor).not.toBeNull()
    const { css } = renderL1Document(
      doc({
        kind: 'container',
        layout: 'row',
        link: { href: 'https://example.com/paper' },
        axes: { surfaceFill: '#123456' },
        children: [run('Read the whitepaper')],
      } as L1Node),
    )
    expect(css).toContain('#123456')
  })

  it('test_UAT_FC_REQ-106_newTab_always_carries_its_rel', () => {
    const html = render(run('Docs', { href: 'https://example.com', newTab: true }))
    expect(html).toContain('target="_blank"')
    // The opener reference is a security hole, not a preference: there is no way
    // to ask for _blank and not get the rel.
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('test_UAT_FC_REQ-106_unsafe_href_never_renders_a_live_link', () => {
    for (const href of ['javascript:alert(1)', 'vbscript:x', 'data:text/html,<b>']) {
      const html = render(run('Click', { href }))
      expect(html).not.toContain('<a')
      expect(html).not.toContain('href=')
      expect(html.toLowerCase()).not.toContain('javascript:')
      // ...and the author is told, rather than shipping a silently dead button.
      const res = validateL1(doc(run('Click', { href })))
      expect(res.ok).toBe(false)
    }
  })

  it('test_UAT_FC_REQ-106_focus_ring_survives_the_retag', () => {
    // The whole reason the renderer retags instead of wrapping: a wrapper would
    // put focus on an outer element while REQ-99's focus rules target the inner
    // class, silently costing a linked node its focus indicator.
    const { css, html } = renderL1Document(
      doc(
        run('Join the beta', { href: '/beta' }) &&
          ({
            kind: 'text',
            text: 'Join the beta',
            link: { href: '/beta' },
            interaction: { focus: { ring: { widthPx: 2, color: '#2E86A3', offsetPx: 2 } } },
          } as L1Node),
      ),
    )
    const cls = /<a class="([^"\s]+)/.exec(html)?.[1]
    expect(cls).toBeTruthy()
    expect(css).toContain(`.${cls}:focus-visible`)
    expect(css).toContain('outline')
  })

  it('test_UAT_FC_REQ-106_link_paints_from_l1_not_ua_chrome', () => {
    const { css } = renderL1Document(
      doc({
        kind: 'text',
        text: 'Whitepapers',
        link: { href: '/papers' },
        axes: { color: '#1F2937' },
      } as L1Node),
    )
    expect(css).toContain('text-decoration: none')
    // An authored colour still wins over the inherit baseline.
    expect(css).toContain('#1F2937')
  })

  it('test_UAT_FC_REQ-106_ids_are_emitted_so_anchors_have_a_target', () => {
    const html = render({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'container', id: 'how', layout: 'stack', children: [run('How it works')] } as L1Node,
        run('jump', { href: '#how' }),
      ],
    } as L1Node)
    expect(html).toContain('id="how"')
    expect(html).toContain('href="#how"')
  })

  it('test_UAT_FC_REQ-106_duplicate_ids_are_rejected', () => {
    const res = validateL1(
      doc({
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'box', id: 'cta' } as L1Node,
          { kind: 'box', id: 'cta' } as L1Node,
        ],
      } as L1Node),
    )
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => /duplicate node id 'cta'/.test(e.message))).toBe(true)
  })

  it('test_UAT_FC_REQ-106_control_cannot_be_a_link', () => {
    // An anchor around a submit button is a malformed interactive nesting, and the
    // module owns that element's semantics. `.strict()` enforces it by shape.
    const res = validateL1(
      doc({ kind: 'control', control: 'submit', link: { href: '/x' } } as unknown as L1Node),
    )
    expect(res.ok).toBe(false)
  })

  it('test_UAT_FC_REQ-106_pages_without_links_are_unchanged', () => {
    const plain: L1Node = {
      kind: 'container',
      layout: 'stack',
      gapPx: 8,
      axes: { surfaceFill: '#F5F4EC' },
      children: [run('hello'), { kind: 'box' } as L1Node],
    } as L1Node
    const out = renderL1Document(doc(plain))
    expect(out.html).not.toContain('<a')
    expect(out.html).toContain('<p class=')
    expect(out.html).toContain('<div class=')
  })
})
