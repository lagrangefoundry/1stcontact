---
uid: comment-3a8105e6
id: COMMENT-877
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T06:38:31.330449+00:00'
updated_at: '2026-08-09T06:38:31.330449+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d52afd90
  kind: note
---

Report created and verified: **REPORT-1729** (`report-d52afd90`) — `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-2049c9ec`, `level=story`, violations=3, warnings=1, needs_review=0.

## Verdict: FAIL — 3 violations, 1 warning, 0 needs_review

**Coverage gaps (reconciled intent, shipped code, no matrix element):**

1. **REQ-88 + BUG-23 are unowned by any story in the matrix.** `1c repro` (bundle → servable site, idempotent, assets mirrored) and `localizeAssets` (reproduction must be self-contained; unmirrored handle hard-fails the import) both shipped — `tools/generate/src/cli/repro.ts:95`, `tools/generate/src/l1/assets.ts:58` — with free-coded UATs. Neither appears in STORY-84, STORY-86, any of their 32 ACs, or any of the other 23 story bodies. Notably `cmdRefold`, defined in the same file, *is* owned (AC-814).

2. **BUG-18's fold half is unexpressed in STORY-84.** `responsiveTextTracks` (`fold.ts:621`) keyframes text scalar axes per width; STORY-84 keyframes geometry only. Both CAP-70 neighbours explicitly disclaim it — STORY-83 excludes "populating the new axes from a capture", STORY-81 excludes per-width value variation and points at "the capture-fold stories".

**Consistency:**

3. **STORY-86's capability cross-references are stale after the 2026-08-05 consolidation.** It attributes the fold to CAP-71 in five places — but STORY-86 now *lives* in CAP-71 alongside the fold story. It also cites "(CAP-72)", which is not a capability in the matrix; that behaviour is CAP-63/STORY-75.

Warning: BUG-17 (fold carries captured padding) is covered only by STORY-84's generic "each node carries its authored axes". Exclusivity is clean — the two stories exclude each other's territory explicitly.

Two process notes for the operator: the `updated_by` chain records only BUNDLE-11 though BUNDLE-8/BUNDLE-10 plainly reshaped this tree, and BUG-18's schema/renderer half looks unexpressed in CAP-70 too — worth confirming when that capability is checked.

One environment issue worth flagging: `xgd ticket list` / `query` / `capability web` are unusable in this worktree — every call rebuilds the cold index and starves on `__cold_index__.flock`, held by the dispatcher (pid 22505) and dashboard (pid 28114); five attempts timed out at 30s each after multi-minute waits. I worked around it via the dashboard HTTP API on :5555. There is also an `xgd revert reconcile BUNDLE-7 --hard` process that has been running for 2 days 10 hours (pid 68355).
