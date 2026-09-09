---
uid: report-f56df596
id: REPORT-3573
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-09-09T23:12:59.983434+00:00'
updated_at: '2026-09-09T23:12:59.983434+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: Two AI-reachable routes to changing the words and pictures on a page
**Stories resolved**: 2 (both **confirmed** — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-37a3921b (STORY-100) | confirm | capability-f753cecd (CAP-86) | (no change) | Owns the **field-level change map over a named region** — the operator's builder/CLI write path. Its body contains no reference to the element tree, the closed element vocabulary or the control surface; its 43 ACs are entirely about field derivation, closed pickers, bounded parameters and refusal shape. Correctly assigned. |
| story-189fc1ac (STORY-106) | confirm | capability-fe236246 (CAP-93) | (no change) | Owns the **element-tree map / verbatim read / bounded replace** reachable through the governed control surface. Its 12 ACs are entirely about the map, the unresolved read, subtree replacement and the closed-vocabulary refusal. Correctly assigned. |

### Why the overlap is acceptable

The two stories are *not* two routes to the same behaviour. They differ in
**granularity, addressing unit and vocabulary**, and each capability declares
the boundary explicitly.

1. **Different unit of change.** CAP-86/STORY-100 addresses an *editable region*
   and applies a **change map of named fields** — words, type-setting, a palette
   reference, a pick from a closed image list, bounded framing percentages. Nothing
   structural is reachable: a region cannot be added, removed or reparented, and no
   element that exposes no field is addressable at all. CAP-93/STORY-106 addresses
   an *element* and **replaces its whole subtree**; adding and removing are expressed
   as replacing a group with one holding a child more or fewer. Half the elements on
   a real page (boxes, rows) are invisible to the first surface and are the point of
   the second.

2. **The "two AI routes" concern is already closed by STORY-106 itself.** Its body
   states that "the narrower copy-field pair **retires from this surface** rather than
   living alongside its successor," and AC-1092 asserts *"The surface offers exactly
   one way to change what is on a page."* The control surface therefore exposes one
   operation, not two. The field surface remains reachable by the operator's
   click-to-edit form and the command line — a different caller, not a second AI route.

3. **Each capability names the other as out of scope.** CAP-93's out-of-scope section
   reads: "The operator's own click-to-edit form (CAP-86 / CAP-87), which is unchanged
   by this capability and must keep working on elements the assistant authored."
   Symmetrically, STORY-100's out-of-scope defers stylisation controls it deliberately
   does not offer with "The AI addresses them directly" — an explicit hand-off to the
   broader element-tree route.

4. **The shared thing is the write path, and CAP-86 owns it uncontested.** STORY-106
   records: "Reaches the same single, validated, all-or-nothing write path as the
   command line and the operator's click-to-edit form (CAP-86). **No new validation was
   written.**" So the atomicity, whole-definition validation and refusal envelope are
   asserted once, in CAP-86. CAP-93 does not restate them; it asserts only what is new
   at its own boundary.

5. **The security invariant is asserted twice on purpose, not by duplication.**
   AC-991 (CAP-86) proves no *field control* can carry raw HTML/CSS because every
   control is plain text, a closed pick, a bounded number, a boolean or a palette
   reference. AC-1089 (CAP-93) proves no *element* outside the page's typed vocabulary
   is accepted. STORY-106 explicitly documents this as a **relocation** of the
   guarantee ("It now holds because the page's element vocabulary is closed... That
   relocation is measured, not asserted") — two different mechanisms at two different
   surfaces, each needing its own evidence.

### AC placement checked, not moved

AC-1093 and AC-1094 (CAP-93/STORY-106) exercise the operator's click-to-edit form on
assistant-composed elements, which touches CAP-86's surface. They were **left where they
are**: they are the non-regression obligation STORY-106 incurs by widening the reach, not
statements about the copy-edit surface's own behaviour. STORY-100 predates
assistant-composed elements entirely, so reparenting them there would attach to it an
obligation it cannot have carried.

### Note for a later content pass (not actioned here — out of scope for a confirm)

STORY-100's narrative still frames itself as "the same path the AI uses" and asks
"could the AI have produced this exact edit through its own tool surface?" After
STORY-106 retired the copy-field pair from the control surface, that framing describes
history rather than the current surface — the shared *write path* claim remains true,
but the shared *tool surface* claim no longer is. This is a wording staleness inside one
story, not a capability-boundary defect, so no content was changed under a confirm
action. Flagging it for whichever pass owns story-body currency.

### Verification

- Every story in the cluster belongs to exactly one capability; neither was skipped.
- No merges performed, so no AC relationships were disturbed.
- No test renames required (no AC changed story or number).
