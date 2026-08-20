---
uid: comment-9aac1cac
id: COMMENT-1206
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-20T01:11:39.021202+00:00'
updated_at: '2026-08-20T01:11:39.021202+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a42f0034
  kind: note
---

Cluster 5 resolved: **all three stories confirmed in place, no ticket changes.**

## What the cluster flagged

"L1 renderer layout semantics implemented twice" is an accurate *code* observation — but the two implementations are different artifacts, not two copies of one behavior:

| | Renderer (`framework/src/l1/render.ts`, CAP-70) | Analytic evaluator (`tools/generate/src/l1/probes.ts`, CAP-71) |
|---|---|---|
| Output | a stylesheet — stacked `@media (min-width: …)` rules | numeric leaf boxes at one width |
| Who resolves | the browser cascade | the evaluator, browser-free |
| Verified by | real-browser capture / round-trip (AC-684, AC-683, AC-688) | fold + probe run with guard-bites check (AC-734, AC-735) |
| Failure mode | a visibly wrong published page | phantom findings against a correct page |

Verified in source: the renderer never resolves geometry *at* a width (`render.ts` ~L1660–1700 emits per-breakpoint rules and lets the engine cascade). The evaluator has no engine, so it must resolve numerically — AC-735's half-open `[a.at, b.at)` is the mirror of the browser's own resolution over those emitted rules. There's no function to extract: one side's answer is CSS text, the other's is a number.

## The one shareable piece is already shared

Where both genuinely need the same rule — which layout mode is in force at a width — there is exactly one definition, in neither consumer: `resolveLayoutMode` in `packages/site-schema/src/l1/layout.ts`, imported at `probes.ts:33`, used at `probes.ts:354`. Its header comment names the drift risk explicitly, and **AC-835 asserts it as a criterion** ("one cascade, two consumers"). The matrix already carries the anti-drift mechanism for this exact seam.

## Boundary rule recorded

- Axis + renderer emission + the obligation that the gate mirror it → **CAP-70** (why AC-803 and AC-835 sit there despite naming the gate: definition plus no-drift clause).
- The evaluator's own model, its envelope findings, and the probes/gate on them → **CAP-71**.

Both stories' existing out-of-scope statements already say this and agree with each other. Reassigning either way would strand ACs from their definitions.

**Report**: REPORT-2292 (`report-a42f0034`), `cluster_id: "5"` (string, confirmed), result `pass`.

One note: the ticket commit landed locally but `git push` failed (`Broken pipe` — no network in this sandbox). The report is committed in the worktree; it just hasn't been pushed to the remote.
