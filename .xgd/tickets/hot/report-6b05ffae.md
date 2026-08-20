---
uid: report-6b05ffae
id: REPORT-2291
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-08-20T01:07:43.777343+00:00'
updated_at: '2026-08-20T01:07:43.777343+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-2485c83c
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: Two operations mutate a page element through one write path, and the newer one retired part of the older from the control surface
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-37a3921b (STORY-100) | confirm | capability-f753cecd (CAP-86) | (no change) | Owns the **field-granular** contract: an editable region's address, the derived list of fields it exposes with their closed/bounded value vocabularies, and a change map applied as one diff. Its live front door is the builder origin `/api/copy` plus the CLI (`packages/site-schema/src/l1/edit.ts`, 31 UATs across `reconciliation-copy-edit-{write-path,image-selection,typography}.test.ts`). Nothing in it is element-granular; moving it into CAP-93 would put the click-to-edit form's whole contract inside a capability whose own body declares that form out of scope. |
| story-189fc1ac (STORY-106) | confirm | capability-fe236246 (CAP-93) | (no change) | Owns the **element-granular** contract: the styling-free map, the verbatim subtree read, and the bounded whole-node replace, reached only through the assistant control surface (`get_l1` / `set_l1`). Its address semantics, payload shape and refusal surface all differ from CAP-86's. Moving it into CAP-86 would import the closed-element-vocabulary security boundary into a capability whose boundary is the closed *field* vocabulary. |

### Why this is a clean boundary, not a duplication

The survey left two questions unstated. Both are answered by the code, not by the
prose:

**1. One contract with two front doors, or two contracts?** Two contracts, one
write path. `AC-1092`'s UAT (`reconciliation-page-composition-surface.test.ts:602`)
asserts exact equality between declared and implemented control-surface operations
and then asserts, in both the declaration and the running toolbox, that `get_copy`
and `set_copy` are absent — a `set_copy` call answers `unknown tool`. So after the
retirement each contract has exactly **one** front door:

- CAP-86 (copy fields) → the builder's browser origin `/api/copy` and the CLI.
- CAP-93 (element tree) → the control surface, `get_l1` / `set_l1`, in the
  `AuthorPages` group.

What they genuinely share is the *substrate*, not the surface: the same validator
over the whole resulting definition and the same all-or-nothing write. That is a
shared implementation, which is a reason for CAP-93's body to cite CAP-86 (it
does) rather than a reason to merge them.

**2. Which capability's evidence proves an assistant-replaced element is still
editable through the operator's form?** CAP-93's — `AC-1093` and `AC-1094`,
driven over `/api/copy` on subtrees the assistant authored via `set_l1`. This is
correct placement: STORY-106 created the risk, so STORY-106 carries the proof.
CAP-93's body already declares exactly this split — the click-to-edit form is
*out of scope* as an owned surface, while "must keep working on elements the
assistant authored" is an obligation CAP-93 accepts. Reparenting those two ACs to
CAP-86 would move a regression guard away from the change that made it necessary
and leave CAP-93's own retirement claim unproven.

No AC required reparenting; all 33 of STORY-100's and all 12 of STORY-106's ACs
sit on the correct side of the boundary. No test renames were needed.

### Residual (not fixed here — outside the three permitted actions)

CAP-86's body and STORY-100's body both still assert the pre-retirement identity:
*"never a second mechanism beside the one the AI uses… Two producers share this
one path"*, and STORY-100's stated test *"could the AI have produced this exact
edit through its own tool surface?"*. Grepping STORY-100's body for `set_l1`,
`get_l1`, `retire`, `supersed`, `CAP-93`, `STORY-106` returns zero hits — the
retirement is nowhere acknowledged.

Post-STORY-106 this is **stale**, and the accurate statement is narrower: the AI
still reaches a text run's words, but through `set_l1` on the element tree, not
through the copy-field pair. CAP-86 is now the **operator gesture's** field
surface (with the CLI beside it), not the shared one.

This is a content-staleness defect in prose, not an assignment ambiguity — the
story/capability split is right regardless of how the sentence reads. Fixing it
would mean editing STORY-100's body (forbidden by this task except when merging)
and CAP-86's capability body (outside this task's three actions, and CAP-86 is
touched by other clusters). Recorded here for whoever owns the capability-body
pass.
