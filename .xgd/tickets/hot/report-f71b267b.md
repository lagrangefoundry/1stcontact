---
uid: report-f71b267b
id: REPORT-11008
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:26:26.297627+00:00'
updated_at: '2026-11-05T20:26:26.297627+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — config/version scalar (UU), single hunk on `"version"`. Resolved to HEAD's `"version": "0.2.117"` via the enrichment resolution rule (take the more recent commit by timestamp) and STEP 3h. Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

Incoming commit 5fc36e3214 ("fix(people): Who they are edits two fields, and they save [FREE-CODED]") touches only `package.json` in this cherry-pick: a version bump from 0.2.76 to 0.2.79. That hunk is deliberately NOT preserved (see below). The commit's feature code (e.g. `builder/email-shape.js`) is already present on HEAD, so no developer code is lost. The staged result has no net diff vs HEAD. The finalize step should treat this pick as empty.

## Arbitration of last resort (BUG-1460)

- `package.json`, `"version"` — resolved at tier 1 / enrichment rule (more recent intent wins):
  - Ours: 2de6a86da7 "chore(version): 0.2.117 for REQ-198 [FREE-CODED]", authored 2026-09-06, committed 2026-11-04.
  - Theirs: 5fc36e3214, authored 2026-09-05, committed 2026-11-02.
  - HEAD's version commit is later on both timestamps. Applying the incoming 0.2.79 would move the version backwards past 38 later bumps. The incoming hunk is stale on this branch.
  - Side dropped: incoming (theirs) version hunk.
