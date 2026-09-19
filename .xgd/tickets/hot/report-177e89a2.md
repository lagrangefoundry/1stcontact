---
uid: report-177e89a2
id: REPORT-4401
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:24:27.889331+00:00'
updated_at: '2026-09-19T11:24:27.889331+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` (BUG-40) — **UU**, index-only (the path is
  outside the sparse-checkout cone on this reconcile branch: `.xgd/tickets/` is
  excluded, so there were no working-tree markers, only three index stages).
  Rule applied: **2e — intent/bookkeeping ticket, superset test**, resolved to
  the OURS side (`git checkout --ours` + `git add --sparse`).

  Incoming commit this attempt: `d2b87a39` `xgd(ticket): update bug
  bug-3ade1af4`, 2026-09-01 12:27:33 -0700. This is the *next* commit in the
  bundle after the one resolved at attempt 123 (`cda495bd`, 12:15:17) — the
  merge base here (stage 1, `164ba43c`) is exactly that prior commit's blob, so
  the two attempts are successive snapshots of the same BUG-40 write-up rather
  than a repeat of the same conflict.

  Stages: base `164ba43c` · ours `1f50971c` (= `HEAD:` blob) · theirs
  `036c1169`.

  Why ours, per field — ours is a strict superset on every fact:

  - `title` — theirs still reads "23 failures … ten UATs"; ours reads "27
    failures + 30 collection errors … eleven UATs". Theirs is not merely older,
    it is internally inconsistent: this very commit rewrote the body to say
    *eleven* UATs and added an eighth Cause-3 item, but left the title at the
    old count. Ours is the corrected form.
  - `status` — ours `bundled`, theirs `free_coding`. Taking theirs would have
    regressed the ticket's lifecycle.
  - `completed_at` — ours `2026-09-14T10:29:13Z`, theirs `null`. Taking theirs
    would have cleared it.
  - `updated_at` / `last_field_updated` — ours `2026-09-16T01:48:35Z` / `status`
    supersedes theirs `2026-09-01T19:27:33Z` / `body`.
  - `fields` — ours carries theirs' `severity: medium` and `story_points: 5` at
    identical values, plus `commits[working_sha e5d76233]`, `version 0.2.33` and
    `bundled_in bundle-8e1807f6`, none of which theirs has.
  - body — **byte-identical between theirs and ours**; see below.

  No timeline tie-break was needed and none was invented: the enrichment's
  "take the more recent commit by timestamp" and 2e's superset rule both point
  at ours. Nothing was composed from outside the two sides, and no
  `fields.intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Not a code file, so STEP 3's per-hunk code check does not apply literally; the
equivalent check — is the incoming commit's intent present in the resolved
file? — passes, and this attempt admits an unusually strong proof. This is the
BUG-1109/BUG-1122 **redundant, not discarded** case: the incoming commit's key
changes are present in HEAD via a later route, not missing from it.

`git diff 036c1169 1f50971c` (theirs → ours) returns **no body hunks at all** —
only the frontmatter fields listed above, plus a trailing-newline difference.
Since the incoming commit `d2b87a39` is entirely a body edit
(`last_field_updated: body`), that empty body diff is a direct demonstration
that every one of its hunks is already present in the resolved file verbatim:

- `## Cause 2` retitled "(environment, no code change)" → "(environment, plus
  one real defect)", the "Note for later … worth a ticket of its own" paragraph
  replaced by the `1c assets` `rm -rf`-then-refill finding and the
  `dist-assets.staging/` atomic-swap fix: **present verbatim**.
- `## Cause 3` "ten UATs" → "eleven UATs" and its lead paragraph rewrite:
  **present verbatim**.
- Item 2 (AC-1055 / REQ-127) expanded with the "stronger property … could not
  check tenancy at all" argument, the traversal-onto-a-real-site case, the
  before-anything-is-streamed clause and the test renames: **present verbatim**.
- Item 3 (AC-1123) expanded with the painted-panel assertion: **present
  verbatim**.
- Item 4 (AC-1331) rewritten so the incomplete leg runs first and bundles
  nothing: **present verbatim**.
- Item 5 (AC-1336/7/8) expanded with the ordered site-check list, the separate
  Access-check list, both control-app origins, and the origin-keyed fetch
  double: **present verbatim**.
- Items 6 and 7 rewordings: **present verbatim**.
- New item 8 (AC-964, the `GET /preview/alpha/draft/` 200-vs-404 store
  dependency): **present verbatim**.
- `## Test plan` rewritten with the coverage argument for the staged asset swap
  and the standalone regression-scope line: **present verbatim**.
- The `Errors  30 errors` whitespace correction inside the fenced failure block:
  **present verbatim**.

Nothing from the incoming side is absent from the resolution except its own
now-superseded frontmatter bookkeeping (`updated_at`, `last_field_updated`,
`status`, `completed_at`), each of which ours supersedes with a strictly later
value. No developer-authored fact was dropped.

No BUG-1301 precedence exception was invoked; no test function was deleted.

## Staging state

`git status --porcelain` is empty; `git ls-files -u` is empty; the path is
staged at stage 0 as blob `1f50971c`, which equals `HEAD:.xgd/tickets/hot/
bug-3ade1af4.md`, so `git diff --cached HEAD` is empty. Per STEP 4 this is
expected and is not a `--skip` trigger — the finalize step detects the clean
staged diff and skips the commit. `CHERRY_PICK_HEAD` (`d2b87a39`) was left in
place; no `--continue` / `--skip` / `--quit` / `--abort` / `reset` was run.
