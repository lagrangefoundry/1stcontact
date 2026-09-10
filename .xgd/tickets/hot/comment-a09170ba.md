---
uid: comment-a09170ba
id: COMMENT-2531
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T12:41:38.071123+00:00'
updated_at: '2026-09-10T12:41:38.071123+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b1f350ae
  kind: note
---

Attempt 7 complete — 10 mutations, both violations closed, four of five warnings closed. Report: **REPORT-3732** (`report-b1f350ae`).

**Findings resolved**

| Finding | Sev | Lever | What I did |
|---|---|---|---|
| 1 | violation | ac-edit | AC-685 narrowed: the "holds even if bypassed" claim now scoped to DOC-2 §2's five Layer-2 families; "closed-enum" dropped from the re-derivation list and stated as a Layer-1 (schema) guarantee. Verified first that `render.ts` has no enum guard (`cssEnum` → 0 hits) — policy and code agree, the AC was the over-claimer. Neither AC-685 test needed changing |
| 2 | violation | uat-edit + ac-edit | `test_UAT_AC1012_*` split into an engine-free stylesheet-proxy test and an `it.runIf(HAVE_CHROMIUM)` box-measurement test; AC-1012's unreachable round-trip-fidelity clause dropped and cross-referenced to AC-683, which owns it |
| 3 | warning | uat-edit | Same split for AC-1009 and AC-1011 — no bare `if (!HAVE_CHROMIUM) return` left in the file |
| 4 | warning | uat-edit + ac-edit | `vi.doUnmock` corrected to `…/src/worker` (the path actually mocked); AC-702 now records the substituted-catalog premise, with a note to drive a real seam if one is ever added |
| 6 | warning | ac-edit | AC-686 / AC-687: site-definition and page-prefix clauses removed from Verification, cross-referenced to AC-849/AC-850. No new tests, per the assessor's explicit "do not uat-add" |
| 7 | warning | uat-edit | AC-718's test now asserts `slots.form.required === true`; retired "capability" vocabulary replaced with "behavior" in header, `describe` and comment |

**Verification** — `npm test --` on the three touched files: `3 passed`, `16 passed | 3 skipped`. The skips are the three new engine-gated arms telling the truth about the missing browser. That file previously reported `4 passed (4)` in 14 ms with nothing skipped, which was the anchor report's counter-signal; the lower pass count here is the success condition, not a regression.

No production code was touched. **Finding 5** (the AC-930/AC-942 cross-capability duplicate) is the only one left — it needs a test retarget plus a one-line AC edit, and I set `needs_more_work: true` to take it in attempt 8.
