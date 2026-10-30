---
uid: report-5bf696ce
id: REPORT-5163
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T22:30:53.984663+00:00'
updated_at: '2026-09-26T22:30:53.984663+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` (REQ-149) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **§2e** applied per fact. Two conflict hunks:

  1. **Frontmatter lifecycle fields** — genuine intent conflict: both sides set
     the same facts differently. Incoming (`c9f82a85cd`, authored
     2026-08-23T22:01) had `status: free_coding`, `completed_at: null`,
     `updated_at: 2026-08-23T22:01`. HEAD had `status: free_and_reconciled`,
     `completed_at: 2026-08-31T14:22`, `updated_at: 2026-08-31T14:22`. Under
     §2e's later-positioned-intent rule (and the auto-enrichment's
     more-recent-timestamp rule, which concurs), **HEAD wins these three
     facts**. Taking incoming would have regressed the ticket backwards through
     its lifecycle, dropped a completion timestamp, and — per the surrounding
     `fields` block — discarded `bundled_in: bundle-b3b7c399`,
     `chat_comment: comment-98e86f10`, `version: 0.2.9`, two `commits` entries
     and the `working_sha_history` keys, none of which exist on the incoming
     side.

  2. **Body tail** — not a competing edit: HEAD is a **strict superset**. It
     contains incoming's final paragraph verbatim and then appends an ~80-line
     follow-up section ("the deploy secret guard asked the wrong question":
     cause, decision table, acceptance criteria 13–16, the seven UATs in
     `tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts`, version bookkeeping
     through 0.2.9) that the 2026-08-23 incoming commit predates entirely.
     §2e keeps the superset. Incoming's only other contribution to this hunk was
     stripping the file's trailing newline (`\ No newline at end of file`), which
     is not content.

  Resolved by taking HEAD's exact committed blob (`85e97c81`) rather than
  hand-authoring a merge, so no stale frontmatter is reintroduced and the
  operator-only `status`/`completed_at` values are not re-derived.

  Mechanical note: `.xgd/tickets/` is outside this worktree's sparse-checkout
  cone (DOC-986 §2/§4.1). `git checkout --ours` printed a "paths outside
  sparse-checkout … will not be updated in the index" warning and exited
  non-zero, but **did** write the correct file to disk — verified
  `git hash-object` on the working tree equals index stage 2 (`85e97c81`).
  Staging then required `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
ticket markdown file, and both sides' commits are `xgd(ticket): update request
request-554ac441` bookkeeping commits.

`git diff c9f82a85cdfd4211ae075ce9306b7c276ec8fb00 -- .xgd/tickets/hot/request-554ac441.md`
against the resolved working tree shows **additions only** in the body: every
line of incoming's body content is present verbatim in the resolved version.
The sole replaced lines are the three frontmatter lifecycle facts named in hunk 1
above, which is the intended §2e per-fact resolution and not a discarded change.

No hunk was dropped under the BUG-1301 precedence exception; no test function on
either side of this conflict was deleted (the resolved file in fact *documents*
the seven UATs in `tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts`, which
only HEAD knows about).

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
paths. CHERRY_PICK_HEAD is still present at
`c9f82a85cdfd4211ae075ce9306b7c276ec8fb00` — no `--continue`/`--skip`/`--quit`/
`--abort` was issued.

Note for the finalize step: because the resolution is HEAD's blob unchanged, the
staged diff against HEAD is empty, so this cherry-pick has nothing left to apply
and will produce no commit. Per the STEP 4 instruction this was left alone for
Python's finalize step to detect and skip.
