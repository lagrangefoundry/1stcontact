---
uid: report-a6d391b1
id: REPORT-3557
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:53:03.984653+00:00'
updated_at: '2026-09-09T22:53:03.984653+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **AA** (both added), intent/bookkeeping
  ticket → **rule 2e**, superset branch. Resolved to the **OURS (HEAD)** blob
  (`ca66295`), staged with `git add --sparse` (path is outside the sparse-checkout cone,
  DOC-986 §2/§4.1 — the conflict existed in the index only, with no working-tree markers).

  Both 2e tests point the same way:

  - **Strict superset.** OURS contains every one of THEIRS' 35 body sentences verbatim
    (verified by normalised per-sentence comparison, not by eyeballing line counts — the two
    sides differ in hard-wrap width and emphasis markers, so a raw `diff` overstates the
    delta). OURS then adds the entire `# What was built` section (~120 lines: the fourth
    option for AC3, the one-browser-per-run lease, the `1c shot` split, deliberately-not-done,
    file table, test plan, AC status table). Frontmatter key sets are identical; OURS advances
    `status: draft → bundled`, `last_field_updated: body → status`, `updated_at
    2026-08-20 → 2026-08-31`, and adds `fields.commits` (working_sha `29c0e86`),
    `fields.version: 0.2.16`, `fields.bundled_in: bundle-8eef3846`. THEIRS holds no field,
    section or sentence that OURS lacks.
  - **Timeline, per fact.** The HEAD-side commit touching this file is `afd1997`
    (2026-08-31 12:21:41 -0700, `seed_local_overlay`); the incoming commit is `97327f5`
    (2026-08-23 16:26:15 -0700, `update request`). HEAD is the later-positioned side, which
    matches the enrichment's stated rule ("take the more recent commit by timestamp").

  Taking THEIRS would have reverted the ticket from `bundled` to `draft` and dropped the
  `commits` / `version` / `bundled_in` bookkeeping — an operator-owned status regression —
  while deleting the implementation record, in exchange for no content gain.

  No fields were invented; no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

No code, test or config files were in conflict — the sole conflicted path is a
bookkeeping ticket (2e). No UAT function on either side was deleted, and the BUG-1301
precedence exception was not invoked (no hunk was dropped on refactor grounds).

STEP 3 check on the incoming commit `97327f5`: its only change to this file is the REQ-154
request body as authored on 2026-08-20. That content is **present in the resolved file**, in
full — it is the pre-`# What was built` half of the HEAD-side version. This is therefore the
*redundant* case, not the *discarded* case: the incoming commit's key changes are in HEAD
already, having arrived by the later `seed_local_overlay` route that also carried the
implementation record.

Consequently the staged tree nets to **no diff vs HEAD** for this path
(`git diff --cached HEAD -- <path>` is empty). Per STEP 4 that is not a failure and not a
`--skip` trigger: staged and exiting `@done`, leaving the empty-commit decision to
`cherry_pick_finalize_resolution`.

`git status --porcelain` shows no remaining UU/AA/DU/UD/AU/UA entries.
`CHERRY_PICK_HEAD` (`97327f55c1d75dfef7bf44d407e7b73949eef6e6`) is intact — no
`continue`/`skip`/`quit`/`abort`/`reset` was run.
