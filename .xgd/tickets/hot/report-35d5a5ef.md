---
uid: report-35d5a5ef
id: REPORT-5148
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:52:47.154161+00:00'
updated_at: '2026-09-26T21:52:47.154161+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` (REQ-150) — **AA**, intent/bookkeeping
  ticket (`type: request`), rule **2e**. Materialized on disk with real conflict
  markers despite `.xgd/tickets/` being out of the sparse cone (staged with
  `git add --sparse`). Resolved by taking **ours** via `git checkout --ours`,
  which restores the exact HEAD blob rather than a hand-written rewrite.

  The two sides' markdown bodies are **byte-identical**. The only divergence is
  lifecycle frontmatter, and ours is strictly later on every differing fact:

  | fact | ours (HEAD) | theirs (`3e9239d68a`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:33` | `null` |
  | `updated_at` | `2026-08-31T14:22:33` | `2026-08-22T21:54:23` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Ours is a strict superset of theirs — same body, same `version: 0.2.2`, same
  three `commits` entries, same `chat_comment`, plus one additional field. Per
  2e ("one side a strict superset: keep the superset"; otherwise "take the
  LATER-positioned intent, per fact"), ours wins on all four facts. Incoming
  wins nothing here because it proposes nothing newer: its commit is dated
  2026-08-23, HEAD's ticket state is from 2026-08-31.

  Taking incoming would have regressed the ticket from `free_and_reconciled`
  back to `ready_to_reconcile`, nulled `completed_at`, and dropped
  `bundled_in: bundle-b3b7c399` — i.e. unbundled a ticket the overlay has
  already bundled and reconciled. That is the overlay-advances-past-incoming-status
  failure mode, not a developer edit worth preserving.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so there is no developer source to discard.

For `request-34dd9049.md`: all substantive incoming content **is** present in the
resolved version, because the incoming body is identical to ours character for
character (verified by full-file diff of index stages 2 and 3 — the diff is
confined to four frontmatter lines). The only incoming-side values not carried
forward are the four lifecycle fields tabled above, which are deliberately
superseded under rule 2e rather than dropped by accident.

No BUG-1301 precedence exception was invoked; no test function was deleted.

## Staging state

`git status --porcelain` and `git ls-files -u` are both empty. Because ours was
already HEAD's content, the resolution leaves **no net staged diff** — the
expected clean-diff case. `--skip` was deliberately **not** called; the finalize
step owns that decision. `CHERRY_PICK_HEAD` (`3e9239d68a`) is intact.
