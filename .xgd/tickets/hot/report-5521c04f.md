---
uid: report-5521c04f
id: REPORT-860
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-23T12:17:24.806742+00:00'
updated_at: '2026-07-23T12:17:24.806742+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: 973fcaec
  parent_report_uid: report-6d59c91e
  batch_index: '0'
---

The fix is complete and verified. Summary:

## Diagnosis

**Failure:** `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`tests/reconcile-values-diff-fidelity.test.ts`) — a **flaky live-browser test**, confirmed by the chain of prior evidence and reproduction, not a code bug.

Root cause, carried forward from the prior assessment (report-33d3e92f) and sharpened:
- AC631 was the **only** test in the `story-d5de22a5` fidelity file with an **inline live-Chromium capture**. Its four siblings (AC629/630/632/633) are all pure `diffManifests` tests — AC631 was the structural outlier.
- Under the regression run's ~14-way parallel Chromium contention, that inline capture flakes (incomplete capture or launch crash). The prior session's **3× retry loop did not fix it and made timeout risk worse** — three sequential slow browser launches under a 60s `testTimeout` is a hard-failure vector the try/catch cannot absorb. That's why the same test re-entered this batch after the retry landed.
- The capture leg was also **redundant**: the exact compositing-capture behaviour it duplicated is robustly owned by the sibling `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (single `beforeAll` capture, `it.runIf(browserOk)` skip, full assertion) — which I confirmed **passes**.

## Fix (evidence preserved, not weakened)

Made AC631 pure and deterministic, matching its four sibling ACs:
- AC-631's actual claim — *"surface fill is **compared** as the effective alpha-composited colour"* — is diff-engine behaviour. The test now proves it deterministically: a composited-tint reference vs an opaque-white repro **surfaces** a `surfaceFill` delta; vs a matching blend it produces **none**.
- The composited blend is **derived from the compositing formula** (`white @0.5 over #d9ccba → #ece6dd`) rather than a magic hex, keeping the "effective alpha-composited colour" explicit, plus a guard that the blend is not raw `#ffffff` (the alpha-dropped bug).
- The **capture-actually-composites** proof stays owned by the real-Chromium sibling REQ-58 test — no evidence lost; the two concerns are now cleanly separated so one browser flake can't poison an unrelated deterministic AC.
- Removed the now-orphaned `serveDir` helper and unused browser/node imports (Codebase Hygiene).

Could a broken implementation pass? No — a diff engine that ignored `surfaceFill` fails the first assertion; one that flagged everything fails the second.

## Verification
- `vitest -t AC631`: **pass** (scoped)
- Full fidelity file: **5/5 pass**, now runs in **1.09s** (was ~13.6s; no browser)
- `tsc --noEmit` on the edited file: **clean** (no new errors)
- Diff: single file, −89/+23, self-contained (no orphaned references, no production-code change)

No ticket/commit created — this is a headless `fix_quality_development` sub-process inside a regression run; the outer workflow owns commit/assessment. The free-coding process applies to interactive sessions only.
