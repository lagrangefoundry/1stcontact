---
uid: report-6e4de612
id: REPORT-3362
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:14:39.195990+00:00'
updated_at: '2026-09-02T21:14:39.195990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` (BUG-38) — class **UU**, rule **2e**
  (intent/bookkeeping ticket), resolved per-fact by later-positioned intent.
  Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`), so staged
  with `git checkout --ours` + `git add --sparse`.

  Conflicting facts, all four in the frontmatter region:

  | fact | HEAD (ours) | incoming (`0431fed4`) | kept |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | HEAD |
  | `completed_at` | `2026-08-31T19:19:34` | `null` | HEAD |
  | `updated_at` | `2026-08-31T19:19:34` | `2026-08-25T22:52:44` | HEAD |
  | `last_field_updated` | `status` | `status` | identical |

  Timeline: the incoming commit is `2026-08-25`; the HEAD-side commit
  (`01492336`) is `2026-09-01`. Both sides' intents were unenriched, so the
  auto-enrichment rule ("take the more recent commit by timestamp") applies,
  and it agrees with the ledger reading below.

  Ledger replay confirms these sides are sequential, not competing. The
  lifecycle for BUG-38 runs:

      free_coded -> ready_to_reconcile (incoming, 2026-08-25)
                 -> bundled            (HEAD-side base, 2026-08-26)
                 -> free_and_reconciled (HEAD, 2026-08-31/09-01)

  HEAD has already passed *through* the incoming state and two steps beyond
  it. Taking incoming would regress an already-reconciled bug back to
  `ready_to_reconcile` and null out its `completed_at`.

  No content was invented, and nothing unique to the incoming side was lost —
  incoming touched only the four fields above. HEAD-side `fields.bundled_in:
  bundle-78f4e2fe` sits outside the conflict region and is preserved
  untouched. `fields.intent_uid` / `story_uid` / `capability_uid` were not
  modified.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflict is a
bookkeeping ticket, so STEP 3's code-discard guard has no code to check and
no BUG-1301 precedence hunk was dropped.

For the ticket itself, the incoming commit's key change is present in HEAD
via a later route rather than absent: its intent was to advance BUG-38 from
`free_coded` to `ready_to_reconcile`, and HEAD's `free_and_reconciled` is two
documented lifecycle steps downstream of exactly that transition (`bundled`
at 2026-08-26 is itself downstream of `ready_to_reconcile`). This is the
redundant case (BUG-1109/BUG-1122), not the discarded case.

The resolution therefore nets to no diff versus HEAD. Per STEP 4 the file was
staged and `--skip` was NOT called; CHERRY_PICK_HEAD remains present for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

Post-merge review flag (per the enrichment rule): low risk — the discarded
side is a strictly earlier position in the same ticket's own status
lifecycle, not a competing edit to any other field.
