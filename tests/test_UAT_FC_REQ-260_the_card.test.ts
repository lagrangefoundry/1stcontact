// @vitest-environment jsdom
/**
 * [[REQ-260]] — **the card is a notice with an undo, and the history is where
 * that undo still is a year later.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED surface
 * (`builder/dns-history.js`) in a real document. The seam that is injected is
 * the two network calls, which are this ticket's own routes and are proven
 * against real D1 by the `.workers` siblings.
 *
 * THE CLAIM THIS FILE EXISTS FOR, and it is the ticket's central design
 * decision: **the card must not be a confirmation.** The obvious shape — the
 * assistant proposes, a card asks, the change applies on approval — sounds safe
 * and is not, for the reason [[EPIC-5]] already settled in bold one layer up: *a
 * confirmation step they cannot meaningfully perform is worse than none, because
 * it launders our error into their approval.* So the falsifier is a control on
 * this surface that approves or declines a change, and the cases below look for
 * one.
 *
 * THE CLAIMS:
 *
 *  1. THE CARD SAYS WHAT IS HAPPENING AND OFFERS AN UNDO. No `Yes`, no `No`, no
 *     `Approve`, nothing that gates the change on a click.
 *  2. IT NAMES NO RECORD TYPE — *"if a customer is being shown a record type, we
 *     have failed"* ([[REQ-259]]), and this is the surface where the underlying
 *     rows are full of them.
 *  3. THE REFUSAL IS SHOWN VERBATIM AND IS NOT DRAWN AS AN ERROR. An undo
 *     declined because the settings have moved is a real answer, written to be
 *     read out.
 *  4. THE HISTORY IS THE CARD'S DURABLE HOME, and an undo that has already been
 *     pressed is a state rather than a disabled button.
 *  5. A MEMBER WHO MAY NOT CHANGE THE DOMAIN IS TOLD WHO TO ASK rather than
 *     shown a control that refuses.
 */

import { beforeEach, describe, expect, it } from 'vitest'

type Handle = Record<string, any>

let HISTORY: Record<string, any>
let root: HTMLElement

const settle = () => new Promise((r) => setTimeout(r, 0))

const A_CHANGE = {
  change: 'dnc_1',
  summary:
    "I'm letting Mailchimp send email as alicesplumbing.com. Anyone already sending for you keeps working.",
  at: '2026-09-17T10:00:00.000Z',
  settles_by: '2026-09-17T10:20:00.000Z',
  undone: false,
  undoable: true,
}

const AN_OLDER_CHANGE = {
  change: 'dnc_0',
  summary: "I'm turning on email reporting for alicesplumbing.com.",
  at: '2026-08-02T10:00:00.000Z',
  settles_by: '2026-08-02T10:20:00.000Z',
  undone: true,
  undoable: false,
}

