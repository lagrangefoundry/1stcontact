// @vitest-environment jsdom
/**
 * [[REQ-260]] — **the card reaches the conversation, and the pane beside it
 * follows.**
 *
 * THE SEAM THIS COVERS, and it is the only one the two sibling suites leave
 * open. `..._the_card.test.ts` proves what a card LOOKS like, driving the
 * shipped section in a real document. `..._dns_operations.workers.test.ts`
 * proves the origin RECORDS a change and announces it once. Neither proves the
 * announcement gets from one to the other — and the announcement is the whole
 * of what the client is owed at the moment their DNS changes. A card the
 * assistant emits into a conversation that drops it is a change made in silence,
 * which is precisely the state this ticket exists to make impossible.
 *
 * WHAT MAKES THIS EVIDENCE. The real `chat.js` over the actually-installed
 * `webui-chat`, with the stream events written in the shape `host-core.ts`
 * emits — the signal arrives AMONG the tool activity that caused it, not after
 * the prose, which is the property the pane has to survive. The transport is
 * injected because it is HTTP; nothing about the card or the panel is.
 *
 * THE CLAIMS:
 *
 *   1. A CHANGE TO THE CLIENT'S DOMAIN REACHES THE HOST, carrying the sentence
 *      it was recorded with — not a count, which is what the two signals beside
 *      it carry and what a card cannot be rebuilt from.
 *   2. SIX CHANGES ARE SIX CARDS. The per-change notice is also what rate-limits
 *      the assistant, which the confirmation was doing incidentally and which is
 *      worth keeping deliberately.
 *   3. A TURN THAT CHANGED NO DNS ANNOUNCES NONE, and a turn that read one
 *      announces none either.
 *   4. THE SIGNAL IS MACHINERY AND LEAVES NO TRACE IN THE PROSE — the card is
 *      drawn from the signal, so a summary that also arrived as an assistant
 *      message would say it twice.
 *   5. THE CARD LANDS IN THE CONVERSATION and carries its undo, and pressing it
 *      re-reads the history section six inches to the left. The two halves of
 *      one screen never disagree about what has been done.
 *   6. A DOMAIN SIGNAL DOES NOT MOVE THE OTHER PANES. It is a third kind, not a
 *      louder version of the two beside it.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let createChatPanel: (opts?: Record<string, unknown>) => Handle
let HISTORY: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-260 card-composition suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

/**
 * A turn that lets a sender send — the shape `host-core.ts` emits, frame for
 * frame.
 *
 * NOTE WHERE THE SIGNAL SITS: among the tool activity, before the prose. The
 * change has already landed by the time it is announced, which is what makes the
 * card a notice rather than a question — there is no shape here that could carry
 * an approval back, and that is deliberate.
 */
const ONE_CHANGE = [
  { kind: 'tool_activity', content: 'tool_call allow_sender', meta: { name: 'allow_sender' } },
  {
    kind: 'dns_changed',
    content: "I'm letting Mailchimp send email as alicesplumbing.com.",
    meta: {
      change: 'dnc_1',
      summary:
        "I'm letting Mailchimp send email as alicesplumbing.com. Anyone already sending for you keeps working.",
      settles_by: '2026-09-17T10:20:00.000Z',
    },
  },
  { kind: 'text', content: 'That is set up.' },
  { kind: 'done' },
]

/** Two changes in one turn. Two notices, and therefore two cards. */
const TWO_CHANGES = [
  { kind: 'tool_activity', content: 'tool_call allow_sender', meta: { name: 'allow_sender' } },
  {
    kind: 'dns_changed',
    content: 'one',
    meta: { change: 'dnc_1', summary: "I'm letting Mailchimp send email as alicesplumbing.com." },
  },
  {
    kind: 'tool_activity',
    content: 'tool_call publish_dmarc_monitoring',
    meta: { name: 'publish_dmarc_monitoring' },
  },
  {
    kind: 'dns_changed',
    content: 'two',
    meta: { change: 'dnc_2', summary: "I'm turning on email reporting for alicesplumbing.com." },
  },
  { kind: 'text', content: 'Both done.' },
  { kind: 'done' },
]

/** A question about the domain. Read, not written — so nothing is announced. */
const A_READING = [
  { kind: 'tool_activity', content: 'tool_call read_domain', meta: { name: 'read_domain' } },
  { kind: 'text', content: 'Your email is handled by Microsoft.' },
  { kind: 'done' },
]

const said = (chat: Handle) =>
  chat
    .getChat()
    .getMessages()
    .map(({ role, markdown }: Handle) => ({ role, markdown }))

const streamOf = (events: unknown[]) =>
  async function* () {
    for (const event of events) yield event
  }

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
  }
  HISTORY = await import('../apps/control-app/src/builder/dns-history.js')
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

