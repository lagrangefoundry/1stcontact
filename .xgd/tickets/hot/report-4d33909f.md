---
uid: report-4d33909f
id: REPORT-3498
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T05:01:41.901520+00:00'
updated_at: '2026-09-04T05:01:41.901520+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-1144410d
---

All 17 UATs pass. Here is the completion report.

**Coverage** — one UAT per AC, split by the boundary each AC actually lives at:

| File | Runtime | ACs |
|---|---|---|
| `tests/reconciliation-material-upload-surface.test.ts` | jsdom, real overlay + real `mountBuilder` | 1571, 1572, 1574, 1575, 1576, 1577, 1578, 1584, 1585, 1586, 1587 |
| `tests/reconciliation-material-upload-origin.workers.test.ts` | workerd, real D1 + both real R2 buckets | 1573, 1579, 1580, 1581, 1582, 1583 |

Doubles are boundaries only: the HTTP transport in the browser suite (it is the network), the index seam and one stubbed `fetch` in the workerd suite, plus one deliberately-refusing site store for the secret-scrub half of AC-1581 — the "error from below carrying a credential" shape cannot be provoked from a store that works.

Two notes on evidence quality worth recording:

- **AC-1587** is the reason the browser suite's stand-in origin *keeps records* rather than returning a fixed list. Its upload envelope deliberately carries less than the row it stores (no `site_slug`, no `description_status`), so any of those fields appearing in the Library proves a read-back rather than an echo — which is exactly the distinction the AC draws.
- **AC-1574**'s "reachable by keyboard" is asserted as `<button type="button">` plus a click landing on the file input. jsdom does not synthesize click-from-Enter, so the honest form of the claim is that the answer is an ordinary control the platform activates, not a second code path.

```
UATs generated for story story-1144410d (plan item 10 of 15)

Story: story-1144410d
Test file(s) created:
  - tests/reconciliation-material-upload-surface.test.ts
  - tests/reconciliation-material-upload-origin.workers.test.ts

Tests written: 17
Tests passed: 17
Tests failed: 0

test_files_created:
  - "tests/reconciliation-material-upload-surface.test.ts"
  - "tests/reconciliation-material-upload-origin.workers.test.ts"
```

No runtime code was modified and no existing test file was touched — `git status` shows only the two new files. No AC needed a weakened assertion: every criterion passed against the code as it stands, so there is no code/intent divergence to hand to the fix-it loop.
