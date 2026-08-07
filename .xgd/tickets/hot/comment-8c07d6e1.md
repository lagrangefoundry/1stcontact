---
uid: comment-8c07d6e1
id: COMMENT-820
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T22:20:33.881969+00:00'
updated_at: '2026-08-07T22:20:33.881969+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-388cfc49
  kind: note
---

Assessment complete. **REPORT-1640** — result **FAIL** (1 violation, 2 warnings, 0 needs_review).

## Verdicts written

| Level | Result |
|---|---|
| 36 ACs | 35 `pass`, 1 `fail` (AC-914) |
| STORY-94 / 95 / 96 | `pass` / `fail` / `pass` |
| CAP-82 | `fail` |

No AC was retired or unsupported — all 36 trace to reconciled intent (REQ-110, REQ-111, REQ-113, BUG-31, with REQ-109 as a dependency), and no ledger entry retires anything.

## The one violation

AC-914 says a colliding deploy is refused **before any bytes are shipped**. The test proves it by calling the pure gate `assertNoReservedSegment` directly — never through `cmdDeploy` — then asserts the store is byte-unchanged at `reconciliation-serve-deployed-snapshot.test.ts:880-881`. That assertion cannot fail: no deploy was attempted and the gate never writes.

I confirmed this by mutation rather than inspection. Commenting out the production wiring at `deploy.ts:136` left all 36 capability UATs green — and the entire repo suite green: **173 files, 1186 passed / 112 skipped**. The wiring is correct in production; nothing pins it. File restored, tree clean.

The prior alignment pass (REPORT-1639) flagged the same assertion as a *warning*; the mutation result is why I graded it a violation instead.

## The judgment call I left to the operator

The collision is genuinely untriggerable through the real command today — `renderSite` calls `emptyDir(outDir)` and emits pages flat, so `out/draft/` cannot arise and a planted stray doesn't survive the deploy's own render. So there are two honest fixes, and I did not pick one:

- **uat-edit** — add a seam and pin the wiring (injected file list, or an instrumented client asserting the gate preceded the first `put`)
- **ac-edit** — amend AC-914 to drop the "before any bytes are shipped" clause no test can honestly satisfy until rendered output gains nesting

Either way the vacuous assertion should go. The STORY-95 fail is the same defect, not a second one — it clears automatically; no story-body edit needed.

Two warnings are cosmetic: AC-900 under-asserts the size column on upload lines (the `fileCount()` helper always emits it), and AC-908/AC-918 seed fixtures directly where their Verification text says to deploy them.

Worth noting on the other side: evidence quality here is high. Every UAT drives a real entry point — `cmdDeploy`, `worker.fetch`, `startServe` over loopback, and a raw TCP socket where `fetch` would normalise the traversal away before it reached the guard. R2 is faked only at the binding. Nothing else in the capability needs repair.
