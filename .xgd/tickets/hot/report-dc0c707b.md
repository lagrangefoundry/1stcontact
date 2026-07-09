---
uid: report-dc0c707b
id: REPORT-388
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-09T23:35:33.791158+00:00'
updated_at: '2026-07-09T23:35:33.791158+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-84adbb17
  parent_report_uid: report-090ce6a8
  batch_index: '0'
---

Both files fully pass (23/23). All fixes are complete.

## Assessment

All four failures were **stale test expectations** (STABILIZATION action 2/4 — code is the source of truth). The shipped implementation added intentional, by-design features, each confirmed already reconciled in the corresponding bundle3 reconciliation test files. No production bugs; no AC deprecations needed — the ACs remain correctly active, only the base reconciliation UATs had drifted behind the shipped surface.

**Diagnosis & fixes:**

| Test | Root cause | Fix |
|------|-----------|-----|
| `AC458` (content modules resolvable) | `services-grid` gained a `stacked` variant (REQ-30) + `size` dial (REQ-20); `contact-form` gained `width` (REQ-20) + `submitTreatment` (REQ-33) dials | Updated expected `variants`/`dials` shapes to match shipped `meta.ts` |
| `AC448` (one card per item) | Each card `<li>` now renders `class="services-grid__card card-size-md …"`, so the exact-match `/class="services-grid__card"/` regex returned `null` | Match the card-wrapper prefix `class="services-grid__card card-size-` — still asserts exactly N cards (one per item), strong evidence unchanged |
| `AC433` / `AC434` (theme CSS) | Palette grew 56→61 slots (secondary, neutral-cool, accent-light, accent-deep, surface-inverse — REQ-26/32/33), all always-emitted per bundle3 | Updated the surface count `56`→`61` (verified by running the generator: `count=61`) |

**Evidence this is by-design, not regression:** the bundle3 reconciliation tests (`reconciliation-framework-content-modules-bundle3.test.ts` AC509 covers `stacked`/per-card size; `reconciliation-framework-theme-modules-bundle3.test.ts` asserts secondary/neutral-cool/accent-light/accent-deep are always emitted) already codify these additions as intended.

**Fixes stay honest** — no assertions weakened: AC448 still counts exactly N card wrappers, AC458 still checks full variant/dial enumerations, AC433/434 still assert exactly one declaration per slot across the full surface.

**Verification:** batch scope `test_UAT_AC458 or AC448 or AC433 or AC434` → **4 passed**; both full touched files → **23/23 passed**. Only test files were edited (no shared infra), so no blast radius.
