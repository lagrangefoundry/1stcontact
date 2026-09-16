// @vitest-environment jsdom
/**
 * [[BUG-97]] — **the Messages list shows the message as sent, and says when it
 * was not sent at all.**
 *
 * WHAT THIS FILE PROVES. That the mail a form actually sends is readable in the
 * builder, by the operator, before a stranger gets it — and that a message a
 * deployment could not send is not reported as a delivery.
 *
 * THE STATE THIS FILLS. `MessageRecord.body` — *"the RENDERED body, as sent"* —
 * has been on this wire since [[REQ-198]] wrote the route, and the pane dropped
 * it. So the only way to read a gated download's mail was to publish the site
 * and send it to yourself, which is the wrong order: the whole point of checking
 * a message is to check it before it goes. It binds twice over for a gated
 * download, whose per-contact link exists NOWHERE else — not in the template,
 * which holds `{{cta_url}}` and not a URL ([[BUG-94]]'s preview shows that), and
 * not in a development deployment's outbox, because [[REQ-196]] means a machine
 * with no mail credential sends nothing.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. jsdom computes no layout and
 * loads no iframe, so this proves the frame is BUILT, sandboxed, and handed the
 * body — the same way [[REQ-198]] proves "distinguishable" by the emitted class
 * and the word rather than by a box jsdom reports as zero either way. That the
 * bytes render as an email is `renderL1Email`'s own claim and is asserted where
 * that function is.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on [[REQ-198]]'s pattern:
 * the only double is the HTTP call, because that is the network.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a body on the wire that no surface shows* — which is the state being
 *     fixed, and it is invisible precisely because nothing fails;
 *   - *a message rendered into the builder's own document* — a mail carries
 *     inlined styles on every element and would restyle the pane around it;
 *   - *a frame that can navigate the operator's tab* — a message is content, and
 *     content that can move the builder is content with more power than a page;
 *   - *a link that cannot be pressed* — a link you cannot follow is a link you
 *     cannot test, which is the whole reason this exists;
 *   - *"sent" for a message that never left* — the one surface an operator
 *     consults to find out whether it did.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-97 message-body suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function memoryStorage() {
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
  }
}

const person = (over: Record<string, unknown>) => ({
  displayName: null,
  status: 'active',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const PEOPLE = [person({ id: 'usr_lead', email: 'lead@example.test', displayName: 'A Lead' })]

/** The gate link the capture path minted, as it appears in the rendered mail. */
const GATE_LINK =
  'http://127.0.0.1:8788/b/bug97/preview/site_abc/draft/api/download/gate_0123456789abcdef0123456789abcdef'

/**
 * The record as the route returns it — a rendered HTML body, and a `local_`
 * provider id, which is what [[REQ-196]]'s capturing adapter mints.
 *
 * SPELLED AS THE STORE HOLDS IT, not as a convenience. `provider_id` is the one
 * thing in the record that distinguishes a message that was recorded from one
 * that was delivered, because the switch between the two adapters is *does this
 * deployment hold a credential* and nothing else.
 */
const RECORDED_ONLY = {
  uid: 'tkt_recorded',
  subject: 'Your two papers',
  queuedAt: '2026-09-15T10:00:00.000Z',
  status: 'sent',
  providerId: 'local_9f3a7c1e5b2d4a6f8c0e1d3b5a7f9c2e',
  failure: null,
  contactId: 'usr_lead',
  assets: ['paper-a'],
  body: `<!doctype html><html><body><a href="${GATE_LINK}">Open</a></body></html>`,
}

/** And one that really went, through a real provider. */
const REALLY_SENT = {
  uid: 'tkt_sent',
  subject: 'Welcome',
  queuedAt: '2026-09-14T10:00:00.000Z',
  status: 'sent',
  providerId: '5f8c0e1d-3b5a-7f9c-2e4d-6a8b0c2e4f60',
  failure: null,
  contactId: 'usr_lead',
  assets: [],
  body: '<!doctype html><html><body><p>Welcome aboard.</p></body></html>',
}

/** A message recorded before a body was kept, which every historical row is. */
const NO_BODY = {
  uid: 'tkt_old',
  subject: 'An older message',
  queuedAt: '2026-09-13T10:00:00.000Z',
  status: 'delivered',
  providerId: 'aa11bb22-cc33-dd44-ee55-ff6600112233',
  failure: null,
  contactId: 'usr_lead',
  assets: [],
  body: '',
}

let messages: unknown[] = []

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, bounced: [] }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [],
      operates: [],
      grants: [],
    }),
    messages: async () => ({ messages }),
    saveRecord: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  messages = [RECORDED_ONLY, REALLY_SENT, NO_BODY]
})

