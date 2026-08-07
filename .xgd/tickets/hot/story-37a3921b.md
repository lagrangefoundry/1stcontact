---
uid: story-37a3921b
id: STORY-100
type: story
title: Change the words on my page through one validated, all-or-nothing edit — the
  same path the AI uses
created_by: xgd
created_at: '2026-08-07T02:01:01.053881+00:00'
updated_at: '2026-08-07T02:01:01.053881+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-f753cecd
  story_kind: feature
  story_points: 3
---

## Story

**As a** person who owns a site on this platform — or the AI acting on my
instruction — **I want** to change the copy on a page by naming the region and
the new words, and have that change either land completely or not at all,
**so that** I can edit my own site without ever being able to break it, and
without it mattering whether the change came from me pointing at it or from me
asking for it.

## Description

This is the **write path for a copy edit**: the one place a change to a page's
words is applied. It exists as a *shared* surface on purpose. The operator
editing in the builder and the AI editing on request are **two producers of the
same kind of change**, not two mechanisms — so there is one addressing scheme,
one validator, one atomicity rule and one refusal shape between them. The test
every part of this surface answers to: *could the AI have produced this exact
edit through its own tool surface?*

**In scope**

- **Naming a region of a page.** An editable region has an address, and the
  address has a strict form. Reading it is untrusted input, so a malformed
  address is refused outright rather than resolved to whatever neighbouring
  region it most nearly matches — a silently-wrong resolution would write the
  right words into the wrong place. One rule resolves an address, and it is the
  same rule whether the region lives in the page's own layout or inside a
  behavior module's presentation slot; a module-scoped address names the
  instance and slot it is rooted in, because the two address spaces reuse the
  same short forms by design.
- **Asking what a region exposes.** Given a region, the surface answers with the
  editable fields it offers and their current values in the draft. For a run of
  copy that is its words. For anything that is not copy — a container, a module
  instance — the answer is an **empty list**, and an empty list is a legitimate
  answer rather than an error: "there is nothing to edit here" is a property of
  the region, decided once, not a check every caller has to remember.
- **Applying one change as one change.** A change map — the fields of a single
  region and their new values — is applied, validated and written **together**.
  However many fields it names, it produces exactly one change to the site. A
  map that is bad in any part writes nothing at all: no half-applied edit, ever.
- **Validating the whole result, not the edit.** Before anything is written, the
  *resulting complete definition* is validated by the same validator the
  platform's other structured-edit operations run. Sharing that validator is
  what makes this a second producer rather than a second path — an edit cannot
  be accepted here under looser rules than the AI's edits face.
- **Refusing legibly.** A rejected edit leaves the draft and the already-rendered
  page **byte-for-byte unchanged** — the page the operator is looking at is still
  accurate, which is what makes "show the error and carry on" safe — and reports
  a structured failure carrying the fault's code, the path it occurred at and a
  hint naming what to do, in both human and machine-readable form, with a
  failing exit status.
- **Making the change visible.** A successful edit is followed by re-rendering
  the affected page so the change is visible without a further manual step.
  Through the builder's origin this covers **both** the editable rendering and
  the plain draft rendering, because an edit changes the page and not one
  rendering of it — re-rendering only the editable one left the plain view
  showing an indefinitely stale page with nothing to signal it.
- **Being incapable of raw code.** The only thing this surface can write is a
  run's words, and the only control it can offer is a plain string. Markup typed
  into that string is stored and rendered as literal text; it creates no element
  and no style. "There is no raw-editing mode" is therefore a property of the
  surface's shape, not a rule it has to enforce.

**Out of scope**

- The browser gesture that turns a click into an address, the modal it opens and
  the frame refresh that follows — a separate capability that *drives* this one.
- The rendering that stamps addresses onto elements (the edit render channel).
- Text properties (size, colour, weight, family), per-run restyling, images, and
  any structural change — add, remove, reorder, resize, reposition. Phase 1 is
  copy.
- Undo. The only reversal in phase 1 is not saving.

## Technical Context

- **One shared validator, over the whole definition.** Validation is not scoped
  to the edited field: an unrelated pre-existing violation elsewhere in the page
  refuses a copy edit for the identical reason it refuses the platform's other
  structured-edit commands. That property is the operative evidence that the two
  producers share a validator, and it is asserted by consequence rather than by
  inspection.
- **Relationship to neighbouring capabilities.** The addresses this surface
  resolves are written by the edit render channel (CAP-84 / STORY-98), whose
  stamp vocabulary and resolution rule live in the shared definition site this
  capability owns. The builder workspace (CAP-85 / STORY-99) exposes this same
  surface over its origin as a thin transport — the same operations, not a
  parallel implementation — so a rejected edit reaches the browser carrying the
  validator's own code, path and hint rather than a generic server failure.
- **Where the intent and the implementation differ.** The intent states that
  clicking a region with no editable fields "opens nothing"; this surface's part
  of that is the empty field list, and the shipped browser behaviour instead
  shows a dismissible "nothing to edit here" message. That divergence lives with
  the editor gesture, not here.
- **Known cosmetic defect, deliberately not fixed.** A saved edit rewrites the
  whole page document with different unicode escaping, so a one-word change
  produces a large diff. Pre-existing behaviour of the shared write helper;
  recorded in the intent as wanting its own ticket.
- **Editing inside a module's slot depends on the module declaring its seam.**
  Only the module knows which of its elements is the slot; a module that marks
  none yields addresses that cannot be scoped and therefore cannot be resolved.

## Dependencies

None. This surface is independently usable and independently provable through
the command line alone — arguments in, structured result and exit status out.

## Story Points

3
