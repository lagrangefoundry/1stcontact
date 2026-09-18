---
uid: report-8d65749a
id: REPORT-4297
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:05:59.645518+00:00'
updated_at: '2026-09-18T05:05:59.645518+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — class **UU**, rule **2e**
  (intent/bookkeeping ticket; `request-*` kind, resident in `hot/` because
  spec-adjacent tickets never demote). Two conflict hunks, both resolved
  toward HEAD on a per-fact basis, not by whole-file preference:

  | Fact | Ours (HEAD, `5e6f3a68c6`, 2026-08-31T14:22:34Z) | Incoming (`c9f82a85cd`, 2026-08-23T22:01:13Z) | Kept |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `free_coding` | ours |
  | `updated_at` | 2026-08-31T14:22:34Z | 2026-08-23T22:01:13Z | ours |
  | `completed_at` | 2026-08-31T14:22:34Z | `null` | ours |
  | `last_field_updated` | `status` | `status` | identical — not a conflict |
  | body tail | v0.2.7 line + 87-line "deploy secret guard" follow-up | v0.2.7 line, EOF newline stripped | ours (strict superset) |

  Both sides are the same intent (`request-554ac441`), so the 2e timeline rule
  reduces to the ticket's own lifecycle ordering. The conflict-intent enrichment
  classified this as "intent unknown on one or both sides — take the more recent
  commit by timestamp"; that also selects ours (08-31 over 08-23).

  Incoming is the older bookkeeping state on every contested fact. Taking it
  would have driven an operator-owned status *backwards*, from
  `free_and_reconciled` to `free_coding`, and truncated 87 lines of body the
  incoming side never saw.

  Resolved with `git checkout --ours` + `git add --sparse` (the path sits
  outside the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

## Incoming changes preserved

No code or implementation files were in this conflict, so STEP 3's
code-discard guard does not govern. For completeness, the incoming commit's
four changed lines are accounted for rather than dropped:

- `status: free_coding` is **superseded, not discarded**. `free_coding` is an
  upstream state on the same lifecycle path that HEAD has already travelled
  past: the ticket entered `free_coding` and subsequently reached
  `free_and_reconciled` in `5e6f3a68c6`. The incoming transition's effect is
  present in HEAD via the later transition, which is STEP 3's "present via a
  different route" (redundant) case, not its "genuinely absent" (discarded)
  case.
- `updated_at` / `completed_at` are monotonic bookkeeping scalars; HEAD carries
  the later values, consistent with the status it records.
- The EOF-newline strip is moot: HEAD's body continues past the line the
  incoming side terminated, so there is no EOF at that position to normalise.

No hunk was dropped under the BUG-1301 precedence exception; that rule did not
need to be invoked.

## Net effect and follow-up

The staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty) —
this cherry-pick is **redundant**, its bookkeeping effect having already landed
through the later 08-31 transition. Per STEP 4 this was staged and exited
normally; `--skip` was not called and the cherry-pick sequencer
(`CHERRY_PICK_HEAD` = `c9f82a85cd`) is untouched for
`cherry_pick_finalize_resolution` to consume.

Flagged for post-merge review as the enrichment rule directs: confirm that
`request-554ac441` should remain at `free_and_reconciled` with version 0.2.9,
and that no later working-timeline work expected the ticket to be sitting at
`free_coding`.
