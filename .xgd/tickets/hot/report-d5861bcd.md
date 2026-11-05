---
uid: report-d5861bcd
id: REPORT-10994
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:15:44.400675+00:00'
updated_at: '2026-11-05T20:15:44.400675+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, version scalar only. Rule applied: enrichment rule ("intent unknown on one or both sides → take the more recent commit by timestamp and flag for post-merge review").
  - Ours: 2de6a86da7 `chore(version): 0.2.117 for REQ-198 [FREE-CODED]`, author date 2026-09-06 12:46 -0700 → `"version": "0.2.117"`
  - Theirs: c38c69d975 `feat(builder): move the scope selector ... [FREE-CODED]`, author date 2026-09-03 14:43 -0700 → `"version": "0.2.61"` (from 0.2.59)
  - Resolution: kept HEAD `"version": "0.2.117"`. Markers removed, JSON parses, file staged.
  - FLAGGED for post-merge review per the enrichment rule.

## Incoming changes preserved

The incoming commit c38c69d975 touches only `package.json` (1 line: version 0.2.59 → 0.2.61). Despite its feat(builder) subject, it carries no code changes on this branch. Its sole hunk is a stale version bump that was superseded long ago: HEAD has since moved through 0.2.60 (BUG-48) ... 0.2.116 → 0.2.117. Applying it would roll the version back 56 patch releases. As a result the resolution nets to **no diff vs HEAD** (an empty cherry-pick). That is intentional, not a discard of developer code. The finalize step should treat it as empty (skip, or keep an empty commit).

## Arbitration of last resort (BUG-1460)

- `package.json`: the enrichment rule already resolves this directly (the more recent commit by timestamp is HEAD). For completeness, STEP 3h tier 1 gives the same answer: later version-bump intents (REQ-198, 0.2.116/0.2.117) supersede the incoming 0.2.61 bump. Incoming side dropped. The code-file default (incoming wins) does not apply, because the only incoming content is an obsolete version scalar.
