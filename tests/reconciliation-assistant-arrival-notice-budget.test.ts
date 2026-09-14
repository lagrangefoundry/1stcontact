import { describe, expect, it } from 'vitest'
import {
  DELTA_BUDGET_CHARS,
  deltaLine,
  type DeltaEntry,
} from '../apps/control-app/src/session-delta'

/**
 * **What an arrival notice does when it will not fit** (story-3cf3d57b — AC-1800,
 * AC-1801).
 *
 * WHY THESE TWO ARE ASSERTED ON THE NOTICE AND NOT THROUGH A TURN. Both criteria
 * are claims about a *character budget at its boundary* — forty-one arrivals whose
 * titles far exceed it, and a single title several times longer than the whole of
 * it. Routing either through workerd would need forty-one real uploads to say
 * something that is not about uploading at all, and the claim would be no more
 * true for the journey. The notice these tests read is the same string the turn
 * carries: `caretakerReminder` appends whatever {@link deltaLine} returns and
 * changes not a character of it, and the end-to-end evidence that it reaches a
 * real turn in that form is the sibling workers suite (AC-1798, AC-1807).
 *
 * THE BUDGET IS IN CHARACTERS, which is why the bound below is stated against
 * {@link DELTA_BUDGET_CHARS} rather than against a literal: the thing being
 * bounded is context, and ten titles cost a different amount depending on how long
 * they are. The `+ 200` allowance is the fixed framing the budget does not cover —
 * the count, the noun, the "and N more", the closing instruction — which is
 * constant in the number of arrivals, and that constancy is itself the property
 * the length assertion exists to check.
 */

/** One arrival, as the change feed hands it over: a uid, a title, an instant. */
function arrival(title: string, at: string, uid = `material-${title}`): DeltaEntry {
  return { uid, title, updated_at: at }
}

describe("an arrival notice above its budget truncates titles and never the count", () => {
  it('test_UAT_AC1800_forty_one_arrivals_keep_an_exact_count_and_lose_only_titles', () => {
    // A BULK IMPORT, which is the case the cap exists for: a capture run or a
    // folder drop puts dozens of documents into the corpus at once, and an
    // unbounded notice would reintroduce on the reminder exactly the pile that
    // priming exists to keep out of the prompt.
    //
    // Oldest first, because that is the order the feed reports in and the order
    // the AC names: the titles that survive truncation are the ones the client
    // uploaded first, which are the ones the conversation is most likely already
    // about.
    const arrivals = Array.from({ length: 41 }, (_, i) =>
      arrival(
        `A deliberately long client material title, number ${i}`,
        `2026-09-01T10:${String(i).padStart(2, '0')}:00Z`,
        `material-${i}`,
      ),
    )

    const notice = deltaLine(arrivals)
    expect(notice).not.toBeNull()

    // THE COUNT IS EXACT AND COMPLETE. Forty-one, stated as forty-one. The
    // magnitude is one integer and it is the one part of the event that cannot be
    // recovered by searching, so it is never what gets dropped.
    expect(notice).toContain('41 documents')

    // A SAMPLE SURVIVES, and it begins at the oldest arrival — so the notice
    // carries both the magnitude and a handhold rather than only a number.
    expect(notice).toContain('"A deliberately long client material title, number 0"')

    // AND IT SAYS HOW MANY IT DID NOT NAME, so the gap between the count and the
    // titles is stated rather than left for the reader to infer.
    expect(notice).toMatch(/and \d+ more/)
    const more = Number(/and (\d+) more/.exec(notice!)![1])
    const named = (notice!.match(/"/g) ?? []).length / 2
    expect(named + more).toBe(41)
    // Truncation really happened — otherwise every clause above would be
    // satisfied by a notice that simply named all forty-one.
    expect(named).toBeGreaterThan(0)
    expect(named).toBeLessThan(41)

    // THE WHOLE NOTICE STAYS BOUNDED. Asserted against the budget rather than
    // against the length of the input: a notice that grew with the number of
    // arrivals would pass a "shorter than the titles" check and still be the
    // unbounded thing the cap forbids.
    expect(notice!.length).toBeLessThan(DELTA_BUDGET_CHARS + 200)
  })
})

describe('a single title longer than the whole budget is clipped and still named', () => {
  it('test_UAT_AC1801_one_oversized_title_is_clipped_rather_than_dropped', () => {
    // THE DEGENERATE CASE OF THE CAP. One title several times the budget: a
    // notice that reported "1 document arrived" while naming nothing would
    // announce that something happened and withhold the only part of it the
    // assistant could act on.
    const title = 'Ravenswood '.repeat(200)
    const notice = deltaLine([arrival(title, '2026-09-01T10:00:00Z', 'material-huge')])

    expect(notice).not.toBeNull()
    // It reports one document, in the singular.
    expect(notice).toContain('1 document')
    // …and it shows the beginning of the title rather than nothing at all.
    expect(notice).toContain('"Ravenswood Ravenswood')
    // …clipped, not whole: the document is named without the notice becoming the
    // document.
    expect(notice).not.toContain(title)
    expect(notice!.length).toBeLessThan(DELTA_BUDGET_CHARS + 200)
  })
})
