---
uid: report-e9b2fb19
id: REPORT-4286
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:33:04.281401+00:00'
updated_at: '2026-09-18T04:33:04.281401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **AA (both added)**, intent/bookkeeping ticket (rule **2e**, with 2b's superset clause). Index-only conflict: the path is outside the sparse-checkout cone on this reconcile branch (DOC-986 §2/§4.1), so there were no working-tree conflict markers. Resolved to the **ours (HEAD)** blob via `git checkout --ours` + `git add --sparse`.

  Both stages were compared blob-to-blob (`ca45d92f` stage 2 vs `ee4b7578` stage 3). The **entire ticket body is byte-identical**; the only divergence is frontmatter, where ours is a strict superset of theirs:

  | fact | ours (HEAD) | theirs (incoming `83973a5e`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:27Z` | `null` |
  | `updated_at` | `2026-08-31T14:22:27Z` | `2026-08-23T03:29:52Z` |
  | `fields.chat_comment` | `comment-18e5a285` | *(absent)* |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  There is **no fact carried by the incoming side that ours lacks** — every field theirs sets, ours also sets, at an equal-or-later value. So this is not a per-fact intent conflict under 2e's third bullet; it is 2e's second bullet (strict superset), and no `working-timeline` arbitration was needed.

  The enrichment metadata classified both subjects as unknown-intent and prescribed "take the more recent commit by timestamp." That points the same way: ours is `f7bd4caa` (2026-08-31 07:22 PDT), theirs is `83973a5e` (2026-08-22 20:29 PDT) — ours is 8 days later.

  Taking theirs would have *reverted* the ticket from `free_and_reconciled` back to `ready_to_reconcile`, cleared `completed_at`, and dropped the bundling/chat linkage — a silent regression of lifecycle state the outer reconcile run has already advanced. Flagged for post-merge review per the enrichment rule, though the superset relation makes the outcome unambiguous.

## Incoming changes preserved

No code/implementation files were in this conflict — the incoming commit `83973a5e` touches exactly one path, and it is the bookkeeping ticket above (127 insertions, whole-file add).

STEP 3 check on that file: the incoming commit's content **is present in HEAD**, arriving by a different route rather than being discarded. Concretely, every one of the 127 lines the incoming commit introduced exists in the resolved (ours) version — the narrative body verbatim, and each frontmatter key at an equal-or-more-advanced value (table above). This is the BUG-1109/BUG-1122 "redundant commit" shape, not the "discarded developer code" shape: HEAD independently received this request ticket and then carried its lifecycle forward past the incoming snapshot.

No hunks were dropped under the BUG-1301 precedence exception; none applied here.

Consequently the staged tree nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty). Per STEP 4 this is not a failure condition and `--skip` was **not** called — `CHERRY_PICK_HEAD` (`83973a5e64b1303e891416b0a952ac6217ee8c32`) is left intact for `cherry_pick_finalize_resolution`, which will detect the clean staged diff and skip the commit itself.

Final `git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
