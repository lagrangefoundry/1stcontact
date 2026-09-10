---
uid: report-ca4d11ce
id: REPORT-3770
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (ac) — attempt
  5'
created_by: xgd
created_at: '2026-09-10T17:47:32.926196+00:00'
updated_at: '2026-09-10T17:47:32.926196+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: ac
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (ac)

**Attempt**: 5
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

Both violations were one-sentence verification-section defects with no sequencing
constraint between them, exactly as the report's Notes for the Editor described.
Neither was a code issue: in both cases `packages/site-schema/src/l1/edit.ts` and
the shipped UAT already asserted the corrected claim, so the AC prose was the only
layer still carrying the pre-colour arithmetic. Both are now corrected. The one
warning (finding 4) is also closed, and the report's suggested successor rule was
executed as a scan before editing.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1111 (`acceptance_criterion-285dd8d6`) | Finding 1 (violation). Replaced "assert **its one field** declares the same thing" with the field the criterion is actually about: assert the panel's **background-image field** declares it, and the **fill field beside it on that same panel** carries no such declaration. Per the assessor's suggested edit this turns a stale count into a second instance of the by-kind-of-field discrimination the criterion exists to make, mirroring the alt text beside an image region's picker. Also corrected the trailing clause "ask it of a run of copy and assert **its field**…" to "assert **none of its fields** declares anything of the kind" — same sentence, same stale-singular defect family, and a run now exposes six fields. Criterion untouched. |
| 2 | ac-edit | AC-991 (`acceptance_criterion-08c7ebe8`) | Finding 2 (violation). Changed the verification's "a run of copy, which exposes fields of **four of the five** shapes" to "**all five** shapes". Nothing else moved — the criterion ("There are exactly five shapes"), the narrowing argument and the free-colour-value refusal step were already correct. |
| 3 | ac-edit | AC-982 (`acceptance_criterion-99f7c64d`) | Finding 4 (warning). Opened the criterion with the producer: "Submitting a change map of new values for a region's fields **from the command line**…". One clause, as suggested; the both-channels claim, the on-disk claim and the verification are unchanged. This removes the last AC that asserts a re-render without naming whose, so it no longer reads as colliding with AC-992's "no rendering step in between" for the origin producer. |
| 4 | uat-edit | `tests/reconciliation-copy-edit-field-format.test.ts:248-259` | Paired with #1. The revised AC-1111 verification asks for one assertion the shipped test lacked — that the panel's `surfaceFill` carries no `format` declaration. The test already asserted the negative for an image region's `alt` and a run's `text`, but not for the fill beside the background handle, which is the only case where both kinds sit on one region. Added `fill.type === 'color'`, `fill.format === undefined` and `Object.hasOwn(fill, 'format') === false` so AC-1111's `uat_coverage: pass` stays honest rather than becoming an immediate coverage gap at this call boundary. |

## The Successor Rule, Executed

The report asked that "whenever a repair changes a count, an ordering or an
exhaustive list in one AC, grep the whole tree for the same number" — so I ran
that scan **before** editing rather than leaving it for the next cycle. All 43
active ACs were pulled with bodies (`xgd ticket list --filter
fields.story_uid=story-37a3921b --view --no-limit`) and every numeric claim was
matched at **sentence** granularity after collapsing whitespace.

Two notes on method, because the naive version of this scan silently under-reports:

- `xgd ticket list` truncates at 50 with a `next_cursor` and returned only 11 of
  this story's ACs on the unfiltered call — a bare list would have scanned a
  fraction of the tree and reported clean. `--no-limit` plus the story filter
  returns all 43 (`truncated: false`, verified).
- AC bodies are hard-wrapped, so a line-based grep splits "assert its one" from
  "field declares" and misses AC-1111 — the very AC under repair. Scanning
  sentences rather than lines is what makes it find its own target.

**Result: no third instance.** Every other numeric phrase in the tree is
idiomatic rather than a count claim (AC-1049's "exactly one field is returned" is
correct for an unpainted-image panel, AC-1024's "two fields" and AC-1270's "first
three" are correct per the ledger). The two violations were the complete set.

## Code Edits

None. Both violations were prose-only; `packages/site-schema/src/l1/edit.ts` was
read to confirm the claims, not changed:

| Claim | Evidence read | Verdict |
|---|---|---|
| A painted panel with a background image exposes **two** fields | `copyFieldsOf` pushes `backgroundImageUrl` only when `background !== undefined`, then `fields.push(...fill.fields)` unconditionally for any `box`/`container` with `opts.paints` (`edit.ts:1022-1046`) | AC-1111 was wrong, code right |
| A run of copy exposes **all five** shapes | `text` is `string` + `...colour.fields` (`color`) + `...type.fields` (`edit.ts:975-984`); union is `'string' \| 'enum' \| 'integer' \| 'boolean' \| 'color'` (`:187`) | AC-991 was wrong, code right |

## Verification

Both affected UAT files run green:

| File | Result |
|---|---|
| `tests/reconciliation-copy-edit-field-format.test.ts` | 1/1 passed — including the three assertions added in #4, which confirms `surfaceFill` genuinely carries no `format` rather than merely being unasserted |
| `tests/reconciliation-copy-edit-typography.test.ts` | 9/9 passed — `test_UAT_AC991_…` asserts `CONTROL_SHAPES = ['string','enum','integer','boolean','color']` are all present on a run, which is the claim AC-991 now makes |

No test I did not touch changed state. (Both runs emit a wrangler `EPERM` log-file
warning writing to `~/Library/Preferences/.wrangler/logs`; it is a sandbox
artifact, not a test failure — the suites pass through it.)

## Deliberately Not Done

| Item | Why |
|---|---|
| Renaming `test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal` and its opening comment ("exactly four shapes", "the vocabulary has now grown twice") | The report places this at the **uat** level explicitly, not here. With AC-991 repaired, the test name is now the last carrier of the pre-colour count — its assertions are already correct and test all five. Flagged for whoever runs the `uat` check next; it is a rename plus a comment, no behaviour change. |
| Findings 3, 5, 6, 7 | Info-only, no resolution category. Finding 5 (AC-1045/AC-1049 boundary) and finding 6 (the fractional-framing caveat with no AC) are explicitly logged by the assessor so a later cycle does not re-open them as drift — recorded here to the same end. |

## needs_review Items Forwarded

None. No finding in report-ca925e0f was categorized `needs_review`, and nothing
in this repair required a judgement the alignment ledger did not already settle.

## State at This Call Boundary

Violations 0, warnings 0. The capability's `uat_coverage` field still reads
`fail`; per this session's field-ownership rule that field belongs to
`check`/`fix_uat_coverage` and was deliberately left alone rather than set here to
manufacture progress. AC-1111 and AC-991 both retain `uat_coverage: pass`, which
their shipped UATs substantiate — AC-1111's now including the assertion its
revised verification added.
