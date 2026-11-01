---
uid: report-548e807b
id: REPORT-7457
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:16:28.816286+00:00'
updated_at: '2026-11-01T07:16:28.816286+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `apps/control-app/src/router.ts` — UU, code file (2c). Single hunk in the `RouterDeps` interface: HEAD (free-REQ-168 merge line) added `launch?: BrowserLauncher` (REQ-157 looking surface); incoming 6d24383f73 (free-REQ-179) added `admission?: Admission | null`. Both are independent optional fields appended at the same position — non-overlapping intent, so combined (rule 2c.2): both fields kept with their doc comments, HEAD's `launch` first, incoming's `admission` after. No timestamp tiebreak was needed since nothing was mutually exclusive.

## Incoming changes preserved

Checked against `git show 6d24383f73 -- apps/control-app/src/router.ts`; all incoming hunks are present in the resolved file:
- `import type { Admission } from './identity'` (line 36)
- `RouterDeps.admission?: Admission | null` with full doc comment (line ~390)
- `BUSINESSES_PATH`, `BusinessesPayload`, `businessesPayload()` (line ~494+)
- `GET /api/businesses` route above the store (line ~939)

HEAD's `launch?: BrowserLauncher` also retained. `identity.ts` exports `Admission`; `index.ts` passes `{ admission }` to `route()`. `tsc --noEmit -p apps/control-app` reported no errors in router.ts or index.ts (sparse checkout; full suite not run). No hunks dropped.
