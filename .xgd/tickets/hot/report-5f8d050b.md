---
uid: report-5f8d050b
id: REPORT-4553
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T21:07:38.561931+00:00'
updated_at: '2026-09-20T21:07:38.561931+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — **UU**, intent/bookkeeping ticket
  (§2e: `request-*`, hot tier). Conflict was confined to the frontmatter
  status block; the body was identical on both sides.

  | field | OURS (HEAD) | THEIRS (CHERRY_PICK_HEAD 2886fb4f72) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `bundled` |
  | `updated_at` | 2026-08-31T14:22:33Z | 2026-08-24T02:10:41Z |
  | `completed_at` | 2026-08-31T14:22:33Z | `null` |

  Same fact changed on both sides → genuine intent conflict → per-fact
  later-positioned intent wins. HEAD is the later intent, and the
  positional check confirms it rather than resting on raw `updated_at`:
  the incoming transition is `ready_to_reconcile → bundled`, and HEAD's
  own ledger already replayed exactly that transition via
  `274c14daf5` (`xgd(ticket): seed_local_overlay`, 2026-08-30) before
  advancing to `free_and_reconciled` in `43c2dac730` (2026-08-31).
  Taking the incoming side would rewind a terminal ticket to a lifecycle
  state it has already passed through and out of. Resolved by keeping the
  HEAD status block; no conflict markers remain. Staged with
  `git add --sparse` (path is outside the sparse cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-34dd9049.md` — no incoming content was
  discarded. `git show 2886fb4f72 -- <file>` shows the commit made
  exactly two changes beyond the status/timestamp block: it added
  `fields.bundled_in: bundle-b3b7c399`. That field **is present** in the
  resolved file (line 31), having arrived on HEAD by the parallel route
  described above. The status/timestamp fields are the sole point of
  divergence and are resolved per §2e's per-fact rule, not dropped
  silently.

- No BUG-1301 precedence exception was invoked; no hunk was dropped on
  refactor grounds. No code or UAT files were involved in this conflict.

## Post-resolution state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain, and the
staged tree is byte-identical to HEAD (`git diff --cached HEAD` empty),
because the incoming commit is a stale replay of a transition HEAD
already performed. Per STEP 4 this is left as-is and NOT skipped here —
`CHERRY_PICK_HEAD` (2886fb4f72) is intact for the finalize step, which
will detect the empty staged diff and skip the commit itself.
