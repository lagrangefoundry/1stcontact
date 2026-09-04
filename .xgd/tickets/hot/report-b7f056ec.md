---
uid: report-b7f056ec
id: REPORT-3455
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:33:00.115333+00:00'
updated_at: '2026-09-04T01:33:00.115333+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — UU, intent/bookkeeping ticket (STEP 2 rule 2e).
  Resolved per-fact in favour of the HEAD side; staged via
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Per-fact analysis (base `2b8dcbd1`, ours `4de1054a`, theirs `0b0d4107`):

  | fact | ours (HEAD) | theirs (incoming `0d47d0c4`) | kept |
  |---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` | ours |
  | `updated_at` | `2026-09-02T17:48:27` | `2026-09-01T18:09:26` | ours |
  | `last_field_updated` | `status` | `status` | identical |
  | `fields.bundled_in` | `bundle-203b1dc2` (added) | untouched | ours |

  Both sides moved the same fact (`status`) off the base value `free_coded`,
  so this is a genuine per-fact conflict and the timeline rule applies.
  Ours is the later-positioned side by every available measure: the ours-side
  commit and its `updated_at` are ~23h later than the incoming commit's, and
  `bundled` is strictly downstream of `ready_to_reconcile` in the request
  lifecycle. The ours side additionally carries `fields.bundled_in:
  bundle-203b1dc2` — the record of this very reconcile bundle — which the
  incoming side never touched, so it is kept as a non-overlapping addition.
  No fields outside the two sides' own operations were modified, and no
  content was invented.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, not source.

The incoming commit `0d47d0c4` ("xgd(ticket): update request
request-3bc4b835") changed exactly three frontmatter scalars, whose only
substantive effect is advancing `status` off `free_coded`. That effect is
present in the resolved file, in its later form: HEAD has already advanced the
same field past `ready_to_reconcile` to `bundled` and stamped `bundled_in`.
Restoring the incoming literal value would move the request backwards through
its own lifecycle and unbundle it from the bundle currently being reconciled.

Consequently the staged tree nets to no diff vs HEAD for this commit. This is
the redundant case, not the discarded case (STEP 3 / STEP 4, BUG-1109/1122):
the incoming commit's key change is present in HEAD via a later route, not
absent. `git cherry-pick --skip` was not called; the finalize step will detect
the empty staged diff.

No hunks were dropped under the BUG-1301 precedence exception.
