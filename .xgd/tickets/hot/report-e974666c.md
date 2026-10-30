---
uid: report-e974666c
id: REPORT-4849
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:41:08.937469+00:00'
updated_at: '2026-09-23T18:41:08.937469+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU, intent/bookkeeping ticket
  (`request-*`, rule 2e). Resolved by taking HEAD (`--ours`), which is a
  **strict superset** of the incoming side.

  Incoming commit `da7fe401` ("content edit: record the dependency-free
  hand-rolled PNG decision, the format scope …, the non-PNG refusal on
  `1c crop`, the pure-core split AC3 implies, exact-equality AC2, AC4
  narrowed to arithmetic cores, and streaming row-lockstep deferred")
  adds a set of body sections. A three-way comparison of the index
  stages shows every one of those additions is already present
  **verbatim** in HEAD — `diff theirs ours` yields no deletions at all,
  only additions on the HEAD side.

  HEAD additionally carries body sections the incoming side never had
  ("What the codec must do, precisely", "Sequencing, revisited: AC5 is
  not deliverable yet", "A finding AC4 turned up", "One honest caveat
  about 'the last native dependency'") and a later lifecycle state
  (`status: bundled`, `completed_at: 2026-09-14`, `commits[]`,
  `version: 0.2.39`, `bundled_in: bundle-8e1807f6`).

  The only fields where the two sides state the same fact differently
  are `updated_at` / `last_field_updated`: incoming
  `2026-09-01T21:38:14` / `body` versus HEAD `2026-09-16T01:48:38` /
  `status`. Per-fact timeline rule resolves these to HEAD, the later
  intent. The auto-enriched metadata's fallback ("take the more recent
  commit by timestamp") agrees with the superset rule here.

## Incoming changes preserved

Not a code file, but every incoming edit was verified present in the
resolved version by grep:

- `## The decision: hand-rolled, dependency-free` — line 61
- `## Formats: PNG is the whole of this path, deliberately` — line 73
- `### Consequence: non-PNG input is refused, not silently mishandled` — line 96
- `## Shape: a pure core the Worker can import` — line 126
- AC2 exact-equality wording (`decoded pixels **byte-identical**`) — line 137
- AC4 narrowed to `**arithmetic cores**` — lines 142–143
- `## Deferred: streaming row-lockstep decode` — line 150
- "What must not move" rewrite (exact equality, not a tolerance band) — present

No incoming hunk was dropped; no BUG-1301 precedence exception was
needed. No UAT or code files were involved in this conflict.

The resolved file is byte-identical to HEAD, so the staged diff against
HEAD is empty — expected, since HEAD already contains the incoming
content and more. `git cherry-pick --continue/--skip` was NOT invoked;
`CHERRY_PICK_HEAD` (`da7fe401e678847b6b6f7e1a2b042624aea1bc00`) remains
in place for the finalize step, which will detect the clean staged diff
and skip the commit.
