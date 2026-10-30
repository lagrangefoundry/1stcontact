---
uid: report-a29b40b5
id: REPORT-4564
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:03:30.651809+00:00'
updated_at: '2026-09-20T23:03:30.651809+00:00'
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

  Incoming is `2759e5b507` (2026-08-24T21:31:48,
  `last_field_updated: body`) — the substantial rewrite that
  replaces the original memory-exhaustion hypothesis with the
  confirmed free-plan / `assembleSite` root cause, the memoisation
  fix, the measured `~78 ms → ~5 ms` result, and the
  `## Superseded` post-mortem. Unlike the four preceding commits
  in this queue, this one carries real authored content rather
  than pure bookkeeping.

  Diffing the incoming result blob (`bc8406e525`) against OURS
  (`29cfe4b6b9`) isolates the divergence to exactly two regions —
  **the entire body from `## Symptom` through `## Superseded`
  is byte-identical on both sides**, i.e. the whole rewrite this
  commit performs is already present in HEAD:

  | region | incoming (`bc8406e525`) | ours/HEAD (`29cfe4b6b9`) | taken |
  |---|---|---|---|
  | body `## Symptom` … `## Superseded` | full rewrite | identical | not in conflict |
  | `updated_at` / `completed_at` | 21:31:48 / null | 2026-08-31T19:19:36 / set | OURS (later) |
  | `last_field_updated` | `body` | `status` | OURS (later) |
  | `status` | `draft` | `free_and_reconciled` | OURS (later) |
  | `fields` | `chat_comment` only | + `commits`, `version: 0.2.13`, `bundled_in` | OURS (strict superset) |
  | observability section | `## Still outstanding (not in this ticket)` | `## Observability — added here` + `## Deployment` | OURS (later) |

  The one substantive body divergence is the same fact at two
  lifecycle stages, not two competing claims. THEIRS records the
  observability block as not yet done ("Worth adding; config-only,
  no code"); OURS records it as done — declared in both places
  with `head_sampling_rate = 1`, the `[env.production]`
  table-ordering trap documented, pinned by
  `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`,
  and verified with `wrangler deploy --env production --dry-run`.
  Per §2e (same section changed differently → later-positioned
  intent per fact) OURS wins.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved; no hunk
  dropped under BUG-1301 precedence.** Verified directly against
  the staged blob: all four section headings this rewrite
  introduces are present — `## Root cause — CONFIRMED` (line 40),
  `## What this ticket fixes in code` (58), `## Result` (106),
  `## Superseded — the original hypothesis, recorded because it
  was wrong` (112) — and the intervening prose is byte-identical
  to the incoming side.

  No test function is lost. §2f is not engaged (this is a ticket,
  not a test file), and the direction of travel is additive
  anyway: OURS *introduces* a UAT reference
  (`test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`)
  that THEIRS does not carry. The commit touches no code and no
  test file, so nothing developer-authored was discarded.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached
HEAD` empty, `git status --porcelain` empty). This is the fifth
consecutive commit in the queue to replay as a genuine no-op
(`fe97d3bc34`, `b0af50e157`, `9255f773b5`, `1975a6876b`, now
`2759e5b507`) — this ticket's working-branch history had already
landed on the main-rooted branch before the resync began. Per the
instructions I did not call `--skip`; finalize's
clean-staged-diff detection should elect to skip the commit.

Per the conflict-intent enrichment this file remains flagged for
post-merge review: intent was unknown on one or both sides, so
resolution fell back to the superset/ledger-position rules.
