// @vitest-environment jsdom
/**
 * [[REQ-267]] §9 — **a stranger's mail renders inert, and the queue is
 * triageable.**
 *
 * WHY THIS IS A SECURITY UAT AND NOT A RENDERING ONE. This is the first surface
 * in the product that displays ANONYMOUS input inside the builder — the origin
 * that holds an operator's session. Rendering a received body as markup is
 * stored XSS with an email address as the delivery mechanism, which is
 * [[EPIC-17]] F1's shape arriving through a door nobody had written a note about.
 * A remote image is the quieter half: it is a read receipt for the sender and an
 * IP disclosure for the operator who opened the message.
 *
 * THE FALSIFIERS:
 *
 *   - *a `<script>` in a received body becoming a `<script>` element* — whether
 *     or not jsdom would run it, its existence is the bug;
 *   - *an `<img src="https://…">` becoming an element* — which issues the
 *     request by existing, with nothing further required;
 *   - *an `onerror=` attribute surviving as an attribute*;
 *   - *the body reaching a frame* — the outbound path's `srcdoc` is right for
 *     copy WE composed and wrong for a stranger's, and the two must not
 *     converge;
 *   - *a pending row with no way to promote or discard it* — a queue that can
 *     only be read is a queue that grows.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED PANEL, on [[REQ-195]]'s pattern: the
 * only double is the HTTP call, because that is the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let mergeCorrespondence: (
  sent: unknown[],
  received: unknown[],
) => Array<{ direction: string; at: string }>

if (!WEBUI_INSTALLED) console.warn(`REQ-267 inert-mail suite skipped: ${WEBUI_SKIP_REASON}`)

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

/**
 * The body of a message an attacker would actually send: a script, an
 * event-handler attribute, and a remote image that is a tracking beacon.
 */
const HOSTILE_BODY = [
  '<script>window.__pwned = true</script>',
  '<img src="https://tracker.test/beacon.gif" onerror="window.__pwned = true">',
  '<a href="javascript:void(0)" onclick="window.__pwned = true">click me</a>',
].join('\n')

const PERSON = {
  id: 'usr_mailed',
  email: 'mailed@example.test',
  accountId: 'acct_a',
  name: null,
  formerNames: [],
  status: 'active',
  pipelineStage: 'lead',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
}

const RECEIVED = {
  uid: 'tkt_inbound_1',
  mailId: 'inm_1',
  envelopeFrom: 'mailed@example.test',
  envelopeTo: 'hello@alicesplumbing.test',
  headerFrom: 'Mailed <mailed@example.test>',
  subject: 'A reply',
  receivedAt: '2026-09-17T10:00:00.000Z',
  sentAt: '',
  alignment: 'fail',
  status: 'captured',
  refusal: '',
  contactId: 'usr_mailed',
  size: 900,
  attachments: [{ key: 'inbound/x/0', name: 'quote.pdf', type: 'application/pdf', size: 12 }],
  synthetic: false,
  body: HOSTILE_BODY,
}

const SENT = {
  uid: 'tkt_out_1',
  contactId: 'usr_mailed',
  addressId: 'eml_1',
  templateKey: 'invite',
  templateUid: null,
  subject: 'Our quote',
  from: 'no-reply@alicesplumbing.test',
  to: 'mailed@example.test',
  assets: [],
  status: 'delivered',
  providerId: 'prov_1',
  queuedAt: '2026-09-16T10:00:00.000Z',
  sentAt: '2026-09-16T10:00:01.000Z',
  failure: null,
  body: '<p>Here is our quote.</p>',
}

const PENDING = {
  ...RECEIVED,
  uid: 'tkt_inbound_2',
  contactId: null,
  envelopeFrom: 'stranger@example.test',
  subject: 'Do you do gutters',
}

/** What each control was asked to do — the claim, for the two queue actions. */
const calls: { promoted: string[]; suppressed: Array<[string, boolean]> } = {
  promoted: [],
  suppressed: [],
}

