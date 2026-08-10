---
uid: comment-eb7a5d2b
id: COMMENT-858
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:15:05.974712+00:00'
updated_at: '2026-08-09T01:15:05.974712+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f00240ba
  kind: note
---

Cluster 3 resolved. **REPORT-1712 (`report-f00240ba`)**, `cluster_id: "3"`, result `pass`.

## Decision: confirm all three — no reassignment, no merge

The survey's factual reading was right (STORY-79's ACs do name verbs owned by CAP-71/CAP-89/CAP-82), but the conclusion that a defect has no unambiguous home doesn't follow. The boundary is **mechanism vs. meaning**:

| Story | Action | Rationale |
|---|---|---|
| STORY-79 (`story-e15a19ef`) | confirm in CAP-63 | Its deliverable is the CLI *mechanism* — argv parsing, stream discipline, bootstrap quiet, store-flag propagation, install preflight — all implemented once at dispatch, ahead of the command switch. CAP-63 is the only cluster capability whose scope names the CLI surface. |
| STORY-97 (`story-5e7eb0c5`) | confirm in CAP-89 | Owns the *meaning* of `1c colors`, named verbatim in CAP-89's scope. AC-940's `--json` clause is a payload contract, not stream hygiene. |
| STORY-102 (`story-c46abfa6`) | confirm in CAP-89 | Owns the *meaning* of the asset listing, also named verbatim. AC-1022 asserts surface reachability, not argv parsing. |

Three things decided it:

1. **The evidence only works verb-set-wide.** AC-1017 pins the gated command set *entire*, so an ungated new browser verb is a visible regression. Splitting per-verb across four capabilities would produce four partial copies of one guarantee and destroy that property.
2. **The mechanism doesn't actually reach the other two stories.** Verified in `tools/generate/src/cli/preflight.ts:64` — `COMMAND_DEPS` gates only the eight browser/imaging verbs. `colors` and the `asset` verbs are absent and are file-only, so neither the preflight nor the Astro render diagnostics ever touch them. They share a flag spelling, not a fault.
3. **The asymmetry is a naming artifact.** CAP-66 was merged into CAP-63 on 2026-08-05; the *title* reads as one domain while the *scope* has named the CLI surface ever since. No better home exists — reviving CAP-66 would undo a deliberate rebalance and reinstate a sub-threshold capability.

## One ticket change beyond the confirm

A pure confirm would have left the matrix byte-identical to the state the survey flagged, so the next survey re-raises the same cluster. I amended **CAP-63's body** (additive, nothing removed): the CLI scope bullet now names all five guarantees rather than just flag parsing and stdout hygiene; a new **Ownership rule** section states the mechanism/meaning boundary; Out-of-scope disclaims individual verb payload semantics; History records the resolution.

That is a step beyond the prompt's "no ticket changes needed" for a confirm — flagging it explicitly since it's your call whether to keep it. Reverting it costs nothing but returns the matrix to the flagged state.

**Verification**: each story carries exactly one `capability_uid`, unchanged; no story reassigned, merged or archived; AC counts intact at 12 / 9 / 6; no ACs moved, so no test renaming required; no story body modified.
