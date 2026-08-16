---
uid: report-ee8a0d79
id: REPORT-2025
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-08-16T00:18:13.460359+00:00'
updated_at: '2026-08-16T00:18:13.460359+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-7ef6a9ea
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: Field-level region edit vs element-level replace: two operations that both change what a page holds
**Stories resolved**: 2 (both confirmed in place — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-37a3921b (STORY-100) | confirm | capability-f753cecd (CAP-86) | (no change) | Owns the *field-level* edit: change the values a region already exposes, through a closed derived field list. Its security argument is that the controls are narrow — every field is plain text, a pick from a supplied list, a bounded whole number, or a yes/no (AC-08c7ebe8). That is a different claim, with different evidence, from CAP-93's. |
| story-189fc1ac (STORY-106) | confirm | capability-fe236246 (CAP-93) | (no change) | Owns the *element-level* reach: map the page, read a subtree verbatim, replace it in the full L1 vocabulary. Its security argument is that the vocabulary is closed (AC-4d4ac81f), which is explicitly the *relocation* of the guarantee CAP-86 used to hold by offering no operation that accepted markup. |

### Why this is a clean boundary, not an unresolved overlap

The discriminator is **granularity plus audience**, and it is load-bearing rather than incidental:

- **CAP-86 / STORY-100** — change the values *inside an element that already exists*. Operator granularity: the contract behind the click-to-edit modal. A caller here cannot compose structure.
- **CAP-93 / STORY-106** — change *which elements exist, and their whole structure*. Assistant granularity: verbatim read/write symmetry around one address, the whole element language rather than a projection of it.

The two are not competing implementations of one operation. CAP-93 *delegates* to the write path CAP-86 owns — "no new validation was written" — so the sharing between them is delegation, not duplication. STORY-106's own Technical Context names CAP-86 as the path it reaches, and CAP-93's capability body lists the operator's click-to-edit form as explicitly **out of scope**.

### Code evidence that both surfaces coexist by design

`tools/generate/src/cli/edit.ts` carries both pairs, with the boundary stated in-source at line 570-592:

- `editCopyGet` / `editCopySet` (l.493, l.530) via `copyFieldsOf` / `applyCopyFields` — annotated *"the click-to-edit modal's contract: four fields, the granularity a non-technical operator clicking a heading needs."*
- `editL1Get` / `editL1Set` (l.595, l.634) via `resolveL1Node` / `replaceL1Node` — annotated *"the AUTHORING pair... deliberately the whole language rather than a projection of it — a caller that can only see `text` cannot compose a nav bar, and 86 of `xgd/home`'s 122 nodes carry `axes` that no projection reaches."*

The same comment records the security relocation that separates the two capabilities' claims: the no-HTML/CSS/JS guarantee *"used to hold because no operation accepted them, and it now holds because L1's schema is closed."*

The AI control surface (`tools/generate/src/cli/ai/l1-surface.json`) offers exactly one page-changing operation — *"Replace one element on a page"* — with no field-level copy edit, matching STORY-106's AC-fbda4a6e. STORY-106's retirement of the copy-field pair was scoped to **that surface only**; the field-level path remains live for the operator gesture and the CLI, which is why CAP-86 is not superseded. Test families are correspondingly disjoint: `reconciliation-copy-edit-*.test.ts` (11 files) against `reconciliation-page-composition-surface` / `-l1-authoring-envelope` / `-assistant-control-surface`.

### Near-miss ACs checked individually

Three AC pairs sit closest to the boundary and were read in full to confirm they are distinct evidence rather than duplicated coverage:

- **AC-4bf1f692 (S-100) vs AC-4d4ac81f (S-106)** — both mention a byte-for-byte unchanged draft, but the subjects differ. S-100 asserts *atomicity* across four refusal classes of a field edit, and additionally that the rendered output is unchanged. S-106 asserts the *closed-vocabulary security closure* across six named injection vectors (raw markup, raw stylesheet, script URL in a link role, script URL in an image file, undeclared kind, wrong-typed property). Different claim, different verification.
- **AC-bcc448ea (S-100) vs AC-4bd36a69 (S-106)** — refusal shape at two layers. S-100 asserts the full envelope (fault code, path at fault, hint, failing exit status). S-106 asserts only that the caller is told nothing was written and what to do, because STORY-106 records a known divergence: the assistant's tool layer renders the declared meaning of the code and drops the per-call detail. The weaker AC is a deliberately-recorded limit, not an accidental restatement.
- **AC-d1bda2c2 / AC-84b87d8a (S-106)** — these exercise CAP-86's click-to-edit gesture, so they were checked for mis-parenting. They are correctly on STORY-106: the subject under test is *an assistant-composed element*, an entity that exists only because of CAP-93, and the guarantee being proven is CAP-93's own non-regression obligation (stated in its out-of-scope: the operator form "must keep working on elements the assistant authored"). Moving them to CAP-86 would orphan them from the change that makes them meaningful.

### Verification

- Every story in the cluster belongs to exactly one capability: story-37a3921b → capability-f753cecd; story-189fc1ac → capability-fe236246.
- No story was skipped: both were read in full, along with all 45 ACs (33 + 12).
- No merges performed, so no AC relationships were disturbed and no test renaming is required.
