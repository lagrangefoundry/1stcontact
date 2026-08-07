---
uid: report-1fc44e55
id: REPORT-1583
type: report
title: 'Overlap resolution: cluster 9'
created_by: xgd
created_at: '2026-08-07T16:23:11.693812+00:00'
updated_at: '2026-08-07T16:23:11.693812+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '9'
---

## Cluster 9 Resolution

**Boundary**: The editable-region address vocabulary is defined, stamped and read across three capabilities
**Stories resolved**: 3 (3 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-af36c2cb (STORY-98) | confirm | capability-12fee326 | (no change) | Owns the *definition and stamping* of the vocabulary. Already correctly on CAP-87, which consolidated the superseded CAP-84. |
| story-3bf94bd4 (STORY-101) | confirm | capability-12fee326 | (no change) | Owns *reading* the stamp in the browser. Sits in the same capability as the render it reads, by CAP-87's explicit consolidation rationale. |
| story-37a3921b (STORY-100) | confirm | capability-f753cecd | (no change) | Owns *parsing and resolving* an address into the definition. CAP-86 declares the strict parse and single resolution rule as its own scope. |

### Why this overlap is acceptable

The cluster is real — one vocabulary genuinely touches three stories — but the
boundaries are clean, declared in both directions, and enforced in code.

**One owner, three consumers.** The vocabulary has a single definition site:
`packages/site-schema/src/l1/edit.ts`, whose own header states the intent —
*"One definition site, imported by the emitter that writes them and the client
that reads them, so the two cannot drift"* — and names its three consumers
explicitly ("the client that reads a clicked element, the write path that
applies the edit, and any future AI tool"). Each story is exactly one consumer,
in a distinct module:

| Role | Module | Story / capability |
|------|--------|--------------------|
| Defines + stamps | `packages/framework/src/l1/render.ts` | STORY-98 / CAP-87 |
| Reads in browser | `packages/framework/src/l1/edit-client.ts` | STORY-101 / CAP-87 |
| Parses + resolves + writes | `tools/generate/src/cli/edit.ts` | STORY-100 / CAP-86 |

**The capabilities disclaim each other explicitly.** CAP-86 scopes itself to
"the address of an editable region, its strict parse and its single resolution
rule" and puts out of scope "the rendering that stamps addresses onto elements"
and "how a click becomes an address in a browser". STORY-98 puts the editor UI
out of scope; STORY-100 puts both the browser gesture and the edit render
channel out of scope. No scope is claimed twice.

**No AC is duplicated; each is observable only at its own layer.**

- Render-side (STORY-98): AC-953 (every stamped address resolves to exactly one
  node), AC-954 (module-seam-rooted addressing), AC-1007 (page stamp completes
  the coordinate), AC-1008 (the vocabulary is one published contract).
- Browser-side (STORY-101): AC-996 (a click names the region relative to
  instance and seam), AC-1006 (the browser runs one implementation, delivered
  from the same source the stamping is defined against), AC-1003 (a rendering
  too old to carry the page coordinate is refused).
- Write-side (STORY-100): AC-987 (a malformed address is refused outright,
  never resolved to a neighbour), AC-989 (module-slot copy read and written
  through the same operation, scoped by instance and slot).

**The drift risk that would justify merging is already closed by an AC.**
AC-1008 asserts the vocabulary is a single published contract "so the render
that writes it and the client that reads it cannot drift", and AC-1006 asserts
the browser client is delivered from that same source. Shared-vocabulary
consumption across capabilities is therefore the intended architecture with a
named owner, not an ownership ambiguity.

**Why the render and gesture halves share one capability.** CAP-87's body states
the consolidation rationale directly: "neither is observable without the other —
an address stamped by the render is only meaningful to the gesture that resolves
it, and the gesture is undefined on any other rendering." STORY-98 and STORY-101
are the two halves of that single capability, so their shared use of the
vocabulary is intra-capability and not an overlap at all.

### Note on the third capability in this cluster

`capability-25f7e486` (CAP-84, "Edit Render Channel") is **superseded**
(`status: superseded`, `superseded_by_uid: capability-12fee326`) and
authoritatively holds **zero** stories. It appeared in this cluster because the
ticket index in the `main` worktree predates the CAP-84 → CAP-87 consolidation
and still maps `story-af36c2cb` to the superseded capability:

- Authoritative ticket in this regression worktree: `capability_uid: capability-12fee326`
  (with `last_field_updated: capability_uid`).
- Stale index at `.../main/.xgd/tickets/hot/index.json` (generated
  2026-08-07T05:32:38Z): `capability-25f7e486 -> ['story-af36c2cb']`.

The cluster is therefore two capabilities in substance, not three. The stale
entry lives in the `main` worktree, which is outside this task's write scope; it
resolves on the next index rebuild and no ticket edit is needed to correct it.

### Verification

- Every story belongs to exactly one capability by its authoritative
  `capability_uid`: STORY-98 → CAP-87, STORY-101 → CAP-87, STORY-100 → CAP-86.
- No story was skipped: all 3 in the cluster were read in full, along with their
  44 ACs (13 + 14 + 17).
- No merges were performed, so no AC relationships were moved and no test
  renaming is required.
