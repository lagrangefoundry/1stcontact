import { describe, expect, it } from 'vitest'
import { containmentCheck, draftAccount, unsettledChecks } from '../tools/generate/src/cli/ai/account-core'
import { delegationMethod } from '../tools/generate/src/cli/ai/roles'
import { editL1Set } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

/**
 * [[BUG-225]] — **the host settles a check about the page's words or about one
 * section, refuses one worded so it cannot, and does not count the client's own
 * edit against the builder.**
 *
 * WHAT MAKES THIS EVIDENCE. The host's real `account` hook — the object the
 * framework's delegation calls `mark`, `changes`, `claims` and `settle` on —
 * bracketing real `editL1Set` writes through the real store port, with the
 * journal recording each write's actor exactly as the builder's tools (`ai`) and
 * the page editor's routes (`client`) record it. A verdict is therefore derived
 * from what the store held and who the journal says wrote it.
 */

const AXES = { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 }
const text = (words: string): Record<string, unknown> => ({ kind: 'text', text: words, axes: AXES })

/** A home page of three sections, each one text: header, hero, body. */
function sectionedPage(): Record<string, unknown> {
  const page = starterHomePage('acme') as Record<string, unknown>
  const l1 = page.l1 as { root: Record<string, unknown> & { children: unknown[] } }
  l1.root = { kind: 'container', layout: 'stack', children: [] }
  l1.root.children = [
    { kind: 'container', layout: 'stack', id: 'header', children: [text('Bob’s Salon')] },
    { kind: 'container', layout: 'stack', id: 'hero', children: [text('Welcome')] },
    { kind: 'container', layout: 'stack', id: 'body', children: [text('Open every day')] },
  ]
  return page
}

const BUILDER = 'ai' as const
const CLIENT = 'client' as const

/** Write one section's text as `actor`. */
async function write(site: SiteFixture, section: number, words: string, actor: 'ai' | 'client'): Promise<void> {
  await editL1Set(site.slug, 'home', `0.${section}.0`, text(words), { ...site.opts, actor })
}

/** One bracketed delegation: the hook's two marks around `work`, then each check settled. */
async function delegated(site: SiteFixture, work: () => Promise<void>, checks: string[]) {
  const account = draftAccount(site.store, site.slug)
  const ctx = {}
  const from = await account.mark(ctx)
  await work()
  const to = await account.mark(ctx)
  const changed = await account.changes(ctx, from, to)
  const verdicts = new Map<string, { settled: boolean; reason: string } | null>()
  for (const check of checks) {
    expect(account.claims(ctx, check)).toBe(true)
    verdicts.set(check, await account.settle(ctx, check, from, to))
  }
  return { changed, verdicts }
}

