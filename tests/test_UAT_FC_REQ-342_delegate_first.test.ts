import { describe, expect, it } from 'vitest'
import {
  DELEGATION_METHOD_PROVIDER,
  DELEGATION_REMINDER_PROVIDER,
  delegationMethod,
  delegationReminder,
  primingConfig,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * [[REQ-342]] — **commissioning is the method, and it is said twice**.
 *
 * DOC-60 §F4 measured the defect precisely: `templates/delegation-method` is
 * priming entry [2] of 7, BEFORE the cache boundary, and the consultant's
 * reminder tier held nine entries of which none was about handing work over. So
 * the instruction was read once and then sat roughly 186k of prefix behind the
 * model for the rest of a sitting — while `act-rather-than-narrate`, a single
 * corrective line, rode the per-turn tail, because standing behaviour needs
 * repeating. Commissioning construction is standing behaviour.
 *
 * And the prose still described handing over as an option to be weighed against
 * doing the work yourself, which is the wrong description now that the host
 * returns its own record of what a delegation changed ([[REQ-340]]) and the
 * consultant no longer has to go and look to find out.
 *
 * THE WORDS ARE READ BACK OUT OF `priming.json`, never restated here, so an edit
 * to the document is what moves a case rather than an edit to a constant holding
 * a copy of it. What this suite pins is the SHAPE of what ships: which tier each
 * half sits in, what each half has to say, and that both halves fall silent
 * together where there is nothing to commission.
 */

/** The method as a deployment that commissions actually renders it. */
const method = delegationMethod(true) as string

/** The one line the per-turn tail carries. */
const tail = delegationReminder(true) as string

/**
 * The same words with the hard wrapping taken out.
 *
 * The templates are authored wrapped, so a sentence this suite quotes is as
 * likely as not to have a newline in the middle of it — and a case that failed
 * because a paragraph re-flowed would be a case about column widths rather than
 * about what a session is told. Structure is asserted against the raw string;
 * phrasing is asserted against this.
 */
const said = (text: string): string => text.replace(/\s+/g, ' ')
const saidInMethod = said(method)

/** Every reminder entry, in the order the consultant is sent them. */
const reminders = primingDocument.reminders as { name?: string; text?: string; provider?: string }[]

// ── 1. the method commissions, rather than offering a choice ─────────────────

describe('REQ-342 — the method prose describes commissioning, not choosing', () => {
  it('test_UAT_FC_REQ-342_the_method_says_construction_is_commissioned_rather_than_performed', () => {
    // BEHAVIOUR 1. Handing construction to a worker is how construction happens,
    // not one of two ways it might — so the prose states it as the method and
    // says so in as many words.
    expect(saidInMethod).toMatch(/commissioned/i)
    expect(saidInMethod).toMatch(/not performed|rather than performed/i)
    expect(saidInMethod).toMatch(/rather than one of two ways it might/i)
  })

  it('test_UAT_FC_REQ-342_the_method_no_longer_offers_doing_it_yourself_as_the_other_arm', () => {
    // THE SENTENCE THAT HAD TO GO. The shipped prose closed its second paragraph
    // with *"If you would have to explain the reasoning twice to hand it over, do
    // it yourself"* — a rule for CHOOSING between two arms, which is exactly the
    // description this ticket says is wrong. The reasoning test survives; what it
    // decides does not. It now decides whether the brief is finished.
    expect(saidInMethod).not.toMatch(/do it yourself/i)
    expect(saidInMethod).not.toMatch(/hand over work where/i)
    expect(saidInMethod).toMatch(/explain twice belongs in the brief/i)
  })

  it('test_UAT_FC_REQ-342_what_the_consultant_keeps_is_the_judgement', () => {
    // BEHAVIOUR 1, second half — and the three examples are kept verbatim from
    // the prose this replaces, because what the consultant keeps did not change.
    // Only what it does with the rest did.
    expect(saidInMethod).toMatch(/what the site should say/i)
    expect(saidInMethod).toMatch(/which of two arrangements is better/i)
    expect(saidInMethod).toMatch(/what to do about a request you think is wrong/i)
  })
})

// ── 2 and 3. what comes back, and what it can settle ─────────────────────────

describe('REQ-342 — the method says what comes back and which part is trustworthy', () => {
  it('test_UAT_FC_REQ-342_the_method_says_two_things_come_back', () => {
    // BEHAVIOUR 2. The worker's own account AND the host's record, named as two
    // things rather than as one result, because the whole point is that they have
    // different standing.
    expect(saidInMethod).toMatch(/two things come back/i)
    expect(saidInMethod).toMatch(/its summary, what it says it changed/i)
  })

  it('test_UAT_FC_REQ-342_the_record_is_not_the_workers_word_and_is_not_read_as_one', () => {
    // BEHAVIOUR 2, the load-bearing sentence. Everything else on a delegation
    // result is declared `untrusted`; this is the one field the host wrote, so
    // the prose says both HOW it is arrived at — which is what makes it checkable
    // rather than merely asserted — and that nothing the builder said is in it.
    expect(saidInMethod).toMatch(/worked out here, by comparing the site before and after/i)
    expect(saidInMethod).toMatch(/no part of it passing through the builder/i)
    expect(saidInMethod).toMatch(/not the builder's word/i)
  })

  it('test_UAT_FC_REQ-342_the_record_describes_a_window_and_not_an_actor', () => {
    // THE BOUNDARY DOC-60 SAYS MUST TRAVEL WITH THE DESCRIPTION. Anything that
    // wrote to the draft between the two captures is in the record, whoever wrote
    // it. So it is *what changed while the builder was working* and never *what
    // the builder changed*, or a reader leans on an attribution it never makes.
    expect(saidInMethod).toMatch(/changed on the site while it was working/i)
    expect(saidInMethod).not.toMatch(/what the builder changed/i)
  })

  it('test_UAT_FC_REQ-342_the_method_says_not_to_go_back_to_the_site_to_establish_either', () => {
    // BEHAVIOUR 2, the consequence that is the entire saving. Read the record for
    // what happened, the account for why, and neither by looking.
    expect(saidInMethod).toMatch(/read it for what happened/i)
    expect(saidInMethod).toMatch(/read the account for why/i)
    expect(saidInMethod).toMatch(/do not go back to the site to establish either/i)
    expect(saidInMethod).toMatch(/does not save the tokens, it moves them to the more expensive side/i)
  })

  it('test_UAT_FC_REQ-342_the_method_says_the_record_cannot_settle_whether_the_change_was_right', () => {
    // BEHAVIOUR 3. The record is trusted about WHAT changed and makes no claim
    // about whether it should have — it will report a builder that did precisely
    // the wrong thing, faithfully. So judgement stays here, and so does looking.
    expect(saidInMethod).toMatch(/what changed, not whether it should have/i)
    expect(saidInMethod).toMatch(/precisely the wrong thing/i)
    expect(saidInMethod).toMatch(/judging the result against the brief is still your work/i)
    expect(saidInMethod).toMatch(/looking at the rendered page is still how that work is done/i)
  })

  it('test_UAT_FC_REQ-342_the_method_says_when_looking_is_the_right_answer', () => {
    // BEHAVIOUR 3's other edge. "Do not re-inspect" without "except here" is an
    // instruction a model will either over-apply or quietly ignore, so the three
    // cases that DO earn a look are named: the record and the brief not meeting,
    // a failed check, and an unanswered one.
    expect(saidInMethod).toMatch(/when the record and the brief do not meet/i)
    expect(saidInMethod).toMatch(/when a check came back failed/i)
    expect(saidInMethod).toMatch(/came back unanswered/i)
    expect(saidInMethod).toMatch(/and not otherwise/i)
  })
})

// ── 6. what already worked is kept ───────────────────────────────────────────

describe('REQ-342 — the parts the measurements vindicate are kept', () => {
  it('test_UAT_FC_REQ-342_the_brief_is_still_written_for_a_reader_who_was_not_here', () => {
    // BEHAVIOUR 6. The brief is prose because intent cannot be enumerated, and a
    // reader who cannot see the conversation cannot infer the constraints that
    // were never said aloud in it. Nothing about that moved.
    expect(saidInMethod).toMatch(/write the brief for someone who cannot see this conversation/i)
    expect(saidInMethod).toMatch(/constraints you would have applied silently/i)
  })

  it('test_UAT_FC_REQ-342_the_checks_are_still_asked_for_and_still_believed', () => {
    // BEHAVIOUR 6, second half, and the one place this ticket could have done
    // damage. The verdicts are still the worker's word — the record does not
    // replace them, it stands beside them — and a verdict the consultant re-makes
    // itself is a verdict that saved it nothing.
    expect(saidInMethod).toMatch(/say what you would have checked afterwards, and ask for exactly that/i)
    expect(saidInMethod).toMatch(/"the page looks right"/i)
    expect(saidInMethod).toMatch(/when the checks come back passed, believe them/i)
  })
})

// ── 4. the method is repeated in the per-turn tail ───────────────────────────

describe('REQ-342 — the method survives a long sitting', () => {
  it('test_UAT_FC_REQ-342_the_reminder_tier_now_carries_an_entry_about_commissioning', () => {
    // BEHAVIOUR 4, and the measured defect itself: nine entries, none of them
    // about handing work over, while the method sat before the cache boundary
    // being read exactly once.
    const entry = reminders.find((e) => e.provider === DELEGATION_REMINDER_PROVIDER)

    expect(entry).toBeDefined()
    // A `provider:` and never `text:`, for the reason the method entry is one.
    expect(entry).not.toHaveProperty('text')
  })

  it('test_UAT_FC_REQ-342_the_standing_instruction_rides_beside_the_other_standing_lines', () => {
    // WHERE IT SITS IS THE ARGUMENT. `act-rather-than-narrate` is the precedent
    // this ticket cites — one corrective line, in the tail, because standing
    // behaviour needs repeating — and the new entry is the same kind of thing, so
    // it goes next to it rather than among the volatile providers.
    const names = reminders.map((e) => e.name)
    const standing = names.indexOf('act-rather-than-narrate')

    expect(names[standing + 1]).toBe('commission-construction')
  })

  it('test_UAT_FC_REQ-342_the_tail_carries_the_standing_instruction_and_not_the_whole_method', () => {
    // BEHAVIOUR 4's constraint, and it is an economic one rather than a stylistic
    // one: the tail is re-assembled every turn and everything in it is paid for on
    // every turn, where the method is paid for once per sitting. Binding the tail
    // to the method's own provider would have been one line of configuration and
    // would have put the whole method on every turn.
    expect(tail).not.toBe(method)
    expect(tail).not.toContain('\n')
    expect(tail.length).toBeLessThan(method.length / 5)
  })

  it('test_UAT_FC_REQ-342_the_tail_says_the_instruction_and_the_one_consequence_that_pays', () => {
    // WHAT A LINE THAT SHORT HAS TO CARRY: that construction is commissioned, and
    // the single behaviour that recovers the cost — reading the record instead of
    // going back to the site. The rest of the method stays in the prefix.
    expect(tail).toMatch(/commissioned, not performed/i)
    expect(tail).toMatch(/read the record of what changed rather than going back to the site/i)
  })
})

// ── 4, continued. both halves fall silent together ───────────────────────────

describe('REQ-342 — a deployment that commissions nothing is told nothing', () => {
  it('test_UAT_FC_REQ-342_both_entries_render_nothing_with_the_switch_off', async () => {
    // BEHAVIOUR 4's last sentence, and REQ-295's condition 1 extended to the
    // entry this ticket adds. `null` drops an entry and its separator, so the
    // switch stays a true rollback — and a session with no `delegate` tool is not
    // told to commission, which would otherwise now be an instruction repeated on
    // every turn rather than merely stated once.
    const lib = await aiCore()
    const bind = (delegating: boolean): Untyped => {
      const providers = new lib.PrimingProviders()
      registerSiteProviders(providers, {
        slug: 'delegation-fixture',
        box: { manual: async () => '## Your tools' },
        signal: () => undefined,
        delegating,
      })
      return providers
    }

    expect(await bind(false).get(DELEGATION_METHOD_PROVIDER)({})).toBeNull()
    expect(await bind(false).get(DELEGATION_REMINDER_PROVIDER)({})).toBeNull()
    // AND THE DEFAULT IS OFF, which is the safe direction for a host that never
    // answered the question.
    expect(delegationReminder(false)).toBeNull()

    // With the switch on, both render — the SHIPPED words, not a copy of them.
    expect(await bind(true).get(DELEGATION_METHOD_PROVIDER)({})).toBe(
      primingDocument.templates['delegation-method'],
    )
    expect(await bind(true).get(DELEGATION_REMINDER_PROVIDER)({})).toBe(
      primingDocument.templates['delegation-reminder'],
    )
  })

  it('test_UAT_FC_REQ-342_the_tail_entry_is_registered_whichever_way_the_switch_points', () => {
    // The reminder tier names the entry unconditionally, so a registry that bound
    // it only when delegating could not load the consultant's role at all. That
    // is the same rule the method entry and the digest provider already follow,
    // and it is why the condition lives in what the provider RETURNS.
    const config = primingConfig(true) as { reminders: { provider?: string }[] }

    expect(config.reminders.some((e) => e.provider === DELEGATION_REMINDER_PROVIDER)).toBe(true)
  })
})

// ── 5. nothing in the prose is configuration ─────────────────────────────────

describe('REQ-342 — the prose names no model, no backend and no price', () => {
  it('test_UAT_FC_REQ-342_neither_half_names_a_backend_this_deployment_configured', () => {
    // BEHAVIOUR 5. Which backend a worker runs on is `delegation.json`, and which
    // model a backend is is `backends.json`. Prose that named either would be
    // configuration copied into words nobody would think to update — and it would
    // be false the day the document changed, which is the point of the rule
    // rather than a consequence of it.
    const names = [
      ...Object.keys(backendsDocument).filter((key) => key !== 'about'),
      ...Object.values(
        (delegationDocument as { workers: Record<string, { backend: string }> }).workers,
      ).map((worker) => worker.backend),
    ]

    for (const name of names) {
      expect(saidInMethod).not.toContain(name)
      expect(tail).not.toContain(name)
    }
  })

  it('test_UAT_FC_REQ-342_neither_half_names_a_model_or_a_price', () => {
    // THE SAME RULE, AT THE TWO SHAPES A LEAK ACTUALLY TAKES. A model name is the
    // obvious one. A price is the one the replaced prose really carried — it
    // opened by calling the worker *"a second, cheaper session"*, which is a claim
    // about a rate that `delegation.json` alone decides, and is simply untrue of a
    // deployment that points a worker at the same backend the consultant runs on.
    for (const half of [saidInMethod, tail]) {
      expect(half).not.toMatch(/claude|opus|sonnet|haiku/i)
      expect(half).not.toMatch(/[$£€]\s*\d/)
      expect(half).not.toMatch(/\bcheaper\b|\bcheap\b/i)
    }
  })
})
