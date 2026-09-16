/**
 * [[REQ-252]] UATs — **what a message arrives as**, on the store side.
 *
 * The subject is the one part of a message that is not in the body: it is not
 * painted, it has no box, and it lives on the page beside the document rather
 * than inside it. That is why it needed a surface of its own — and why the two
 * claims this file makes are about the STORE rather than about a control:
 *
 *   - changing it changes what the send reads, through the reader the send
 *     actually uses rather than through a second opinion about the same field;
 *   - clearing it does not store nothing, because a message with no subject line
 *     arrives with no subject line and nobody chose that.
 *
 * Driven through `editPageUpdate` and `editPageList` — the real command the
 * builder's route is a thin transport over, and the real listing every reader of
 * the page set uses. The chrome is asserted in the jsdom suite beside this one;
 * the route between them in the workerd suite.
 *
 * Acceptance covered:
 *
 *   AC-2  the change reaches what the next message is sent with
 *   AC-3  a subject is never silently empty; blank falls back to the title
 *   AC-6  a message is unreachable because no form sends it, and a message a
 *         form does send is not marked at all
 *   AC-8  changing the subject does not touch the copy
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { EditOptions } from '../tools/generate/src/cli/edit'
import {
  editPageAdd,
  editPageGet,
  editPageList,
  editPageUpdate,
} from '../tools/generate/src/cli/edit'
// The reader the SEND uses, from the Astro-free worker entry `lead.ts` reaches
// it through. Asserting on this rather than on the stored record is what makes
// AC-2 a claim about the message rather than about a field somebody set.
import { emailPagesOf } from '../packages/framework/src/worker'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-seed'

let site: SiteFixture

beforeEach(() => {
  site = makeMemorySite()
})
afterEach(() => void site.dispose())

const SLUG = () => site.slug
const opts = (): EditOptions => site.opts

interface Row {
  id: string
  slug: string
  title: string
  kind: string
  reachable: boolean
  email?: { subject?: string; placeholders?: string[] }
}

const rows = async (): Promise<Row[]> =>
  ((await editPageList(SLUG(), opts())).data as { pages: Row[] }).pages

const row = async (id: string): Promise<Row> => {
  const found = (await rows()).find((r) => r.id === id)
  expect(found, `page '${id}' in the listing`).toBeDefined()
  return found as Row
}

/** What the send would put on the envelope for `id`, read the way the send reads it. */
const sentSubject = async (id: string): Promise<string> => {
  const pages = (await rows()).map(async (r) => (await editPageGet(SLUG(), r.id, opts())).data)
  const definitions = (await Promise.all(pages)) as { page: Record<string, unknown> }[]
  const ref = emailPagesOf(definitions.map((d) => d.page)).find((p) => p.id === id)
  expect(ref, `'${id}' among the site's messages`).toBeDefined()
  return ref!.subject
}

describe('REQ-252 — the subject is a real field of the message', () => {
  /**
   * AC-2 — the whole point of making it editable. A subject changed anywhere has
   * to reach the envelope, and the only honest way to say so is to read it back
   * through `emailPagesOf`, which is what the sender walks the published pages
   * with.
   *
   * AC-8's first half rides along: the copy is read before and after and is
   * byte-identical, because `editPageUpdate` writes the page's `email` block and
   * has no reach into its document at all.
   */
  it('test_UAT_FC_REQ-252_a_changed_subject_is_what_the_next_message_carries', async () => {
    await editPageAdd(SLUG(), 'papers', {
      ...opts(),
      kind: 'email',
      title: 'Your two XGD papers',
      subject: 'Your two XGD papers',
      placeholders: ['cta_url'],
    })
    expect(await sentSubject('papers')).toBe('Your two XGD papers')

    const before = JSON.stringify(
      ((await editPageGet(SLUG(), 'papers', opts())).data as { page: { l1: unknown } }).page.l1,
    )

    await editPageUpdate(SLUG(), 'papers', { ...opts(), subject: 'The papers you asked for' })

    expect(await sentSubject('papers')).toBe('The papers you asked for')
    // AC-2 — and the builder reads the same value, off the row, without a second
    // request: the listing is where the field draws from.
    expect((await row('papers')).email?.subject).toBe('The papers you asked for')
    // AC-8 — the declaration survives a subject edit, and so does every word of
    // the body.
    expect((await row('papers')).email?.placeholders).toEqual(['cta_url'])
    expect(
      JSON.stringify(
        ((await editPageGet(SLUG(), 'papers', opts())).data as { page: { l1: unknown } }).page.l1,
      ),
    ).toBe(before)
  })

  /**
   * AC-3 — blank is not a subject somebody chose, it is one they cleared, and
   * nothing downstream turns it into anything: the envelope takes
   * `String(email.subject ?? '')` and the mail arrives with no subject line.
   *
   * SO THE FALLBACK IS IN THE WRITE, not in each reader. That is what lets the
   * builder show what will be sent by showing what is stored — the field is
   * filled from the write's own answer, so an operator who clears the box
   * watches the title appear rather than being left looking at an empty box that
   * means something they were never told.
   */
  it('test_UAT_FC_REQ-252_a_cleared_subject_becomes_the_title_rather_than_nothing', async () => {
    await editPageAdd(SLUG(), 'welcome', {
      ...opts(),
      kind: 'email',
      title: 'Welcome aboard',
      subject: 'Thanks for getting in touch',
    })

    const cleared = (await editPageUpdate(SLUG(), 'welcome', { ...opts(), subject: '' }))
      .data as { page: { email: { subject: string } } }

    // The write ANSWERS with what it stored, which is what the control shows.
    expect(cleared.page.email.subject).toBe('Welcome aboard')
    expect((await row('welcome')).email?.subject).toBe('Welcome aboard')
    // AC-3 — and it is genuinely what goes out, not a display convenience.
    expect(await sentSubject('welcome')).toBe('Welcome aboard')

    // Whitespace is blank. Three spaces is the same non-answer typed slightly
    // differently, and a listing that showed it would show nothing.
    await editPageUpdate(SLUG(), 'welcome', { ...opts(), subject: '   ' })
    expect(await sentSubject('welcome')).toBe('Welcome aboard')
  })

  /**
   * AC-6 — WHY a message has no address, rather than merely that it has none.
   *
   * A message is reached by the form that sends it and never by a link, so
   * "unreachable" said flatly about one describes a page that is working
   * correctly, and sends its author looking for a link they must never add. The
   * listing already draws this distinction; this pins it, because it is what the
   * page control's own label is read from.
   */
  it('test_UAT_FC_REQ-252_the_listing_says_a_message_is_a_message_and_why_it_has_no_link', async () => {
    await editPageAdd(SLUG(), 'papers', {
      ...opts(),
      kind: 'email',
      title: 'Your two XGD papers',
      subject: 'Your two XGD papers',
    })

    // Every row carries a kind — the served pages too, so an unmarked row never
    // means "written before messages existed".
    expect((await row('home')).kind).toBe('web')
    expect((await row('papers')).kind).toBe('email')
    // Nothing sends it yet, so it really is stranded — and the sentence says
    // what would un-strand it.
    expect((await row('papers')).reachable).toBe(false)
    const human = (await editPageList(SLUG(), opts())).human
    expect(human).toContain('(unreachable: no form sends it)')
    expect(human).not.toContain('papers\temail\t(unreachable: nothing links to it)')
  })
})
