---
uid: report-240da16a
id: REPORT-3848
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:28:04.315934+00:00'
updated_at: '2026-09-11T01:28:04.315934+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (rule 2e; `request-*`, user-authored content, not matrix state). Resolved by
  keeping the HEAD side, which is a **strict superset** of the incoming side.
  Out of the sparse-checkout cone (DOC-986 §2/§4.1), so resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

  Per-fact analysis (base `3e8ad95e49` / ours `97468957db` / theirs `edc369d9b1`):

  - Incoming commit `7e204dc27e` (`xgd(ticket): update request request-119dd4af`,
    Aug 31 2026) changes **2 insertions, 1 deletion** total: it adds
    `fields.chat_comment: comment-733e844c` and drops the trailing newline at EOF.
    Nothing else.
  - HEAD commit `ba5f1d5da9` (`xgd(ticket): seed_local_overlay request
    request-119dd4af`, Sep 9 2026) already carries **both** of those facts, plus
    disjoint additions the incoming side never touched: `status: draft → bundled`,
    `last_field_updated: body → status`, `updated_at`, `fields.commits`
    (`working_sha 115f0d39ec`), `fields.version: 0.2.23`,
    `fields.bundled_in: bundle-87be4669`, and the body's "What landed" section.
  - There is **no fact changed differently on the two sides**, so the timeline
    rule in 2e never had to be invoked. (Had it been: HEAD is Sep 9, incoming is
    Aug 31 — HEAD is the later-positioned side either way, matching the
    auto-enrichment's "take the more recent commit by timestamp" note.)
  - No content was invented; no `fields.intent_uid` / `story_uid` /
    `capability_uid` was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-119dd4af.md` — **preserved, verified twice.**
  - `git diff <theirs> <ours>` shows `  chat_comment: comment-733e844c` as an
    **unchanged context line**, not a deletion — i.e. the incoming field is
    present on both sides.
  - `git show :.xgd/tickets/hot/request-119dd4af.md` on the staged blob confirms
    `chat_comment: comment-733e844c` at line 18, and the file ends without a
    trailing newline, matching the incoming commit's other change.

  No hunk was dropped; the BUG-1301 precedence exception was not needed and is
  not being invoked.

## Note: resolution nets to no diff vs HEAD

`git status --porcelain` reports no tracked changes and `git ls-files -u` is
empty. This is the **redundant-commit** case of BUG-1109/BUG-1122, not a
discard: STEP 3's distinguishing check passes — the incoming commit's key change
is *present* in HEAD (it arrived via the later `seed_local_overlay` commit, which
carried the same `chat_comment` field forward), rather than *absent*. Per STEP 4,
`--skip` was not called; the tree is staged and left for
`cherry_pick_finalize_resolution` to detect the clean staged diff.

`CHERRY_PICK_HEAD` (`7e204dc27e`) is intact — no `--continue`, `--skip`,
`--quit`, `--abort`, `reset`, or `checkout <branch>` was run.