beforeEach(async () => {
  if (!HISTORY) HISTORY = await import('../apps/control-app/src/builder/dns-history.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The shipped section, with its two calls recorded. */
function history(over: Record<string, any> = {}): { made: Handle; asked: { undone: string[] } } {
  const asked = { undone: [] as string[] }
  const made = HISTORY.createDnsHistorySection({
    transport: {
      load: async () => over.answer ?? { changes: [A_CHANGE], mayUndo: true },
      undo: async (change: string) => {
        asked.undone.push(change)
        if (over.undoThrows) throw new Error(over.undoThrows)
        return { change, undone: true }
      },
    },
  })
  root.append(made.element)
  return { made, asked }
}

const press = async (node: HTMLElement) => {
  node.dispatchEvent(new Event('click', { bubbles: true }))
  await settle()
  await settle()
  await settle()
}

const undoButton = () => root.querySelector('.builder-dns-change__undo') as HTMLButtonElement | null

describe('REQ-260 AC13 — the card is a notice, not a confirmation', () => {
  it('test_UAT_FC_REQ-260_the_card_says_what_is_happening_and_offers_one_control', async () => {
    const pressed: string[] = []
    const host = document.createElement('div')
    root.append(host)
    HISTORY.appendDnsCard(host, A_CHANGE, {
      onUndo: async (change: string) => {
        pressed.push(change)
      },
    })

    const card = host.querySelector('.builder-dns-card') as HTMLElement
    expect(card.textContent).toContain("I'm letting Mailchimp send email")
    // ONE CONTROL, AND IT IS THE UNDO. A card carrying a decision would carry
    // two, and the click would record consent that was never informed.
    const buttons = [...card.querySelectorAll('button')]
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent).toBe(HISTORY.UNDO_LABEL)
    for (const word of ['Approve', 'Accept', 'Confirm', 'Yes', 'No', 'Cancel', 'Allow', 'Deny']) {
      expect(card.textContent).not.toContain(word)
    }

    await press(buttons[0])
    // AND PRESSING IT UNDOES SOMETHING THAT HAS ALREADY HAPPENED, which is the
    // difference: the change is behind the card, not in front of it.
    expect(pressed).toEqual([A_CHANGE.change])
  })

  it('test_UAT_FC_REQ-260_nothing_a_client_reads_names_a_record', async () => {
    const host = document.createElement('div')
    root.append(host)
    HISTORY.appendDnsCard(host, A_CHANGE, { onUndo: async () => {} })
    history({ answer: { changes: [A_CHANGE, AN_OLDER_CHANGE], mayUndo: true } }).made
    await settle()

    const said = String(document.body.textContent)
    for (const jargon of ['TXT', 'CNAME', 'MX', 'SPF', 'DKIM', 'DMARC', 'v=spf1', 'zone']) {
      expect(said).not.toContain(jargon)
    }
  })

  it('test_UAT_FC_REQ-260_a_refused_undo_is_read_out_as_it_was_written', async () => {
    const host = document.createElement('div')
    root.append(host)
    const refusal =
      "I can't undo this — your settings have changed since then, so putting it " +
      'back would undo the newer change as well. Ask us and we will sort it out with you.'
    HISTORY.appendDnsCard(host, A_CHANGE, {
      onUndo: async () => {
        throw new Error(refusal)
      },
    })

    await press(host.querySelector('.builder-dns-change__undo') as HTMLElement)
    const note = host.querySelector('.builder-dns-change__note') as HTMLElement
    // VERBATIM. A re-worded version here would be a second voice on one subject,
    // and this sentence was written to be read out.
    expect(note.textContent).toBe(refusal)
    // AND THE CONTROL COMES BACK, because the client may want to try again after
    // asking — a refusal is not a terminal state.
    expect((host.querySelector('.builder-dns-change__undo') as HTMLButtonElement).disabled).toBe(
      false,
    )
  })
})

describe('REQ-260 AC14 — the history is the durable home of the same sentence', () => {
  it('test_UAT_FC_REQ-260_the_history_lists_what_was_changed_newest_first', async () => {
    const { made } = history({ answer: { changes: [A_CHANGE, AN_OLDER_CHANGE], mayUndo: true } })
    await made.refresh()

    const rows = [...root.querySelectorAll('.builder-dns-change')]
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('Mailchimp')
    // AN ALREADY-UNDONE CHANGE IS A STATE AND NOT A DISABLED BUTTON — a control
    // that cannot do anything, with no sentence saying why, is how a client
    // learns the surface is unreliable.
    expect(rows[1].querySelector('button')).toBeNull()
    expect(rows[1].textContent).toContain(HISTORY.UNDONE_LABEL)
  })

  it('test_UAT_FC_REQ-260_an_undo_from_the_history_re_reads_rather_than_patching', async () => {
    let answered = { changes: [A_CHANGE], mayUndo: true }
    const asked = { undone: [] as string[], loads: 0 }
    const made = HISTORY.createDnsHistorySection({
      transport: {
        load: async () => {
          asked.loads += 1
          return answered
        },
        undo: async (change: string) => {
          asked.undone.push(change)
          // AN UNDO IS ITSELF A CHANGE and appears in the list as one, which is
          // why the honest redraw asks the origin what the history now is.
          answered = {
            changes: [
              {
                ...A_CHANGE,
                change: 'dnc_2',
                summary: 'Undone: ' + A_CHANGE.summary,
                undoable: false,
              },
              { ...A_CHANGE, undone: true, undoable: false },
            ],
            mayUndo: true,
          }
          return { change }
        },
      },
    })
    root.append(made.element)
    await made.refresh()

    await press(undoButton() as HTMLElement)
    expect(asked.undone).toEqual([A_CHANGE.change])
    expect(asked.loads).toBe(2)
    expect([...root.querySelectorAll('.builder-dns-change')]).toHaveLength(2)
    expect(root.textContent).toContain('Undone:')
  })

  it('test_UAT_FC_REQ-260_nothing_changed_yet_is_said_plainly', async () => {
    const { made } = history({ answer: { changes: [], mayUndo: true } })
    await made.refresh()
    expect(root.textContent).toContain(HISTORY.DNS_HISTORY_EMPTY)
    expect(undoButton()).toBeNull()
  })

  it('test_UAT_FC_REQ-260_a_member_who_may_not_undo_is_told_who_to_ask', async () => {
    const { made } = history({ answer: { changes: [A_CHANGE], mayUndo: false } })
    await made.refresh()
    // NO CONTROL AT ALL rather than one that refuses — the same shape the domain
    // section uses for a member who may not attach.
    expect(undoButton()).toBeNull()
    expect(root.textContent).toContain(HISTORY.ASK_THE_HOLDER)
  })

  it('test_UAT_FC_REQ-260_a_business_switch_clears_the_list_before_the_next_read', async () => {
    const { made } = history()
    await made.refresh()
    expect([...root.querySelectorAll('.builder-dns-change')]).toHaveLength(1)
    // THE ONE THING THAT MUST NOT HAPPEN ON THIS PANE is one business's history
    // drawn under another business's heading — `settings.js`'s rule, per section.
    made.clear()
    expect([...root.querySelectorAll('.builder-dns-change')]).toHaveLength(0)
  })
})
