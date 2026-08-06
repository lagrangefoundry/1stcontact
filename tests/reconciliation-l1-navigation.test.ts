/**
 * Reconciliation UATs — story-2e4e2c45 "L1 navigation: a typed link role any
 * subtree can take, with real DOM ids for in-page anchors".
 *
 *   AC-839  a run / box / container declaring a link BECOMES the link (retag)
 *   AC-840  an image is enclosed by a link that occupies no layout box
 *   AC-841  a new browsing context always carries opener + referrer isolation
 *   AC-842  a target outside the URL allowlist never becomes a live link
 *   AC-843  a linked node keeps its keyboard focus indicator
 *   AC-844  a link paints from L1, not from user-agent link chrome
 *   AC-845  a declared identifier is a real in-page navigation target
 *   AC-846  two nodes sharing an identifier are rejected
 *   AC-847  a behavior-bound control / a module mount seam cannot be a link
 *   AC-848  a definition declaring no links publishes exactly as it did before
 *
 * The two boundaries are the envelope validator (`validateL1`) and the sole
 * markup/CSS emitter (`renderL1Document`) — the same pair every other L1
 * reconciliation file probes. Where an AC calls for driving the published page,
 * the page is parsed and driven in jsdom, which implements same-document
 * fragment navigation and focus; it has no layout engine, so "scrolled into
 * view" is observed as the browser resolving the fragment to the identified
 * element — the element a user agent then scrolls to.
 */
import { describe, expect, it } from 'vitest'
import {
  l1BoxSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1ImageSchema,
  l1SlotSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

/** A document whose root is the subject under test. */
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })

const render = (root: L1Node): { html: string; css: string } => renderL1Document(doc(root))

/**
 * The declarations of one class's **axis** rule — the last un-media-queried rule
 * for that selector (a node with geometry emits its position rule first).
 */
