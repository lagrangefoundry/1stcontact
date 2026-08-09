---
uid: report-8c6c169a
id: REPORT-1710
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-08-09T01:05:27.472209+00:00'
updated_at: '2026-08-09T01:05:27.472209+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: Editing transport and client code: builder workspace vs write path vs click-to-edit gesture
**Stories resolved**: 3 (all confirmed — no reassignment, no merge, no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-e674c60a (STORY-99) | confirm | capability-a994b8f3 (CAP-85) | (no change) | All 23 ACs are chrome, origin, display panel, toolbar, layout state and confinement. Its one editing-adjacent AC (AC-1029) is scoped to *registering* an editable mode and which channel it points at, and explicitly disclaims both channel content (CAP-87/STORY-98) and gesture behaviour (STORY-101). No AC here asserts edit semantics or gesture behaviour. |
| story-37a3921b (STORY-100) | confirm | capability-f753cecd (CAP-86) | (no change) | All 17 ACs are addressing, field derivation, atomicity, whole-definition validation and refusal shape. The story's own Dependencies note it is provable through the command line alone — it is not workspace-dependent, so it cannot belong to CAP-85. |
| story-3bf94bd4 (STORY-101) | confirm | capability-12fee326 (CAP-87) | (no change) | All 15 ACs are hover marking, innermost-click resolution, the form, one-form-one-change, and save/refusal as seen in a real browser. It depends on both neighbours (STORY-99 for the surface, STORY-100 for the write path) and owns neither. |

### Why the flagged overlap is acceptable

The survey flagged this cluster because two capability bodies each mention the
same physical artifacts — the workspace origin carrying the write path's
read/apply operations, and the origin serving the editing gesture's client code.
Reading the acceptance criteria shows the boundary is drawn on the **subject** of
each criterion, not on the mechanism it happens to run through, and each
capability's Out-of-scope section names the other two explicitly.

**Seam A — write-path operations over the workspace origin.**

- CAP-85 owns *reachability*: the workspace and everything it displays come from
  one origin, nothing reinterpreted in between (AC-964). Its Out-of-scope states
  it owns "only that those operations are reachable over the workspace origin, as
  a transport that changes none of it".
- CAP-86 owns *surface identity*: AC-992 asserts the origin's editing endpoint
  exposes the same read, the same client-fault code/path/hint, and the same
  both-renderings re-render as the command line — "not a parallel implementation".
  That is a claim about the write path being one surface with two producers. It
  is unobservable from the workspace's side and meaningless as a workspace
  criterion.

Distinct subjects, correctly placed. Moving AC-992 to STORY-99 would put a
validator-semantics assertion in a capability that declares edit semantics out of
scope.

**Seam B — the editing gesture's client code served by the origin.**

- CAP-85 owns that those bytes are served from this origin, and disclaims "what
  the editing gesture's client code *does* once the browser runs it".
- CAP-87 owns the *no-drift* invariant: AC-1006 asserts the browser runs one
  implementation of click-to-address resolution, from the same source the
  rendering's stamping is defined against, with no second copy in the workspace's
  browser source. The subject is that the reader of the markup cannot drift from
  the writer of it — a gesture-correctness property. Delivery over the origin is
  the mechanism the criterion is verified through, not what it asserts.

Correctly placed. AC-1006 does assert against the workspace's browser source, but
only to prove the absence of a competing implementation of a gesture-owned rule.

**Seam C — the editable mode.** AC-1029 (STORY-99) registers the mode and fixes
which channel it displays; it states in its own body that channel content belongs
to CAP-87/STORY-98 and gesture behaviour to STORY-101. No ambiguity remains.

### Merge candidates considered and rejected

The closest apparent duplicates are the save and refusal pairs across STORY-100
and STORY-101. They are complementary, observed at different layers, and backed
by different evidence:

- AC-982 (write path) — a change map updates the draft, the re-render happens in
  the same operation, and the result reports which fields changed and where output
  was written; an identical resubmission reports "no change". Observed at the
  surface/CLI.
- AC-998 (gesture) — after confirming the form the operator is looking at their
  page with the new words, no further action, and the gesture is still live on
  the replaced page. Observed in a real browser.
- AC-984 (write path) — a refused edit leaves the draft and previously rendered
  output byte-for-byte identical, asserted by byte snapshot across every class of
  refusal.
- AC-999 (gesture) — a refused edit keeps the form open holding exactly what the
  operator typed and shows the refusal's own message, and correcting from that
  same form succeeds.

Merging either pair would collapse two distinct observation layers into one and
lose evidence: the write-path ACs would stop being provable without a browser,
and the gesture ACs would stop asserting the operator never loses their words.

### Note for the matrix (no action taken here)

CAP-85's Scope prose claims two things that no AC under STORY-99 asserts: that
the origin serves the editing gesture's client code, and that it carries the
write path's read/apply operations as a thin transport. The evidence for both
exists, but under the neighbouring stories (AC-1006 and AC-992 respectively),
which is where this resolution finds it correctly placed. The consequence is that
CAP-85's prose describes territory its own ACs do not cover. This is a capability
body/evidence alignment question, not a story-assignment one, so no change was
made under this resolution's mandate.

### Verification

- Every story in the cluster belongs to exactly one capability; the three
  assignments are disjoint and 1:1 with the three capabilities.
- No story was skipped: all three were read in full, together with all 55 of
  their acceptance criteria.
- No merges were performed, so no AC relationships were moved and no test
  renaming is required.
- No ticket mutations were made by this resolution.
