---
uid: request-395b67e6
id: REQ-117
type: request
title: 'Copy editing end-to-end: click segment → fields modal → validated diff → re-render'
created_by: xgd
created_at: '2026-07-31T20:43:32.395678+00:00'
updated_at: '2026-08-01T17:43:03.378511+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  depends_on:
  - request-a6740b4a
  - request-41796766
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 1dd851d39bfbbf1c2f28642cc7b0f82b95462483
    reconcile_sha: null
    main_sha: null
  version: 0.1.14
---

## What this builds

The **first end-to-end edit**: click a segment, edit its copy in a modal, and see the
page re-render with the change saved. This is the ticket where the chrome (T1) and the
edit render (T2) meet, and where the editor becomes a *second producer of structured
edits* rather than a viewer.

Phase 1 ticket **T3** of [[DOC-28]] §12. Design: [[DOC-28]] §4, §9.1, §11;
[[DOC-8]] §5, §7.

## The loop

```
click segment → resolve to its structured target via the stamped address (T2)
  → modal form over that segment's exposed fields
  → Save → structured diff
  → validate (the shared validator — [[DOC-8]] §7 layer 1)
       ├─ invalid: surface the error, revert; nothing is applied
       └─ valid:   apply to the draft definition
  → re-render (edit channel) → refresh the iframe
```

This is **the same loop the AI drives** — only the first two steps differ.

## Scope

### 1. Click → target

Edit-mode click handling in the same-origin iframe: read the segment address off the
clicked element and resolve it to the node in the definition. Innermost-wins for
nested segments. Hover treatment (brighter outline, small movement) on top of T2's
rendered outlines.

### 2. The modal — `webui-fields`, not hand-rolled

The modal is `mountFields` ([[DOC-8]] §9.3), which supplies typed controls, per-field
validation and a settled confirm/cancel gesture model. **This ticket's job is to
derive a field descriptor list from a segment**, not to build forms.

- **`buffered` commit**, so the modal's Save is the flush point and **one modal
  produces exactly one structured diff**. (`auto` would emit a diff per field.)
- Copy fields render as plain text/textarea controls. **The full string is always
  legible in the form field** regardless of what the render does to it — see §4.
- **No WYSIWYG, no contenteditable, no inline HTML editing.** The modal is a form
  over structured fields; that is what keeps the invariant below true.

### 3. The write path

- **Validate before applying**, through the **same validator the AI's edits use**.
  One validator, one set of rules — sharing it is what makes the editor a second
  producer rather than a second path.
- Apply the validated diff to the **draft definition** ([[DOC-12]] §3 — the draft
  *is* the working copy; the builder introduces no separate draft concept).
- Re-render the edit channel and refresh the iframe.
- Invalid never lands: surface the error, revert, apply nothing.

**The invariant, and the test to apply to every control:**

> **Could the AI have produced this exact edit through its tool surface?**
> If no, it does not ship as a control — it goes to the AI.

No raw HTML or CSS, no "raw" mode, ever ([[DOC-2]], [[DOC-7]] §6.2).

### 4. Copy that no longer fits — accepted, with one guard

L1 pins a run's width and can pin `nowrapFromPx`; vertical position is flow-based, so
longer copy generally pushes content down, but a no-wrap headline can run out of its
box. **This is accepted** — the goal is to let the user enter the text they want; if
the result looks ugly they work with the AI to tidy it ([[DOC-28]] §9.1).

The one guard is free and required: because the modal edits the text in a plain form
field, **the full string is always legible there**. Ugly is acceptable; *silently
clipped so the user cannot see what they typed* is not.

## Non-goals

- **Text properties** (size, colour, weight, family, background) — phase 2. The modal
  is single-stage in phase 1; the parameters stage comes later.
- **Per-run in-text restyling** — stays with the AI. Doing it properly needs a
  semantic rich-text engine, which is not day one.
- **Images** — T4.
- **Structural editing** — no add/remove/reorder/resize/reposition ([[DOC-28]] §7.3).
- **Undo beyond the modal's Cancel** — the Design-view undo affordance is an open
  question ([[DOC-28]] §13 Q6).

## Acceptance criteria

1. Clicking a copy segment in Edit mode opens a modal listing that segment's copy
   fields; clicking a segment with no editable fields opens nothing.
2. Editing text and saving updates the draft definition, re-renders, and the iframe
   shows the new copy.
3. **One modal Save produces exactly one structured diff**, regardless of how many
   fields were edited in it.
4. An edit that fails validation is **not applied**: the error is surfaced, the draft
   is unchanged, and the iframe still shows the pre-edit state.
5. The editor's edits pass through the **same validator function** the AI's edits do —
   demonstrated by test, not by inspection.
6. No editor path can produce raw HTML or CSS; there is no raw-editing mode.
7. Copy inside a behavior module's slot is editable through the same loop.
8. Text longer than its box still shows in full in the modal's form field after
   reopening the modal.
9. Nested segments resolve innermost-first.
10. View mode is unaffected: no handles, no click interception, no modal.