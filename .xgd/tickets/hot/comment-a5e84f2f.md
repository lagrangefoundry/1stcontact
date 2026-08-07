---
uid: comment-a5e84f2f
id: COMMENT-773
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T17:27:35.754350+00:00'
updated_at: '2026-08-07T17:27:35.754350+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c5644f16
  kind: note
---

Done — attempt 1 closed both actionable findings.

## Mutations (4)

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1028 | `status: pending → active` — field write only; body untouched as the report instructed |
| 2 | story-body-edit | STORY-101 | Added AC-1000's n=0 clause to the "A form over that region's fields" bullet |
| 3–4 | uat rename (sequenced) | `tests/req118-image-selection.test.ts:178,393` | `test_UAT_FC_REQ-118_*` → `test_UAT_AC1028_*` on both tests carrying AC-1028's evidence |

**Finding 1** (the one violation) was the single field write — AC-1028 was invisible to `check_active_ac_coverage`, which only sees `active` ACs.

**Finding 2** (warning) placed the missing clause inline with the "one confirmed form is one change" sentence rather than as a new bullet, since AC-997 and AC-1000 are the n>1 and n=0 ends of the same assertion.

**Findings 3–4** were the report's "sequence together if the run permits" item. Renaming turned out to be a debt already owed: `FREE-CODING.md`'s FC-orphan invariant requires reconciliation to rename every `test_UAT_FC_<TICKET>_*` to `test_UAT_AC<N>_*`, but `check_fc_orphans` scans for FC-named *files* — this evidence lives in `req118-image-selection.test.ts`, so the gate never saw it. Both tests were renamed because AC-1028's Verification paragraph names both halves (the derivation, and "obtains these choices over the same copy transport"). No reference to either name exists outside historical report bodies.

## Verification

```
tests/req118-image-selection.test.ts        7 passed | 4 skipped (11)
3 reconciliation test files                26 passed | 1 skipped (27)
```

`test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` passes. The second renamed test skips with its whole `describe.skipIf(!WEBUI_INSTALLED)` suite — that is STORY-101's declared Known coverage caveat (webui components not installed), not a regression. Nothing that passed before this call fails after it.

## Forwarded, not fixed

CAP-87's body still reads "the page showing **the new words**", narrowing the post-save outcome to copy after REQ-118 routed image selection through the same gesture. The report categorizes this "none at this level" — it's an upper-layer element and no AC inherits the narrowing — so I left it for a capability- or story-level cycle and recorded suggested wording in the report.

Report: **REPORT-1593** (`report-c5644f16`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. Handing back to the assessor.
