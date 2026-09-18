/**
 * BUG-108 — the round prompt said both "you file the ticket yourself" and "you
 * never file".
 *
 * WHY THIS IS NOT COSMETIC. The two halves were not two opinions; only one of
 * them was implementable. [[REQ-262]] D10 deleted the console's filing relay —
 * `ticket.ts`'s header says so in as many words — so a round that obeyed the
 * hand-back half had nowhere to put the ticket it wrote: §7's closing block
 * carries `ticketId` and `bugTickets`, which are ids, and has no field for a
 * body. Its whole diagnosis would be discarded, and a `"filed"` block with no
 * `ticketId` is read by `confirm` as a failed round.
 *
 * WHAT IS ASSERTED, AND AGAINST WHAT. The one string the round actually reads:
 * `buildPrompt(brief, context)`, brief and round context joined exactly as the
 * console joins them. Asserting against either half alone is what let the two
 * drift apart — each was internally consistent and the contradiction lived only
 * in the join.
 *
 * NORMALISED, BECAUSE THESE ARE ASSERTIONS ABOUT PROSE. Line wrapping and
 * blockquote markers are layout; a phrase that moved across a line break has
 * not been removed, and failing on that teaches the next editor to fight the
 * formatting rather than to keep the rule. Same normalisation the REQ-262 suite
 * uses on the brief.
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildPrompt, readBrief } from '../tools/repro-console/src/ai'
import { ROUND_CREATED_BY } from '../tools/repro-console/src/ticket'

/** A round context with the fields the prompt needs and nothing this suite varies. */
function roundContext(over: Record<string, unknown> = {}): Parameters<typeof buildPrompt>[1] {
  return {
    n: 4,
    slug: 'repro-gigabytealchemy-ai',
    originalUrl: 'https://gigabytealchemy.ai',
    bundleDir: '/tmp/bundle',
    evidenceDir: '/tmp/evidence',
    pageDocument: '/tmp/page.json',
    siteDir: '/tmp/site',
    gate: null,
    rail: { available: false, summary: 'not run' },
    knownGaps: [],
    ...over,
  } as Parameters<typeof buildPrompt>[1]
}

/** The whole prompt, flattened — layout is not the subject of any assertion here. */
const prompt = (over: Record<string, unknown> = {}): string =>
  buildPrompt(readBrief(), roundContext(over))
    .replace(/^\s*>\s?/gm, '')
    .replace(/\s+/g, ' ')

describe('BUG-108 the round prompt says who files, once, and in one direction', () => {
  it('test_UAT_FC_BUG_108_the_prompt_tells_the_round_to_file_its_own_ticket', () => {
    const text = prompt()

    // The standing brief's half, which is the one the code implements.
    expect(text).toMatch(/Your deliverable is a ticket you file yourself/i)
    expect(text).toContain('xgd ticket create')
    // And the round context, appended beneath it, now agrees rather than
    // reversing it.
    expect(text).toMatch(/You file\. Nothing is handed back to be filed for you/i)
  })

  it('test_UAT_FC_BUG_108_no_hand_back_instruction_survives_anywhere_in_the_prompt', () => {
    const text = prompt()

    // The verbatim phrases the round-context half used. Each one, on its own,
    // told a round to discard its work — so each is asserted absent by name
    // rather than by a single loose pattern that a rewording would slip past.
    expect(text).not.toMatch(/You still do not file/i)
    expect(text).not.toMatch(/the console creates it/i)
    expect(text).not.toMatch(/Never create one yourself/i)
    expect(text).not.toMatch(/the console files each one/i)
    expect(text).not.toMatch(/hand the ticket back/i)
    expect(text).not.toMatch(/What you hand back/i)
  })

  it('test_UAT_FC_BUG_108_secondary_bugs_are_filed_and_reported_as_ids', () => {
    // The §7 block carries `bugTickets`, which is a list of ids. The round
    // context used to say bugs were "handed back in `bugs`" — a field that does
    // not exist, describing a body the block cannot carry.
    const text = prompt()

    expect(text).toContain('bugTickets')
    expect(text).toMatch(/Anything else you tripped over is its own bug ticket/i)
    expect(text).toMatch(/name its id in `bugTickets`/i)
  })

  it('test_UAT_FC_BUG_108_the_ready_status_warning_survives_the_edit', () => {
    // The paragraph that was replaced carried two instructions, and only one of
    // them was wrong. `ready_*` is the mistake that spends real money while
    // nobody is watching — losing it while fixing the other would be a strictly
    // worse outcome than the bug this ticket is about.
    const text = prompt()

    expect(text).toContain('`ready_*` status')
    expect(text).toContain('dispatcher trigger')
    expect(text).toMatch(/status: draft/)
  })

  it('test_UAT_FC_BUG_108_the_literal_created_by_for_this_round_is_in_the_prompt', () => {
    // `wrongProvenance` reports any ticket whose `created_by` does not start
    // with the marker, and the round types that string by hand. Handing it over
    // whole — rather than asking the round to assemble it from a slug and an
    // iteration stated elsewhere — is what makes it un-mis-assemblable.
    expect(prompt()).toContain(`${ROUND_CREATED_BY}:repro-gigabytealchemy-ai#4`)

    // And it tracks the round it is actually for, rather than being a constant
    // that happens to match one fixture.
    expect(prompt({ n: 12, slug: 'repro-faelan-com' })).toContain(`${ROUND_CREATED_BY}:repro-faelan-com#12`)
  })

  it('test_UAT_FC_BUG_108_the_brief_on_disk_is_the_one_the_prompt_carries', () => {
    // `readBrief` reads a file in the repository ([[REQ-262]] behavior 11), so
    // the corrected text is a diff somebody reviews rather than a string in the
    // console. Guard that this suite is asserting against that file and not a
    // default that drifted from it.
    const briefFile = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'tools',
      'repro-console',
      'brief',
      'DIAGNOSE-THE-GAP.md',
    )
    expect(prompt()).toContain(readBrief(briefFile).split('\n')[0].trim())
  })
})
