---
uid: report-4b37de94
id: REPORT-4180
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:53:59.320215+00:00'
updated_at: '2026-09-13T23:53:59.320215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, sparse-excluded (no
  working-tree markers; conflict existed only in the index). Rule **2e**
  (intent/bookkeeping ticket), superset branch: kept **ours**.
  Resolved with `git checkout --ignore-skip-worktree-bits --ours` +
  `git add --sparse`.

  Base (stage 1) `8d17adefbb` is byte-identical to the incoming commit's
  pre-image, so ours-vs-theirs is a clean two-way comparison.
  Ours (stage 2) `9129eee477` == `HEAD:` blob; theirs (stage 3) `e26fd6afb7`
  == the result of the cherry-picked commit `a61029bb`.

  `git diff <theirs> <ours>` is **additions only**, save for one
  replaced sentence (see below). Ours carries every block the incoming
  commit added, plus: three extra "Three behaviours" bullets (cursor
  boundary / corrupt cursor / conversation-never-reported-to-itself), the
  co-ranked-search delivery passage, an extra out-of-scope sentence
  ([[REQ-171]] ownership), an extra acceptance bullet, an extra "Decided"
  bullet (oversized title clipped), and the bundling frontmatter
  (`status: bundled`, `fields.commits`, `version`, `bundled_in`).
  Ours' `updated_at` (2026-09-11T18:53:54) is later than theirs
  (2026-09-01T19:12:34) on every contested frontmatter fact.

  Net staged diff vs HEAD is empty — this commit's effect is already in
  HEAD via the `seed_local_overlay` commit `cdc7e2329a`. Per STEP 4 this
  is left for `cherry_pick_finalize_resolution` to skip; `--skip` was not
  called here.

## Incoming changes preserved

Verified against `git show a61029bb -- .xgd/tickets/hot/request-bbff35c7.md`.
Every added hunk of the incoming commit is present verbatim in the resolved
(ours) blob:

- the "Except that in the Worker it is not one yet" block — present
- the "And on the `knowledge` component" block with both bullets — present
- the three "Out of scope" additions (chat-ticket summary, audit trail,
  Node's host) — present
- the two "Acceptance" additions (chat ticket / session cursor) — present
- the `## Open questions` → `## Decided` rewrite with all three bullets —
  present

**One incoming hunk is absent, and it is the developer's own retraction,
not a discard.** The incoming commit added:

    Until they land, seeding and the delta channel are deliverable and search
    remains single-index.

`git log -S` shows that sentence added by `a61029bb` (Tue Sep 1 12:12:34
-0700) and removed 42 minutes later by `9081f1b0` (Tue Sep 1 12:54:48
-0700), which replaced it with the longer "The second is genuinely blocked
and waits. The first is not, and is delivered here…" passage.
`git merge-base --is-ancestor a61029bb 9081f1b0` confirms `9081f1b0` is a
direct descendant of the commit being cherry-picked on the same working
timeline — the same author superseding their own sentence, not an
automated overwrite. `cdc7e2329a` (`seed_local_overlay`) is what carried
that later state into HEAD. Keeping the incoming two-liner would
*reintroduce* text the developer deleted, so its absence is correct.

No code/implementation files were involved; no test functions on either
side were touched.
