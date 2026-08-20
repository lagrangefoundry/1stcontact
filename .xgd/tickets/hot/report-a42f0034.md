---
uid: report-a42f0034
id: REPORT-2292
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-08-20T01:11:13.818231+00:00'
updated_at: '2026-08-20T01:11:13.818231+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-2485c83c
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: The L1 renderer layout semantics are implemented twice — once in the renderer, once in the acceptance gate evaluator
**Stories resolved**: 3 (all confirmed; no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d0a8cfad (STORY-83, L1 layout substrate rendered safe by construction) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the safe renderer and envelope validator — the emitter side. Its body already declares "the end-to-end 3-probe reproduction gate (REQ-86, a separate story)" out of scope. |
| story-24098299 (STORY-86, End-to-end 3-probe reproduction acceptance gate) | confirm | capability-2049c9ec (CAP-71) | (no change) | Owns the browser-free analytic evaluator and the probes built on it. Its body already declares "the renderer and envelope validator (CAP-70)" out of scope. |
| story-3569e1a4 (STORY-81, Responsive layout: layout mode per breakpoint, row wrap) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | An L1 typed axis (schema shape, envelope track-coherence rules, renderer emission). Its cross-cutting clause is the *anti-duplication guarantee* for the very seam this cluster names, and it belongs with the axis definition, not with the consumer. |

### Why the overlap is acceptable

The survey's observation is a **code** observation, and it is accurate — but the
two implementations are not two copies of one behaviour. They are two different
artifacts, with different outputs, different verification instruments, and
different failure consequences:

| | Renderer (`packages/framework/src/l1/render.ts`, CAP-70) | Analytic evaluator (`tools/generate/src/l1/probes.ts`, CAP-71) |
|---|---|---|
| Output | a stylesheet — a stack of `@media (min-width: …)` rules | numeric leaf boxes at one width |
| Who resolves | the **browser cascade** | the evaluator itself, browser-free |
| Verified by | real-browser capture / round-trip (AC-684, AC-683, AC-688) | fold + probe run with a guard-bites check (AC-734, AC-735) |
| Failure mode | a visibly wrong published page | phantom probe findings against a page that renders correctly |

Verified in source: the renderer never resolves geometry *at* a width — it emits
per-breakpoint rules and lets the engine cascade them (`render.ts` ~L1660–1700).
The evaluator has no engine, so it must resolve numerically; AC-735's half-open
`[a.at, b.at)` interval is precisely the *mirror* of the browser's own resolution
over those emitted `min-width` rules, which is how the AC states it. There is no
shared function to extract here: one side's answer is CSS text, the other side's
is a number. The duplication is structural necessity, and it is what buys the
probes their key property — always-run and deterministic rather than a
cross-engine skip (STORY-86, Technical Context).

The evaluator is also, in places, deliberately *not* faithful to the renderer:
equal shares of the leftover extent stand in for flex-grow, and grid is modelled
conservatively as a stack. Both are recorded on STORY-86 as approximations chosen
to keep the envelope probe conservative — a claim CAP-70 must never make about
the renderer.

### The one genuinely shareable piece is already shared

Where both sides *do* need the same resolution rule — which layout mode is in
force at a width — there is exactly one definition, in neither consumer:
`resolveLayoutMode` in `packages/site-schema/src/l1/layout.ts`, imported by
`probes.ts:33` and used at `probes.ts:354`. Its header comment states the reason
("Two copies of this three-line cascade is exactly the kind of drift that makes
the analytic gate report phantom findings"). AC-835 asserts it as a criterion:
*"One cascade, two consumers … stated once and drives both the published
stylesheet and the analytic layout gate."*

So the matrix does not merely tolerate this seam — it carries the anti-drift
mechanism for it, on CAP-70, as a criterion.

### Boundary rule for future assignment

Stated so the next story lands unambiguously:

- **The axis itself, its renderer emission, and the obligation that the gate
  mirror it → CAP-70.** This is why AC-803 ("the analytic layout gate models the
  same constraint") and AC-835 ("one cascade serves both") sit on CAP-70 despite
  naming the gate: each is the *definition* plus its no-drift clause.
- **The evaluator's own analytic model, its envelope findings, and the probes and
  gate built on them → CAP-71.** This is why AC-734 and AC-735 sit on CAP-71: the
  subject is the browser-free model's own behaviour, not the axis.

Moving AC-734/AC-735 to STORY-83 would push browser-free probe internals into the
framework-substrate capability and strand CAP-71's gate ACs on inputs defined
elsewhere; moving STORY-81 to CAP-71 would relocate an L1 typed axis away from the
substrate that defines and validates it. Both stories' existing out-of-scope
statements already say this, and they agree with each other.

### Verification

- Each of the three stories carries exactly one `capability_uid`; none is
  ambiguous or unset.
- No story was skipped: 3 of 3 resolved.
- No merges performed, so no AC relationships were moved and no test renaming is
  required. AC counts are unchanged: STORY-83 43, STORY-86 16, STORY-81 6.
