---
uid: comment-52cc793e
id: COMMENT-2447
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T03:26:32.307036+00:00'
updated_at: '2026-09-10T03:26:32.307036+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c698c3d5
  kind: note
---

## UAT Coverage Assessment: CAP-105 — **PASS**

**REPORT-3648** (`report-c698c3d5`) — 0 violations, 1 warning, 0 needs_review.

**Intent ledger is single-origin.** REQ-152 (`free_and_reconciled`, 2026-08-20 → 2026-08-31), delivered via BUNDLE-20, is the sole intent. A body scan for `formatMoney` / `formatDateTime` / `intl.ts` / `REQ-152` surfaces nothing later that extended or retired any part of the seam. Its one comment adds no new ask. Nothing is retired → no deprecation candidates.

**Three intent-silent behaviors are reconciliation-decided**, not unreviewed: negative amounts (AC-1440), the options-pass-through boundary (AC-1444), and the shaped-but-impossible instant (AC-1443) each have an explicit `## Reconciliation Decisions` entry in STORY-123 dated 2026-08-31. Treated as active. The BUG-1306 impact screen was never reached — there is no unreviewed silence here.

**All 9 ACs pass; story passes; capability passes.** Evidence is `tests/reconciliation-money-time-formatting-seam.test.ts` — one UAT per AC, all against real `formatMoney`/`formatDateTime`/`renderSiteFiles`/`renderL1Page` with zero mocking. I ran it: **9 passed / 9**, 313ms.

The tests are discriminating rather than decorative — several carry explicit negative assertions that a plausible wrong implementation would fail: `not.toContain('409.90')` catches a regression to `amountMinor / 100`; the Dublin↔New York gap asserted as 5 → 4 → 5 catches a fixed offset; `2026-02-30` is refused even though ECMAScript's rolling `MakeDay` parses it *cleanly* into 2 March; the zone-override option is tested against two different zone arguments so it can't pass by accident.

Two ACs assert against source text (AC-1445's clock scan, AC-1446's recorded-contract half). I judged both **pass**, not structural-smell: each AC's criterion is itself a claim about the source, each Verification clause prescribes that method, and each AC's other half is behavioral and load-bearing. I noted in the report that these should not be "upgraded" — there is no behavior to observe and rewriting them would lose the check.

**The one warning** — the seam's reachability is untested. REQ-152 §1 says "Exported from the framework barrel"; that's true at `packages/framework/src/index.ts:103`, but the UAT imports `packages/framework/src/intl` directly, so deleting the barrel line leaves all nine UATs green while making the seam unreachable by the payments and calendar modules it exists for. I held it at warning rather than violation: no AC claims the barrel export, the ac-level alignment check (REPORT-3642) found the AC set complete against REQ-152, and every enumerated behavioral promise is covered. Fix is a one-line test import change, no ticket edits.

Wrote `uat_coverage: pass` to all 9 ACs, STORY-123, and CAP-105.
