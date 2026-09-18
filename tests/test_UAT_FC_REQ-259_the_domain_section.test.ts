// @vitest-environment jsdom
/**
 * [[REQ-259]] — **the domain section: three controls, and no records.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED section
 * (`builder/domain.js`) in a real document, over the shipped dialog shell
 * (`builder/modal.js`) — no stand-in for either. The seam that is injected is
 * the four network calls, which are this ticket's own routes and are proven
 * against real D1 by the `.workers` sibling. The last cases mount the WHOLE
 * builder, so "the section is on the Settings pane, beside the free web address"
 * is the assembled product rather than a module in isolation.
 *
 * NOTHING HERE DECIDES ANYTHING. Which domains the account holds, whether one is
 * free, whether this person may spend it and where the verification got to are
 * all the Worker's answers — which is itself a claim below, scanned over the
 * client source.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. IT IS CALLED `Your domain`, AND THE WORD IS FINALLY CORRECT HERE. The
 *     section above it refuses the word for a `1stc.site` hostname precisely so
 *     that it means something when the customer has a real one.
 *  2. NO RECORD TYPE, NO RECORD VALUE, NO ZONE ID, anywhere a customer can read.
 *     *"If a customer is being shown a record type, we have failed."*
 *  3. THE SELECTOR OFFERS WHAT IS FREE AND SHOWS WHAT IS NOT, naming no other
 *     site.
 *  4. A MEMBER WHO IS NOT THE ACCOUNT HOLDER SEES NO POOL and is told who to ask.
 *  5. ATTACHING NOTIFIES AND DOES NOT ASK: no dialog in front of it, and what was
 *     already on the domain is said afterwards, in their language.
 *  6. THE EMAIL TOGGLE IS ON BY DEFAULT and carries the third wait's own state.
 *  7. RELEASE IS ALWAYS OFFERED, behind a dialog that says what comes back —
 *     because finality is a `platform` rule and is not inherited.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')

type Handle = Record<string, any>

let DOMAIN: Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CONFIG: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-259 builder suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

const MINE = 'alicesplumbing.com'
const TAKEN = 'alices-shop.com'

/** What `GET /api/domain` answers, in the states the section has to draw. */
const NOTHING_ATTACHED = {
  pool: [
    { domain: MINE, available: true, refusal: null },
    { domain: TAKEN, available: false, refusal: 'This domain is already in use on another site.' },
  ],
  attached: null,
  email: 'off',
  mayAttach: true,
  refusal: null,
}

const ATTACHED = (email = 'pending') => ({
  pool: [],
  attached: MINE,
  email,
  mayAttach: true,
  refusal: null,
})

const NOT_THE_HOLDER = {
  pool: [],
  attached: null,
  email: 'off',
  mayAttach: false,
  refusal: 'Ask the account owner to attach a domain to this site.',
}

let root: HTMLElement

