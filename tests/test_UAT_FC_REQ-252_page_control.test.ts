// @vitest-environment jsdom
/**
 * [[REQ-252]] UATs — **the builder says what a page is, and what a message
 * arrives as**, in the real chrome.
 *
 * Two things an operator could not see about a message before this. Its subject
 * line appeared nowhere in the builder, so the one part of a message that is not
 * in the body could be read and changed only by asking the assistant. And the
 * page control threw away the kind the listing already put on every row, so a
 * message sat in the list looking like an ordinary page nothing links to —
 * which is exactly the state an operator is invited to treat as a mistake and
 * fix by adding a link, the one thing they must never do to a message.
 *
 * Driven against the ACTUAL composition — `mountBuilder`, the real panel, the
 * real toolbar — for the reason the [[REQ-248]] suite beside it is: the property
 * under test is which controls a MODE declares and what they do, and a stand-in
 * strip would assert that of itself. Only the transport is injected.
 *
 * Acceptance covered:
 *
 *   AC-1  the subject is readable in the builder without the assistant
 *   AC-2  changing it is sent, for that page, as that page's subject
 *   AC-3  the field shows what came back from the write rather than what was
 *         typed, so a cleared subject shows the title that will be sent instead
 *   AC-4  an email page is named as a message, distinguishably from a web page
 *         of the same title
 *   AC-5  a web page's label is unchanged
 *   AC-6  a message is not called "unreachable"; it says no form sends it, and a
 *         message a form does send is not marked at all
 *   AC-7  the label reads the `kind` the listing returns
 *   AC-8  the subject field is a message's and no other page's
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ site: 'acme', latest: null }]

interface Row {
  id: string
  slug: string
  title: string
  kind: string
  reachable: boolean
  email?: { subject?: string }
}

/**
 * A site with all four cases in it at once.
 *
 * `papers` and `papers-page` share a TITLE deliberately: AC-4 is about telling
 * a message apart from a served page that is called the same thing, which is the
 * realistic collision — the mail that sends somebody a download and the page the
 * download lives on are one idea with two surfaces, and an author names them
 * alike.
 */
const ROWS: Row[] = [
  { id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true },
  { id: 'terms', slug: 'terms', title: 'Terms', kind: 'web', reachable: false },
  {
    id: 'papers-page',
    slug: 'papers-page',
    title: 'Your two XGD papers',
    kind: 'web',
    reachable: true,
  },
  {
    id: 'papers',
    slug: 'papers',
    title: 'Your two XGD papers',
    kind: 'email',
    reachable: false,
    email: { subject: 'Your two XGD papers' },
  },
  {
    id: 'welcome',
    slug: 'welcome',
    title: 'Welcome aboard',
    kind: 'email',
    // A form sends this one, so it is not stranded and carries no mark at all.
    reachable: true,
    email: { subject: 'Thanks for getting in touch' },
  },
]

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => { destroy?: () => void }

