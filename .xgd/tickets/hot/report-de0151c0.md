---
uid: report-de0151c0
id: REPORT-4717
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T11:17:53.025436+00:00'
updated_at: '2026-09-21T11:17:53.025436+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e rule. Two conflict hunks, both confined to frontmatter; the
  body was untouched on both sides.

  - **Hunk 1 — `updated_at` / `last_field_updated` / `status`.** Same fact changed on
    both sides, so 2e's per-fact later-intent rule applies. HEAD (`c94654a355`,
    `seed_local_overlay`): `status: bundled` @ `2026-09-09T21:32:50`. Incoming
    (`f20ff760fc`): `status: free_coded` @ `2026-09-01T01:22:19`. HEAD is both eight
    days later and strictly downstream in the lifecycle (`free_coded` → … → `bundled`),
    so the incoming side is a stale replay of a transition HEAD has already passed
    through. **Took HEAD.** This also matches the auto-enrichment rule quoted for this
    file ("take the more recent commit by timestamp").

  - **Hunk 2 — `fields.bundled_in: bundle-87be4669`.** Present only on HEAD; the
    incoming side predates bundling and has no competing value. Not a genuine conflict —
    an add-vs-absent. **Kept HEAD's line.**

## Incoming changes preserved

- `.xgd/tickets/hot/request-6893f6ea.md` — confirmed against
  `git show f20ff760fc -- .xgd/tickets/hot/request-6893f6ea.md`. That commit made three
  changes; all three are accounted for in the resolved file:

  - `fields.commits` (`working_sha: 27450010586c65b293b2ad5cc6243815133a17be`,
    `reconcile_sha: null`, `main_sha: null`) — **present**, verbatim. It landed outside
    the conflict region and is already in HEAD, so it survives untouched.
  - `fields.version: 0.2.27` — **present**, verbatim, same reasoning.
  - `status: free_coded` — **superseded, not discarded.** This is the one fact where the
    two sides genuinely compete, and 2e resolves it to the later-positioned intent
    (`bundled`). Recording `free_coded` here would roll REQ-158's lifecycle backwards.

  No BUG-1301 precedence exception was needed: nothing was dropped on the grounds of a
  prior refactor. No code files, no spec tickets, and no UAT tests were involved in this
  conflict, so 2c/2d/2f did not come into play.

## Staging state

`git status --porcelain` is empty — the resolved file is byte-identical to HEAD, since
every incoming addition was already present there and the only divergent fact resolved
to HEAD's value. `git add --sparse` was issued (the path is outside the sparse-checkout
cone per DOC-986 §2/§4.1) and left an empty staged diff. `CHERRY_PICK_HEAD`
(`f20ff760fc`) is still present and untouched; no `--continue`/`--skip`/`--quit`/
`--abort` was run. The finalize step should see a clean staged diff and skip the commit.
