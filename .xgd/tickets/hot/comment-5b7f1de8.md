---
uid: comment-5b7f1de8
id: COMMENT-1282
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T08:49:13.522906+00:00'
updated_at: '2026-08-20T08:49:13.522906+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-95a1aa0e
  kind: note
---

**Attempt 7 complete — all 3 violations addressed, plus 3 of 5 warnings.** 9 mutations, report `report-95a1aa0e` (REPORT-2412).

**Violations**

1. **AC-685** (`ac-edit`) — executed the five-cycle-stalled recommendation rather than re-presenting it as a branch. Narrowed ¶1's "even if bypassed" claim to the DOC-2 §2 Layer-2 families (text/colour/font-family/length/image-src), dropped "closed-enum" from ¶2's re-derivation list, and stated explicitly that enums are a Layer-1 (`validateL1`) guarantee. Test untouched — it already matches.
2. **AC-1012** (`uat-edit` + `ac-edit`) — split the browser arm into `it.runIf`, and removed the round-trip-fidelity clause no arm exercised, cross-referencing AC-683 which owns `capture(render(L1)) ≈ L1`.
3. **AC-718** (`uat-edit`) — folded the four config-surface assertions (closed config key set, retired dial names, single `form` slot, no `dials`) into `test_UAT_AC701_*`, then deleted `test_UAT_AC718_*` and the retired REQ-87 "capability" wording. No live test names a deprecated AC now.

**Warnings 4, 7, 8** — converted all three `if (!HAVE_CHROMIUM) return` sites to `it.runIf`; deleted the AC-686/AC-687 Verification clauses that AC-849/AC-850 already own (no duplicate tests written); renamed the two on-point REQ-137 FC tests to `test_UAT_AC928_*`.

The gate fix is observable, not inferred:

```
✓ test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations 1ms
↓ test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed
Tests  4 passed | 3 skipped (7)
```

Previously the same file reported `4 passed (4)` with three browser arms not running.

Full verification run across the four touched files: **22 passed, 3 skipped, 0 failed**. `test_UAT_AC701_*` passes with the folded assertions. The one failure anywhere in scope is the pre-existing `EPERM: listen` on `test_UAT_AC703_*` — the worktree sandbox, which the report classes as not-a-finding; I left it alone rather than removing the server it exists to test.

**Deferred to attempt 8** (declared `needs_more_work: true`): Warning 5 (AC-702's internal `vi.doMock` — needs a `ModuleResolver`-style seam on `cmdRender`, which would be a code edit I'd justify with named evidence) and Warning 6 (retarget `test_UAT_AC930_*` off the `cmdColors` drive, paired with the one-line AC-930 edit that currently prescribes it). No `needs_review` items.
