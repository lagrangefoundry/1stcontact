/**
 * [[BUG-76]] Defect 3 — a schema error inside a behavior slot must localise as
 * precisely as the identical error in the page's own `l1` tree.
 *
 * The session this ticket came from had a `set_l1` refused with
 * `/pages/0/modules/1/slots/dialog: Invalid input` — the slot root and nothing
 * else — for a `lineHeight` that should have been `lineHeightPx`. The same
 * mistake one level away, in the page's own L1, reported the offending key and
 * the whole path to it. The difference was structural: a slot's position wraps
 * the node union in a SECOND union, `z.union([node, node[]])`, which no literal
 * discriminates, so the error localiser found no tag and kept Zod's default
 * message at the slot's own path.
 *
 * Every probe here drives `validateSite`, the one validator every consuming
 * operation goes through, plus the `1c` edit path for the "report every error"
 * criterion.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { validateSite, type L1Node, type ValidationError } from '../packages/site-schema/src/index'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { editL1Set } from '../tools/generate/src/cli/edit'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

const WIDTHS = [320, 1280]

/** A page whose L1 body is `children`, with a seam a module can mount into. */
function pageWith(children: L1Node[], modules: Record<string, unknown>[] = []) {
  return {
    id: 'home',
    slug: '',
    title: 'home',
    modules,
    l1: {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [...children, { kind: 'slot', name: 'chrome' }],
      } as L1Node,
    },
  }
}

function errorsOf(page: Record<string, unknown>): ValidationError[] {
  const result = validateSite({ ...starterSiteJson('slot-errors'), pages: [page] })
  return result.ok ? [] : result.errors
}

/** The `account-chrome` instance, with `dialog` carrying whatever is handed in. */
function chromeWith(dialog: unknown, extra: Record<string, unknown> = {}) {
  return {
    id: 'chrome',
    type: 'account-chrome',
    version: 2,
    slot: 'chrome',
    config: {
      signIn: 'https://app.1stcontact.io/sign-in',
      portal: 'https://app.1stcontact.io/account',
      businesses: 'https://app.1stcontact.io/builder',
    },
    slots: { dialog, ...extra },
  }
}

describe('BUG-76 Defect 3 — an error inside a behavior slot names itself', () => {
  it('test_UAT_FC_BUG-76_slot_axis_error_reports_the_offending_path_and_key', () => {
    // `lineHeight` is not the vocabulary; `lineHeightPx` is. Axes are `.strict()`,
    // so this is an unrecognised key either side of the seam — the only variable
    // is WHERE it sits.
    const badNode: L1Node = {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'control', control: 'email', axes: { lineHeight: 24 } } as unknown as L1Node],
    }

    const inSlot = errorsOf(pageWith([], [chromeWith(badNode)]))
    expect(inSlot.length).toBeGreaterThan(0)

    // The path reaches the node that carries the fault, not the slot it is under.
    const slotPaths = inSlot.map((e) => e.path)
    expect(slotPaths).toContain('/pages/0/modules/0/slots/dialog/children/0/axes')
    // And the message names the key, which is what makes it self-correctable.
    const slotMessage = inSlot.find((e) => e.path.endsWith('/slots/dialog/children/0/axes'))!.message
    expect(slotMessage).toContain('lineHeight')
    // The old report, verbatim: the slot root with nothing said about it.
    expect(slotPaths).not.toContain('/pages/0/modules/0/slots/dialog')

    // ── The oracle: the identical node in the page's own L1 ───────────────────
    const inPage = errorsOf(pageWith([badNode]))
    const pageError = inPage.find((e) => e.path.endsWith('/children/0/axes'))!
    expect(pageError.path).toBe('/pages/0/l1/root/children/0/children/0/axes')
    // Same tail, same sentence: the seam is no longer a place errors go blind.
    expect(slotMessage).toBe(pageError.message)
  })

  it('test_UAT_FC_BUG-76_unknown_kind_names_the_kinds_that_exist', () => {
    // `picture` is what an author reaches for; the vocabulary calls it `image`.
    // No branch of the node union survives, so nothing is guessed about WHERE the
    // fault is — the union's own path is the accurate report. What changes is
    // that the sentence says what would have been accepted.
    const unknownKind = { kind: 'picture', src: '/x.png', alt: 'x' } as unknown as L1Node
    const errors = errorsOf(pageWith([unknownKind]))

    const at = errors.find((e) => e.path === '/pages/0/l1/root/children/0')
    expect(at).toBeDefined()
    expect(at!.message).not.toBe('Invalid input')
    expect(at!.message).toContain('kind')
    for (const kind of ['text', 'image', 'slot', 'control', 'box', 'container']) {
      expect(at!.message).toContain(kind)
    }

    // The same courtesy inside a slot, which is where it was worth least before.
    const inSlot = errorsOf(pageWith([], [chromeWith(unknownKind)]))
    const slotAt = inSlot.find((e) => e.path === '/pages/0/modules/0/slots/dialog')
    expect(slotAt).toBeDefined()
    expect(slotAt!.message).toContain('image')
  })

  it('test_UAT_FC_BUG-76_a_repeated_slot_still_reports_through_its_array', () => {
    // The array branch of the slot union is the one a repeated slot uses, and the
    // shape rule must not have stolen it: an error inside an array element still
    // localises, through the index.
    const badItem = {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: 'x', axes: { lineHeight: 24 } } as unknown as L1Node],
    } as L1Node
    const carousel = {
      id: 'c',
      type: 'carousel',
      version: 1,
      slot: 'chrome',
      config: {},
      slots: { slides: [badItem] },
    }
    const errors = errorsOf(pageWith([], [carousel]))
    expect(errors.map((e) => e.path)).toContain(
      '/pages/0/modules/0/slots/slides/0/children/0/axes',
    )
  })
})

describe('BUG-76 Defect 3c — a refusal reports every error it was given', () => {
  let site: SiteFixture | null = null
  afterEach(() => {
    site?.dispose()
    site = null
  })

  it('test_UAT_FC_BUG-76_two_invented_field_names_are_both_reported_at_once', async () => {
    // "I used a couple of field names that don't exist." Discovering them one per
    // round trip is a refusal withholding half of what it knows — and an AI author
    // self-corrects from exactly what it is told.
    site = makeMemorySite()
    const twoFaults = {
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'a', axes: { lineHeight: 24 } },
        { kind: 'text', text: 'b', axes: { backgroundGradient: 'x' } },
      ],
    } as unknown as L1Node

    const refusal = await editL1Set(site.slug, 'home', '0', twoFaults, site.opts).then(
      () => null,
      (e: unknown) => e as { message: string },
    )
    expect(refusal).not.toBeNull()
    expect(refusal!.message).toContain('lineHeight')
    expect(refusal!.message).toContain('backgroundGradient')
  })
})
