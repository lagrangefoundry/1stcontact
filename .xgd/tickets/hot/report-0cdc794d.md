---
uid: report-0cdc794d
id: REPORT-3535
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:07:09.326199+00:00'
updated_at: '2026-09-09T22:07:09.326199+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, class 2e (intent/bookkeeping
  ticket, `request-*`). Rule applied: **one side is a strict superset — keep the
  superset**, which here is OURS (HEAD). The auto-enrichment's fallback rule
  ("intent unknown on one or both sides; take the more recent commit by
  timestamp") points the same way: HEAD's edit is
  `5e6f3a68c6 2026-08-31T14:22:34Z`, the incoming commit
  `a74ac03993 2026-08-23T03:24:39Z`.

  This is the same file as attempt 6/0, one commit further along the bundle.
  Incoming commit `a74ac03993` appends the body section *"Follow-up: `bin/build`
  failed on a type-only reach into node"* (AC 12, version-bookkeeping note to
  0.2.7) and moves `updated_at` / `last_field_updated`.

  Per-fact comparison of stage 3 (theirs) against stage 2 (ours):

  | fact | theirs (incoming) | ours (HEAD) | kept |
  |---|---|---|---|
  | `updated_at` | 2026-08-23T03:24:38Z | 2026-08-31T14:22:34Z | ours (later) |
  | `completed_at` | null | 2026-08-31T14:22:34Z | ours (later) |
  | `last_field_updated` | `body` | `status` | ours (later) |
  | `status` | `free_coded` | `free_and_reconciled` | ours (downstream state of the same lifecycle) |
  | sha entries `932f362e`, `92fc26e7` | present | present, plus `working_sha_history: []` | ours (superset) |
  | sha entries `ec144c85`, `02bd4437` | absent | added | ours (ours-only addition) |
  | `version` | 0.2.7 | 0.2.9 | ours (later) |
  | `bundled_in`, `chat_comment` | absent | added | ours (ours-only addition) |
  | body: type-only-reach follow-up (AC 12) | added by this commit | already present, **verbatim** | identical |
  | body: deploy-secret-guard follow-up (ACs 13–16) | absent | present | ours (superset) |

  No fact is present on the incoming side and absent from ours, so no
  composition was needed and nothing from either side was invented or dropped.
  `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit
`a74ac03993024fbbffb13bf95ca29a0605894043` ("xgd(ticket): update request
request-554ac441") touches exactly one file, the ticket above, and its diff is a
ticket body append plus two frontmatter timestamps/markers.

STEP 3 check: every key change in the incoming diff **is present in HEAD**, via
a later route rather than via this commit. The entire appended body section
(cause, "why no test caught it", AC 12, the 0.2.7 version-bookkeeping note)
appears byte-for-byte in HEAD's version, which then appends a further follow-up
on top; the frontmatter fields it moved have since been moved further by HEAD's
own `5e6f3a68c65de745a528ba9cb929236465d892f5`. This is the redundant-commit
case described in STEP 4 (BUG-1109/BUG-1122), not the discarded case: the
incoming intent is present in HEAD, superseded by later values of the same
facts, not absent.

The staged tree therefore nets to no diff vs HEAD for this file. Per STEP 4, no
`--skip` was called; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD = a74ac03993`) is intact for
`cherry_pick_finalize_resolution` to act on.

No hunks were dropped under the BUG-1301 precedence exception. No UAT test
files were involved.

`git status --porcelain` shows no remaining conflict-class (UU/AA/DU/UD/AU/UA)
entries; the only remaining lines are pre-existing untracked ticket/report
files unrelated to this conflict.