describe('BUG-225 the host settles what the builder cannot be trusted to', () => {
  it('test_UAT_FC_BUG-225_a_text_check_is_settled_from_the_page_the_builder_left', async () => {
    const site = makeMemorySite({ pages: { 'home.json': sectionedPage() } })
    const HELD = "page home contains the text 'Hair, heart, community'"
    const MISSING = "page home contains the text 'Book your cut today'."
    const IN_SECTION = 'section hero on page home contains the text "Hair, heart, community"'
    const WRONG_SECTION = "section body on page home contains the text 'Hair, heart, community'"
    const NO_SECTION = "section banner on page home contains the text 'Welcome'"
    const ABSENT = "page home does not contain the text 'Welcome'"
    const STILL_THERE = "page home does not contain the text 'Open every day'"
    // A curly apostrophe in the page and a straight one in the check are the same words.
    const QUOTE_SHAPE = "page home contains the text 'Bob's Salon'"

    const { verdicts } = await delegated(
      site,
      () => write(site, 1, 'Hair, heart, community', BUILDER),
      [HELD, MISSING, IN_SECTION, WRONG_SECTION, NO_SECTION, ABSENT, STILL_THERE, QUOTE_SHAPE],
    )

    expect(verdicts.get(HELD)).toMatchObject({ settled: true })
    expect(verdicts.get(IN_SECTION)).toMatchObject({ settled: true })
    expect(verdicts.get(ABSENT)).toMatchObject({ settled: true })
    expect(verdicts.get(QUOTE_SHAPE)).toMatchObject({ settled: true })

    // A failure says what the page holds instead, so the caller need not open it.
    const missing = verdicts.get(MISSING)!
    expect(missing.settled).toBe(false)
    expect(missing.reason).toContain("'Hair, heart, community'")
    expect(verdicts.get(WRONG_SECTION)).toMatchObject({ settled: false })
    expect(verdicts.get(WRONG_SECTION)!.reason).toContain("'Open every day'")
    expect(verdicts.get(NO_SECTION)!.reason).toContain('its sections are header, hero, body')
    expect(verdicts.get(STILL_THERE)).toMatchObject({ settled: false })
    expect(verdicts.get(STILL_THERE)!.reason).toContain("'Open every day'")
    await site.dispose()
  })

  it('test_UAT_FC_BUG-225_section_containment_and_its_near_phrasing_are_settled_by_the_host', async () => {
    const site = makeMemorySite({ pages: { 'home.json': sectionedPage() } })
    const CANONICAL = 'only the elements in section header on page home changed'
    const NEAR = 'page home: only elements inside the header section changed'
    const SHORT = 'Only the `hero` section changed.'
    const NO_SECTION = 'only the elements in section banner on page home changed'

    // Briefed to fix the header and "not change any wording" elsewhere, the builder
    // rewrote the body as well: the two header checks fail and say where.
    const { verdicts } = await delegated(
      site,
      async () => {
        await write(site, 0, 'Bob’s Salon & Spa', BUILDER)
        await write(site, 2, 'Open every day, prices from $5', BUILDER)
      },
      [CANONICAL, NEAR, SHORT, NO_SECTION],
    )

    for (const check of [CANONICAL, NEAR]) {
      const verdict = verdicts.get(check)!
      expect(verdict.settled).toBe(false)
      expect(verdict.reason).toContain('element 0.2.0')
    }
    expect(verdicts.get(SHORT)).toMatchObject({ settled: false })
    expect(verdicts.get(NO_SECTION)).toMatchObject({ settled: false })
    expect(verdicts.get(NO_SECTION)!.reason).toContain("no section 'banner' on page home")

    // Held to the header alone, the same check passes.
    const held = await delegated(site, () => write(site, 0, 'Bob’s', BUILDER), [CANONICAL, NEAR])
    expect(held.verdicts.get(CANONICAL)).toMatchObject({ settled: true })
    expect(held.verdicts.get(NEAR)).toMatchObject({ settled: true })
    await site.dispose()
  })

  it('test_UAT_FC_BUG-225_a_client_edit_during_the_run_is_set_apart_and_not_judged_against_the_builder', async () => {
    const site = makeMemorySite({ pages: { 'home.json': sectionedPage() } })
    const HEADER_ONLY = 'only the elements in section header on page home changed'

    // The builder fixes the header while the client rewords the body in the editor.
    const { changed, verdicts } = await delegated(
      site,
      async () => {
        await write(site, 0, 'Bob’s Salon & Spa', BUILDER)
        await write(site, 2, 'Open Tuesday to Sunday', CLIENT)
      },
      [HEADER_ONLY],
    )

    expect(changed.differences).toEqual([
      { page: 'home', address: '0.0.0', field: 'text', before: 'Bob’s Salon', after: 'Bob’s Salon & Spa' },
    ])
    expect(changed.others).toEqual([
      {
        page: 'home',
        address: '0.2.0',
        field: 'text',
        before: 'Open every day',
        after: 'Open Tuesday to Sunday',
        actor: 'client',
      },
    ])
    expect(verdicts.get(HEADER_ONLY)).toMatchObject({ settled: true })

    // A page only the client wrote is the client's whole; one where both wrote
    // the same element stays the builder's, because the journal cannot split it.
    const shared = await delegated(
      site,
      async () => {
        await write(site, 1, 'Hello', CLIENT)
        await write(site, 1, 'Hello there', BUILDER)
      },
      [],
    )
    expect(shared.changed.others).toBeUndefined()
    expect(shared.changed.differences).toHaveLength(1)
    await site.dispose()
  })

  it('test_UAT_FC_BUG-225_a_check_worded_like_the_hosts_but_not_in_its_words_is_named_for_refusal', () => {
    const refused = [
      'page X: only elements inside the header, and nothing else, were changed',
      'the hero headline reads exactly "Hair, heart, community"',
      'The footer is untouched',
      "the button says 'Book now'",
    ]
    const kept = [
      'page home has no visible changes',
      'every section has a heading',
      'the hero image is the one from the Library',
      "the client's logo sits left of the menu",
      'only the elements in section header on page home changed',
      "page home contains the text 'Book now'",
    ]
    expect(unsettledChecks([...refused, ...kept])).toEqual(refused)
  })

  it('test_UAT_FC_BUG-225_the_delegation_method_names_each_new_form_and_the_host_claims_every_example', () => {
    for (const writing of [false, true]) {
      const method = delegationMethod(true, writing)!
      const paragraph = method.split('\n\n').find((p) => p.startsWith('Two more kinds of check'))
      expect(paragraph).toBeDefined()
      const examples = [...paragraph!.matchAll(/"([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' '))
      expect(examples.map((e) => containmentCheck(e)?.kind)).toEqual(['section', 'text', 'text', 'text'])
      expect(paragraph).toContain('refused before anything runs')
    }
  })
})
