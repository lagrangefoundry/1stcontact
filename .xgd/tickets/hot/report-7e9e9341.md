---
uid: report-7e9e9341
id: REPORT-6774
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-26T01:51:28.075988+00:00'
updated_at: '2026-10-26T01:51:28.075988+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-1500b111
  parent_report_uid: report-835bb45a
  batch_index: '0'
---

I fixed all six failures in this batch by updating tests only. No production code changed. All the failures had the same cause: these tests were written before BUG-47 replaced `site_slug` (the site open at upload) with `placed_on` (the sites a promotion actually landed the material on).

**`tests/reconciliation-library-tab.test.ts`** (AC-1715, AC-1716, AC-1717)
- The fixture now uses `placed_on: ['alpha']`, `[]` and `['beta']` instead of `site_slug`, so the badge and the "used on this site" filter have real placement data to read.
- AC-1717 now looks for the `placed_on` ("Used on") record row instead of `site_slug`. It also checks that an unplaced document's row shows the fields component's own empty placeholder (an em dash) rather than naming a site.

**`tests/reconciliation-library-surface.workers.test.ts`** (AC-1722)
- The test now creates a real site with `makeD1Site`. Before, it uploaded to a site that didn't exist, so the promotion failed softly and nothing was placed — which is exactly how BUG-47 is meant to behave.
- It now asserts that the bound row's `placed_on` equals that site, the unplaced row and the single-item read return `[]`, and no `site_slug` key remains on the row.

**Ticket:** I updated AC-1722's criterion and verification text so they describe the placement list rather than the old "which site it is bound to (or nothing)".

The two "orphaned acceptance criterion" entries (AC-1717 and AC-1722) should clear now, because their own tests pass.

**Test results**
- Node config: `reconciliation-library-tab.test.ts` and `reconciliation-library-placement-and-row.test.ts` — 10/10 pass.
- Workers config: `reconciliation-library-surface.workers.test.ts` — 6/6 pass.

```yaml
## Assessment
blocked_by: null
```
