---
uid: report-5f850ea8
id: REPORT-4288
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:37:53.258259+00:00'
updated_at: '2026-09-18T04:37:53.258259+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — AA (both added), intent/bookkeeping
  ticket → rule 2e (intent/bookkeeping ticket, per-fact resolution), with the
  enrichment note's "intent unknown on one or both sides → take the more recent
  commit by timestamp" tiebreak. Path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so resolved via `git checkout --ours` + `git add --sparse`.

  Per-fact comparison (the two blobs differ only in frontmatter; the 303-line
  body is byte-identical on both sides):

  | fact | ours (HEAD, commit `decf67f5`, 2026-08-31) | theirs (incoming `773e1698`, 2026-08-23) | kept |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours (later lifecycle state) |
  | `updated_at` | 2026-08-31T14:22:36Z | 2026-08-20T00:47:43Z | ours |
  | `completed_at` | 2026-08-31T14:22:36Z | `null` | ours |
  | `fields.commits` | `055378794f...` folded into the first entry's `working_sha_history` | `055378794f...` as a separate pending entry with `reconcile_sha: null` | ours |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | ours (theirs never carried it) |

  Every differing fact is the SAME fact at two lifecycle stages, not two
  competing edits: the incoming side is the earlier snapshot of this request
  ticket (pre-reconcile), the HEAD side is the post-reconcile snapshot of the
  same facts. No field, section, or list value exists only on the incoming
  side. The working sha `055378794f49f1dc39b20fdcf54aa7fa0b1190e3` that the
  incoming side records as a pending commits entry is present in the HEAD side
  inside `working_sha_history` — carried forward, not dropped.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path
is a bookkeeping ticket (2e), not a spec ticket (2d) and not source.

The incoming commit `773e1698` touches exactly one file, this ticket, and its
content is an earlier state of facts HEAD already carries in their later form.
STEP 3's discard test therefore passes by the "present via a different route"
branch, not by the "genuinely absent" branch: the incoming commit's key change
(recording working sha `055378794f...` against this request, and the request's
progression through the reconcile lifecycle) IS present in HEAD, in its
completed form. Nothing the developer authored is lost.

No BUG-1301 precedence exception was invoked; no test function was deleted.

Note on the staged result: `git diff --cached HEAD` is empty — this resolution
nets to no diff vs HEAD, because HEAD already holds the superseding state of
this ticket. Per STEP 4 this is not a failure and `--skip` was NOT called; the
cherry-pick sequencer state is intact (`CHERRY_PICK_HEAD` =
`773e1698198c4066bd2dfad635bb963bde641a6b`) for
`cherry_pick_finalize_resolution` to handle.

Post-merge review flag (per the enrichment rule): this file's resolution relied
on commit timestamps rather than a known intent on both sides. The judgement is
low-risk — the sides are the same ticket before and after reconcile, with no
disjoint edits — but it is recorded here as flagged.
