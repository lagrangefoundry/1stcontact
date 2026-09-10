---
uid: comment-d7e7a4f3
id: COMMENT-2634
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T23:37:35.392336+00:00'
updated_at: '2026-09-10T23:37:35.392336+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c0b1dda7
  kind: note
---

Attempt 6 complete — report **REPORT-3817** (`report-c0b1dda7`), 5 mutations, 0 violations remaining.

**What I applied:**

| Finding | Element | Change |
|---|---|---|
| V1 (violation) | AC-997 | "two controls" → derivation ("however many controls the region's fields were spread across"); image case restated as grid + box + sheet; Verification gained the missing framing-parameter step |
| W1 | AC-1123 | Image-options descriptor carved out of the routing enumeration, deferring the grid to AC-1112 — Criterion and Verification now agree |
| W2 | AC-1000, AC-1043 | Stale witness ("all thumbnails and no form") replaced with the region that actually exists: a painted backdrop — picker + colour row, no editing box |
| W3 | STORY-101 | Added the missing in-scope bullet for the dialog's themed chrome and application typeface, so the body now states what AC-1037/AC-1038 assert. Neither AC touched |

Before editing I verified the code claims directly: `edit.ts:987-1005` returns `src`, `alt`, then 13 framing fields (three routes, not two), and `edit.ts:1022-1024` derives `surfaceFill` for every painted surface unconditionally — so no region yields an image field alone, which is what makes W2's witness stale.

I also ran the prophylactic sweep the report asked for: all 40 STORY-101 AC bodies re-pulled and grepped for the closed-enumeration shape. Four hits, all four correct as written (AC-1140's "family has no control", AC-1050, AC-1112, AC-1282) — no seventh instance.

**Two things I did not do, stated plainly:**

- **Tests were not run.** Per finding 7 the covering suites can't execute here — `startBuilder` dies with `listen EPERM` in each `beforeAll`. That's the sandbox, not an assertion. I changed no test file.
- **AC-997's new Verification step outruns its UAT.** The test still stops at thumbnail + alt text. I left `uat_coverage` at `pass` rather than flipping it by hand — that field belongs to the uat-coverage prompts, and setting it from here would manufacture either progress or a failure they'll re-derive. It's flagged as a follow-on in the report instead.
