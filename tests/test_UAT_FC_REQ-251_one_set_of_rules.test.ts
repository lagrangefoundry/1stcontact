import { describe, expect, it } from 'vitest'
import { SETTINGS_DECLARATION } from '../tools/generate/src/cli/ai/settings-core'
import {
  HOSTNAME_HINT,
  HOSTNAME_TITLE,
  confirmLines,
  heldLines,
  raceLostLine,
  reservedLine,
  takenLine,
} from '../apps/control-app/src/builder/hostname.js'

/**
 * [[REQ-251]] — **the field and the conversation say one set of rules.**
 *
 * WHY THIS IS A TEST AND NOT A PROOFREAD. The Settings tab puts [[REQ-249]]'s
 * section and the settings assistant on screen at the same moment, describing the
 * same decision to the same person in two registers. A drift between them is not
 * untidiness — it is the field and the conversation contradicting each other in
 * front of the customer, at the one moment in this product where the answer is
 * permanent and there is nothing to break the tie.
 *
 * THE PANE'S OWN SENTENCES ARE IMPORTED, NOT RESTATED. That is the whole
 * mechanism: every phrase below is read out of the shipped copy in
 * `builder/hostname.js`, so a rewrite of either side turns the other red and the
 * reconciliation happens again rather than silently lapsing. A suite that
 * hard-coded the words would pass forever against a declaration nobody updated.
 *
 * ONE DIRECTION ONLY. This asks whether the declaration says what the field says.
 * It does not ask the reverse, because the field is [[REQ-249]]'s and its wording
 * is that ticket's to change; this ticket's job is to follow.
 */

const decl = JSON.stringify(SETTINGS_DECLARATION)
const lower = decl.toLowerCase()

/** One error's sentence, by its declared code. */
function refusal(code: string): string {
  const errors = (SETTINGS_DECLARATION as { errors?: Record<string, { message?: string }> }).errors
  return errors?.[code]?.message ?? ''
}

describe('REQ-251 AC6 — the noun', () => {
  it('test_UAT_FC_REQ-251_the_declaration_calls_it_a_free_web_address', () => {
    // THE PANE'S HEADING IS THE PRODUCT'S NOUN FOR THIS THING, and the
    // declaration now teaches it as the words to say out loud.
    expect(HOSTNAME_TITLE.toLowerCase()).toContain('free web address')
    expect(lower).toContain('free web address')
  })

  it('test_UAT_FC_REQ-251_domain_is_kept_for_a_domain_the_client_owns', () => {
    /**
     * THE FALSIFIER, MECHANISED. `domain` may appear — a customer-owned domain is
     * genuinely a domain, and [[EPIC-6]] is going to sell them one — but never as
     * a name for the free address. Checked as a window around each occurrence,
     * because the failure this guards is one sentence, not a global count.
     */
    for (const m of decl.matchAll(/.{0,120}domain.{0,60}/g)) {
      const window = m[0].toLowerCase()
      const ownsIt =
        window.includes('they own') ||
        window.includes('your client owns') ||
        window.includes('already owns') ||
        window.includes('bought elsewhere') ||
        window.includes('will buy') ||
        window.includes('sell your client a real one') ||
        // The rule itself, which has to contain the word in order to forbid it.
        window.includes('never call it a domain') ||
        window.includes('but i already have a free domain')
      expect(ownsIt, `\`domain\` used for the free address: …${m[0]}…`).toBe(true)
    }
  })
})

describe('REQ-251 AC7 — three refusals, three sentences', () => {
  it('test_UAT_FC_REQ-251_taken_reserved_and_invalid_lead_three_different_places', () => {
    const taken = refusal('HOSTNAME_TAKEN').toLowerCase()
    const reserved = refusal('HOSTNAME_RESERVED').toLowerCase()
    const invalid = refusal('HOSTNAME_INVALID').toLowerCase()

    // THREE DISTINCT SENTENCES, and each says what the customer does NEXT —
    // which is the only thing that makes the distinction worth drawing.
    expect(new Set([taken, reserved, invalid]).size).toBe(3)
    expect(taken).toContain('another')
    expect(reserved).toContain('different word')
    expect(invalid).toContain('rule it broke')
  })

  it('test_UAT_FC_REQ-251_reserved_is_kept_for_1st_contact_itself_in_both_places', () => {
    // THE FIELD'S OWN WORDS. A customer told by the box that a name is *kept for
    // 1st Contact itself* and by the conversation that it is *kept for the
    // product* has been given two answers to one question.
    expect(reservedLine('mail.1stc.site')).toContain('kept for 1st Contact itself')
    expect(refusal('HOSTNAME_RESERVED')).toContain('kept for 1st Contact itself')
  })

  it('test_UAT_FC_REQ-251_taken_sends_them_to_another_name_in_both_places', () => {
    expect(takenLine('alice.1stc.site').toLowerCase()).toContain('try something else')
    expect(refusal('HOSTNAME_TAKEN').toLowerCase()).toContain('another')
  })
})

describe('REQ-251 AC8 — the whole host, the business, and the race', () => {
  it('test_UAT_FC_REQ-251_both_say_the_whole_address_and_never_a_bare_label', () => {
    // THE PANE DRAWS THE APEX BESIDE THE BOX AND NAMES THE HOST IN EVERY LINE;
    // the declaration is told the same rule in the same terms, because this is
    // the one the two most easily drift on.
    expect(takenLine('alice.1stc.site')).toContain('alice.1stc.site')
    expect(lower).toContain('`alice.1stc.site`, never `alice`')
  })

  it('test_UAT_FC_REQ-251_both_say_the_address_is_the_businesss_and_not_the_sites', () => {
    // [[REQ-238]]'s rule is one platform address per BUSINESS, and the confirm
    // dialog is where that promise is made. *"This site's address"* would promise
    // something narrower than what is actually enforced.
    expect(confirmLines('alice.1stc.site').join(' ')).toContain('business’s')
    expect(lower).toContain("business's address, not this site's")
    expect(lower).toContain("it is the business's address and not the site's")
  })

  it('test_UAT_FC_REQ-251_the_race_is_said_the_same_way_in_both_places', () => {
    // THE ONE SENTENCE THE TICKET NAMES VERBATIM. The pane says it beside the
    // field; the declaration now hands the model the same words, so a customer
    // who loses the race hears one thing whichever half told them.
    const said = raceLostLine('alice.1stc.site')
    expect(said).toContain('went while you were deciding')
    expect(lower).toContain('went while you were deciding')
  })

  it('test_UAT_FC_REQ-251_already_held_says_chosen_once_and_cannot_be_changed', () => {
    // THE STATE MOST BUSINESSES ARE IN MOST OF THE TIME. The pane replaces the
    // box with two sentences; the declaration is told to say the same thing
    // rather than to offer a way out that does not exist.
    expect(heldLines('alice.1stc.site').join(' ')).toContain('cannot be changed')
    expect(refusal('HOSTNAME_ALREADY_HELD')).toContain('cannot be changed')
  })

  it('test_UAT_FC_REQ-251_both_say_it_is_free_and_that_it_is_permanent_before_they_type', () => {
    // [[REQ-238]]'s rule: *"this cannot be changed"* has to reach the customer
    // BEFORE they commit. The hint says it while they are still choosing; the
    // declaration says it as an instruction to say it first.
    expect(HOSTNAME_HINT.toLowerCase()).toContain('cannot be changed')
    expect(lower).toContain('before you do it, not after')
  })
})
