---
uid: comment-76efc109
id: COMMENT-762
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:23:44.035487+00:00'
updated_at: '2026-08-07T16:23:44.035487+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1fc44e55
  kind: note
---

Cluster 9 resolved: **confirm ×3, no reassignments, no merges.**

## What the cluster actually is

The boundary is real — one address vocabulary genuinely spans three stories — but ownership is clean, declared in both directions, and enforced in code. There is **one definition site with three consumers**:

| Role | Module | Story / capability |
|---|---|---|
| Defines + stamps | `packages/framework/src/l1/render.ts` | STORY-98 / CAP-87 |
| Reads in browser | `packages/framework/src/l1/edit-client.ts` | STORY-101 / CAP-87 |
| Parses + resolves + writes | `tools/generate/src/cli/edit.ts` | STORY-100 / CAP-86 |

`packages/site-schema/src/l1/edit.ts:1` states the intent itself — *"One definition site, imported by the emitter that writes them and the client that reads them, so the two cannot drift"* — and names exactly those three consumers.

Three things made this a confirm rather than a merge:

- **No AC is duplicated.** Each layer's criteria are observable only at that layer — rendered output (AC-953/954/1007/1008), a real browser (AC-996/1003/1006), the CLI write path (AC-987/989).
- **The drift risk that would justify merging is already closed by an AC.** AC-1008 asserts the vocabulary is one published contract "so the render that writes it and the client that reads it cannot drift"; AC-1006 asserts the browser client ships from that same source.
- **STORY-98 and STORY-101 are intra-capability.** CAP-87 consolidated them deliberately: "an address stamped by the render is only meaningful to the gesture that resolves it, and the gesture is undefined on any other rendering."

## The third capability was a phantom

CAP-84 (`capability-25f7e486`) is `status: superseded`, `superseded_by_uid: capability-12fee326`, and authoritatively holds **zero** stories. It appeared here because the ticket index in the `main` worktree predates the CAP-84→CAP-87 consolidation:

- Authoritative ticket in this worktree: `capability_uid: capability-12fee326` (`last_field_updated: capability_uid`)
- Stale index at `main/.xgd/tickets/hot/index.json` (generated 05:32:38Z): `capability-25f7e486 -> ['story-af36c2cb']`

So the cluster is two capabilities in substance. The stale entry is in the `main` worktree — outside this task's write scope — and clears on the next index rebuild without any ticket edit.

One caveat on my own actions: while diagnosing, I rewrote STORY-98's `capability_uid` to `capability-12fee326` — the value it already held — as an attempt to force a reindex. It was a no-op value-wise and did not clear the stale index (the index lives in the other worktree), but it did bump the ticket's `updated_at`.

Report created: **REPORT-1583** (`report-1fc44e55`), verified carrying `report_kind: overlap_resolution`, `subject_uid: report-17a279f7`, `cluster_id: "9"`, result `pass`.
