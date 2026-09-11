---
uid: report-1b35e36b
id: REPORT-3878
type: report
title: 'Fix Page Authoring Through The Control Surface: Read & Replace The Element
  Tree (uat) — attempt 2'
created_by: xgd
created_at: '2026-09-11T02:42:44.896417+00:00'
updated_at: '2026-09-11T02:42:44.896417+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-fe236246
  level: uat
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Page Authoring Through The Control Surface: Read & Replace The Element Tree (uat)

**Attempt**: 2
**Fixes applied this call**: 7
**Violations remaining**: 0
**Needs more work**: false

All four actionable findings (1 violation + 3 warnings) are repaired in one pass, as the
report's editor note recommended — they were four assertions of the same shape ("an AC
names a set, its UAT asserts one member") and all four lived in
`tests/reconciliation-page-composition-surface.test.ts`, the AC-numbered suite the matrix
reads. No production code was touched.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1090 (finding 1, **violation**) | Added `expect(answer).toMatch(/fontSizePx/)` after the three strategy assertions; replaced the `:568-572` rationale, which asserted the *opposite* of the AC, with the current contract (code + strategy + pointer, complementary not alternatives), naming the `renderHostError`/`host_detail`/`validateOrThrow` mechanism as the free-coded twin does; renamed the test `test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy` so the name states what it proves |
| 2 | uat-edit | AC-1092 (finding 2) | Added `expect(box.manual()).not.toContain('get_copy')` beside the `set_copy` manual assertion, with a note on why the retired *read* half in prose is the same exclusivity failure. Both halves of the pair are now checked in all three places the AC names (declaration, tool list, manual) |
| 3 | uat-edit | AC-1093 (finding 3) | Replaced the single `read.fields[0].name === 'text'` check with the **full descriptor name set**, *derived* rather than pinned: the set the same `/api/copy` origin returns for the hand-written twin seeded at `0.0.0` (a text run carrying the same axes), asserted equal to the assistant-authored node's at `0.1.0`. Added an `arrayContaining(['text','color','fontSizePx','italic','textTransform'])` floor so the equality cannot be two identically impoverished forms agreeing, and asserted each read carries *its own* current values (`fontSizePx` 20 vs 32) |
| 4 | uat-edit | AC-1085 (finding 4) | Put the REQ-137 production reference shape on the seed: `color: { ref: 'paper', shade: -0.35, alpha: 0.9 }` and `surfaceFill: { ref: 'ink', shade: 0.2 }`. The verbatim-read assertion now pins the whole reference, so a read that resolved it to a hex **or** kept `ref` while dropping the variation keys fails |
| 5 | uat-edit | AC-1086 (finding 4, second half) | Added explicit post-write-back assertions that the reference the read returned was accepted verbatim, variation keys and all — the half of "what comes back is what may be written back" that a whole-page structural equality hides |
| 6 | uat-edit | suite header / seed rationale | Documented why the seed carries the full `{ ref, shade, alpha }` form: a bare-`{ ref }` seed cannot distinguish "still a reference" from "reference with its variation resolved away" |

Findings 5 and 6 are `info` with no suggested edit and were left alone: finding 5 is the
repo-wide free-coded → reconciliation pattern (explicitly "not a duplicate to remove"), and
finding 6 is an environment note.

## Verification

`npm test -- tests/reconciliation-page-composition-surface.test.ts --reporter=verbose`
→ **12 passed (12)**, 0 skipped, including AC-1093 and AC-1094.

Note for the assessor: the two suites' skips reported in REPORT-FFF96718 did **not**
reproduce this session. `startBuilder` came up and `/api/copy` served both reads, so the
AC-1093 descriptor-set assertion was actually executed rather than reasoned about — the
derivation does return the REQ-139 colour row and the REQ-135 typography fields for an
assistant-authored run, which is what finding 3 asked be proven. AC-1094 also executed.

Finding 1's behaviour was already correct before this call (both refusal tests passed
pre-edit); the repair was the missing assertion and the contradictory rationale, not the
code.

## Code Edits (if any)

None this call.

## Divergence Note (not a finding; no action taken)

`tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` still carries the warning-level shapes of
findings 2–4 at `:456` (manual, `set_copy` only), `:537` (`fields[0]` only) and `:61`/`:66`
(bare `{ ref }` seed). Left as-is deliberately: the findings' suggested edits named the
AC-numbered suite's lines, and the `test_UAT_AC<n>_` convention makes that suite the
matrix's evidence. The result is the documented pattern — the reconciliation suite strictly
stronger than its free-coded ancestor — rather than the AC-1090-style divergence where the
weaker assertion was the AC-numbered one.

## needs_review Items Forwarded

None.
