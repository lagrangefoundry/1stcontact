---
uid: report-dc102701
id: REPORT-2978
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:49:13.436671+00:00'
updated_at: '2026-08-31T15:49:13.436671+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **UU**, intent/bookkeeping ticket (rule **2e**;
  a `request-*` ticket, not a matrix-defining spec ticket, so 2d's ledger-replay does not
  apply). Index-only conflict: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1),
  so there were no working-tree conflict markers. Staged with `git add --sparse`.

  Per-fact composition of the two sides:

  | Fact | HEAD (`seed_local_overlay`, e0ffd3bf, 2026-08-30) | Incoming (`update`, 95ffc177, 2026-08-23) | Kept |
  |---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` | **HEAD** — genuine same-field conflict, resolved by timeline |
  | `updated_at` | `2026-08-24T02:10:41.151671+00:00` | `2026-08-24T01:15:24.843755+00:00` | **HEAD** — follows `status` |
  | `fields.chat_comment` | added (`comment-d6476701`) | untouched | **HEAD** — non-overlapping addition |
  | `fields.bundled_in` | added (`bundle-b3b7c399`) | untouched | **HEAD** — non-overlapping addition |
  | body / prose / ACs / implementation record | untouched | untouched | identical on both sides |

  Timeline basis for the one contested fact (`status`): both available orderings agree, and
  no `xgd working-timeline` call was needed because neither side's operation narrative
  declares an intent_uid — the enrichment metadata's fallback rule ("intent unknown on one or
  both sides; take the more recent commit by timestamp") therefore governs.
  - Commit timestamps: HEAD 2026-08-30T22:06:22-07:00 vs incoming 2026-08-23T18:15:24-07:00.
  - The ticket's own `updated_at`, which both sides rewrote: HEAD 02:10:41 vs incoming 01:15:24.

  Corroborating consistency check: HEAD's `status: bundled` is the forward lifecycle step from
  the incoming's `ready_to_reconcile`, and HEAD adds `fields.bundled_in: bundle-b3b7c399`.
  Taking the incoming `status` while keeping HEAD's `bundled_in` would have produced an
  internally inconsistent ticket — bundled into a bundle while still claiming to be merely
  ready to reconcile.

  Net result: the resolution is byte-identical to HEAD's blob (196bd290). Per STEP 4 this is
  staged and exited @done rather than `--skip`ped; the finalize step will detect the empty
  staged diff. `CHERRY_PICK_HEAD` was left in place.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
ticket, so STEP 3's "incoming developer code discarded" guard has no code file to check and
the BUG-1301 precedence exception was not invoked anywhere.

For completeness on the one ticket: the incoming commit's entire diff is the two-line
`status` / `updated_at` pair shown above. Its `status: ready_to_reconcile` is not carried
into the resolution, and that is *supersession, not discard* — HEAD already advanced the
same field further along the same lifecycle (`ready_to_reconcile` → `bundled`) in a commit
one week later, and recorded the bundle membership that transition produced. The incoming
side contributes no field, section, or prose that HEAD lacks; HEAD is a strict superset of
it. Nothing the developer authored in this commit is lost.

## Flagged for post-merge review

The enrichment metadata asked that this file be flagged, since intent was unknown on at
least one side. Flagging it here as requested: `.xgd/tickets/hot/request-23fd6e61.md`,
resolved to HEAD's `status: bundled`. The one thing a reviewer might want to confirm is that
`bundle-b3b7c399` (HEAD's `bundled_in`) is the intended bundle for REQ-147, given this
reconcile run is `reconcile-BUNDLE-21` / intent `bundle-78f4e2fe`. That value was not
introduced or altered by this resolution — it was already on the HEAD side — and no
`fields.intent_uid` / `story_uid` / `capability_uid` was touched.
