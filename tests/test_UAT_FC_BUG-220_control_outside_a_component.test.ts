import { describe, expect, it } from 'vitest'
import { validateSite, type L1Node } from '../packages/site-schema/src/index'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { projectL1Vocabulary } from '../tools/generate/src/cli/kb-projection'
import { makeMemorySite } from './support/site-factory'

/**
 * [[BUG-220]] — a `control` node outside a component renders nothing, so it must
 * not validate, and one already stored must be reported `broken`.
 *
 * WHAT WENT WRONG. A builder put `control: "button"` nodes in a page's own tree
 * as calls to action, with a gold fill and padding. The page validated, the map
 * raised nothing, and the buttons were simply not on the page: only a
 * component's slots are rendered with its elements in scope, so a page-level
 * control emits nothing whatever it names.
 */

const WIDTHS = [320, 1280]
const INK = '#1f2937'
const FACE = 'Satoshi, Helvetica Neue, Arial, sans-serif'

/** The ticket's node: a fully painted call-to-action control. */
const CTA = {
  kind: 'control',
  control: 'button',
  axes: { surfaceFill: '#c9a227', color: '#111111', fontFamily: FACE, fontSizePx: 16 },
  padding: { topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 },
} as unknown as L1Node

function styledControl(control: string): Record<string, unknown> {
  return {
    kind: 'control',
    control,
    axes: { color: INK, placeholderColor: '#6b7280', fontFamily: FACE, fontSizePx: 15, surfaceFill: '#ffffff' },
    padding: { topPx: 12, rightPx: 16, bottomPx: 12, leftPx: 16 },
  }
}

function contactForm(children: Record<string, unknown>[]): Record<string, unknown> {
  return {
    id: 'enquiry',
    type: 'contact-form',
    version: 7,
    slot: 'enquiry',
    config: {
      fields: [{ name: 'email', label: 'email', labelMode: 'placeholder', type: 'email', required: true }],
      submitLabel: 'Send',
      successMessage: 'Thanks.',
      assets: [],
    },
    slots: { form: { kind: 'container', layout: 'stack', gapPx: 12, children } },
  }
}

function page(copy: unknown[], modules: Record<string, unknown>[] = []): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules,
    l1: {
      widths: WIDTHS,
      background: '#f5efe6',
      textColor: INK,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'Bob’s Salon', axes: { fontFamily: FACE, fontSizePx: 40 } },
          ...copy,
          { kind: 'slot', name: 'enquiry', behavior: 'contact-form' },
        ],
      },
    },
  }
}

type Ops = Record<string, (p: Record<string, unknown>) => Promise<unknown>>
interface Entry {
  path: string
  kind: string
  module?: string
  label: string
  attention?: { tier: string; says: string[] }
}

async function onSite<T>(home: Record<string, unknown>, fn: (ops: Ops) => Promise<T>): Promise<T> {
  const site = makeMemorySite({ pages: { 'home.json': home } })
  try {
    return await fn(l1Operations(site.slug, site.opts) as Ops)
  } finally {
    await site.dispose()
  }
}

describe('BUG-220 — a control outside a component paints nothing', () => {
  it('test_UAT_FC_BUG-220_set_l1_refuses_a_control_in_the_page_tree', async () => {
    await onSite(page([]), async (ops) => {
      const before = (await ops.get_l1({ page: 'home', path: '0' })) as { node: unknown }
      const root = before.node as { children: unknown[] }
      const next = { ...root, children: [root.children[0], CTA, ...root.children.slice(1)] }

      let refusal = ''
      await ops.set_l1({ page: 'home', path: '0', node: next }).catch((e: unknown) => {
        refusal = String((e as Error).message ?? e)
      })
      // Refused, at the node, saying what to use instead.
      expect(refusal).toContain('/l1/root/children/1')
      expect(refusal).toContain("only valid inside a component's slot")
      expect(refusal).toContain('`text` node with a `link`')

      // And nothing was written.
      const after = (await ops.get_l1({ page: 'home', path: '0' })) as { node: unknown }
      expect(after.node).toEqual(before.node)
    })
  })

  it('test_UAT_FC_BUG-220_a_control_nested_in_the_page_tree_is_refused_by_validation', () => {
    const nested = { kind: 'box', children: [CTA] }
    const result = validateSite({ ...starterSiteJson('bug-220'), pages: [page([nested])] })
    expect(result.ok).toBe(false)
    const errors = result.ok ? [] : result.errors
    const at = errors.find((e) => e.path === '/pages/0/l1/root/children/1/children/0')
    expect(at?.message).toContain("only valid inside a component's slot")
  })

  it('test_UAT_FC_BUG-220_a_control_inside_a_component_slot_still_validates', () => {
    const home = page([], [contactForm([styledControl('email'), styledControl('submit')])])
    const result = validateSite({ ...starterSiteJson('bug-220'), pages: [home] })
    expect(result.ok ? [] : result.errors).toEqual([])
  })

  it('test_UAT_FC_BUG-220_describe_page_marks_a_stored_page_level_control_broken', async () => {
    // A page written before the rule: the store holds it as it was.
    const map = await onSite(page([CTA]), (ops) => ops.describe_page({ page: 'home' }) as Promise<{
      attention: Record<string, number>
      segments: Entry[]
    }>)
    const entry = map.segments.find((s) => s.kind === 'control' && !s.module)
    expect(entry?.attention?.tier).toBe('broken')
    expect(entry!.attention!.says.join(' | ')).toContain('control outside any component paints nothing')
    expect(map.attention.broken).toBeGreaterThanOrEqual(1)
  })

  it('test_UAT_FC_BUG-220_describe_page_marks_an_undeclared_control_in_a_slot_broken', async () => {
    const home = page([], [contactForm([styledControl('email'), styledControl('phone'), styledControl('submit')])])
    const map = await onSite(home, (ops) => ops.describe_page({ page: 'home' }) as Promise<{ segments: Entry[] }>)
    const controls = map.segments.filter((s) => s.kind === 'control' && s.module === 'enquiry')
    const phone = controls.find((s) => s.label === 'phone')
    expect(phone?.attention?.tier).toBe('broken')
    expect(phone!.attention!.says.join(' | ')).toContain("control 'phone' is not one this component declares")
    // The declared ones are not reported as unbound.
    for (const name of ['email', 'submit']) {
      const says = controls.find((s) => s.label === name)?.attention?.says.join(' | ') ?? ''
      expect(says).not.toContain('paints nothing')
    }
  })

  it('test_UAT_FC_BUG-220_the_l1_reference_states_where_a_control_belongs', () => {
    const body = projectL1Vocabulary().body
    // The field's own definition, which the reference is generated from.
    expect(body).toContain(
      "The element this node paints, as its component declares it (a field name, `submit`, …) — valid only inside that component's slot.",
    )
  })
})
