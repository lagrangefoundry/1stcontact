---
uid: comment-070b5acb
id: COMMENT-673
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T21:17:14.340735+00:00'
updated_at: '2026-08-05T21:17:14.340735+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0cb0a92d
  kind: note
---

**REPORT-1318 (`report-0cb0a92d`) — FAIL: 8 violations, 0 warnings, 1 needs_review.**

## What I found

CAP-71 has two stories: STORY-84 (fold) and STORY-86 (3-probe gate). Against BUNDLE-7 and BUNDLE-8 intent both are **cleanly aligned** — every ask in REQ-83/86/90/92 and BUG-5/6/7/8/9/11 is present in the bodies and verifiable in `probes.ts`/`fold.ts`. Exclusivity is clean too; the post-rebalance halves don't overlap.

The drift is BUNDLE-10.

**One violation stands on its own (finding 1, repairable now):** REQ-88 delivered `1c repro` (`cli/repro.ts:66`) and `1c l1-gate` (`repro.ts:132`) — live on this branch — and no story in the matrix claims them. CAP-63's body explicitly disclaims "the fold/gate reproduction pipeline", so the operator-facing pipeline surface is unowned.

**Seven violations (2–8) share one cause.** BUG-13/14/17/18/19/20/23 and REQ-88 rounds 5–8 are all `free_and_reconciled` and none is expressed; STORY-84 §"reconstructed run surfaces" still describes the flat per-run backing-box model BUG-14 explicitly retired.

## The finding that changes what to do about it

BUNDLE-10 (`bundle-4ff83a8b`) reads `free_and_reconciled` with a `merged_at_commit` that *is* an ancestor here — but **neither its code nor its matrix updates are on this branch**. `git grep` for `foldPadding`, `buildCards`, `nowrapFromPx`, `fitColumn`, `localizeAssets`, `partitionProbes`, `evalScalarTrack` returns nothing; `fold.ts` was last touched 2026-07-28 and still carries BUG-11's `doc.background`. All those symbols exist on `xgd-working`, and the corresponding story-body rewrites were already authored on `reconcile-BUNDLE-10` (2026-08-02, `f5402cd45`/`447808bb3`) — `git branch --contains` lists that branch and no other.

So the matrix and the code on this branch agree with each other; both sit at the BUNDLE-8 state while BUNDLE-10's tickets claim reconciliation. I reported the gaps as violations per the check's rules, but filed finding 9 as **needs_review**: hand-editing 2–8 here would make the matrix describe behaviour this branch doesn't implement, inverting the drift. The repair is a merge or a status correction, not authoring — an operator call.

I excluded 8 of BUNDLE-10's 16 intents as CAP-63/CAP-70 scope (BUG-12 states outright that `fold.ts` was not touched). REQ-94 is `bundled`/imminent and noted as a ledger entry for STORY-86, not a violation.

Read-only throughout — no tickets, tests, or code modified.

One unrelated environment note: the claude.ai Gmail, Calendar, and Drive MCP connectors reported that they need authorization and can't run OAuth in this non-interactive session. Nothing in this task needed them, but those connectors stay unavailable until authorized via claude.ai connector settings.
