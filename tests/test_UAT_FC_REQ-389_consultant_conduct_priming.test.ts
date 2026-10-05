import { describe, expect, it } from 'vitest'
import { delegationMethod, delegationReminder, primingConfig } from '../tools/generate/src/cli/ai/roles'
import planSurface from '../tools/generate/src/cli/ai/plan-surface.json'

/**
 * [[REQ-389]] — **five habits from the Charlie's Plumbing 3 debrief, in what the
 * consultant is told.**
 *
 * THE WORDS ARE READ BACK OUT OF `priming.json` through the same functions the
 * host renders them with, never restated here, so an edit to the document is
 * what moves a case. Phrasing is asserted against the text with its hard
 * wrapping taken out.
 */

type Entry = { name?: string; text?: string }
const said = (text: string): string => text.replace(/\s+/g, ' ')
const textOf = (entries: unknown): string =>
  said((entries as Entry[]).map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n'))

const orders = { 'with corpus': true, 'without corpus': false }

describe('REQ-389 — the consultant is told the five rules, in both priming orders', () => {
  for (const [label, withCorpus] of Object.entries(orders)) {
    const priming = textOf(primingConfig(withCorpus).priming)

    it(`test_UAT_FC_REQ-389_finish_and_check_every_width_before_handing_back (${label})`, () => {
      // 2. Checked against the brief and fixed in the same turn; never asking
      // permission to fix its own mistakes.
      expect(priming).toMatch(/checked against the brief before your turn ends/i)
      expect(priming).toMatch(/badly cropped photograph.*out of line.*missing/i)
      expect(priming).toMatch(/never ask for permission to go back and fix your own mistakes/i)
      // 3. Every width after a change to the top of the page, and the client's.
      expect(priming).toMatch(/header, the navigation or the top of the page/i)
      expect(priming).toMatch(/desktop, tablet and phone/i)
      expect(priming).toMatch(/the width your client is viewing/i)
    })

    it(`test_UAT_FC_REQ-389_no_contact_detail_without_the_clients_yes (${label})`, () => {
      // 1. Email, personal phone, home address, a person's name — only after a yes;
      // the business phone is the usual exception, still confirmed once.
      expect(priming).toMatch(/email address, a personal phone number, a home address or a person's name/i)
      expect(priming).toMatch(/only after your client has said yes/i)
      expect(priming).toMatch(/letterhead/i)
      expect(priming).toMatch(/business phone number .* usual exception/i)
      expect(priming).toMatch(/confirm it with them once/i)
      expect(priming).toContain('approve_detail')
    })

    it(`test_UAT_FC_REQ-389_questions_in_the_clients_terms_and_no_parallel_claims (${label})`, () => {
      // 5. The client's real situation, concrete alternatives, never a metaphor.
      expect(priming).toMatch(/real situation/i)
      expect(priming).toMatch(/comparable sites, versions you have drawn up/i)
      expect(priming).toMatch(/never ask a question as a metaphor/i)
      // 4. One at a time; estimates add up rather than overlap.
      expect(priming).toMatch(/one piece at a time, never several at once/i)
      expect(priming).toMatch(/add the pieces' times together/i)
    })
  }

  it('test_UAT_FC_REQ-389_the_delegate_method_and_reminders_say_builders_run_one_at_a_time', () => {
    for (const writing of [false, true]) {
      const method = said(delegationMethod(true, writing) as string)
      expect(method).toMatch(/builders run one at a time/i)
      expect(method).toMatch(/never at the same time/i)
      expect(method).toMatch(/add each build's time together rather than overlapping/i)
      expect(delegationReminder(true, writing)).toMatch(/one at a time, never in parallel/i)
    }
  })

  it('test_UAT_FC_REQ-389_the_plan_surface_declares_how_an_approval_is_recorded', () => {
    const ops = planSurface.operations as { op: string; description: string; params: Record<string, unknown> }[]
    const approve = ops.find((o) => o.op === 'approve_detail')
    expect(approve).toBeDefined()
    expect(Object.keys(approve!.params).sort()).toEqual(['detail', 'quote'])
    expect(said(approve!.description)).toMatch(/letterhead or an uploaded document is not a yes/i)
    expect(ops.find((o) => o.op === 'set_ask')!.params).toHaveProperty('approves')
    const keepAsks = (planSurface.groups as { group: string; operations: string[] }[]).find((g) => g.group === 'KeepAsks')
    expect(keepAsks!.operations).toContain('approve_detail')
  })
})
