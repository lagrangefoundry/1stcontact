import { describe, expect, it } from 'vitest'
import {
  DELTA_BUDGET_CHARS,
  advance,
  deltaLine,
  storedCursor,
  type Cursor,
  type DeltaEntry,
} from '../apps/control-app/src/session-delta'
import { coRank, type RankedHit } from '../apps/control-app/src/session-knowledge'

/**
 * REQ-160 — **the delta channel's arithmetic**.
 *
 * The three rules [[DOC-39]] §6.4 states as requirements rather than polish, and
 * the merge rule the co-ranked surface rests on. All four are pure functions
 * over plain data, which is why they are asserted here rather than through a
 * turn: a claim about what a cap does at its boundary is not made more true by
 * routing it through workerd, and it is made much harder to read.
 *
 * The end-to-end evidence — a real turn, a real corpus, a real chat ticket — is
 * `test_UAT_FC_REQ-160_two_kb_session.workers.test.ts`. These are its edges.
 */

function entry(title: string, at: string, uid = `m-${title}`): DeltaEntry {
  return { uid, title, updated_at: at }
}

function hit(title: string, score: number, kb: string): RankedHit {
  return { uid: `u-${title}`, title, score, kbs: [kb] }
}

describe('REQ-160 — the delta channel', () => {
  it('test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens', () => {
    // NOT "nothing new", NOT a heading, NOT an empty string that a caller might
    // join into the reminder anyway. A line that appears every turn and is
    // almost always empty teaches the model that this region carries no
    // information — which is precisely the region the non-empty case has to be
    // noticed in. `null` is the type saying so.
    expect(deltaLine([])).toBeNull()
  })

  it('test_UAT_FC_REQ-160_a_delta_names_what_arrived_and_counts_it_exactly', () => {
    const line = deltaLine([
      entry('Brand guidelines 2024', '2026-09-01T10:00:00Z'),
      entry('Q3 positioning note', '2026-09-01T10:01:00Z'),
    ])
    expect(line).not.toBeNull()
    expect(line).toContain('2 documents')
    expect(line).toContain('"Brand guidelines 2024"')
    expect(line).toContain('"Q3 positioning note"')
    // No excerpts, no summaries, no rights annotations — the AI now knows the
    // material exists and can search it, which is the entire job.
    expect(line!.length).toBeLessThanOrEqual(DELTA_BUDGET_CHARS + 200)

    // The singular is not a cosmetic detail: "1 documents" is the tell of a
    // machine-generated line, and this one is read by something that is very
    // good at noticing register.
    expect(deltaLine([entry('One thing', '2026-09-01T10:00:00Z')])).toContain('1 document ')
  })

  it('test_UAT_FC_REQ-160_a_delta_above_the_cap_is_truncated_but_the_count_is_not', () => {
    // A bulk import or a capture run can put hundreds of entries in one turn, and
    // an unbounded delta reintroduces the pile priming exists to avoid.
    const many = Array.from({ length: 41 }, (_, i) =>
      entry(`A reasonably long material title number ${i}`, `2026-09-01T10:${String(i).padStart(2, '0')}:00Z`),
    )
    const line = deltaLine(many)!
    expect(line.length).toBeLessThan(DELTA_BUDGET_CHARS + 200)

    // THE COUNT IS ALWAYS EXACT. A character budget is a hard stop on content,
    // but the magnitude is one integer and is the one thing that cannot be
    // recovered by searching for it — so it is never what gets truncated.
    expect(line).toContain('41 documents')
    expect(line).toMatch(/and \d+ more/)
    // And a sample survives, so the AI has both the magnitude and a handhold.
    expect(line).toContain('"A reasonably long material title number 0"')
  })

  it('test_UAT_FC_REQ-160_a_single_oversized_title_is_clipped_rather_than_dropped', () => {
    // The degenerate case of the cap: one title longer than the whole budget. A
    // delta that reported "1 document arrived" while naming none would announce
    // that something happened and withhold the only part that is actionable.
    const line = deltaLine([entry('x'.repeat(2000), '2026-09-01T10:00:00Z')])!
    expect(line).toContain('1 document')
    expect(line).toContain('"xxx')
    expect(line.length).toBeLessThan(DELTA_BUDGET_CHARS + 200)
  })

  it('test_UAT_FC_REQ-160_the_cursor_does_not_re_report_the_document_it_stopped_on', () => {
    // THE INCLUSIVE-BOUNDARY BUG THIS EXISTS TO PREVENT. The change feed's
    // predicate is `updated_at >= cursor`, so a cursor set to the newest
    // timestamp sweeps that document up again on the very next turn — and every
    // turn after it. The boundary therefore travels with the uids that sat
    // exactly on it.
    const start: Cursor = { at: '2026-09-01T09:00:00Z', seen: [] }
    const first = [entry('Brand guidelines', '2026-09-01T10:00:00Z', 'm-1')]
    const next = advance(start, first)

    expect(next.at).toBe('2026-09-01T10:00:00Z')
    expect(next.seen).toEqual(['m-1'])

    // A second turn with nothing new leaves the cursor exactly where it was.
    expect(advance(next, [])).toEqual(next)

    // And a genuinely newer document moves the boundary, dropping a `seen` list
    // that is now behind it — the list is bounded by one timestamp's worth of
    // ties, never by the corpus.
    const later = advance(next, [entry('Q3 note', '2026-09-01T11:00:00Z', 'm-2')])
    expect(later).toEqual({ at: '2026-09-01T11:00:00Z', seen: ['m-2'] })
  })

  it('test_UAT_FC_REQ-160_documents_sharing_the_boundary_timestamp_all_travel_with_it', () => {
    // A bulk import writes many documents in one instant. Remembering only one of
    // them would re-announce the rest forever.
    const start: Cursor = { at: '2026-09-01T09:00:00Z', seen: [] }
    const tie = '2026-09-01T10:00:00Z'
    const next = advance(start, [
      entry('a', tie, 'm-a'),
      entry('b', tie, 'm-b'),
      entry('c', '2026-09-01T09:30:00Z', 'm-c'),
    ])
    expect(next.at).toBe(tie)
    expect([...next.seen].sort()).toEqual(['m-a', 'm-b'])
  })

  it('test_UAT_FC_REQ-160_a_corrupt_cursor_costs_a_sweep_and_never_a_turn', () => {
    // The same judgement REQ-159 made for its transcript cursors: a bookkeeping
    // field that will not parse is worth one over-wide sweep, which re-announces
    // a document at worst. Failing the conversation over it would be the more
    // expensive answer by a wide margin.
    expect(storedCursor({ fields: { kb_cursor: 'not json' } } as never)).toBeNull()
    expect(storedCursor({ fields: {} } as never)).toBeNull()
    expect(storedCursor(null)).toBeNull()
    expect(
      storedCursor({ fields: { kb_cursor: '{"at":"2026-09-01T10:00:00Z"}' } } as never),
    ).toEqual({ at: '2026-09-01T10:00:00Z', seen: [] })
  })

  it('test_UAT_FC_REQ-160_hits_from_two_independent_indexes_are_co_ranked', () => {
    // The knowledge bases stay independent — two corpora, two indexes, two build
    // cadences — and meet only here, where results are presented. The merge sorts
    // on the component's OWN score and does nothing else: no re-weighting, no
    // re-scoring, because a second answer to "how are hits ordered" is exactly
    // what the component's search module refuses to have.
    const merged = coRank(
      [
        [hit('the client paper', 0.9, 'project'), hit('another upload', 0.4, 'project')],
        [hit('a design document', 0.7, 'system'), hit('a second doc', 0.5, 'system')],
      ],
      3,
    )
    expect(merged.map((h) => h.title)).toEqual([
      'the client paper',
      'a design document',
      'a second doc',
    ])
    // The union is cut to `topK` AFTER merging, not before — taking three of the
    // union is what makes this the answer one index over both corpora would give.
    expect(merged).toHaveLength(3)
  })

  it('test_UAT_FC_REQ-160_a_tie_is_broken_project_first', () => {
    // Stability, not a second rule: the lists arrive in KB declaration order and
    // `sort` is stable, so equal scores come back the client's material first —
    // the same precedence the landscape uses, and it needs no code.
    const merged = coRank([[hit('client', 0.5, 'project')], [hit('system', 0.5, 'system')]], 2)
    expect(merged.map((h) => h.title)).toEqual(['client', 'system'])
  })
})
