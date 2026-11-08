---
uid: comment-8c4eeb8b
id: COMMENT-658
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T19:36:52.147712+00:00'
updated_at: '2026-08-05T19:36:52.147712+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-00cb70b9
  kind: note
---

**Verdict: PASS** — 0 violations, 0 needs_review, 1 warning. Report: `REPORT-1302` (`report-00cb70b9`).

## What I found

`capability-ac7ca849` (CAP-66) owns **zero stories, zero ACs, zero UATs**. UAT coverage is vacuously satisfied — there's nothing to assess. The capability was absorbed into `capability-aa030c83` ("1c Capture & Diff Fidelity") by the 2026-08-05 structural rebalance; its `merged_into` field and body banner both record this.

## The index is lying on this worktree

This is the load-bearing part of the assessment. The obvious query says this capability still owns a story:

```
xgd ticket list --type story --filter fields.capability_uid=capability-ac7ca849
  → Found 1 ticket: STORY-79
```

That's a phantom. The record itself reads `capability_uid: capability-aa030c83`. Two more symptoms of the same defect:

- `xgd ticket list --type story` returns **two entries for STORY-79** (stamped `2026-08-05` and `2026-07-29`), both resolving to the same UID `story-e15a19ef`
- `xgd ticket get STORY-79` fails with **"Ticket ID not found"** — the duplication breaks human-ID lookup entirely

So I didn't use the filter as evidence. I fetched all 12 story UIDs individually and read `capability_uid` off each record: `aa030c83` ×5, `ae9d65d6` ×5, `2049c9ec` ×2 — none pointing here. ACs carry no `capability_uid` of their own (verified on all 7 formerly in this tree), so they can only reach a capability transitively via `story_uid`; with no story, no AC and no UAT can resolve here. The proof is complete.

This matches the defect the rebalance report (`report-bdaf6840`) already flagged — a branch worktree's index resolves to the canonical main store holding pre-merge values. Both blockers are bugs in the xgd system repo, not this project.

## The one warning

CAP-66 is empty but still `status: active`. Deprecation was attempted and blocked by that same index defect (`reject_deprecation_if_capability_has_stories` sees phantom attached stories). Not fixable in this scope — it needs the index fixed and the reassignment landed in the canonical store first.

## One item for the survivor's scope

AC-738 and AC-739 (both from BUNDLE-9) carry **no `uat_coverage` field at all**, while the other five ACs on STORY-79 are marked `pass`. They're under `capability-aa030c83` now, so out of my scope — but that capability's coverage check shouldn't mistake an absent field for a verdict. I noted this in the report's editor notes.
