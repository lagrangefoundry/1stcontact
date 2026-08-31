---
uid: report-2d75f63f
id: REPORT-2995
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:21:23.440989+00:00'
updated_at: '2026-08-31T16:21:23.440989+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, index-only conflict (path is
  outside the sparse-checkout cone, so no working-tree markers existed;
  resolved via `git checkout --ours` + `git add --sparse`, DOC-986 §2/§4.1).
  Rule applied: **2e** (intent/bookkeeping ticket — `bug-*`, user-authored
  content, not matrix state), per-fact, superset branch.

  Incoming commit this attempt is `e81f695ea6` (2026-08-24 14:57:20 -0700),
  a *different* commit from attempt 210/0's `a9248d6756`. HEAD-side is
  unchanged at `501a0595d1` (2026-08-31 07:24:25 -0700).

  What the incoming commit actually adds, per `git show e81f695ea6`:
  `working_sha_history: []` on the first `commits` entry, two new entries
  (`0fe586d1f67c678efd5a1ff02f5978948a41bb11`,
  `999579b3fbef0757cf5e715691c9aaa9ecdf329e`), `version: 0.2.11` → `0.2.13`,
  and `last_field_updated: body` → `status`. **All five are already present
  verbatim in ours** — they do not appear in the ours-vs-theirs diff at all.

  The ours-vs-theirs diff reduces to exactly three facts, and ours wins each:

  - **`updated_at`** — ours `2026-08-26T17:36:27`, incoming
    `2026-08-24T21:57:19`. Ours later.
  - **`status`** — ours `bundled`, incoming `free_coded`. Ours is the later
    intent and is this bundle's own bookkeeping.
  - **`fields.bundled_in`** — `bundle-78f4e2fe` exists only on ours.

  Body prose is byte-identical on both sides (zero diff below the frontmatter).

  Both 2e tests agree: ours is a strict superset on every conflicting field,
  and the HEAD-side commit is later-positioned than the incoming. Taking the
  incoming frontmatter would have reverted `status` from `bundled` back to
  `free_coded` and dropped `bundled_in: bundle-78f4e2fe`, corrupting the
  in-flight bundle's own state. No content was invented; every line in the
  resolved file is present on at least one side.

## Incoming changes preserved

Confirmed. This ticket is a bookkeeping file, not code, but the STEP 3 check
was performed anyway against `git show e81f695ea6 --
.xgd/tickets/hot/bug-6612c4b7.md`, and verified by reading the resolved
frontmatter directly rather than inferring it from the diff:

- `working_sha_history: []` — present.
- `working_sha: 0fe586d1f67c678efd5a1ff02f5978948a41bb11` — present.
- `working_sha: 999579b3fbef0757cf5e715691c9aaa9ecdf329e` — present.
- `version: 0.2.13` — present.
- `last_field_updated: status` — present (identical on both sides).

The incoming's remaining frontmatter deltas (`updated_at`, `status:
free_coded`) are not carried forward. They are not discarded work: HEAD
already contains this commit's substantive additions and then advanced the
same fields further along the same timeline. These are superseded bookkeeping
scalars, not developer code.

No hunks were dropped under the BUG-1301 precedence exception; no test
function on either side was deleted.

**Net result vs HEAD is an empty staged diff.** This is the BUG-1109/BUG-1122
redundant-commit case, not a discard: HEAD already contains every one of the
incoming commit's key changes, which is exactly the distinction STEP 3 draws —
present via a different route, not absent. Per STEP 4, no `--skip` was called;
the tree is staged and left for `cherry_pick_finalize_resolution` to detect and
skip.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `e81f695ea6…`) left intact.
`git diff --diff-filter=U` reports zero unmerged paths.