function transport() {
  return {
    list: async () => ({ people: [{ ...PERSON }], canInvite: true, canFulfil: false }),
    item: async () => ({
      person: { ...PERSON },
      emails: [
        {
          id: 'eml_1',
          email: 'mailed@example.test',
          isPrimary: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      operates: [],
      grants: [],
      acceptances: [],
      events: [],
      provenance: null,
    }),
    messages: async () => ({ messages: [SENT], received: [RECEIVED] }),
    pending: async () => ({ pending: [{ ...PENDING }], suppressed: [] }),
    promote: async (uid: string) => {
      calls.promoted.push(uid)
      return { contactId: 'usr_new', created: true, attached: [uid] }
    },
    suppress: async (address: string, on: boolean) => {
      calls.suppressed.push([address, on])
      return { address }
    },
    saveRecord: async () => ({ ...PERSON }),
    grant: async () => ({}),
    revoke: async () => {},
    add: async () => ({ created: true, person: PERSON }),
    inviteDraft: async () => ({ from: '', subject: '', body: '' }),
    invite: async () => ({ results: [] }),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    const panel = await import('../apps/control-app/src/builder/people.js')
    ;({ createPeoplePanel, mergeCorrespondence } = panel as never)
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
  calls.promoted = []
  calls.suppressed = []
  delete (globalThis as Record<string, unknown>).__pwned
})

async function mount(): Promise<{ panel: HTMLElement; open(id: string): Promise<HTMLElement> }> {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  const element = (made as unknown as { element: HTMLElement }).element
  root.append(element)
  await (made as unknown as { refresh(): Promise<unknown> }).refresh()
  await settle()
  return {
    panel: element,
    async open(id: string): Promise<HTMLElement> {
      ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
      await settle()
      await settle()
      return root.querySelector('.builder-people__detail') as HTMLElement
    },
  }
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-267 — a received body is inert', () => {
  it('test_UAT_FC_REQ-267_a_hostile_body_renders_as_text_and_creates_no_elements', async () => {
    const { open } = await mount()
    const detail = await open('usr_mailed')

    // OPENED, because the body is deliberately not built until somebody asks —
    // which is also the state an attacker needs the operator to reach.
    const disclosure = [...detail.querySelectorAll('.builder-people__msgopen')].find((one) =>
      one.textContent?.includes('A reply'),
    ) as HTMLDetailsElement
    expect(disclosure).toBeDefined()
    disclosure.open = true
    disclosure.dispatchEvent(new Event('toggle'))
    await settle()

    const body = disclosure.querySelector('.builder-people__rcvbody') as HTMLElement
    expect(body).not.toBeNull()

    // THE MARKUP IS THE TEXT. Every character the sender wrote is on the screen
    // and none of it is structure.
    expect(body.textContent).toBe(HOSTILE_BODY)
    expect(body.children.length).toBe(0)

    // NO ELEMENT WAS CREATED FOR ANY OF IT. The image is the one that matters
    // even in a runtime that executes nothing: an `<img>` with a remote `src`
    // issues the request by existing, which is a read receipt for the sender and
    // the operator's IP address.
    expect(detail.querySelector('script')).toBeNull()
    expect(detail.querySelector('img')).toBeNull()
    expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined()
    // AND NO FRAME EITHER. `srcdoc` is right for copy we composed and wrong for
    // a stranger's; the two paths must not converge.
    expect(disclosure.querySelector('iframe')).toBeNull()
  })

  it('test_UAT_FC_REQ-267_an_unaligned_message_is_shown_as_unverified', async () => {
    const { open } = await mount()
    const detail = await open('usr_mailed')
    // ADDRESS MATCHING DOES NOT UPGRADE TRUST. The message resolved to a real
    // contact and is still labelled, because what resolved is who the sender
    // CLAIMS to be.
    const flag = detail.querySelector('.builder-people__msgunverified') as HTMLElement
    expect(flag).not.toBeNull()
    expect(flag.dataset.alignment).toBe('fail')
  })

  it('test_UAT_FC_REQ-267_both_directions_appear_in_one_sequence_newest_first', async () => {
    // PURE, so the interleaving is provable without a DOM.
    const merged = mergeCorrespondence([SENT], [RECEIVED])
    expect(merged.map((row) => row.direction)).toEqual(['received', 'sent'])

    const { open } = await mount()
    const detail = await open('usr_mailed')
    const subjects = [...detail.querySelectorAll('.builder-people__msgsubject')].map((one) =>
      one.textContent?.trim(),
    )
    expect(subjects).toEqual(['A reply', 'Our quote'])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-267 — the pending queue is triageable', () => {
  it('test_UAT_FC_REQ-267_a_waiting_message_offers_promote_and_discard', async () => {
    const { panel } = await mount()
    const queue = panel.querySelector('.builder-people__pending') as HTMLElement
    expect(queue).not.toBeNull()
    expect(queue.hidden).toBe(false)
    // THE COUNT IS IN THE SUMMARY, because that is the only part visible while
    // the queue is closed and *is anything waiting* is what it has to answer.
    expect(queue.querySelector('.builder-people__pendinghead')?.textContent).toContain('(1)')

    const row = queue.querySelector('.builder-people__pendingrow') as HTMLElement
    expect(row.textContent).toContain('stranger@example.test')
    // THE BODY IS NOT HERE. This is a decision about a sender, taken from the
    // subject and the address; a stranger's text belongs on a contact's page.
    expect(row.textContent).not.toContain('tracker.test')

    const promote = row.querySelector('.builder-people__pendingpromote') as HTMLButtonElement
    promote.click()
    await settle()
    await settle()
    expect(calls.promoted).toEqual(['tkt_inbound_2'])
  })

  it('test_UAT_FC_REQ-267_discarding_suppresses_the_sender_and_not_the_message', async () => {
    const { panel } = await mount()
    const discard = panel.querySelector(
      '.builder-people__pendingdiscard',
    ) as HTMLButtonElement
    discard.click()
    await settle()
    await settle()
    // PER SENDER, AND STICKY. What is suppressed is being ASKED about them; the
    // message is untouched and their later mail is still recorded and forwarded.
    expect(calls.suppressed).toEqual([['stranger@example.test', true]])
  })
})