async function open(id = 'usr_lead') {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  root.append((made as unknown as { element: HTMLElement }).element)
  await (made as unknown as { refresh(): Promise<void> }).refresh()
  ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
  await settle()
  await settle()
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

/** The `<details>` for one message row, by index down the list. */
function rowAt(detail: HTMLElement, index: number): HTMLDetailsElement {
  const rows = [...detail.querySelectorAll('.builder-people__msgopen')]
  return rows[index] as HTMLDetailsElement
}

/** Open one row the way a click does, and let the handler run. */
async function expand(row: HTMLDetailsElement): Promise<void> {
  row.open = true
  row.dispatchEvent(new Event('toggle'))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-97 — a message can be read as it was sent', () => {
  it('test_UAT_FC_BUG-97_a_message_opens_to_show_the_body_that_was_sent', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    // CLOSED UNTIL ASKED, and nothing built. Twenty messages is twenty
    // documents, and the operator wants one of them.
    expect(row.open).toBe(false)
    expect(row.querySelector('.builder-people__msgbody')).toBeNull()

    await expand(row)
    const frame = row.querySelector('.builder-people__msgbody') as HTMLIFrameElement
    expect(frame).not.toBeNull()
    expect(frame.tagName).toBe('IFRAME')
    // THE BODY THE RECORD CARRIES, not a summary of it and not the template.
    expect(frame.getAttribute('srcdoc')).toContain('<a href=')
    expect(frame.getAttribute('srcdoc')).toContain(RECORDED_ONLY.body)
  })

  /**
   * The link in the mail is the WHOLE reason this surface exists for a gated
   * download: it is minted per contact, so it is in the record and nowhere else.
   */
  it('test_UAT_FC_BUG-97_the_gate_link_the_recipient_was_given_is_readable_here', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    await expand(row)
    const frame = row.querySelector('.builder-people__msgbody') as HTMLIFrameElement
    expect(frame.getAttribute('srcdoc')).toContain(GATE_LINK)
  })

  /**
   * SANDBOXED, WITH EXACTLY ONE CAPABILITY. `allow-popups` is what makes the link
   * pressable — a link you cannot follow is a link you cannot test — and
   * top-level navigation is withheld, so a message cannot take the builder's own
   * tab. `<base target="_blank">` is what routes the click into that one
   * capability.
   */
  it('test_UAT_FC_BUG-97_the_message_is_framed_sandboxed_and_cannot_take_the_tab', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    await expand(row)
    const frame = row.querySelector('.builder-people__msgbody') as HTMLIFrameElement

    const sandbox = frame.getAttribute('sandbox') ?? ''
    expect(sandbox.split(/\s+/)).toContain('allow-popups')
    expect(sandbox.split(/\s+/)).toContain('allow-popups-to-escape-sandbox')
    // THE WITHHELD ONES ARE THE CLAIM. Same-origin access would let a message
    // read the builder; top-level navigation would let it replace it.
    expect(sandbox).not.toContain('allow-same-origin')
    expect(sandbox).not.toContain('allow-top-navigation')
    expect(sandbox).not.toContain('allow-scripts')

    expect(frame.getAttribute('srcdoc')?.startsWith('<base target="_blank">')).toBe(true)
    // AND IT IS A FRAME AND NOT MARKUP IN THIS DOCUMENT. A mail's styles are
    // inlined on every element, so appending them here would restyle the pane.
    expect(detail.querySelector('.builder-people__messages a')).toBeNull()
  })

  it('test_UAT_FC_BUG-97_opening_a_row_twice_does_not_build_a_second_frame', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    await expand(row)
    row.open = false
    row.dispatchEvent(new Event('toggle'))
    await expand(row)
    expect(row.querySelectorAll('.builder-people__msgbody')).toHaveLength(1)
  })

  /**
   * A historical record kept no body, and saying so is not the same as showing an
   * empty message — only one of them means "we have no copy of what we sent".
   */
  it('test_UAT_FC_BUG-97_a_message_with_no_body_says_so_rather_than_framing_nothing', async () => {
    const detail = await open()
    const row = rowAt(detail, 2)
    await expand(row)
    expect(row.querySelector('.builder-people__msgbody')).toBeNull()
    expect((row.textContent ?? '')).toContain('recorded without a body')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-97 — a message that never left says so', () => {
  /**
   * [[REQ-196]]'s capturing adapter writes the record `sent` with a `local_`
   * provider id, so this pane reported a delivery that never happened — at the
   * one surface an operator consults to find out whether it did.
   */
  it('test_UAT_FC_BUG-97_a_recorded_only_message_names_the_missing_mail_provider', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    const said = row.querySelector('.builder-people__msgunsent')
    expect(said).not.toBeNull()
    const words = (said?.textContent ?? '').toLowerCase()
    // IT NAMES THE CAUSE AND NOT JUST THE FACT. "Not sent" alone invites the
    // operator to press something again; "no mail provider" tells them what to
    // do, which is the same standard the failure line is held to.
    expect(words).toContain('mail provider')
    expect(words).toContain('nothing was delivered')
  })

  /**
   * And the record's own word is still shown. The pane does not rewrite what the
   * store says — the ledger is evidence — it adds the sentence that qualifies it.
   */
  it('test_UAT_FC_BUG-97_the_records_own_status_is_still_shown_beside_it', async () => {
    const detail = await open()
    const row = rowAt(detail, 0)
    const status = row.querySelector('.builder-people__msgstatus') as HTMLElement
    expect(status.textContent).toBe('sent')
    expect(status.dataset.status).toBe('sent')
  })

  it('test_UAT_FC_BUG-97_a_message_that_really_was_sent_carries_no_such_note', async () => {
    const detail = await open()
    expect(rowAt(detail, 1).querySelector('.builder-people__msgunsent')).toBeNull()
    expect(rowAt(detail, 2).querySelector('.builder-people__msgunsent')).toBeNull()
  })

  /**
   * NOT COLOUR ALONE AND NOT LAYOUT ALONE, the standard [[REQ-198]] set: the note
   * carries the words, and the stylesheet has a rule for the hook the row emits.
   */
  it('test_UAT_FC_BUG-97_the_stylesheet_has_rules_for_the_hooks_the_row_emits', async () => {
    const detail = await open()
    expect(rowAt(detail, 0).querySelector('.builder-people__msghead')).not.toBeNull()
    expect(CSS).toContain('.builder-people__msgunsent')
    expect(CSS).toContain('.builder-people__msgbody')
    expect(CSS).toContain('.builder-people__msghead')
  })
})
