---
uid: report-c5644f16
id: REPORT-1593
type: report
title: Fix In-Page Copy Editing (ac) — attempt 1
created_by: xgd
created_at: '2026-08-07T17:27:17.741971+00:00'
updated_at: '2026-08-07T17:27:17.741971+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: ac
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — In-Page Copy Editing (ac)

**Attempt**: 1
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

Both findings that carried a resolution category in report-9f7e2b43 are closed,
and the `info` forward-notice (finding 3) was pre-empted in the same call as the
report's "Notes for the Editor" asked, so activating AC-1028 does not hand the
`uat` cycle a loud gate failure.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1028 (`acceptance_criterion-26ffac6d`) | `status: pending → active`. Field write only — the criterion body was left untouched per the report's instruction (it already tracks REQ-118 and STORY-101 clause for clause, and nothing was renamed toward `segmentFieldsOf`) |
| 2 | story-body-edit | STORY-101 (`story-3bf94bd4`) | Added the n=0 clause to the **"A form over that region's fields"** bullet, immediately after the existing "one confirmed form is **one change**" sentence that AC-1000 sits adjacent to. Rest of the body preserved verbatim |
| 3 | (uat, sequenced) | `tests/req118-image-selection.test.ts:178` | Renamed `test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` → `test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` |
| 4 | (uat, sequenced) | `tests/req118-image-selection.test.ts:393` | Renamed `test_UAT_FC_REQ-118_the_modal_reads_its_picker_from_the_same_copy_transport` → `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` |

### Finding 2 — the exact clause added

Appended to the existing sentence rather than added as a new bullet, because the
n=0 case is the same assertion's other end and AC-997/AC-1000 are deliberately
adjacent criteria (report finding 6):

> …so the operator's Save is the single moment anything is written — **and a form
> the operator changed nothing in is not an edit at all: confirming it and
> cancelling it are the same answer, with nothing written and nothing
> re-rendered. Opening a form to look is not an edit.**

### Findings 3 & 4 — why the renames were in scope, and why two

The report categorized finding 3 as `uat`-level, but its Notes asked to sequence
it with finding 1. Two things made it a rename rather than authorship:

- **It is the documented post-reconciliation action, already owed.**
  `FREE-CODING.md` → "The FC orphan invariant": reconciliation must rename every
  `test_UAT_FC_<TICKET-ID>_*` to `test_UAT_AC<N>_<slug>` or delete it, and zero
  may remain for a reconciled ticket. REQ-118 is `free_and_reconciled` yet its FC
  names survived, because `check_fc_orphans` scans the input diffs for
  `test_UAT_FC_*` **files** — and this evidence lives in
  `tests/req118-image-selection.test.ts`, a file the scan never matched. The gate
  was blind to it; nothing about the evidence was wrong.
- **Both halves are named in AC-1028's own Verification paragraph.** The first
  test proves the derivation half (image kind resolves; closed `src` enum +
  `alt`, pre-filled; enum is exactly the site's images, excluding the `.woff2`
  and the `.css` in the same asset directory; includes an unused image and one
  the registry never declared; a region whose handle the mirror never got still
  has that handle among its options). The second proves the last sentence —
  "obtains these choices over the same copy transport a copy edit uses" — over
  the builder origin. Renaming only the first would have left that clause
  unlinked.

No other reference to either test name exists outside historical report bodies
(`report-afb07aaa`, `report-415b9b22`, `report-9f7e2b43`, `comment-92217202`);
REQ-118 records no test-name evidence registry, so the renames break no link.

## Verification

```
npx vitest run tests/req118-image-selection.test.ts
  Test Files  1 passed (1)
       Tests  7 passed | 4 skipped (11)

npx vitest run tests/reconciliation-copy-edit-gesture.test.ts \
              tests/reconciliation-copy-edit-gesture-modal.test.ts \
              tests/reconciliation-edit-render-channel.test.ts
  Test Files  3 passed (3)
       Tests  26 passed | 1 skipped (27)
```

`test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets`
**passes**. `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport`
**skips**, with the whole `describe.skipIf(!WEBUI_INSTALLED)` origin suite, for
the stated reason "webui components not installed" — this is STORY-101's declared
**Known coverage caveat** (the loud, reported skip), not a regression from these
renames. No test that passed before this call fails after it.

## Code Edits

Test renames only — no production code touched.

| File | Lines | Evidence chain |
|---|---|---|
| tests/req118-image-selection.test.ts | 178, 393 | `it()` title strings only; no assertion, fixture or entry point altered. Justified by `FREE-CODING.md` "FC orphan invariant" (rename owed since REQ-118 reconciled at `b2b9208c`) and by report-9f7e2b43 finding 3 + Notes. Both names now yield `AC-1028` through `extract_ac_id_from_test_name` (`(?:^|_)uat(?:_|$)` matches, then `ac[-_]?(\d+)` → 1028), which the FC-prefixed names could not |

## Remaining Findings — forwarded, not fixed

| # | Element | Why not fixed here |
|---|---|---|
| 4 (info) | CAP-87 body (`capability-12fee326`) | Unrepaired from report-afb07aaa finding 1: the capability body still says "the page showing **the new words**", narrowing the post-save outcome to copy after REQ-118 put image selection through the same gesture. The report categorizes this "none at this level" — the capability body is an upper-layer element, the story cycle passed with it as a warning, and no AC inherits the narrowing (AC-998 is copy-scoped by design; AC-1028 owns the image case). Left for a capability- or story-level cycle rather than edited from the `ac` level. Suggested wording when it is taken up: "the page showing the change — the new words, the chosen image", matching STORY-101's own "The page updating" bullet |
| 5, 6 (info) | AC-952/AC-1007 vs AC-956; AC-997 vs AC-1000 | Assessor examined both and judged them acceptable (per-criterion contrast clauses; distinct n>1 vs n=0 scenarios). No action requested |

## needs_review Items Forwarded

None — report-9f7e2b43 recorded `needs_review_count: 0`.

## Systemic note carried forward (not actionable in this project)

The report's third Editor note stands and this call did nothing to change it:
`acceptance_criterion.status` defaults to `pending` in `ticket_types.yaml`, the
story-generation prompts create ACs with `"status":"pending"` in `--fields`, and
nothing in the prompt or workflow tree drains it. AC-718 and AC-719 remain
`pending` (outside this capability, so untouched here) — one already carrying
passing evidence. Any AC authored by a future validation-fix cycle will land
`pending` and be silently invisible to `check_active_ac_coverage`. An XGD-tool
concern, out of scope for this capability.
