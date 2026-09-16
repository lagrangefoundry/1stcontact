// @vitest-environment jsdom
/**
 * [[REQ-249]] — **the field a business chooses its free web address in.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED section
 * (`builder/hostname.js`) in a real document, over the shipped dialog shell
 * (`builder/modal.js`) — no stand-in for either. The seams that are injected are
 * the two network calls, which are [[REQ-238]]'s routes and are proven against
 * real D1 by that ticket's own suite and by this one's `.workers` sibling. The
 * last two claims mount the WHOLE builder, so "the section is on the Settings
 * pane" is the assembled product rather than a module in isolation.
 *
 * NOTHING HERE DECIDES WHAT A HOSTNAME IS. That is [[REQ-238]]'s and is called,
 * not restated — which is itself a claim below, scanned over the client source.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. IT IS CALLED `Your free web address` AND NEVER `domain`. A `1stc.site`
 *     hostname is not a domain and [[EPIC-6]] is going to sell the customer a
 *     real one, so teaching them the word here means unteaching it there.
 *  2. THE WHOLE HOST IS ON SCREEN, never a bare label — [[REQ-238]]'s own
 *     requirement, because a permanent name typed by a low-tech customer is a
 *     permanent typo waiting to happen.
 *  3. THE BUTTON FIRES THE CHECK, AND SO DOES RETURN. A check reachable only by
 *     mouse is this field with the registrar experience taken out of it.
 *  4. FOUR ANSWERS, FOUR LINES. `reserved` is not `taken`: somebody told `mail`
 *     is taken goes looking for `mail2`, which is also reserved.
 *  5. LOCKING IN IS A CONFIRM DIALOG IN THE SHARED SHELL: it says *your
 *     business*, its confirming button names the act, and Cancel takes focus.
 *  6. LOSING THE RACE AFTER THE DIALOG IS ONE SENTENCE BESIDE THE FIELD, with
 *     the candidate still in the box — not an error dialog and not a reload.
 *  7. A BUSINESS THAT HAS ALREADY CHOSEN SEES NO TEXT BOX, and the pane reads
 *     that from the addresses it already asked for rather than asking again.
 *  8. NO RULE IS RE-IMPLEMENTED IN THE CLIENT — no reserved list, no syntax, no
 *     availability.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')

type Handle = Record<string, any>

let HOSTNAME: Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CONFIG: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-249 builder suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

const APEX = '1stc.site'

/** What `/api/hostname/check` answers, in each of its four shapes. */
const FREE = (label: string) => ({
  host: `${label}.${APEX}`,
  available: true,
  refusal: null,
  reason: null,
})
const TAKEN = (label: string) => ({
  host: `${label}.${APEX}`,
  available: false,
  refusal: `\`${label}.${APEX}\` is already taken.`,
  reason: 'taken',
})
const RESERVED = (label: string) => ({
  host: `${label}.${APEX}`,
  available: false,
  refusal: `\`${label}\` is one we keep for the product itself. Pick another word.`,
  reason: 'reserved',
})
const INVALID = (label: string) => ({
  host: `${label}.${APEX}`,
  available: false,
  refusal: 'A hostname can only use letters, numbers and hyphens.',
  reason: 'invalid',
})

let root: HTMLElement

