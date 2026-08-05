---
uid: request-395b67e6
id: REQ-117
type: request
title: 'Copy editing end-to-end: click segment → fields modal → validated diff → re-render'
created_by: xgd
created_at: '2026-07-31T20:43:32.395678+00:00'
updated_at: '2026-08-05T18:11:19.125379+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  depends_on:
  - request-a6740b4a
  - request-41796766
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 43779415c4ef9e578f0f3534eba69d952d2b510c
    reconcile_sha: null
    main_sha: null
  version: 0.1.14
  story_points: 3
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


---

## What landed (2026-08-01, commit `1dd851d`)

The **definition half** of the loop, complete and driven by real entry points.
The **modal and the shell wiring are blocked on T1**, not descoped — see below.

### The edit-address contract moved to `site-schema`

`packages/site-schema/src/l1/edit.ts` is new and now owns the attribute names
(`data-l1-path`, `data-l1-segment`, `data-fc-edit`, `data-fc-module`,
`data-l1-slot`, plus the hover class), the segment vocabulary, the address type,
and the **one** resolution rule — index the render's root node LIST, then
`children` at each later step. REQ-116 had these in the renderer; they are the
*contract*, not the rendering of it, so the emitter that writes the stamp and the
client that reads it now share one definition site and cannot drift.
`packages/framework` re-exports the names it used to own, so nothing downstream
moved.

The same module derives a segment's exposed fields (`copyFieldsOf`) and applies a
change map (`applyCopyFields`). `type` is `'string'` and only `'string'` — DOC-28
§3's exposure rule expressed as a type.

### The write path is the AI's surface, not a second one

`1c copy get|set` lands in `tools/generate/src/cli/edit.ts` beside
`page`/`config`/`asset`. DOC-28 §4's invariant is that the editor and the chat AI
are **peers, not two mechanisms** — peers share a surface. A copy edit therefore
inherits that module's atomicity (assemble and validate the *resulting*
definition before a byte hits disk) and runs the same `validateSite` +
`validateL1` call the other commands run.

- `1c copy get <slug> <pageId> <path> [--module <id> --slot <name>]` → the
  `mountFields` descriptors + current values. An empty field list is the answer
  for a segment with no phase-1 control, which is what makes "clicking it opens
  nothing" a property of the derivation.
- `1c copy set … --values '<json>'` → **one change map is one diff**: applied,
  validated and written together, then the edit channel is re-rendered so the
  host has only to refresh the iframe.

### The client half reads the stamp

`packages/framework/src/l1/edit-client.ts` — `resolveEditTarget` (innermost-wins
via `closest`, module/slot scoping) and `mountL1EditBridge` (click + hover, and a
guard that **refuses to bind on anything without `data-fc-edit`**, so a host that
forgets to unmount on a mode switch still cannot break View mode). It answers one
question — *which segment is this, and where in the definition does it live?* —
and hands the answer to a host.

### Two gaps the consumer revealed

- **`contact-form` marked no seam.** Copy in its `form` slot carried an address
  with no scope, and instance-rooted and document-rooted paths reuse the same
  short forms by design — so it was unresolvable. It now marks the slot the way
  `carousel` already marked its slide. Only the module knows which of its
  elements is which seam.
- **The hover treatment had no home.** The rule joins the outline it strengthens
  in `L1_EDIT_CSS`; the client only says which segment is hot. The "small
  movement" is the outline lifting *off* the box — moving the element itself
  would reflow the page under the pointer and make the edit render's geometry
  differ from the draft's.

### Evidence

`tests/req117-copy-editing.test.ts` — 10 UATs, one per AC, across both real entry
points: jsdom over the bytes `1c render --edit` actually wrote, and `1c` itself
(argv in, `{ok,data}` envelope and exit code out).

AC5 is demonstrated by consequence: an unrelated part of the page's L1 is pushed
past the envelope, and `copy set` and `config set` refuse for the *identical*
reason — which `copy set` could not do if it validated only what it touched.

AC3's "one Save, one diff" is demonstrated by atomicity: a change map whose
second entry is bad writes neither half, and `1c status` reports zero modified
files after it; a well-formed map moves exactly one.

## Blocked on T1 (REQ-115), not descoped

Two pieces of this ticket's scope cannot be built yet:

1. **The `mountFields` modal.** The ticket is explicit that it is `mountFields`
   and not hand-rolled — and REQ-115's Deliverable 0, *how `@gendevlabs/webui-*`
   is consumed*, is unsettled. Nothing in `node_modules`, no submodule, no
   published package. Hand-rolling a form to fill the gap is exactly what the
   ticket forbids.
2. **The shell wiring** — mounting the bridge on the iframe's document, refreshing
   it after a save, and the View/Edit toggle. REQ-115 is still `draft`:
   `apps/control-app` is a "Hello from app.1stcontact.io" stub, so there is no
   host, no iframe and no mode to bind to.

What T1 has to wire is small and named: `mountL1EditBridge(iframe.contentDocument,
hit => …)`, then `1c copy get` for the descriptors, `mountFields` in **buffered**
commit so Save is the flush point, then `1c copy set` with the confirmed values,
then reload the iframe. Every piece but the modal itself is landed and tested.