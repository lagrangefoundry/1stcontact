---
uid: report-09ab844d
id: REPORT-3315
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:49:02.936409+00:00'
updated_at: '2026-09-02T18:49:02.936409+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket: `request-*`). Resolved by keeping the HEAD side, which is a **strict superset**
  of the incoming side. Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  staged with `git add --sparse`.

  Per-fact breakdown against the merge base (`ee4b7578`):

  | Fact | Base | Ours (HEAD) | Theirs (incoming `082425cc`) | Resolved |
  |---|---|---|---|---|
  | `fields.chat_comment` | absent | `comment-18e5a285` | `comment-18e5a285` | `comment-18e5a285` |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | untouched | `bundle-b3b7c399` |
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | untouched | `free_and_reconciled` |
  | `updated_at` / `completed_at` | 2026-08-23 / null | 2026-08-31T14:22:27 (both) | untouched | 2026-08-31T14:22:27 (both) |

  No genuine per-fact conflict exists. The two sides agree exactly on the only fact
  incoming touched (`chat_comment`), so no `xgd working-timeline` tiebreak was needed.
  The sole textual conflict hunk was HEAD's extra `bundled_in` line against an empty
  incoming side — an addition-vs-nothing, not competing intent. HEAD's `status`,
  `updated_at` and `completed_at` advances merged cleanly (incoming never touched them)
  and are preserved; reverting `free_and_reconciled` back to `ready_to_reconcile` would
  have discarded operator-only state.

  No fields were invented, and `fields.intent_uid` / `story_uid` / `capability_uid` were
  not modified.

## Incoming changes preserved

The incoming commit `082425ccd333debca6a7cb520dfdeca19ca4eaa8`
("xgd(ticket): update request request-94e93caa", Aug 23 2026) touches exactly one file
and makes exactly one change: `1 file changed, 1 insertion(+)` — adding
`chat_comment: comment-18e5a285` under `fields`.

That line is present verbatim in the resolved, staged blob. Verified with
`git cat-file -p :.xgd/tickets/hot/request-94e93caa.md`. Nothing from the incoming
side was dropped.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply here.

### Note on net-zero staged diff

`git diff --cached HEAD` is empty: this resolution nets to no change against HEAD,
because HEAD had already recorded the same `chat_comment` value the incoming commit
adds (alongside its own later `bundled_in` and status advance).

This is the **redundant** case, not the discarded one, per STEP 3's discriminator: the
incoming commit's key change is *present* in HEAD via a different route, not absent.
Left staged as-is without calling `--skip`, per STEP 4 — the finalize step
(`cherry_pick_finalize_resolution`) detects the clean staged diff and skips the commit.

## Verification performed

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines remain; the tree
  reports no unmerged paths.
- Working-tree file contains zero conflict markers.
- `CHERRY_PICK_HEAD` left intact. No `cherry-pick --continue/--skip/--quit/--abort`,
  `reset`, or branch checkout was run. Git writes were limited to
  `git checkout --ours` and `git add --sparse` on the single conflicted path.
- No test suite was run: the resolution touches only ticket frontmatter, no code.
