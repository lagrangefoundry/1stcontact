---
uid: report-f9dab171
id: REPORT-4565
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:04:42.055328+00:00'
updated_at: '2026-09-20T23:04:42.055328+00:00'
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

  Incoming is `0909c3f158` (2026-08-24T21:32:02), fourteen
  seconds after the body rewrite `2759e5b507` handled in the
  previous attempt. Unlike the five commits before it, this one
  contains a **genuine per-fact conflict** rather than facts the
  two sides already agreed on:

  | fact | incoming (`af15f9ef54`) | ours/HEAD (`29cfe4b6b9`) | taken |
  |---|---|---|---|
  | `status` | `free_coding` | `free_and_reconciled` | OURS (later) — *genuine conflict* |
  | `last_field_updated` | `status` | `status` | identical — not in conflict |
  | `updated_at` | 21:32:02 | 2026-08-31T19:19:36 | OURS (later) |
  | `completed_at` | `null` | 2026-08-31T19:19:36 | OURS (later) |
  | `fields` | `chat_comment` only | + `commits`, `version: 0.2.13`, `bundled_in` | OURS (strict superset) |
  | observability section | `## Still outstanding` | `## Observability — added here` + `## Deployment` | OURS (later) |
  | trailing newline | stripped | present | OURS (later) |

  Body from `## Symptom` through `## Superseded` is byte-identical
  on both sides, as in the previous attempt.

  On the `status` conflict specifically: this commit's whole
  substantive intent is the transition `draft → free_coding` —
  "begin free-coding work on this bug." OURS records
  `free_and_reconciled`, which is the *downstream* state of that
  very transition, and the evidence for it is in the same file:
  three `working_sha` entries under `fields.commits`,
  `version: 0.2.13`, and `bundled_in: bundle-78f4e2fe`. The
  free-coding this commit opens was subsequently done, bundled
  and reconciled. Per §2e (same field changed differently → take
  the later-positioned intent, per fact) OURS wins — and the
  incoming intent is *fulfilled* by that later state, not
  discarded by it.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved in substance;
  no hunk dropped under BUG-1301 precedence.** This commit
  asserts one fact — a lifecycle advance out of `draft` — and the
  staged blob carries that advance, taken further along the same
  axis (`free_and_reconciled`, verified in the staged frontmatter
  alongside `completed_at`, `bundled_in` and the `commits` list).
  `last_field_updated: status`, the other field this commit
  writes, is present verbatim and identical on both sides.

  The commit touches no code, no test, and no UAT function, so
  nothing developer-authored was discarded. §2f is not engaged.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached
HEAD` empty, `git status --porcelain` empty). This is the sixth
consecutive commit in the queue to replay as a no-op
(`fe97d3bc34`, `b0af50e157`, `9255f773b5`, `1975a6876b`,
`2759e5b507`, now `0909c3f158`) — this ticket's entire
working-branch history had already landed on the main-rooted
branch before the resync began, which is exactly why HEAD can
show the reconciled end-state of a transition the queue is still
replaying the start of. Per the instructions I did not call
`--skip`; finalize's clean-staged-diff detection should elect to
skip the commit.

Per the conflict-intent enrichment this file remains flagged for
post-merge review: intent was unknown on one or both sides, so
resolution fell back to the superset/ledger-position rules.
