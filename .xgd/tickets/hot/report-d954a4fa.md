---
uid: report-d954a4fa
id: REPORT-3417
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:04:27.844422+00:00'
updated_at: '2026-09-04T00:04:27.844422+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; `request-*`, user-authored content, not matrix state). Resolved to
  the **OURS/HEAD** side.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  Per-fact analysis against the merge base (`84206ff09a`):

  - **Incoming** (`ad68bd8ac7`, `xgd(ticket): update request`, 2026-08-31 15:17
    -0700) touched **only frontmatter**: `status: free_coding → free_coded`,
    `updated_at`, `+fields.commits[{working_sha: 115f0d39ec…, reconcile_sha: null,
    main_sha: null}]`, `+fields.version: 0.2.23`. The body was untouched.
  - **Ours/HEAD** (`1856968a43`, `xgd(ticket): seed_local_overlay request`,
    2026-09-02 10:50 -0700) made every one of those same additions verbatim
    (`fields.commits` with the identical `working_sha`, `fields.version: 0.2.23`),
    and additionally `status: bundled`, `+fields.bundled_in: bundle-203b1dc2`,
    and a full body rewrite (the `# What landed` section, plus de-linking
    `[[REQ-158]]` references).

  HEAD is therefore a **strict superset** of the incoming change — 2e's
  "one side is a strict superset, keep the superset" branch. The only fields where
  the two sides state the same fact differently are `status` and `updated_at`; both
  resolve to HEAD under 2e's per-fact timeline rule, HEAD being the later-positioned
  side by two days (2026-09-02 vs 2026-08-31) on both commit date and `updated_at`.

  `status: bundled` is also the strictly downstream lifecycle state: taking the
  incoming's `free_coded` would revert the ticket's status and drop
  `bundled_in: bundle-203b1dc2` — i.e. un-bundle the very bundle this reconcile run
  is executing.

  No content was invented; no `intent_uid`/`story_uid`/`capability_uid` field was
  touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted file is a
bookkeeping ticket.

The incoming commit's key changes are **present in the resolved result**, carried
by HEAD rather than by the incoming blob:

- `fields.commits[0].working_sha: 115f0d39ec5f8787751f144cda8b5d3c6279fbf9` — present
- `fields.version: 0.2.23` — present
- `status` advanced past `free_coding` — present, and further advanced to `bundled`

Nothing was dropped under the BUG-1301 precedence exception; no hunk was discarded.

Because HEAD already carried the incoming commit's entire effect, the staged tree
nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty). Per STEP 4 this is
the redundant-commit case (BUG-1109/BUG-1122), **not** a discard: STEP 3's
distinguishing check passes — the incoming commit's key changes are present in HEAD
via a different route, rather than simply absent. `--skip` was not called; the
cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `ad68bd8ac7`) is left intact for
`cherry_pick_finalize_resolution`.

Tree state: `git status --porcelain` shows no conflict-class (UU/AA/DU/UD/AU/UA)
entries. The remaining `??` entries are pre-existing untracked `comment-*.md`
tickets unrelated to this cherry-pick.
