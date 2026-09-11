---
uid: report-3a5b0440
id: REPORT-4063
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:23:43.694097+00:00'
updated_at: '2026-09-11T22:23:43.694097+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU** (both modified), intent/bookkeeping
  ticket (rule **2e**). Resolved by keeping the HEAD side in full, on the
  strict-superset branch of 2e.

  Incoming commit `c9f82a85cd` (`xgd(ticket): update request request-554ac441`,
  authored 2026-08-23T15:01:14-0700) moves the ticket to an *earlier* lifecycle
  point than HEAD already holds:

  | fact | merge base | incoming (theirs) | HEAD (ours) |
  |---|---|---|---|
  | `status` | `free_coded` | `free_coding` | `free_and_reconciled` |
  | `updated_at` | 2026-08-23T03:24:38Z | 2026-08-23T22:01:13Z | 2026-08-31T14:22:34Z |
  | `completed_at` | `null` | `null` | 2026-08-31T14:22:34Z |
  | `fields.version` | 0.2.7 | 0.2.7 | 0.2.9 |
  | `fields.commits` | 2 entries | 2 entries | 4 entries + `working_sha_history` |
  | `fields.bundled_in` | absent | absent | `bundle-b3b7c399` |
  | `fields.chat_comment` | absent | absent | `comment-98e86f10` |
  | body | ends at 0.2.7 note | ends at 0.2.7 note | + ~85 lines (deploy-secret-guard follow-up, ACs 13–16) |

  A direct `git diff <ours-blob> <theirs-blob>` confirms the incoming side is
  not merely older but *strictly subtractive*: every hunk either removes a field
  HEAD added, removes body content HEAD appended, or rewinds a field HEAD has
  already advanced. There is no field or section where the incoming side is the
  later-positioned or unique authority, so 2e's per-fact timeline rule never
  fires — the superset branch decides the whole file.

  The one genuinely unique byte on the incoming side is the removal of the
  trailing newline at EOF (`\ No newline at end of file`). HEAD appends a new
  section past that point, so the incoming EOF state is not reconstructible and
  carries no intent.

  The file sits outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Stage 2 was
  materialised via `git cat-file blob` and staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path
is a bookkeeping ticket, not source.

For that ticket, STEP 3's distinction between *redundant* and *discarded*
resolves to **redundant**. The incoming commit's intent — advancing this ticket
through the `free_coding` stage of its lifecycle — is present in HEAD, reached
by a different route and then carried further: HEAD's `free_and_reconciled`
status, `completed_at` timestamp, 0.2.9 version and four-entry `commits` list
are all downstream consequences of that same progression. Nothing the incoming
commit asserts is absent from HEAD in a form that matters; it is absent only in
the sense that HEAD has moved past it. Re-applying it would demote an
operator-owned status field backwards.

No hunk was dropped under the BUG-1301 precedence exception; no UAT or test
function was touched on either side.

## Net result

The resolution nets to no diff vs HEAD (`git status --porcelain` is empty). Per
STEP 4 this is the BUG-1109/BUG-1122 case — a genuinely redundant commit, not a
discarded one, as established above. `--skip` was not called; the cherry-pick
sequencer state is intact (`CHERRY_PICK_HEAD` = `c9f82a85cd`) for
`cherry_pick_finalize_resolution` to act on.