if (!WEBUI_INSTALLED) console.warn(`REQ-252 suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-252 — a message says it is one, and what it arrives as', () => {
  let root: HTMLElement
  let listing: Row[]
  /** Every subject write the control made, in order. */
  let sent: { site: string; page: string; subject: string }[]
  /** What the origin answers a write with; a test moves it to refuse one. */
  let answer: (subject: string) => Promise<{ page: { email: { subject: string } } }>

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    listing = ROWS.map((r) => ({ ...r, email: r.email ? { ...r.email } : undefined }))
    sent = []
    answer = async (subject: string) => ({ page: { email: { subject } } })
  })

  const mount = () =>
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: {
        list: async () => ({ pages: listing }),
        saveSubject: async (site: string, page: string, subject: string) => {
          sent.push({ site, page, subject })
          const out = await answer(subject)
          // THE ORIGIN'S OTHER HALF, and not a convenience. A write changes what
          // the listing says, and the control re-takes the listing after one —
          // so a double that answered the write and went on serving the old rows
          // would be asserting against a state the product never reaches, and
          // would hide the case this models: the field and the listing agreeing
          // about the subject after a write, rather than one of them winning.
          const row = listing.find((r) => r.id === page)
          if (row) row.email = { subject: out.page.email.subject }
          return out
        },
      },
    })

  const selectOf = () =>
    root.querySelector('[data-action="pages"] select') as HTMLSelectElement
  const optionsOf = () => [...selectOf().options].map((o) => [o.value, o.text])
  const subjectOf = () => root.querySelector('[data-action="subject"]') as HTMLElement | null
  const inputOf = () => subjectOf()?.querySelector('input') as HTMLInputElement
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  const choose = (slug: string): void => {
    const select = selectOf()
    select.value = slug
    select.dispatchEvent(new Event('change'))
  }

  /** Finish typing in the subject box, which is what commits it. */
  const type = async (value: string): Promise<void> => {
    const input = inputOf()
    input.value = value
    input.dispatchEvent(new Event('change'))
    await settled()
  }

  it('test_UAT_FC_REQ-252_the_page_control_names_a_message_as_one', async () => {
    mount()
    await settled()
    expect(optionsOf()).toEqual([
      // AC-5 — a web page's label is exactly what it was.
      ['home', 'Home'],
      ['terms', 'Terms — unreachable'],
      ['papers-page', 'Your two XGD papers'],
      // AC-4 — the same title, told apart by what the page IS. AC-6 — and the
      // note says what would reach it, which for a message is a form and never
      // a link.
      ['papers', 'Email: Your two XGD papers — no form sends it'],
      // AC-6 — a message a form does send is working correctly and is not
      // marked at all.
      ['welcome', 'Email: Welcome aboard'],
    ])
  })

  it('test_UAT_FC_REQ-252_the_label_reads_the_kind_the_listing_gave_the_row', async () => {
    // AC-7 — the control holds no opinion of its own about what a page is. A
    // kind this build has never heard of is named without a claim rather than
    // labelled with a word it cannot read, which is what makes adding a third
    // kind a change to the listing and not to this control.
    listing = [
      { id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true },
      { id: 'sms', slug: 'sms', title: 'Text message', kind: 'sms', reachable: false },
    ]
    mount()
    await settled()
    expect(optionsOf()).toEqual([
      ['home', 'Home'],
      ['sms', 'Text message — unreachable'],
    ])
  })

  it('test_UAT_FC_REQ-252_the_subject_is_shown_for_a_message_and_for_nothing_else', async () => {
    mount()
    modeButton('edit').click()
    await settled()

    // AC-8 — the home page is a page, not a message, and has no subject to show.
    expect((subjectOf() as HTMLElement).hidden).toBe(true)

    choose('papers')
    await settled()
    // AC-1 — the subject an operator's contacts are receiving, readable in the
    // builder, without the assistant.
    expect((subjectOf() as HTMLElement).hidden).toBe(false)
    expect(inputOf().value).toBe('Your two XGD papers')

    // It follows the page rather than the site: another message, another subject.
    choose('welcome')
    await settled()
    expect(inputOf().value).toBe('Thanks for getting in touch')

    // …and back to a served page, it goes away again rather than sitting there
    // holding a message's subject beside a page that has none.
    choose('papers-page')
    await settled()
    expect((subjectOf() as HTMLElement).hidden).toBe(true)
  })

  it('test_UAT_FC_REQ-252_editing_the_subject_sends_it_for_that_page', async () => {
    mount()
    modeButton('edit').click()
    await settled()
    choose('papers')
    await settled()

    await type('The papers you asked for')

    // AC-2 — one write, naming the site in scope and the page's own id (not its
    // slug, which is what a page is addressed BY and not what it is called).
    expect(sent).toEqual([
      { site: 'acme', page: 'papers', subject: 'The papers you asked for' },
    ])
    expect(inputOf().value).toBe('The papers you asked for')

    // Leaving it alone writes nothing. The commit fires on every blur, and a
    // control that posted an unchanged subject every time the operator clicked
    // past it would fill the draft's history with edits nobody made.
    inputOf().dispatchEvent(new Event('change'))
    await settled()
    expect(sent).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-252_clearing_the_subject_shows_the_title_that_will_be_sent', async () => {
    // AC-3 — a message with no subject line arrives with no subject line, so
    // the store puts the page's title there instead. The field is filled from
    // the write's own answer rather than from what was typed, which is what
    // makes an operator who clears the box watch the title appear instead of
    // being left looking at an empty box that means something nobody told them.
    answer = async (subject: string) => ({
      page: { email: { subject: subject.trim() === '' ? 'Your two XGD papers' : subject } },
    })
    mount()
    modeButton('edit').click()
    await settled()
    choose('papers')
    await settled()

    await type('')

    expect(sent).toEqual([{ site: 'acme', page: 'papers', subject: '' }])
    expect(inputOf().value).toBe('Your two XGD papers')
  })

  it('test_UAT_FC_REQ-252_a_refused_subject_is_reported_and_not_kept', async () => {
    // The placeholder rule guards a subject exactly as it guards the copy, and
    // its refusal names the token that went missing. The box goes back to what
    // is actually stored rather than sitting there holding a subject the store
    // declined — an operator left looking at their own text has no way to know
    // it was not saved.
    answer = async () => {
      const err = new Error("Message 'papers' declares {{cta_url}}, which the copy no longer has.")
      throw err
    }
    mount()
    modeButton('edit').click()
    await settled()
    choose('papers')
    await settled()

    await type('Something the message may not say')

    expect(inputOf().value).toBe('Your two XGD papers')
    expect(inputOf().getAttribute('aria-invalid')).toBe('true')
    expect(inputOf().title).toContain('{{cta_url}}')
  })

  it('test_UAT_FC_REQ-252_the_field_follows_a_subject_the_operator_did_not_change', async () => {
    mount()
    modeButton('edit').click()
    await settled()
    choose('papers')
    await settled()
    expect(inputOf().value).toBe('Your two XGD papers')

    // AC-1 — the assistant rewrites the subject, and its write reloads the
    // render, which is when the listing is re-taken. A field that redrew only on
    // the panel's own events would go on showing the subject that has already
    // been replaced — which is worse than showing nothing, because it is a
    // confident answer to "what are my contacts receiving" that is wrong.
    listing = listing.map((r) =>
      r.id === 'papers' ? { ...r, email: { subject: 'The papers you asked for' } } : r,
    )
    const frame = root.querySelector('.builder-panel__frame') as HTMLIFrameElement
    frame.dispatchEvent(new Event('load'))
    await settled()

    expect(inputOf().value).toBe('The papers you asked for')
    // …and nothing was written to get there. Reading is not editing.
    expect(sent).toEqual([])
  })

  it('test_UAT_FC_REQ-252_the_subject_is_offered_in_edit_and_not_in_view', async () => {
    mount()
    await settled()
    // View must behave exactly as published, and a box that writes to the draft
    // is not that. The mode declares the control, so there is no channel in
    // which it is present and inert.
    expect(subjectOf()).toBeNull()

    modeButton('edit').click()
    await settled()
    expect(subjectOf()).not.toBeNull()
  })
})
