---
uid: comment-e64625a7
id: COMMENT-2502
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T08:54:14.685135+00:00'
updated_at: '2026-09-10T08:54:14.685135+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0fba386b
  kind: note
---

Both findings resolved; the capability's suite is green.

## What was wrong

The violation was real and wider than AC-1266. Upstream `@lagrangefoundry/ai` replaced the four-field `Role` (`system` / `source` / `reminder`) with three entry-list tiers and froze the class. Two consequences, only one of which threw:

- `role.reminder = …` at `host-core.ts:596` hit a frozen object → `TypeError` on the *first* `streamPrompt` call, so no session on this branch could take a turn.
- `system` and `source` are silently destructured away — a session was priming with **nothing**: no preamble, no projected manual, no landscape. Nothing failed on that, because the throw came first.

A third piece of drift only surfaced once turns ran again: the reminder no longer rides the `system` field. Upstream moved it to the per-turn message tail so no cache breakpoint lands on a block guaranteed to differ each turn. Every assertion in these suites read `client.seen[N].system` — and half of them assert the signal is *absent*, which an empty field satisfies for the wrong reason.

## What I changed

- `tools/generate/src/cli/ai/host-core.ts` — role built from `priming` entries; the change signal declared as a `reminders` entry whose provider (`reminderFor`) resolves baseline-vs-counter at turn time; `streamPrompt` keeps only the `finally` that records the baseline.
- `tests/support/scripted-model-client.ts` — added `modelSaw(req)`, which reads the whole request rather than one placement.
- Three test files moved their reminder reads onto it (the journal UAT, the REQ-131 free-coded UAT, and AC-1058 in the conversation suite).
- AC-1263's Verification rewritten to the no-op publish instrument REQ-149 left behind (the Criterion is unchanged).

## Measured

- Journal suite: 16/17 → **17/17**.
- Blast radius, both directions: with `host-core.ts` reverted, the two conversation suites report 13 failed / 2 passed; with the fix, 4 failed / 41 passed. A six-suite run over everything that opens a session is **60 passed (60)**.
- Still failing, pre-existing and outside this capability: three knowledge-surface ACs (grant/declaration mismatch — a different drift) and the BUG-39 one-transcription scan (two `*.workers.test.ts` files carry their own wire-protocol copies). Neither is a file this call touched; both are in the report.

Completion report is REPORT-3703 (`report-0fba386b`): `needs_more_work: false`, `violations_remaining: 0`. One judgement call flagged there — I did not set `uat_coverage` on AC-1266, because it is unset on all seventeen ACs under the story and marking one would imply a coverage difference that does not exist.
