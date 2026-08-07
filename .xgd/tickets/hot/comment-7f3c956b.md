---
uid: comment-7f3c956b
id: COMMENT-757
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:02:03.578903+00:00'
updated_at: '2026-08-07T16:02:03.578903+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-530263fe
  kind: note
---

Cluster 4 resolved. Working tree clean, all changes auto-committed by the ticketing API.

## Outcome

**STORY-97 → confirm (no change).** It is *already* homed on CAP-89, whose body carries an explicit `### Site colour census & palette retrofit` section restating CAP-83's scope in full. Verified three ways:
1. `xgd ticket get story-5e7eb0c5` → `capability_uid: capability-b4ac88fc`
2. No story ticket file references `e382c142` at all
3. All 9 ACs (AC-939…AC-947) still attached to the story; none reference CAP-83

## The cluster isn't a story-assignment overlap

It's **consolidation residue**. `xgd ticket list --filter fields.capability_uid=capability-e382c142` returns STORY-97, but that's a **stale index hit** — a local `rebuild-index` doesn't clear it, because the entry lives in main's canonical index and overlay mode's `_merge_shadowed` only suppresses a canonical hit when the overlay layer also matches the same filter.

I set `merged_into: capability-b4ac88fc` on CAP-83, matching the established retirement pattern (CAP-64/CAP-72 both carry `deprecated` + `merged_into`).

## One thing I could not complete

**`status: deprecated` on CAP-83 could not be set** — reproducing blocker 1 of `report-dcc11130`. Root cause confirmed in code:

- `ticketing/__init__.py:3047` runs the invariant on any capability update containing `status`
- `invariants.py:reject_deprecation_if_capability_has_stories` → `attached_story_ids()` → `invariants.py:61` issues the *same* index-backed `ticketing.list()` query that returns the stale hit

Two things worth flagging beyond the known blocker:

- **The refusal is silent.** The CLI exits 0 and prints no diagnostic. A combined `{"status", "merged_into"}` patch is rejected *wholesale*, so neither key lands — that's why splitting the patch was needed to get `merged_into` through. A caller has no way to know the deprecation failed.
- It is self-correcting on merge-back, once main's index rebuilds.

I deliberately did **not** bypass the invariant via the internal `_skip_deprecation_check` kwarg, and did **not** use `xgd ticket archive` — per `report-dcc11130`, archiving moves the local copy out of the scanned directory and lets canonical's *active* version win, silently un-deprecating the capability (observed and reverted on CAP-64). Either route would hide a real engine bug behind a green result.

## Report

**REPORT-1578** (`report-530263fe`) — `report_kind: overlap_resolution`, `subject_uid: report-17a279f7`, `cluster_id: "4"`. Field shape matches clusters 1–3 exactly, so the iterator will detect this cluster as complete.

Integrity: 1 story before/after, no content edited, none archived or created; 9 ACs before/after, no AC changed story, so no `test_UAT_AC<N>_*` renames were required.
