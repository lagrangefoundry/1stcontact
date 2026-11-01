---
uid: report-18a590fe
id: REPORT-7373
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:23:27.126397+00:00'
updated_at: '2026-11-01T06:23:27.126397+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- package.json — UU, version scalar conflict (HEAD 0.2.57 vs incoming 0.2.51). Took HEAD (`git checkout --ours`) and staged it. Two rules apply: the enrichment rule "take the more recent commit by timestamp" (HEAD 2d59060f2e, 2026-10-31, is later than incoming 68db393777, 2026-09-02), and STEP 3h. **Flagged for post-merge review** as the enrichment rule requires.

## Incoming changes preserved

68db393777 does two things: (1) it removes conflict markers committed by a raced merge (0.2.50 vs 0.2.48), and (2) it sets the version to 0.2.51. Effect (1) is already present in HEAD: HEAD's package.json has no markers and parses (`require('./package.json').version` returns 0.2.57). Effect (2) is superseded, because HEAD has already bumped past it to 0.2.57. Net staged diff vs HEAD: none. The commit is redundant, not discarded (BUG-1109/BUG-1122 shape).

## Arbitration of last resort (BUG-1460)

- package.json — tier 1 (most-recent intent). The incoming commit's stated rationale, "package.json left conflicted", is false on this branch: HEAD's package.json is clean. Its version value, 0.2.51, is older than the later BUG-46 bump to 0.2.57, so applying it would move the version backwards. Dropped the incoming version hunk and kept HEAD.
