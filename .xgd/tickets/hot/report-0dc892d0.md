---
uid: report-0dc892d0
id: REPORT-3041
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:54:35.633319+00:00'
updated_at: '2026-08-31T19:54:35.633319+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — class **AA** (both added), intent/bookkeeping ticket.
  Rule applied: **2b/2e — one side is a strict superset, keep the superset** (HEAD side).
  Path is outside the sparse-checkout cone, so resolved via `git checkout --ours --` +
  `git add --sparse --` (DOC-986 §2/§4.1).

  Both sides carry byte-identical bodies (the full 164-line request document). The only
  differences are three bookkeeping facts in frontmatter, and on every one of them the HEAD
  side is strictly further advanced:

  | fact | incoming (c5752ee5cc) | HEAD (a4b923f94e) |
  |---|---|---|
  | `status` | `ready_to_reconcile` | `bundled` |
  | `updated_at` | `2026-08-23T03:29:49Z` | `2026-08-24T02:10:41Z` |
  | `fields.chat_comment` | absent | `comment-869ded75` |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` |

  This is not a competing-fact conflict requiring the working-timeline rule: it is the same
  lifecycle fact observed at two points in time, with HEAD holding the later observation
  (`ready_to_reconcile` → `bundled` is a forward status progression, and the two added fields
  are the bookkeeping that progression produced). Taking the incoming side would have
  regressed the ticket's status and dropped its bundle linkage. No content was invented; no
  `intent_uid` / `story_uid` / `capability_uid` field was touched.

## Incoming changes preserved

Confirmed by diffing the incoming blob (`b6f1c0d06a`) against the resolved working-tree file:
the incoming commit's entire contribution — it added the file, 164 insertions — is present
verbatim in the resolution. The diff reports only the four frontmatter facts tabulated above,
in every case with HEAD carrying the later value. Nothing the developer authored was
discarded.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.

## Note on the staged result

`git diff --cached HEAD` is empty: the resolution nets to no change against HEAD. This is the
redundant-commit case described in STEP 4 (BUG-1109/BUG-1122), not a discard — STEP 3's
distinguishing check passes, because the incoming commit's key changes are *present* in HEAD
(HEAD already carries the same body plus later bookkeeping), rather than absent. Per
instructions, `--skip` was not called; the tree is staged and CHERRY_PICK_HEAD is left intact
for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD` lines remain (untracked `??` ticket files
  are pre-existing and untouched).
- `grep -c '^<<<<<<<'` on the resolved file — `0`; no conflict markers remain.
- No `cherry-pick --continue/--skip/--quit/--abort`, `git reset`, or `git checkout <branch>`
  was run. Git writes were limited to `checkout --ours` and `add --sparse` on the single
  conflicted path, each issued as the sole content of its own call (BUG-1294).
