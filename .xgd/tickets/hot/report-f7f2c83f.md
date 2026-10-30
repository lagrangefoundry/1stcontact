---
uid: report-f7f2c83f
id: REPORT-4566
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:05:55.303498+00:00'
updated_at: '2026-09-20T23:05:55.303498+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping
  ticket (§2e). Resolved per-fact in favour of OURS. Path is
  outside the resync branch's sparse-checkout cone (DOC-986
  §2/§4.1), so the conflict lived in the index only with no
  working-tree markers; resolved with `git checkout --ours` +
  `git add --sparse`.

  Incoming is `1eb1dd1586` (2026-08-24T21:42:43) — the commit
  that closes the free-coding pass opened by `0909c3f158` in the
  previous attempt, advancing `free_coding → free_coded` and
  recording the build artefacts for the first time:

  | fact | incoming (`0ca29a5bac`) | ours/HEAD (`29cfe4b6b9`) | taken |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | OURS (later, same axis) |
  | `fields.commits` | 1 entry: `2058a16449…` | same entry + `working_sha_history: []`, plus `0fe586d1…` and `999579b3…` | OURS (strict superset) |
  | `fields.version` | `0.2.11` | `0.2.13` | OURS (later) |
  | `fields.bundled_in` | absent | `bundle-78f4e2fe` | OURS (addition) |
  | `last_field_updated` | `status` | `status` | identical — not in conflict |
  | `updated_at` / `completed_at` | 21:42:43 / null | 2026-08-31T19:19:36 / set | OURS (later) |
  | observability section | `## Still outstanding` | `## Observability — added here` + `## Deployment` | OURS (later) |

  Body from `## Symptom` through `## Superseded` is byte-identical
  on both sides, as in the two preceding attempts.

  `fields.commits` is the §2e list case ("List fields: combine and
  dedup"), and it resolves without judgement: OURS already
  contains THEIRS' sole element verbatim as the first entry, so
  the combined list *is* OURS. The two later entries
  (`0fe586d1…`, `999579b3…`) and the `working_sha_history: []` key
  are subsequent additions on the same record, not competing
  values.

  On `status` and `version`: both are the downstream continuation
  of what this commit asserts, not a contradiction of it.
  `free_coded` → `free_and_reconciled` is forward motion along one
  lifecycle axis; `0.2.11` → `0.2.13` is forward motion along one
  version axis. Per §2e (same field changed differently → later
  intent, per fact) OURS wins on each.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved; no hunk
  dropped under BUG-1301 precedence.** The substantive artefact
  this commit introduces — `working_sha:
  2058a16449a8e783bdd655d22bade58fd6b8d0fc` — is present verbatim
  in the staged blob at line 20, as the first element of the
  `commits` list. Its `status` advance out of `free_coding` is
  carried and taken further along the same axis, and
  `last_field_updated: status` is identical on both sides.

  The commit touches no code, no test, and no UAT function, so
  nothing developer-authored was discarded. §2f is not engaged.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached
HEAD` empty, `git status --porcelain` empty). Seventh consecutive
no-op in this queue (`fe97d3bc34`, `b0af50e157`, `9255f773b5`,
`1975a6876b`, `2759e5b507`, `0909c3f158`, now `1eb1dd1586`) —
this ticket's entire working-branch history had already landed on
the main-rooted branch before the resync began. Per the
instructions I did not call `--skip`; finalize's
clean-staged-diff detection should elect to skip the commit.

Per the conflict-intent enrichment this file remains flagged for
post-merge review: intent was unknown on one or both sides, so
resolution fell back to the superset/ledger-position rules.