beforeEach(async () => {
  if (!DOMAIN) DOMAIN = await import('../apps/control-app/src/builder/domain.js')
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The shipped section, with its four calls recorded. */
function section(over: Record<string, any> = {}) {
  const asked = {
    loads: 0,
    attached: [] as { domain: string; email: boolean }[],
    released: 0,
    email: [] as boolean[],
  }
  let state = over.state ?? NOTHING_ATTACHED
  const made = DOMAIN.createDomainSection({
    transport: {
      load: async () => {
        asked.loads += 1
        return over.reload ? over.reload(asked.loads) : state
      },
      attach: async (domain: string, email: boolean) => {
        asked.attached.push({ domain, email })
        if (over.attachThrows) throw new Error(over.attachThrows)
        state = ATTACHED(email ? 'pending' : 'off')
        return over.attachAnswer ?? { domain, liveUse: { live: false, notes: [] }, email: 'pending' }
      },
      release: async () => {
        asked.released += 1
        state = NOTHING_ATTACHED
        return { released: MINE }
      },
      setEmail: async (enabled: boolean) => {
        asked.email.push(enabled)
        state = ATTACHED(enabled ? 'pending' : 'off')
        return { email: state.email }
      },
    },
  })
  root.append(made.element)
  made.setState(over.state ?? NOTHING_ATTACHED)
  return { made, asked }
}

const select = () => root.querySelector('select.builder-domain__select') as HTMLSelectElement
const attachButton = () =>
  root.querySelector('.builder-domain__attach') as HTMLButtonElement | null
const releaseButton = () =>
  root.querySelector('.builder-domain__release') as HTMLButtonElement | null
const emailToggle = () => root.querySelector('input.builder-domain__email') as HTMLInputElement
const dialog = () => document.querySelector('.builder-modal') as HTMLElement | null

const press = async (node: HTMLElement) => {
  node.dispatchEvent(new Event('click', { bubbles: true }))
  await settle()
  await settle()
  await settle()
}

// ── 1 & 2: the word, and the absence of every other word ─────────────────────

describe('REQ-259 AC1 — this is where the word *domain* is correct', () => {
  it('test_UAT_FC_REQ-259_the_section_is_called_your_domain', () => {
    section()
    expect(DOMAIN.DOMAIN_TITLE).toBe('Your domain')
    expect(root.textContent).toContain('Your domain')
  })

  it('test_UAT_FC_REQ-259_no_record_type_or_value_appears_anywhere_a_customer_can_read', () => {
    // EVERY WORD THE CUSTOMER CAN READ, in every state of the section and in the
    // dialog's own sentences — not just the ones drawn at this instant.
    const shown = [
      DOMAIN.DOMAIN_TITLE,
      DOMAIN.DOMAIN_HINT,
      DOMAIN.ATTACH_LABEL,
      DOMAIN.RELEASE_LABEL,
      DOMAIN.RELEASE_CONFIRM_TITLE,
      DOMAIN.CANCEL_LABEL,
      DOMAIN.EMAIL_LABEL,
      DOMAIN.NO_DOMAINS,
      DOMAIN.attachedLine(MINE),
      ...DOMAIN.releaseLines(MINE),
      DOMAIN.emailLine('off', MINE),
      DOMAIN.emailLine('pending', MINE),
      DOMAIN.emailLine('verified', MINE),
      DOMAIN.emailLine('failed', MINE),
    ]
      .join(' ')
      .toLowerCase()

    // THE TICKET'S FIRST FALSIFIER, read off the words themselves.
    for (const machinery of [
      'spf',
      'dkim',
      'dmarc',
      'cname',
      'nameserver',
      'name server',
      'zone',
      'certificate',
      'propagat',
      'txt record',
      'mx record',
      'a record',
      'dns',
    ]) {
      expect(shown).not.toContain(machinery)
    }
  })

  it('test_UAT_FC_REQ-259_the_section_re_implements_no_rule_of_its_own', () => {
    const source = fs.readFileSync(path.join(BUILDER, 'domain.js'), 'utf8')
    // WHICH DOMAINS ARE FREE, WHO MAY SPEND THEM AND WHERE THE VERIFICATION GOT
    // TO ARE THE WORKER'S ANSWERS. A client carrying its own copy of any of them
    // would be a second rule that can disagree with the first, with the customer
    // holding two answers and no way to tell which is right.
    expect(source).not.toMatch(/_dmarc|v=spf1|_domainkey|p=none/)
    expect(source).not.toMatch(/\baccount_id\b|owner_account_id/)
    // AVAILABILITY IS READ, NEVER DERIVED: the only mention of it is the field
    // the origin answered with.
    expect(source).not.toMatch(/available\s*=\s*(true|false)/)
  })
})

// ── 3: the selector ──────────────────────────────────────────────────────────

describe('REQ-259 AC3 — the selector offers what is free and shows what is not', () => {
  it('test_UAT_FC_REQ-259_a_taken_domain_is_listed_disabled_and_names_no_other_site', () => {
    section()
    const options = [...select().options]
    expect(options.map((option) => option.value)).toEqual([MINE, TAKEN])
    expect(options[0].disabled).toBe(false)
    expect(options[1].disabled).toBe(true)
    expect(options[1].textContent).toContain('already in use on another site')
    // THE FREE ONE IS SELECTED, so the ordinary press needs no choice first.
    expect(select().value).toBe(MINE)
  })

  it('test_UAT_FC_REQ-259_attaching_sends_the_chosen_domain_and_the_toggle', async () => {
    const { asked } = section()
    await press(attachButton()!)
    expect(asked.attached).toEqual([{ domain: MINE, email: true }])
  })

  it('test_UAT_FC_REQ-259_an_account_with_no_domains_is_told_so_and_shown_no_control', () => {
    section({ state: { ...NOTHING_ATTACHED, pool: [] } })
    expect(root.textContent).toContain(DOMAIN.NO_DOMAINS)
    expect(select()).toBeNull()
    expect(attachButton()).toBeNull()
  })
})

// ── 4: authorisation ─────────────────────────────────────────────────────────

describe('REQ-259 AC4 — a member who is not the account holder is told who to ask', () => {
  it('test_UAT_FC_REQ-259_a_non_holder_sees_no_pool_and_no_controls', () => {
    section({ state: NOT_THE_HOLDER })
    // NO POOL AT ALL, not a disabled one: it is a list of things somebody else
    // paid for, and showing it invites them to ask for a specific one.
    expect(select()).toBeNull()
    expect(attachButton()).toBeNull()
    expect(releaseButton()).toBeNull()
    expect(root.textContent).toContain('Ask the account owner')
    expect(root.textContent).not.toContain(MINE)
  })

  it('test_UAT_FC_REQ-259_a_non_holder_looking_at_an_attached_domain_cannot_release_it', () => {
    section({ state: { ...ATTACHED('verified'), mayAttach: false, refusal: NOT_THE_HOLDER.refusal } })
    // THEY STILL SEE THE ADDRESS — it is their site's address and they may
    // certainly know it — and they cannot take it down.
    expect(root.textContent).toContain(DOMAIN.attachedLine(MINE))
    expect(releaseButton()).toBeNull()
    expect(emailToggle().disabled).toBe(true)
  })
})

// ── 5: attaching notifies, and does not ask ──────────────────────────────────

describe('REQ-259 AC5 — it notifies; it does not ask', () => {
  it('test_UAT_FC_REQ-259_there_is_no_dialog_in_front_of_an_attach', async () => {
    section()
    await press(attachButton()!)
    // A CONFIRMATION A FURNITURE RESTORER CANNOT PERFORM LAUNDERS OUR ERROR INTO
    // THEIR APPROVAL. There is deliberately no gate here at all.
    expect(dialog()).toBeNull()
  })

  it('test_UAT_FC_REQ-259_what_was_already_on_the_domain_is_said_afterwards', async () => {
    const { asked } = section({
      attachAnswer: {
        domain: MINE,
        liveUse: {
          live: true,
          notes: ["Your email is with Microsoft 365 — I'll keep that working."],
        },
        email: 'pending',
      },
      reload: () => ATTACHED('pending'),
    })
    await press(attachButton()!)
    expect(asked.loads).toBeGreaterThan(0)
    const note = root.querySelector('.builder-domain__note')
    expect(note?.textContent).toBe("Your email is with Microsoft 365 — I'll keep that working.")
    // IN THEIR LANGUAGE: a provider's name, and a promise about their mail.
    expect(note?.textContent).not.toContain('MX')
  })

  it('test_UAT_FC_REQ-259_a_clean_domain_says_nothing_at_all', async () => {
    section({ reload: () => ATTACHED('pending') })
    await press(attachButton()!)
    // A WARNING ABOUT A RISK THAT DOES NOT EXIST is how customers learn to
    // dismiss warnings.
    expect(root.querySelector('.builder-domain__note')).toBeNull()
  })
})

// ── 6: the email toggle and the third wait ───────────────────────────────────

describe('REQ-259 AC6 — the sending toggle, and a wait with a state of its own', () => {
  it('test_UAT_FC_REQ-259_the_toggle_is_on_by_default_before_the_attach', () => {
    section()
    expect(emailToggle().checked).toBe(true)
    expect(root.textContent).toContain(DOMAIN.EMAIL_LABEL)
  })

  it('test_UAT_FC_REQ-259_the_third_wait_reads_as_progress_and_not_as_broken', () => {
    section({ state: ATTACHED('pending') })
    const said = root.querySelector('.builder-domain__email-line')?.textContent ?? ''
    expect(said).toContain('few minutes')
    expect(said).toContain('come right on its own')
    // AND IT IS DISTINCT FROM BOTH OTHER STATES, which is the whole of *"it
    // needs its own state or it reads as broken"*.
    expect(said).not.toBe(DOMAIN.emailLine('verified', MINE))
    expect(said).not.toBe(DOMAIN.emailLine('off', MINE))
  })

  it('test_UAT_FC_REQ-259_a_verified_domain_says_what_recipients_now_see', () => {
    section({ state: ATTACHED('verified') })
    expect(root.querySelector('.builder-domain__email-line')?.textContent).toBe(
      `Email to your customers comes from ${MINE}.`,
    )
  })

  it('test_UAT_FC_REQ-259_turning_the_toggle_off_does_not_touch_the_address', async () => {
    const { made, asked } = section({ state: ATTACHED('verified'), reload: () => ATTACHED('off') })
    emailToggle().checked = false
    emailToggle().dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    await settle()
    await settle()
    expect(asked.email).toEqual([false])
    // THE WEBSITE ADDRESS SURVIVES THE TOGGLE. They are separately reversible.
    expect(made.getState().attached).toBe(MINE)
    expect(root.textContent).toContain(DOMAIN.attachedLine(MINE))
  })

  it('test_UAT_FC_REQ-259_a_re_read_that_found_no_news_changes_nothing', () => {
    const { made } = section({ state: ATTACHED('pending') })
    expect(made.refresh(ATTACHED('pending'))).toBe(false)
    // AND ONE THAT DID follows it, which is how the wait ends without the
    // customer reloading the page.
    expect(made.refresh(ATTACHED('verified'))).toBe(true)
    expect(root.querySelector('.builder-domain__email-line')?.textContent).toContain(
      'comes from',
    )
  })
})

// ── 7: release ───────────────────────────────────────────────────────────────

describe('REQ-259 AC7 — release, and the rule that must not be inherited', () => {
  it('test_UAT_FC_REQ-259_an_attached_domain_always_offers_release', () => {
    section({ state: ATTACHED('verified') })
    // **FINALITY IS A `platform` RULE AND IS NOT INHERITED.** Any refusal to
    // move or remove a `custom` host is this ticket's falsifier, and the section
    // above this one — where the rule IS finality — is what makes the mistake
    // easy to make.
    expect(releaseButton()?.textContent).toBe('Stop using this domain')
  })

  it('test_UAT_FC_REQ-259_release_is_behind_a_dialog_that_says_what_comes_back', async () => {
    const { asked } = section({ state: ATTACHED('verified'), reload: () => NOTHING_ATTACHED })
    await press(releaseButton()!)
    const panel = dialog()
    expect(panel).toBeTruthy()
    const said = panel?.textContent ?? ''
    // THE FEAR THIS DIALOG ACTUALLY ANSWERS is *"will I lose my website"*, and
    // the truthful answer is that the free address takes over and the domain
    // stays theirs.
    expect(said).toContain('free 1st Contact address takes over again')
    expect(said).toContain('stays yours')
    expect(asked.released).toBe(0)

    const confirm = [...(panel?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent === 'Stop using this domain',
    ) as HTMLButtonElement
    await press(confirm)
    expect(asked.released).toBe(1)
    expect(dialog()).toBeNull()
    // AND THE SELECTOR IS BACK, because the zone stays on the account.
    expect(select()).toBeTruthy()
  })

  it('test_UAT_FC_REQ-259_cancel_takes_focus_in_the_release_dialog', async () => {
    section({ state: ATTACHED('verified') })
    await press(releaseButton()!)
    // A RETURN PRESS AIMED AT SOMETHING ELSE must not land on the control that
    // takes a customer's website address down.
    expect(document.activeElement?.textContent).toBe('Cancel')
  })
})

// ── the assembled product ────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-259 — on the Settings pane, beside the free web address', () => {
  function mount(over: Record<string, any> = {}) {
    const asked = { domain: 0 }
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
        loadAddresses: async () => ({ apex: '1stc.site', addresses: [] }),
        checkHostname: async (label: string) => ({
          host: `${label}.1stc.site`,
          available: true,
          refusal: null,
          reason: null,
        }),
        claimHostname: async (label: string) => ({
          id: 'dom_1',
          siteKey: 'site-bakery',
          host: `${label}.1stc.site`,
          kind: 'platform',
        }),
        loadDomain: async () => {
          asked.domain += 1
          return over.state ?? NOTHING_ATTACHED
        },
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

  it('test_UAT_FC_REQ-259_the_pane_shows_the_domain_section_under_the_free_web_address', async () => {
    const { app, asked } = mount()
    await settle()
    await settle()

    const pane = app.settings.element as HTMLElement
    // THE TWO SECTIONS READ AS ONE SENTENCE ABOUT THE SAME SUBJECT or they read
    // as two products, which is why they are adjacent and in this order: the
    // free one first, because every business has it.
    expect(pane.textContent).toContain('Your free web address')
    expect(pane.textContent).toContain('Your domain')
    const sections = [...pane.querySelectorAll('.builder-settings__subtitle')].map(
      (node) => node.textContent,
    )
    // STILL EXHAUSTIVE, so a stray fourth section would still be caught. The
    // third is [[REQ-260]]'s record of what has been changed about the domain,
    // which is a different question asked at a different moment and therefore
    // sits BELOW the controls rather than inside them — the order above it is
    // the claim this case is making and is unchanged.
    expect(sections).toEqual(['Your free web address', 'Your domain', 'Changes to your domain'])
    expect(pane.querySelector('select.builder-domain__select')).toBeTruthy()
    expect(asked.domain).toBe(1)
    expect(app.shell.getPanel(CONFIG.SETTINGS_TAB.id).contains(pane)).toBe(true)
  })

  it('test_UAT_FC_REQ-259_the_word_domain_is_still_refused_for_the_free_address', async () => {
    const { app } = mount()
    await settle()
    await settle()
    const hostname = app.settings.hostname.element as HTMLElement
    // THE NOUNS HAVE TO AGREE ACROSS THE TWO SECTIONS. [[REQ-249]] refuses the
    // word above; adding a section that uses it correctly must not leak it
    // upward, or the distinction the two sections exist to teach is gone.
    expect((hostname.textContent ?? '').toLowerCase()).not.toContain('domain')
  })
})
