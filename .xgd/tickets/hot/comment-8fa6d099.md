---
uid: comment-8fa6d099
id: COMMENT-1284
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T09:53:34.270162+00:00'
updated_at: '2026-08-20T09:53:34.270162+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7d6cc8e0
  kind: note
---

**Result: PASS** — `REPORT-2414` (`report-7d6cc8e0`), 0 violations, 2 warnings, 0 needs_review.

## What I verified

**All eight findings from REPORT-2410 are genuinely repaired** — I re-located each in the working tree rather than trusting the fix reports:

- **V1** AC-685's Criterion now scopes the bypass guarantee to DOC-2 §2's five value families and states enums as a Layer-1 guarantee; test untouched (the recommended shape).
- **V2/W4** `if (!HAVE_CHROMIUM) return` is gone from the whole nowrap file; `itChromium = it.runIf(HAVE_CHROMIUM)` splits AC-1009/1011/1012, and the file now reports **4 passed / 3 skipped** where it previously reported 4 silent passes. AC-1012's fidelity clause was handed to AC-683.
- **V3** No `test_UAT_AC718_*` exists anywhere; its four config-surface assertions landed in `test_UAT_AC701_*` (`reconciliation-behavior-modules.test.ts:448-464`).
- **W5** `grep vi.doMock|vi.mock(` over `tests/` returns nothing — the mock was replaced by a real `clientJs` seam plus a positive control. I reviewed the production edit: it mirrors the pre-existing `resolveModule` seam, is optional, and preserves the previous truth table.
- **W6/W7/W8** AC-930 retargeted off the retrofit drive (paired AC edit landed same call), AC-686/687 Verifications cross-reference AC-849/850, AC-928's two FC tests renamed.

**Coverage**: all 103 live ACs (100 active, 3 pending; AC-718 deprecated) have a matching UAT definition — verified by a scan that handles the multi-line `it.runIf` form. Only one foreign AC number (AC-932, STORY-97) is defined in a CAP-70 file; cosmetic placement.

**Execution**: I ran all 22 CAP-70 files plus the render-path consumers — **128 passed, 5 skipped, 3 EPERM**. The 3 failures are this worktree's socket denial (AC-703/888/1344), not defects.

## The two new warnings — both REQ-93 surface, both in `req93-l1-slot-mounted-behaviors.test.ts`

1. **AC-1343**: the Verification lists 8 cases; the tests cover 6. The two the Criterion marks *"deliberately legal and must not be rejected"* — an unbound seam, and a page with neither modules nor an L1 tree — are exercised by neither test. An implementation that over-tightened to "every seam must be bound" would keep the suite green. Repairable here in two assertions.
2. **AC-1344**: the test proves the `mountInL1` fixture mode builds and serves the slot-bound composition, but nothing anywhere runs `assertModuleConforms` against the mounted shape — the AC's headline claim — nor the discriminating case (conforms standalone, breaks mounted). **This repair cannot be verified in this worktree**; it needs a runner with socket permission.

Both are clause-level gaps on `pending` ACs whose primary criteria are proven, so neither blocks the level. The likely cause is worth carrying forward: last cycle's `ac-add` closed a gap by *renaming* existing FC tests onto new AC names — and a renamed test proves whatever it happened to assert, not what the newer AC asks for.