function baseDecls(css: string, cls: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))]
  const last = rules[rules.length - 1]
  return last ? last[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** The declarations of one class's `:focus-visible` rule. */
function focusDecls(css: string, cls: string): string[] {
  const m = new RegExp(`\\.${cls}:focus-visible\\s*\\{([^}]*)\\}`).exec(css)
  return m ? m[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** The whole opening tag of the element carrying `cls` — tag name and attributes. */
function openingTag(html: string, cls: string): string {
  const m = new RegExp(`<[a-z]+[^>]*class="${cls}"[^>]*>`).exec(html)
  expect(m, `an element carrying class ${cls} was published`).toBeTruthy()
  return m![0]
}

/** The class the published `<a>` carries (the retagged node's own identity). */
function anchorClass(html: string): string {
  const m = /<a class="([^"]+)"/.exec(html)
  expect(m, 'the linked node published as an <a> carrying its own class').toBeTruthy()
  return m![1]
}

/** Let jsdom's queued navigation task run — a fragment navigation is not synchronous. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20))

/** The slice of a published element these probes drive (the repo builds without `lib.dom`). */
interface DrivenElement {
  click(): void
  focus(): void
  className: string
  textContent: string | null
}

/** The slice of a browsing context these probes drive. */
interface DrivenWindow {
  location: { href: string; hash: string }
  document: {
    querySelector(selector: string): DrivenElement | null
    getElementById(id: string): DrivenElement | null
    activeElement: DrivenElement | null
  }
  addEventListener(type: string, listener: () => void): void
}

/** Parse a published page into a jsdom browsing context, styles included. */
async function open(
  page: { html: string; css: string },
  url = 'https://site.test/index.html',
): Promise<DrivenWindow> {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${page.css}</style></head><body>${page.html}</body></html>`,
    { url },
  )
  return dom.window as unknown as DrivenWindow
}

describe('story-2e4e2c45 — the L1 navigation role', () => {
  /**
   * AC-839 — the retag. The element the author styled *is* the link, so every
   * paint axis, measure and interaction state still resolves against the thing
   * the reader clicks. Asserted for each of the three subtree kinds, then driven
   * for real: activating the link navigates the browser to the declared target.
   */
  it('test_UAT_AC839_run_box_and_container_become_the_navigable_element', async () => {
    /**
     * `emitted` is the href the renderer publishes for this case's authored
     * target. It is stated as a literal per case rather than derived, so the
     * assertion still pins an exact byte sequence: an absolute target survives
     * untouched, while a root-relative one is published document-relative so the
     * snapshot resolves under a path prefix (REQ-109).
     */
    const cases: Array<{ label: string; own: string; node: L1Node; paint: string; emitted: string }> = [
      {
        label: 'text run',
        own: 'p',
        paint: '#0A7D3B',
        emitted: 'https://example.com/beta',
        node: {
          kind: 'text',
          text: 'Join the beta',
          link: { href: 'https://example.com/beta', ariaLabel: 'Join the private beta' },
          axes: { color: '#0A7D3B' },
        } as L1Node,
      },
      {
        label: 'painted box',
        own: 'div',
        paint: '#123456',
        emitted: 'pricing',
        node: {
          kind: 'box',
          link: { href: '/pricing', ariaLabel: 'See pricing' },
          axes: { surfaceFill: '#123456', borderRadiusPx: 12 },
        } as unknown as L1Node,
      },
      {
        label: 'laid-out container',
        own: 'div',
        paint: '#654321',
        emitted: 'https://example.com/paper',
        node: {
          kind: 'container',
          layout: 'row',
          link: { href: 'https://example.com/paper', ariaLabel: 'Read the whitepaper' },
          axes: { surfaceFill: '#654321' },
          children: [{ kind: 'text', text: 'Read the whitepaper' } as L1Node],
        } as unknown as L1Node,
      },
    ]

    for (const { label, own, node, paint, emitted } of cases) {
      const link = (node as { link: { href: string; ariaLabel?: string } }).link
      expect(validateL1(doc(node)).ok, `${label} declaring a link validates`).toBe(true)
      const { html, css } = render(node)

      // It is a link to the declared target, carrying the authored accessible name.
      expect(html, label).toContain(`<a class=`)
      expect(html, label).toContain(`href="${emitted}"`)
      expect(html, label).toContain(`aria-label="${link.ariaLabel}"`)

      // Retagged, not wrapped: the node's own element type is gone for this node,
      // and the anchor carries the identity the paint is bound to.
      const cls = anchorClass(html)
      expect(html, `${label} is not additionally wrapped`).not.toMatch(
        new RegExp(`<${own}[^>]*class="${cls}"`),
      )
      expect(baseDecls(css, cls).join('; '), `${label} keeps its paint`).toContain(paint)
    }

    // Its content is unchanged and still escaped.
    const escaped = render({
      kind: 'text',
      text: 'Fish & <chips>',
      link: { href: '/menu' },
    } as L1Node).html
    expect(escaped).toContain('Fish &amp; &lt;chips&gt;')

    // Drive it: activating the link navigates the browser to the declared target.
    const page = render({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'See pricing', link: { href: '#pricing' } } as L1Node,
        { kind: 'box', id: 'pricing' } as unknown as L1Node,
      ],
    } as unknown as L1Node)
    const win = await open(page)
    win.document.querySelector('a')!.click()
    await settle()
    expect(win.location.href).toBe('https://site.test/index.html#pricing')
  })

  /**
   * AC-840 — the one exception. A void element cannot be an anchor, so an image
   * is *enclosed*; the enclosure is `display: contents`, so it contributes no
   * layout box and the image keeps its own identity, attributes and every
   * published declaration it would have had un-linked.
   */
  it('test_UAT_AC840_linked_image_keeps_its_paint_inside_a_layout_free_enclosure', () => {
    const image = (linked: boolean): L1Node =>
      ({
        kind: 'image',
        id: 'hero-shot',
        src: '/assets/hero.png',
        alt: 'The product in use',
        axes: { objectFit: 'cover', borderRadiusPx: 8 },
        sizing: { width: { mode: 'fixed', px: 480 } },
        ...(linked ? { link: { href: '/gallery' } } : {}),
      }) as unknown as L1Node

    const linked = render(image(true))
    const plain = render(image(false))

    // The image sits inside a link carrying the target…
    expect(linked.html).toMatch(/<a href="gallery" style="display:contents"><img /)
    // …and the enclosure carries no styling identity of its own, so nothing about
    // the image's own box moved into it.
    expect(/<a[^>]*class=/.test(linked.html)).toBe(false)

    // The image itself is untouched: same identity, same attributes.
    const cls = /<img class="([^"]+)"/.exec(linked.html)![1]
    expect(cls).toBe(/<img class="([^"]+)"/.exec(plain.html)![1])
    expect(openingTag(linked.html, cls)).toBe(openingTag(plain.html, cls))
    expect(linked.html).toContain('id="hero-shot"')
    expect(linked.html).toContain('src="assets/hero.png"')
    expect(linked.html).toContain('alt="The product in use"')

    // …and so are its published style declarations — object-fit, measure, paint.
    expect(baseDecls(linked.css, cls)).toEqual(baseDecls(plain.css, cls))
    expect(baseDecls(linked.css, cls).join('; ')).toContain('object-fit: cover')
    expect(baseDecls(linked.css, cls).join('; ')).toContain('width: 480px')
  })

  /**
   * AC-841 — the new browsing context and its isolation are one indivisible
   * thing. The vocabulary is `.strict()`, so there is no field, value or
   * combination that yields `_blank` with a weakened or absent `rel`.
   */
  it('test_UAT_AC841_new_browsing_context_always_carries_opener_and_referrer_isolation', () => {
    const newTab = render({
      kind: 'text',
      text: 'Docs',
      link: { href: 'https://example.com/docs', newTab: true },
    } as L1Node).html
    expect(newTab).toContain('target="_blank"')
    expect(newTab).toContain('rel="noopener noreferrer"')

    // A link that does not ask for it requests no new context at all.
    const sameTab = render({
      kind: 'text',
      text: 'Docs',
      link: { href: 'https://example.com/docs' },
    } as L1Node).html
    expect(sameTab).toContain('href="https://example.com/docs"')
    expect(sameTab).not.toContain('target=')
    expect(sameTab).not.toContain('rel=')

    // Every attempt to ask for the new context without the isolation is refused
    // by the shape: there is no such field to accept.
    const weakened = [
      { href: 'https://example.com', newTab: true, rel: '' },
      { href: 'https://example.com', newTab: true, rel: 'opener' },
      { href: 'https://example.com', newTab: true, noopener: false },
      { href: 'https://example.com', target: '_blank' },
      { href: 'https://example.com', newTab: true, referrerPolicy: 'unsafe-url' },
    ]
    for (const link of weakened) {
      const res = validateL1(doc({ kind: 'text', text: 'Docs', link } as unknown as L1Node))
      expect(res.ok, `link ${JSON.stringify(link)} is refused`).toBe(false)
    }
    // The one accepted form is the isolated one.
    expect(
      validateL1(doc({ kind: 'text', text: 'Docs', link: { href: 'https://example.com', newTab: true } } as L1Node)).ok,
    ).toBe(true)
  })

  /**
   * AC-842 — the link target is the same URL sink as an image src or a
   * background image. Enforcement is doubled on purpose: the envelope rejects
   * the document *and* the renderer independently degrades to the plain element,
   * so neither layer is load-bearing alone.
   */
  it('test_UAT_AC842_target_outside_the_allowlist_never_becomes_a_live_link', () => {
    const disallowed = [
      'javascript:alert(1)',
      'data:text/html,<b>pwned</b>',
      '/beta"><script>alert(1)</script>',
    ]
    for (const href of disallowed) {
      const res = validateL1(doc({ kind: 'text', text: 'Click', link: { href } } as L1Node))
      expect(res.ok, `${href} is rejected`).toBe(false)
      if (!res.ok) {
        expect(res.errors.some((e) => e.path === '/root/link/href')).toBe(true)
      }

      // Independently of validation: rendering it publishes the plain element.
      const { html } = render({ kind: 'text', text: 'Click', link: { href } } as L1Node)
      expect(html, href).not.toContain('<a')
      expect(html, href).not.toContain('href=')
      expect(html, href).not.toContain('target=')
      expect(html.toLowerCase(), href).not.toContain('javascript:')
      expect(html.toLowerCase(), href).not.toContain('data:text/html')
      expect(html.toLowerCase(), href).not.toContain('<script')
      expect(html).toContain('<p class=')
    }

    // The permitted forms all validate and publish as live links. Each authored
    // target is paired with the exact href published for it: the two absolute
    // forms and the fragment survive byte-identical, while the root-relative one
    // is published document-relative (REQ-109). Stated as literals so widening
    // the emitted shape cannot pass unnoticed.
    const permitted: Array<[authored: string, emitted: string]> = [
      ['https://example.com/docs', 'https://example.com/docs'],
      ['http://example.com/docs', 'http://example.com/docs'],
      ['/pricing', 'pricing'],
      ['#how', '#how'],
    ]
    for (const [href, emitted] of permitted) {
      const node = { kind: 'text', text: 'Go', link: { href } } as L1Node
      expect(validateL1(doc(node)).ok, `${href} is permitted`).toBe(true)
      expect(render(node).html).toContain(`<a class=`)
      expect(render(node).html, href).toContain(`href="${emitted}"`)
    }
  })

  /**
   * AC-843 — the reason the renderer retags rather than wraps. A wrapper would
   * move keyboard focus onto an outer element while the authored focus treatment
   * targets the styled one, silently costing a linked node its focus indicator.
   *
   * The image is the story's declared enclosure exception and is covered by
   * AC-840; the criterion's probe is stated against a linked node's focus rule
   * binding to the identity the published link itself carries.
   */
  it('test_UAT_AC843_linked_node_keeps_its_keyboard_focus_indicator', async () => {
    const ring = { widthPx: 2, color: '#2E86A3', offsetPx: 3 }
    const kinds: Array<[string, L1Node]> = [
      [
        'text run',
        { kind: 'text', text: 'Join the beta', link: { href: '/beta' }, interaction: { focus: { ring } } } as L1Node,
      ],
      [
        'painted box',
        { kind: 'box', link: { href: '/beta' }, interaction: { focus: { ring } } } as unknown as L1Node,
      ],
      [
        'laid-out container',
        {
          kind: 'container',
          layout: 'row',
          link: { href: '/beta' },
          interaction: { focus: { ring } },
          children: [{ kind: 'text', text: 'Join the beta' } as L1Node],
        } as unknown as L1Node,
      ],
    ]

    for (const [label, node] of kinds) {
      const { html, css } = render(node)
      const cls = anchorClass(html)
      // The keyboard-focus rule binds to the identity the LINK carries, not to a
      // surrounding element, and it paints a visible outline.
      expect(focusDecls(css, cls), label).toEqual(['outline: 2px solid #2E86A3', 'outline-offset: 3px'])
    }

    // The parts of the treatment the author leaves unstated come from the
    // substrate's own default (solid, 2px offset) — still on the link's identity.
    const defaulted = render({
      kind: 'text',
      text: 'Join the beta',
      link: { href: '/beta' },
      interaction: { focus: { ring: { widthPx: 2, color: '#2E86A3' } } },
    } as L1Node)
    expect(focusDecls(defaulted.css, anchorClass(defaulted.html))).toEqual([
      'outline: 2px solid #2E86A3',
      'outline-offset: 2px',
    ])

    // Drive it: the element the reader focuses is the link itself, so it is the
    // element the focus rule matches.
    const page = render(kinds[0][1])
    const win = await open(page)
    const anchor = win.document.querySelector('a')!
    anchor.focus()
    expect(win.document.activeElement).toBe(anchor)
    expect(win.document.activeElement!.className).toBe(anchorClass(page.html))
  })

  /**
   * AC-844 — a designed call to action must not acquire browser chrome by
   * becoming navigable. The neutralising declarations are a baseline (unshifted
   * ahead of the node's own axes), so an authored colour or underline wins.
   */
  it('test_UAT_AC844_link_paints_from_the_substrate_not_user_agent_chrome', () => {
    const bare = render({ kind: 'text', text: 'Whitepapers', link: { href: '/papers' } } as L1Node)
    const bareDecls = baseDecls(bare.css, anchorClass(bare.html))
    expect(bareDecls).toContain('text-decoration: none')
    expect(bareDecls).toContain('color: inherit')

    const authored = render({
      kind: 'text',
      text: 'Whitepapers',
      link: { href: '/papers' },
      axes: { color: '#1F2937', textDecoration: 'underline' },
    } as L1Node)
    const decls = baseDecls(authored.css, anchorClass(authored.html))
    // Both present, and the authored value is declared last — so it resolves.
    expect(decls).toContain('color: #1F2937')
    expect(decls).toContain('text-decoration-line: underline')
    expect(decls.indexOf('color: #1F2937')).toBeGreaterThan(decls.indexOf('color: inherit'))
    expect(decls.indexOf('text-decoration-line: underline')).toBeGreaterThan(
      decls.indexOf('text-decoration: none'),
    )
  })

  /**
   * AC-845 — a declared identifier becomes a real in-page navigation target, so
   * a same-page link has something to land on. jsdom implements same-document
   * fragment navigation, so the click is a real one; it has no layout, so being
   * "scrolled into view" is observed as the browser resolving the fragment to
   * the identified element.
   */
  it('test_UAT_AC845_declared_identifier_is_an_in_page_navigation_target', async () => {
    const page = render({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'How it works', link: { href: '#how' } } as L1Node,
        { kind: 'text', text: 'no identifier here' } as L1Node,
        {
          kind: 'container',
          id: 'how',
          layout: 'stack',
          children: [
            { kind: 'text', id: 'how-lede', text: 'It works like this' } as L1Node,
            { kind: 'box', id: 'how-panel' } as unknown as L1Node,
            { kind: 'image', id: 'how-shot', src: '/assets/how.png', alt: 'How' } as unknown as L1Node,
          ],
        } as unknown as L1Node,
      ],
    } as unknown as L1Node)

    // Every kind that can declare one publishes it as a real DOM id.
    for (const id of ['how', 'how-lede', 'how-panel', 'how-shot']) {
      expect(page.html).toContain(`id="${id}"`)
    }
    expect(page.html).toContain('href="#how"')
    // A node that declares none publishes none: 4 ids for 4 identified nodes.
    expect(page.html.match(/ id="/g)).toHaveLength(4)

    const win = await open(page)
    let hashchanged = ''
    win.addEventListener('hashchange', () => {
      hashchanged = win.location.hash
    })
    win.document.querySelector('a')!.click()
    await settle()

    // The browser's location carries the same-page reference…
    expect(win.location.hash).toBe('#how')
    expect(hashchanged).toBe('#how')
    // …and it resolves to the identified node — the element the reader is taken to.
    const landed = win.document.querySelector(win.location.hash)
    expect(landed).toBe(win.document.getElementById('how'))
    expect(landed?.textContent).toContain('It works like this')
  })

  /**
   * AC-846 — an identifier that becomes a real DOM id must be unique within the
   * page: a browser resolves only the first match, and the same rule protects
   * the label↔control association the behavior-module control contract needs.
   */
  it('test_UAT_AC846_two_nodes_sharing_an_identifier_are_rejected', () => {
    const duplicated = validateL1(
      doc({
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'box', id: 'cta' } as unknown as L1Node,
          {
            kind: 'container',
            layout: 'stack',
            children: [{ kind: 'text', id: 'cta', text: 'Join the beta' } as L1Node],
          } as unknown as L1Node,
        ],
      } as unknown as L1Node),
    )
    expect(duplicated.ok).toBe(false)
    if (!duplicated.ok) {
      const err = duplicated.errors.find((e) => /duplicate node id/.test(e.message))
      expect(err, 'the duplicate is reported').toBeTruthy()
      // The duplicated value, the offending node, and where it was first declared.
      expect(err!.message).toContain("duplicate node id 'cta'")
      expect(err!.message).toContain('first declared at /root/children/0')
      expect(err!.path).toBe('/root/children/1/children/0/id')
    }

    // Distinct identifiers, and no identifiers at all, both validate.
    const distinct = validateL1(
      doc({
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'box', id: 'cta' } as unknown as L1Node,
          { kind: 'box', id: 'cta-secondary' } as unknown as L1Node,
        ],
      } as unknown as L1Node),
    )
    expect(distinct.ok).toBe(true)
    expect(
      validateL1(
        doc({
          kind: 'container',
          layout: 'stack',
          children: [{ kind: 'box' } as unknown as L1Node, { kind: 'box' } as unknown as L1Node],
        } as unknown as L1Node),
      ).ok,
    ).toBe(true)

    // The same rule guards the control contract's `for`↔`id` association.
    const controls = validateL1(
      doc({
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'control', control: 'email', id: 'field' } as unknown as L1Node,
          { kind: 'control', control: 'submit', id: 'field' } as unknown as L1Node,
        ],
      } as unknown as L1Node),
    )
    expect(controls.ok).toBe(false)
    if (!controls.ok) {
      expect(controls.errors.some((e) => /duplicate node id 'field'/.test(e.message))).toBe(true)
    }
  })

  /**
   * AC-847 — the two kinds that cannot take the role. A link around an
   * interactive control is malformed interactive nesting and the module owns
   * that element's semantics; a mount seam is a module's own markup, not an
   * authored navigable subtree. Both are refused by the *shape* — every node
   * object is `.strict()`, so `link` is an unrecognised key there.
   */
  it('test_UAT_AC847_control_and_mount_seam_cannot_take_the_link_role', () => {
    const link = { href: '/beta' }

    const refused: Array<[string, L1Node]> = [
      ['behavior-bound control', { kind: 'control', control: 'submit', link } as unknown as L1Node],
      ['module mount seam', { kind: 'slot', name: 'signup-form', link } as unknown as L1Node],
    ]
    for (const [label, node] of refused) {
      const res = validateL1(doc(node))
      expect(res.ok, `${label} declaring a link is rejected`).toBe(false)
      // The error locates the offending node — here, the document root.
      if (!res.ok) expect(res.errors.some((e) => e.path === '/root')).toBe(true)
    }

    // It is a property of the vocabulary, not a rule applied after the fact:
    // the definition shape for these kinds admits no `link` key at all.
    for (const [label, schema] of [
      ['control', l1ControlSchema],
      ['slot', l1SlotSchema],
    ] as const) {
      const parsed = schema.safeParse(
        label === 'control'
          ? { kind: 'control', control: 'submit', link }
          : { kind: 'slot', name: 'signup-form', link },
      )
      expect(parsed.success, label).toBe(false)
      expect(JSON.stringify(parsed.error!.issues), label).toContain('link')
    }
    // …and the same kinds are perfectly valid without it.
    expect(l1ControlSchema.safeParse({ kind: 'control', control: 'submit' }).success).toBe(true)
    expect(l1SlotSchema.safeParse({ kind: 'slot', name: 'signup-form' }).success).toBe(true)

    // The identical link declaration validates on every kind that can navigate,
    // so the refusal above is the kind restriction and not the link itself.
    const accepted: Array<[string, L1Node]> = [
      ['text run', { kind: 'text', text: 'Join', link } as L1Node],
      ['box', { kind: 'box', link } as unknown as L1Node],
      ['container', { kind: 'container', layout: 'stack', children: [], link } as unknown as L1Node],
      ['image', { kind: 'image', src: '/assets/a.png', alt: 'A', link } as unknown as L1Node],
    ]
    for (const [label, node] of accepted) {
      expect(validateL1(doc(node)).ok, `${label} accepts the link role`).toBe(true)
    }
    expect(l1TextSchema.safeParse({ kind: 'text', text: 'Join', link }).success).toBe(true)
    expect(l1BoxSchema.safeParse({ kind: 'box', link }).success).toBe(true)
    expect(l1ContainerSchema.safeParse({ kind: 'container', layout: 'stack', children: [], link }).success).toBe(true)
    expect(l1ImageSchema.safeParse({ kind: 'image', src: '/assets/a.png', alt: 'A', link }).success).toBe(true)
  })

  /**
   * AC-848 — navigation is additive. A definition declaring no links publishes
   * exactly as it did before the role existed, and adopting it on one node
   * changes only that node's markup and declarations.
   */
  it('test_UAT_AC848_a_definition_without_links_publishes_unchanged', () => {
    const page = (linked: boolean): L1Node =>
      ({
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'Hello', axes: { color: '#111111' } },
          { kind: 'box', axes: { surfaceFill: '#eeeeee' }, ...(linked ? { link: { href: '/pricing' } } : {}) },
          { kind: 'container', layout: 'row', children: [{ kind: 'text', text: 'Inner' }] },
          { kind: 'image', src: '/assets/a.png', alt: 'A' },
        ],
      }) as unknown as L1Node

    const plain = render(page(false))
    expect(validateL1(doc(page(false))).ok).toBe(true)

    // No links at all, and every node in its own element type.
    expect(plain.html).not.toContain('<a')
    expect(plain.html).not.toContain('href=')
    expect(plain.html).not.toContain('target=')
    expect(plain.html).toBe(
      '<div class="l1-0">' +
        '<p class="l1-1">Hello</p>' +
        '<div class="l1-2"></div>' +
        '<div class="l1-3"><p class="l1-4">Inner</p></div>' +
        '<img class="l1-5" src="assets/a.png" alt="A" />' +
        '</div>',
    )

    // Adopt the role on exactly one node.
    const linked = render(page(true))
    expect(validateL1(doc(page(true))).ok).toBe(true)
    expect(linked.html).toContain('<a class="l1-2" href="pricing">')
    expect(linked.html).not.toMatch(/<div[^>]*class="l1-2"/)

    // Every other node's markup and style declarations are byte-identical.
    for (const cls of ['l1-0', 'l1-1', 'l1-3', 'l1-4', 'l1-5']) {
      expect(openingTag(linked.html, cls), `${cls} markup unchanged`).toBe(openingTag(plain.html, cls))
      expect(baseDecls(linked.css, cls), `${cls} declarations unchanged`).toEqual(baseDecls(plain.css, cls))
    }
  })
})