// ── 1–4: the signal ──────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-260 AC15 — the change is announced to the conversation', () => {
  it('test_UAT_FC_REQ-260_a_domain_change_reaches_the_host_with_its_sentence', async () => {
    const reported: any[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(ONE_CHANGE) },
      onDnsChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Let Mailchimp send my newsletters.')

    // THE SENTENCE, NOT A COUNT. `site_changed` and `business_changed` carry a
    // number because the pane re-reads; this carries the words, because a card
    // IS the words and a sentence rebuilt later from a record diff is a sentence
    // nobody wrote.
    expect(reported).toHaveLength(1)
    expect(reported[0].change).toBe('dnc_1')
    expect(reported[0].summary).toContain('Mailchimp')
    expect(reported[0].settles_by).toBe('2026-09-17T10:20:00.000Z')
  })

  it('test_UAT_FC_REQ-260_two_changes_are_two_notices_and_not_one', async () => {
    const reported: any[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_CHANGES) },
      onDnsChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Set up my email properly.')

    // ONE CARD PER CHANGE. This is the rate limit the confirmation was applying
    // incidentally and which is kept deliberately: six changes are six cards,
    // never one silent cascade.
    expect(reported.map((r) => r.change)).toEqual(['dnc_1', 'dnc_2'])
  })

  it('test_UAT_FC_REQ-260_reading_the_domain_announces_nothing', async () => {
    const reported: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(A_READING) },
      onDnsChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Who handles my email?')

    // THE READ HALF IS FREE AND SILENT. A client asked a question and is not
    // shown a notice about a change that did not happen.
    expect(reported).toEqual([])
  })

  it('test_UAT_FC_REQ-260_the_notice_leaves_no_trace_in_the_prose', async () => {
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(ONE_CHANGE) },
      onDnsChanged: () => {},
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Let Mailchimp send my newsletters.')

    // MACHINERY, OBSERVED BY THE WRAPPER AND STOPPING THERE. The card is drawn
    // from the signal, so a summary that ALSO arrived as an assistant message
    // would tell the client the same thing twice in two different voices.
    expect(said(chat)).toEqual([
      { role: 'user', markdown: 'Let Mailchimp send my newsletters.' },
      { role: 'assistant', markdown: 'That is set up.' },
    ])
  })

  it('test_UAT_FC_REQ-260_a_domain_signal_does_not_move_the_other_panes', async () => {
    const site: unknown[] = []
    const business: unknown[] = []
    const dns: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(ONE_CHANGE) },
      onSiteChanged: (meta: unknown) => site.push(meta),
      onBusinessChanged: (meta: unknown) => business.push(meta),
      onDnsChanged: (meta: unknown) => dns.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Let Mailchimp send my newsletters.')

    // A THIRD KIND, NOT A LOUDER VERSION OF THE TWO BESIDE IT. A host that
    // rebuilt the site preview every time the assistant touched DNS would be
    // spending a render on a change no site file saw.
    expect(dns).toHaveLength(1)
    expect(site).toEqual([])
    expect(business).toEqual([])
  })
})

// ── 5: the card lands, and the pane follows ─────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-260 AC16 — the card lands in the conversation with its undo', () => {
  it('test_UAT_FC_REQ-260_the_card_is_drawn_into_the_conversation_and_carries_its_undo', async () => {
    // The host's arrangement, as `app.js` makes it: the signal is handed to the
    // card renderer, and the renderer is given the conversation to draw into.
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(ONE_CHANGE) },
      onDnsChanged: (meta: any) => {
        const panel = chat.getChat()
        const host = panel?.element?.querySelector('.chat-widget-messages') ?? panel?.element
        HISTORY.appendDnsCard(host, meta, { onUndo: async () => {} })
      },
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Let Mailchimp send my newsletters.')
    await settle()

    const card = chat.element.querySelector('.builder-dns-card') as HTMLElement
    expect(card).not.toBeNull()
    // THEIR NOUNS AND THE PRESENT TENSE.
    expect(card.textContent).toContain('Mailchimp')
    // AND NOT OURS. The falsifier for this whole surface is a record type in
    // front of a customer.
    expect(card.textContent).not.toMatch(/\bTXT\b|\bCNAME\b|\bDMARC\b|v=spf1/)
    // ONE CONTROL, AND IT IS NOT A DECISION. A confirmation the client cannot
    // meaningfully perform would only launder our error into their approval, so
    // there is nothing here to accept or decline.
    const buttons = [...card.querySelectorAll('button')].map((b) => b.textContent?.trim())
    expect(buttons).toEqual(['Undo'])
  })

  it('test_UAT_FC_REQ-260_pressing_undo_on_the_card_re_reads_the_history_beside_it', async () => {
    const undone: string[] = []
    let reads = 0
    // The durable home, mounted as the settings pane mounts it.
    const section = HISTORY.createDnsHistorySection({
      transport: {
        load: async () => {
          reads += 1
          return { changes: [], mayUndo: true }
        },
        undo: async () => ({ undone: true }),
      },
    })
    root.append(section.element)

    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(ONE_CHANGE) },
      onDnsChanged: (meta: any) => {
        const panel = chat.getChat()
        const host = panel?.element?.querySelector('.chat-widget-messages') ?? panel?.element
        HISTORY.appendDnsCard(host, meta, {
          onUndo: async (change: string) => {
            undone.push(change)
            await section.refresh()
          },
        })
      },
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Let Mailchimp send my newsletters.')
    await settle()

    const before = reads
    const button = chat.element.querySelector('.builder-dns-change__undo') as HTMLButtonElement
    button.dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    await settle()
    await settle()

    // THE UNDO NAMES THE CHANGE IT IS PUTTING BACK — not a record, not a zone.
    expect(undone).toEqual(['dnc_1'])
    // AND THE PANE RE-READS. An undo is itself a change and appears in that list
    // as one; without this the two halves of one screen disagree about what has
    // been done.
    expect(reads).toBeGreaterThan(before)
  })
})