beforeEach(async () => {
  if (!HOSTNAME) HOSTNAME = await import('../apps/control-app/src/builder/hostname.js')
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The shipped section, with its two calls recorded. */
function section(over: Record<string, any> = {}) {
  const asked = { checks: [] as string[], claims: [] as string[] }
  const made = HOSTNAME.createHostnameSection({
    transport: {
      check: async (label: string) => {
        asked.checks.push(label)
        return over.check ? over.check(label) : FREE(label)
      },
      claim: async (label: string) => {
        asked.claims.push(label)
        if (over.claim) return over.claim(label)
        return { id: 'dom_1', siteKey: 'site_1', host: `${label}.${APEX}`, kind: 'platform' }
      },
    },
    onClaimed: over.onClaimed ?? (() => {}),
  })
  root.append(made.element)
  made.setAddresses({ apex: APEX, addresses: over.addresses ?? [] })
  return { made, asked }
}

const box = () => root.querySelector('input.builder-hostname__label') as HTMLInputElement
const line = () => root.querySelector('.builder-hostname__line') as HTMLElement
const checkButton = () => root.querySelector('.builder-hostname__check') as HTMLButtonElement
const lockButton = () => root.querySelector('.builder-hostname__lock') as HTMLButtonElement | null
const dialog = () => document.querySelector('.builder-modal') as HTMLElement | null

/** Type a candidate and press Return on it — exactly what a customer does. */
async function typeAndReturn(label: string) {
  box().value = label
  box().dispatchEvent(new Event('input', { bubbles: true }))
  box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await settle()
  await settle()
}

// ── 1 & 2: what it is called, and what it shows ──────────────────────────────

describe('REQ-249 AC1 — it is a free web address and it is not a domain', () => {
  it('test_UAT_FC_REQ-249_the_section_is_called_your_free_web_address', () => {
    section()
    expect(HOSTNAME.HOSTNAME_TITLE).toBe('Your free web address')
    expect(root.textContent).toContain('Your free web address')
  })

  it('test_UAT_FC_REQ-249_the_word_domain_appears_nowhere_in_the_section', () => {
    section()
    // EVERY WORD THE CUSTOMER CAN READ, in both states of the section and in the
    // dialog's own sentences — not just the ones drawn at this instant.
    const shown = [
      root.textContent ?? '',
      HOSTNAME.HOSTNAME_HINT,
      HOSTNAME.CHECK_LABEL,
      HOSTNAME.LOCK_LABEL,
      HOSTNAME.CONFIRM_TITLE,
      HOSTNAME.lockInLabel(`alice.${APEX}`),
      ...HOSTNAME.confirmLines(`alice.${APEX}`),
      ...HOSTNAME.heldLines(`alice.${APEX}`),
      HOSTNAME.availableLine(`alice.${APEX}`),
      HOSTNAME.takenLine(`alice.${APEX}`),
      HOSTNAME.reservedLine(`mail.${APEX}`),
      HOSTNAME.raceLostLine(`alice.${APEX}`),
    ].join(' ')
    expect(shown.toLowerCase()).not.toContain('domain')
  })

  it('test_UAT_FC_REQ-249_the_apex_is_beside_the_box_so_the_whole_host_is_visible', () => {
    section()
    // THE APEX COMES FROM THE ORIGIN'S ANSWER, not from a string in the browser:
    // a second place `1stc.site` is written is a second place it can fall out of
    // step with the host the Worker actually issues.
    expect(root.querySelector('.builder-hostname__apex')?.textContent).toBe(`.${APEX}`)
    expect(box()).toBeTruthy()
  })

  it('test_UAT_FC_REQ-249_every_answer_names_the_whole_host_and_never_the_bare_label', () => {
    // NOT "the apex appears somewhere" — that is satisfied by a sentence that
    // ALSO names the bare word. The claim is that the label never appears on its
    // own: everywhere `alice` is written, `alice.1stc.site` is what is written.
    const groups = [
      [HOSTNAME.availableLine(`alice.${APEX}`)],
      [HOSTNAME.takenLine(`alice.${APEX}`)],
      [HOSTNAME.raceLostLine(`alice.${APEX}`)],
      HOSTNAME.heldLines(`alice.${APEX}`),
      HOSTNAME.confirmLines(`alice.${APEX}`),
      [HOSTNAME.lockInLabel(`alice.${APEX}`)],
    ]
    for (const group of groups) {
      const said = group.join(' ')
      expect(said).toContain(`alice.${APEX}`)
      expect(said.replaceAll(`alice.${APEX}`, '')).not.toContain('alice')
    }
    const reserved = HOSTNAME.reservedLine(`mail.${APEX}`)
    expect(reserved).toContain(`mail.${APEX}`)
    expect(reserved.replaceAll(`mail.${APEX}`, '')).not.toContain('mail')
  })
})

// ── 3: how a check is fired ──────────────────────────────────────────────────

describe('REQ-249 AC3 — the button checks, and so does Return', () => {
  it('test_UAT_FC_REQ-249_return_in_the_box_fires_the_check', async () => {
    const { asked } = section()
    await typeAndReturn('alice')
    expect(asked.checks).toEqual(['alice'])
    expect(line().textContent).toBe(HOSTNAME.availableLine(`alice.${APEX}`))
  })

  it('test_UAT_FC_REQ-249_the_button_fires_the_same_check', async () => {
    const { asked } = section()
    box().value = 'alice'
    checkButton().dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    await settle()
    expect(asked.checks).toEqual(['alice'])
  })

  it('test_UAT_FC_REQ-249_an_empty_box_asks_nothing', async () => {
    const { asked } = section()
    await typeAndReturn('   ')
    // A REFUSAL NOBODY EARNED. The route would answer an empty label with the
    // rule about needing a character; reporting it to somebody who has not typed
    // yet is a refusal for having done nothing.
    expect(asked.checks).toEqual([])
    expect(line().textContent).toBe('')
  })
})

// ── 4: four answers, four lines ──────────────────────────────────────────────

describe('REQ-249 AC4 — four refusals, and they are not one refusal', () => {
  it('test_UAT_FC_REQ-249_an_available_name_offers_the_lock_in', async () => {
    section()
    await typeAndReturn('alice')
    expect(line().textContent).toBe(`✓ alice.${APEX} is available`)
    expect(lockButton()?.textContent).toBe(HOSTNAME.LOCK_LABEL)
  })

  it('test_UAT_FC_REQ-249_a_taken_name_says_so_and_offers_nothing_to_lock_in', async () => {
    section({ check: TAKEN })
    await typeAndReturn('alice')
    expect(line().textContent).toBe(
      `✗ Sorry, alice.${APEX} is taken — try something else or ask the AI for help`,
    )
    // THE ASSISTANT IS NAMED AS PLAIN TEXT AND NOTHING MORE. It sits beside the
    // chat, on the same tab, in the same split — so the sentence names something
    // the customer can already see; priming that conversation is later work.
    expect(line().querySelectorAll('button, a')).toHaveLength(0)
    expect(lockButton()).toBeNull()
  })

  it('test_UAT_FC_REQ-249_a_reserved_name_is_not_reported_as_taken', async () => {
    section({ check: RESERVED })
    await typeAndReturn('mail')
    const said = line().textContent ?? ''
    expect(said).toBe(
      `✗ Sorry, mail.${APEX} is kept for 1st Contact itself — please choose a different word`,
    )
    // THE WHOLE POINT OF THE DISTINCTION. A customer told `mail` is TAKEN goes
    // looking for `mail2`, which is also reserved, and so is every other
    // decoration of the word. This one has to send them to change the WORD.
    expect(said).not.toContain('taken')
    expect(lockButton()).toBeNull()
  })

  it('test_UAT_FC_REQ-249_an_invalid_name_is_answered_with_the_rule_the_route_states', async () => {
    section({ check: INVALID })
    await typeAndReturn('Alice Smith')
    // THE ROUTE'S OWN SENTENCE, VERBATIM. Which rule was broken is the one thing
    // the pane cannot word for itself without carrying a copy of the rules.
    expect(line().textContent).toBe('✗ A hostname can only use letters, numbers and hyphens.')
    expect(lockButton()).toBeNull()
  })

  it('test_UAT_FC_REQ-249_editing_the_box_withdraws_the_lock_in', async () => {
    section()
    await typeAndReturn('alice')
    expect(lockButton()).toBeTruthy()

    box().value = 'alicex'
    box().dispatchEvent(new Event('input', { bubbles: true }))
    // THE BUTTON COMMITS THE HOST THE LAST CHECK ANSWERED ABOUT. Leaving it up
    // beside an edited box would offer to make permanent a name nobody has been
    // told is free.
    expect(lockButton()).toBeNull()
    expect(line().textContent).toBe('')
  })
})

// ── 5: the confirm dialog ────────────────────────────────────────────────────

async function openTheDialog(over: Record<string, any> = {}) {
  const made = section(over)
  await typeAndReturn('alice')
  lockButton()!.dispatchEvent(new Event('click', { bubbles: true }))
  await settle()
  return made
}

describe('REQ-249 AC5 — locking in is a confirm dialog in the shared shell', () => {
  it('test_UAT_FC_REQ-249_it_wears_the_builder_dialog_shell', async () => {
    await openTheDialog()
    const modal = dialog()
    expect(modal).toBeTruthy()
    // THE SHELL EVERY BUILDER MODAL WEARS — a second dialog implementation is
    // the ticket's own falsifier.
    expect(modal!.getAttribute('role')).toBe('dialog')
    expect(modal!.getAttribute('aria-modal')).toBe('true')
    expect(modal!.querySelector('.builder-modal__panel')).toBeTruthy()
    expect(modal!.querySelector('.builder-modal__backdrop')).toBeTruthy()
    expect(modal!.querySelector('.builder-modal__footer')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-249_it_promises_the_business_and_not_the_site', async () => {
    await openTheDialog()
    const said = dialog()!.textContent ?? ''
    expect(said).toContain(`alice.${APEX}`)
    expect(said).toContain('cannot be undone')
    // ONE PLATFORM ADDRESS PER BUSINESS is what is actually enforced, and this
    // dialog is the moment that promise is made. "This site" would promise
    // something narrower than the rule.
    expect(said).toContain('business')
    expect(said).not.toContain('this site')
  })

  it('test_UAT_FC_REQ-249_the_confirming_button_names_the_act_and_is_not_called_OK', async () => {
    await openTheDialog()
    const buttons = [...dialog()!.querySelectorAll('.builder-modal__footer button')]
    const labels = buttons.map((b) => b.textContent)
    expect(labels).toContain(`Lock in alice.${APEX}`)
    // THE WEAKEST LABEL AVAILABLE for the most irreversible action in the
    // product: a customer should be able to read the button alone and know what
    // they are about to do.
    expect(labels).not.toContain('OK')
    expect(labels).toContain('Cancel')
  })

  it('test_UAT_FC_REQ-249_cancel_takes_focus_when_the_dialog_opens', async () => {
    await openTheDialog()
    // A RETURN PRESS AIMED AT THE CHECK BOX MUST NOT LAND ON THE PERMANENT
    // CHOICE. The customer has been pressing Return to check names.
    expect(document.activeElement?.textContent).toBe('Cancel')
  })

  it('test_UAT_FC_REQ-249_cancel_claims_nothing_and_leaves_the_field_as_it_was', async () => {
    const { asked } = await openTheDialog()
    const cancel = [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    expect(dialog()).toBeNull()
    expect(asked.claims).toEqual([])
    expect(box().value).toBe('alice')
  })

  it('test_UAT_FC_REQ-249_confirming_claims_it_and_the_box_is_gone_for_good', async () => {
    const claimed: any[] = []
    const { asked } = await openTheDialog({ onClaimed: (a: any) => claimed.push(a) })
    const confirm = [...dialog()!.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith('Lock in'),
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    await settle()

    expect(asked.claims).toEqual(['alice'])
    expect(dialog()).toBeNull()
    // THE FIELD IS NOT LEFT ON SCREEN. A box that can only be refused from here
    // on is worse than no box.
    expect(box()).toBeNull()
    expect(root.textContent).toContain(`Your free web address is alice.${APEX}.`)
    expect(claimed).toHaveLength(1)
  })
})

// ── 6: losing the race ───────────────────────────────────────────────────────

describe('REQ-249 AC6 — losing the race, after the dialog', () => {
  it('test_UAT_FC_REQ-249_a_409_is_one_sentence_beside_the_field', async () => {
    const { asked } = await openTheDialog({
      claim: () => {
        const err: any = new Error('`alice.1stc.site` went while you were deciding.')
        err.taken = true
        err.host = `alice.${APEX}`
        throw err
      },
    })
    const confirm = [...dialog()!.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith('Lock in'),
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await settle()
    await settle()

    expect(asked.claims).toEqual(['alice'])
    // THE DIALOG CLOSES, and what replaces it is not another dialog. A check
    // reserves nothing, so this is the ordinary outcome of a first-come
    // namespace rather than something going wrong.
    expect(dialog()).toBeNull()
    expect(line().textContent).toBe(`✗ alice.${APEX} went while you were deciding — try another one.`)
    // THE CANDIDATE IS STILL IN THE BOX, so the next attempt starts from what
    // they typed rather than from an empty field.
    expect(box().value).toBe('alice')
    expect(lockButton()).toBeNull()
  })
})

// ── 7: the state most businesses are in most of the time ─────────────────────

describe('REQ-249 AC7 — a business that has already chosen sees no box', () => {
  it('test_UAT_FC_REQ-249_a_held_address_is_shown_as_permanent_with_no_field', () => {
    section({
      addresses: [{ id: 'dom_1', siteKey: 'site_1', host: `alice.${APEX}`, kind: 'platform' }],
    })
    expect(root.textContent).toContain(`Your free web address is alice.${APEX}.`)
    expect(root.textContent).toContain('This was chosen once and cannot be changed.')
    expect(box()).toBeNull()
    expect(checkButton()).toBeNull()
    expect(lockButton()).toBeNull()
  })

  it('test_UAT_FC_REQ-249_a_custom_address_is_not_mistaken_for_the_platform_one', () => {
    // [[EPIC-6]]'s kind is already declared and will arrive in this same list.
    // A business holding only a custom domain has not chosen its free address
    // yet, so the field is still the right thing to draw.
    section({
      addresses: [
        { id: 'dom_2', siteKey: 'site_1', host: 'alicesplumbing.com', kind: 'custom' },
      ],
    })
    expect(box()).toBeTruthy()
  })
})

// ── 8: nothing is re-decided in the client ───────────────────────────────────

describe('REQ-249 AC8 — no rule is re-implemented in the client', () => {
  it('test_UAT_FC_REQ-249_the_builder_client_carries_no_reserved_list_and_no_syntax_rule', () => {
    const source = fs
      .readdirSync(BUILDER)
      .filter((f) => f.endsWith('.js'))
      .map((f) => fs.readFileSync(path.join(BUILDER, f), 'utf8'))
      .join('\n')
    // THE RESERVED LIST LIVES IN ONE PLACE. A copy here would be a second rule
    // that can disagree with the first, with the customer holding two answers
    // and no way to tell which is right.
    for (const kept of ['smtp', 'autodiscover', '_acme-challenge', 'firstcontact']) {
      expect(source, kept).not.toContain(kept)
    }
    expect(source).not.toContain('xn--')

    // AND THE SECTION ITSELF DECIDES NOTHING ABOUT A NAME'S SHAPE. Scanned on
    // the module rather than on the whole client, because this is where such a
    // rule would plausibly be written: no pattern, no length ceiling, and the
    // only thing done to what was typed is the whitespace a browser field
    // collects on the way in.
    const mine = fs.readFileSync(path.join(BUILDER, 'hostname.js'), 'utf8')
    expect(mine).not.toMatch(/RegExp|\/\^|test\(/)
    expect(mine).not.toContain('63')
  })
})

// ── the assembled product ────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-249 AC2 — the section is on the Settings pane', () => {
  function mount(over: Record<string, any> = {}) {
    const asked = { addresses: 0 }
    const app = mountBuilder(root, {
      businesses: [{ id: 'acct_bakery', name: 'Cole’s Bakery', selectable: true }],
      person: { name: 'Sam', email: 'sam@example.test' },
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      },
      loadSites: async () => [{ site: 'site-bakery', latest: null }],
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        openSettingsSession: async () => ({ sessionId: 'b', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      settingsTransport: {
        saveName: async (name: string) => ({ businessId: 'acct_bakery', name, effects: {} }),
        loadAddresses: async () => {
          asked.addresses += 1
          return { apex: APEX, addresses: over.addresses ?? [] }
        },
        checkHostname: async (label: string) => FREE(label),
        claimHostname: async (label: string) => ({
          id: 'dom_1',
          siteKey: 'site-bakery',
          host: `${label}.${APEX}`,
          kind: 'platform',
        }),
      },
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
        upload: async () => ({ uid: 'm1', role: 'site', indexed: true }),
      },
      peopleTransport: { list: async () => ({ people: [] }), person: async () => ({}) },
      paletteTransport: {
        get: async () => ({ palette: {}, usage: {} }),
        write: async () => ({ palette: {}, usage: {} }),
      },
    })
    return { app, asked }
  }

  it('test_UAT_FC_REQ-249_the_settings_pane_shows_the_field_beneath_the_business_name', async () => {
    const { app, asked } = mount()
    await settle()
    await settle()

    const pane = app.settings.element as HTMLElement
    expect(pane.textContent).toContain('Your free web address')
    expect(pane.querySelector('input.builder-hostname__label')).toBeTruthy()
    expect(pane.querySelector('.builder-hostname__apex')?.textContent).toBe(`.${APEX}`)
    // ONE QUESTION, NOT TWO. "Has this business chosen yet" is read out of the
    // addresses the pane already asked for.
    expect(asked.addresses).toBe(1)
    // AND IT IS ON THE SETTINGS PANEL, with the name field, not somewhere else.
    expect(app.shell.getPanel(CONFIG.SETTINGS_TAB.id).contains(pane)).toBe(true)
    expect(pane.querySelector('.fields-row[data-field="name"]')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-249_a_business_that_holds_one_gets_no_field_on_the_pane', async () => {
    const { app } = mount({
      addresses: [{ id: 'dom_1', siteKey: 'site-bakery', host: `cole.${APEX}`, kind: 'platform' }],
    })
    await settle()
    await settle()

    const pane = app.settings.element as HTMLElement
    expect(pane.textContent).toContain(`Your free web address is cole.${APEX}.`)
    expect(pane.querySelector('input.builder-hostname__label')).toBeNull()
  })
})
