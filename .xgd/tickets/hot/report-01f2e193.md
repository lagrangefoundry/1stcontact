---
uid: report-01f2e193
id: REPORT-4671
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:14:32.377424+00:00'
updated_at: '2026-09-21T09:16:07.604587+00:00'
completed_at: null
last_field_updated: title
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU** (both modified), intent/bookkeeping
  ticket (REQ-159-adjacent request, "Ingestion: from a dropped file to an indexed
  material ticket"). Rule **2e** applied per fact, not per file.

  Incoming `CHERRY_PICK_HEAD` = `72ef0ecea8` ("xgd(ticket): update request
  request-439cd0c8", 2026-08-31 16:13 -0700). Its entire diff from the merge base is
  a single frontmatter hunk — three lines, no body change at all:

  | fact | incoming (parent → child) | HEAD (ours) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T22:57:11.632203Z` → `2026-08-31T23:13:20.099222Z` | `2026-09-09T21:32:49.997177Z` | **ours** |
  | `last_field_updated` | `body` → `status` | `status` | **ours** |
  | `status` | `draft` → `free_coding` | `bundled` | **ours** |

  All three are genuine same-field conflicts, so 2e's timeline rule decides each one.
  HEAD's stamp is later-positioned by nine days, and the surrounding HEAD-only
  frontmatter corroborates that ordering rather than resting on the wall clock alone:
  HEAD carries `fields.commits[0].working_sha = d99c1f4385`, `fields.version = 0.2.24`
  and `fields.bundled_in = bundle-87be4669`. The ticket was free-coded and then
  bundled; `bundled` is downstream of the `free_coding` the incoming commit sets, so
  taking theirs would have rewound the ticket's lifecycle and orphaned those three
  fields. The `request` status enum in `ticket_types.yaml` is alphabetical, not
  ordered, so the ordering claim rests on the recorded bundle/version/working_sha
  evidence, not on enum position.

  HEAD is additionally a strict superset of the body: it adds an origin-wide
  no-store criterion bullet and a 170-line "What was built, and where it departs from
  the decisions above" section. That content never entered a conflict hunk — incoming
  does not touch the body — so it merged cleanly and is untouched by this resolution.

- No code, test, spec-matrix (`story-` / `acceptance_criterion-` / `capability-`) or
  config files were in this conflict set — the cherry-pick touches exactly one path,
  an xgd bookkeeping ticket. No test function on either side was touched, and the
  BUG-1301 precedence exception was **not** invoked.

## Incoming changes preserved

Nothing the incoming side authored was dropped as developer work.

Verified against `CHERRY_PICK_HEAD` per STEP 3:

    git show 72ef0ecea8 -- .xgd/tickets/hot/request-439cd0c8.md

The commit's complete payload is the three frontmatter lines in the table above.
Two of the three are already satisfied on HEAD by a later write — `last_field_updated`
is `status` on both sides, and `status` has since advanced past `free_coding` to
`bundled` by the very free-coding run this commit was announcing (`working_sha
d99c1f4385`, recorded on HEAD). The only fact genuinely not carried forward is the
superseded `updated_at` stamp.

There is no code, test or matrix content on the incoming side of this commit to
preserve or to lose.

## Staging state

The path sits outside this branch's sparse-checkout cone (11% of tracked files
present; DOC-986 §2/§4.1), so the conflict existed only in the index with no
working-tree file at all. Resolved with `git checkout --ours -- <path>` followed by
`git add --sparse -- <path>`, each issued as the sole content of its own Bash call
per STEP 4 (BUG-1294). The materialized file was byte-compared against the stage-2
blob (`a8c14c1e9b`) before staging: identical, and therefore marker-free.

`git status --porcelain` is empty: no unmerged paths, no modified paths.

The staged blob is **identical to HEAD's blob** (`git diff --cached --stat HEAD` is
empty), so this cherry-pick carries an empty net change — expected, since its entire
payload is a status transition HEAD has already advanced past. Per STEP 4 this is
staged and exited normally rather than skipped; the finalize step should expect a
clean staged diff and skip the commit itself.

Per STEP 4, `--continue`, `--skip`, `--quit` and `--abort` were **not** called and
nothing was run that resets or forgets the cherry-pick. `CHERRY_PICK_HEAD`
(`72ef0ecea8c1f1d1142fad036df53879883bd41c`) is intact for the finalize step.

Note for the watchdog: `.xgd/tmp/cherry_pick_no_progress_state.json` records
`count: 1` for this `conflict_sha`, below the threshold of 3
(`CHERRY_PICK_NO_PROGRESS_THRESHOLD`), so the BUG-1300 circuit breaker did not and
should not fire on this attempt.