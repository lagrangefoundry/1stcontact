---
uid: comment-0cfb1ed1
id: COMMENT-2596
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T20:17:54.474276+00:00'
updated_at: '2026-09-10T20:17:54.474276+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dde93f42
  kind: note
---

**REPORT-3790** (`report-dde93f42`) — **FAIL**: 3 violations, 2 warnings, 0 needs_review.

## What I found

Coverage is complete — all 38 active ACs have a substantive UAT driving a real entry point (CLI `run(argv)`, the shipped `1c` launcher as a subprocess, `startBuilder` over HTTP, `cmdNew`/`cmdRender`/`cmdShot`/`cmdRepro`, `validateSite`/`loadSite`). No AC needs a `uat-add`, and no test is a structural stand-in.

All three violations share one root cause: **the ac-level fix round (commit `1a027575a4`) moved claims between ACs and updated only one of the three test files that assert them.**

1. **Exclusivity** — `tests/reconciliation-colour-census-and-retrofit.test.ts` duplicates AC-939…AC-947 already covered by `tests/reconciliation-colour-retrofit-shade-model.test.ts`, in the same shape. Four pairs have *byte-identical test function names*; the AC-939 and AC-940 bodies are line-for-line the same test differing only in slug prefix (`ac939-` vs `shade939-`). Both files are live under `vitest.node.config.mts:71`. The census file is the superseded pre-REQ-137 original that was never removed.

2. **Consistency** — `census-and-retrofit.test.ts:548 test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` asserts the pixel-identity guarantee AC-944's own body says it supersedes (retired by REQ-137, `free_and_reconciled`, 2026-08-12). It exercises none of AC-944's three live clauses. I ran it — it passes green in 31ms, so it reads as evidence for a guarantee the capability no longer makes.

3. **Consistency** — `tests/reconciliation-colour-palette-overlay.test.ts:497 test_UAT_AC932_…` covers none of AC-932's three current bullets. It asserts the two claims attempt 5 moved *off* AC-932 onto AC-941 ("materially smaller palette") and AC-944 ("no colour lost"); its colourless tail stops at the census and never runs the retrofit. This file belongs to `story-c490f1cf` in another capability, so the STORY-97 sweep didn't reach it — it needs a separate fix.

Before recommending the deletion I verified the survivor loses nothing: `…shade-model.test.ts` is a strict superset (12 ACs vs 9), and on the two ACs where they diverge it is the wider one — its AC-943 adds the REQ-137 mis-classifying-fit refusal, its AC-944 covers all three live clauses (verified green, 1032ms).

The two warnings are docblock wording only (a retired story title in the surviving colour file; "asset directory" vs the reworded "asset store" in the listing file) — the assertions under them are correct.
