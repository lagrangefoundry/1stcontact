---
uid: comment-5d0fc0a7
id: COMMENT-632
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-05T17:52:11.607834+00:00'
updated_at: '2026-08-05T17:52:11.607834+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f1b6cf2b
  kind: note
---

Cluster 3 resolved. **All three stories confirmed in place — no reassignments, no merges, no ticket mutations.**

## What the cluster actually was

The survey flagged STORY-79 (`1c CLI: flags parse correctly… --json emits a clean scriptable document`) as shared toolchain infrastructure parked in CAP-63 while covering pipeline commands. Reading the tickets, that framing doesn't hold up:

- **CAP-63 explicitly owns this.** Its Scope carries a dedicated bullet — *"CLI argument parsing and output hygiene"* — because the 2026-08-05 structural rebalance absorbed CAP-66 (`1c CLI Argument Parsing & Output Hygiene`) into it. CAP-66's fields confirm it: `merged_into: capability-aa030c83`. STORY-79 was CAP-66's sole story. It is in its designed home, not parked there.
- **The "pipeline commands" mention is an invariant's subject list, not ownership.** AC-738 asserts no `1c` invocation emits the "Missing pages directory" warning on either stream, enumerating `help`, `list`, `repro`, `l1-gate`, `capture`, `values-diff`. The property under test belongs to the CLI entry point's Astro bootstrap — narrowing it to capture/diff commands would weaken the AC without relocating any pipeline behavior.
- **The boundary is clean both ways.** STORY-84 (fold) and STORY-86 (3-probe gate) contain zero CLI-parsing or stdout-hygiene content — verified across both bodies and all 24 AC titles. And CAP-71's body puts the `1c` capture/values-diff surface explicitly out of scope, so moving STORY-79 there would breach CAP-71's stated boundary *and* orphan the CLI clause CAP-63 now declares. No two stories describe the same behavior, so no merge candidate exists.

## Two things worth your attention

**A real breadth issue inside STORY-79, left unactioned.** Two of its seven ACs reach past capture/diff into a *third* area: AC-720 (`aligned-crops --sandbox` store routing → perceptual path) and AC-739 (conditional Astro container → CAP-70 substrate territory). Both still fit the story's stated theme, and separating them means splitting a story — outside this task's remit. Recorded in the report for a future structural pass.

**The ticket index is stale.** `xgd ticket get <human-id>` returns `TICKET_ID_NOT_FOUND` for tickets that resolve fine by UID (`CAP-63`, `AC-738`), and `ticket list --type capability` returns duplicate entries with pre-rebalance titles. Most consequentially, filtering stories on `capability-ac7ca849` (absorbed CAP-66) **still returns story-e15a19ef**, contradicting the authoritative read of `capability_uid: capability-aa030c83`. This matches the blocking index defect CAP-66's own body already notes. Every finding above came from UID reads rather than index queries — but any downstream cluster analysis driven off `ticket list --filter` is reading stale assignments.

Report created: **REPORT-1274** (`report-f1b6cf2b`), `result: pass`, `cluster_id: "3"` — verified set, so the iterator will skip this cluster.
