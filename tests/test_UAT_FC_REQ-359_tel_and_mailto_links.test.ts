/**
 * REQ-359 — a link may be `tel:` or `mailto:`.
 *
 * L1's link allowlist was the image allowlist: http(s), relative and `#anchor`
 * only. So a trades site's phone number — its one real conversion action — could
 * only ever render as inert text, and a box styled as a "Call now" button did
 * nothing when tapped. A link now clears `isSafeHref`, which is `isSafeUrl` plus
 * exactly those two non-executing schemes. Image and other resource sinks keep
 * the narrow allowlist: a phone number is not an image.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Email } from '../packages/framework/src/index'

const TEL = 'tel:+15555550123'
const MAIL = 'mailto:hello@example.com'

const doc = (root: L1Node, widths = [320, 768, 1440]): L1Document => ({ widths, root })
const run = (text: string, link?: unknown): L1Node =>
  ({ kind: 'text', text, ...(link ? { link } : {}) }) as L1Node
/** A hero call-to-action: a styled container that IS the link. */
const button = (href: string): L1Node =>
  ({ kind: 'container', layout: 'row', link: { href }, children: [run('Call now')] }) as L1Node
/** Body copy with the number as a linked run mid-sentence. */
const sentence = (href: string): L1Node =>
  ({
    kind: 'text',
    text: [{ text: 'Burst pipe? Call ' }, { text: '555-555-0123', link: { href } }, { text: ' any time.' }],
  }) as L1Node
const page = (href: string): L1Node =>
  ({ kind: 'container', layout: 'stack', children: [button(href), sentence(href)] }) as L1Node

const errorsOf = (root: L1Node, widths?: number[]) => {
  const result = validateL1(doc(root, widths))
  return result.ok ? [] : result.errors
}
const hrefErrors = (root: L1Node) => errorsOf(root).filter((e) => e.path.endsWith('/link/href'))

describe('REQ-359 — tel: and mailto: links', () => {
  it('test_UAT_FC_REQ-359_tel_and_mailto_links_validate_and_render_live', () => {
    for (const href of [TEL, MAIL, 'TEL:+15555550123', 'tel:+1-(555)-555-0123', 'mailto:a@b.co?subject=Quote%20request']) {
      const result = validateL1(doc(page(href)))
      expect(result.ok ? [] : result.errors, href).toEqual([])

      const { html } = renderL1Document(doc(page(href)))
      const live = html.match(/<a [^>]*href="([^"]*)"/g) ?? []
      // Both the node-level CTA and the run-level number are live anchors, and
      // the href passes through unrewritten (it is not root-relative).
      expect(live, href).toHaveLength(2)
      for (const a of live) expect(a, href).toContain(`href="${href}"`)
    }
  })

  it('test_UAT_FC_REQ-359_an_email_body_carries_a_live_tel_link', () => {
    const html = renderL1Email(doc(page(TEL), [600]))
    expect(html).toContain(`href="${TEL}"`)
    expect(renderL1Email(doc(page(MAIL), [600]))).toContain(`href="${MAIL}"`)
  })

  it('test_UAT_FC_REQ-359_executing_and_malformed_hrefs_are_still_refused', () => {
    const refused = [
      'javascript:alert(1)',
      'data:text/html,<b>x</b>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'tel:', // a scheme with nothing to dial
      'tel:+1555"onmouseover=alert(1)', // attribute break-out
      'mailto:a@b.co<script>',
      'tel:+1 555 555 0123', // raw whitespace
    ]
    for (const href of refused) {
      const errors = hrefErrors(page(href))
      // One for the CTA, one for the run — each named at its own path.
      expect(errors.map((e) => e.path).sort(), href).toEqual(['/root/children/0/link/href', '/root/children/1/text/1/link/href'])
      expect(errors[0].message).toContain('http/https, mailto, tel, relative, or #anchor only')

      // Layer 2: the renderer degrades without trusting the validator.
      const { html } = renderL1Document(doc(page(href)))
      expect(html, href).not.toMatch(/<a [^>]*href=/)
      expect(renderL1Email(doc(page(href), [600])), href).not.toMatch(/<a [^>]*href=/)
    }
  })

  it('test_UAT_FC_REQ-359_the_widening_is_link_only', () => {
    // A phone number or address is not an image: resource sinks keep the
    // narrow allowlist.
    for (const src of [TEL, MAIL]) {
      const errors = errorsOf({ kind: 'image', src, alt: 'x' } as L1Node)
      expect(errors.some((e) => e.path === '/root/src' && /not an allowed URL/.test(e.message)), src).toBe(true)
    }
  })
})
