---
uid: story-3bf94bd4
id: STORY-101
type: story
title: Click the words on my page and change them, and watch the page update in front
  of me
created_by: xgd
created_at: '2026-08-07T02:15:12.017937+00:00'
updated_at: '2026-08-07T02:15:12.017937+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-12fee326
  story_kind: feature
  story_points: 3
---

## Story

**As a** person who owns a site on this platform, **I want** to point at the
words on my own page and change them right there — see what I am about to edit,
type the new text into a form, and watch the page update in front of me — **so
that** editing my site is something I do by looking at it, without knowing an
address, a command, or anything about how the page is stored.

## Description

This is the **edit gesture**: everything between the operator's pointer and the
change landing on their page. It is the story the whole editing phase exists
for. The workspace that shows the page is a separate capability, and the
validated write path that applies the change is another; this one is the loop
that joins them and the thing the operator actually performs.

The loop, as the operator experiences it: *hover a piece of copy and it lights
up → click it and a form opens over exactly the words in it → change them and
Save → the page reloads showing the new words, still editable.* The same loop
the AI drives on the operator's instruction; only the first two steps — pointing
and typing into a form — are the operator's.

**In scope**

- **Seeing what is about to be edited.** Moving the pointer over an editable
  region marks that region as the live one, and only that one; moving away
  clears it. The page must not move under the pointer as a result — a region
  that shifted when highlighted would change the very geometry the operator is
  editing.
- **Resolving a click to one region.** Regions nest: copy sits inside a painted
  box, which may sit inside a behavior module. A click resolves to the
  **innermost** region containing it, so clicking words edits the words and not
  the box around them. When the click lands inside a behavior module's
  presentation seam, the region is named relative to that instance and seam,
  because an instance's regions and the page's own regions reuse the same short
  addresses by design and are otherwise indistinguishable.
- **A form over that region's fields.** The form is built from the fields the
  region exposes and the words currently in the draft. It is a **form over
  structured fields** — not editing on the page itself, not a rich-text surface,
  and with no route to markup or styling. One confirmed form is **one change**
  no matter how many fields it held, so the operator's Save is the single moment
  anything is written.
- **The page updating.** A successful Save leaves the operator looking at their
  page with the new words on it, with no further step to take, and the gesture
  still live on the page they are now looking at — the page was replaced, and
  clicking again must work.
- **Being told no, without losing anything.** A refused edit keeps the form open
  holding exactly what the operator typed, showing the reason the edit was
  refused, with their page and their draft untouched. This is the one failure
  path that must never cost the operator their words.
- **Two honest dead ends.** A region with nothing editable says so plainly and
  can be dismissed by every route a dialog is normally dismissed by. A rendering
  too old to carry the coordinate an edit needs is refused before anything is
  sent, naming what to re-run — rather than sending an incomplete request and
  getting back a technically-true answer about a page that was never the
  problem.
- **Copy that no longer fits.** Longer copy may overflow the box it renders
  into; that is accepted, and tidying it is a conversation with the AI. What is
  not accepted is the operator being unable to see what they typed: the full
  string is always legible in the form field, whatever the page does with it.
- **Viewing is not editing.** A page being viewed behaves exactly as it does
  when published: nothing is marked, nothing is intercepted, no form opens. This
  holds as a property of the gesture itself — it attaches only to an editable
  rendering — rather than depending on the workspace remembering to detach it.

**Out of scope** (the intent's declared non-goals): text properties (size,
colour, weight, family, background); per-run restyling inside a passage; images;
structural editing — adding, removing, reordering, resizing or repositioning
anything; and undo beyond cancelling the open form.

## Technical Context

- **Depends on the workspace** (STORY-99 / CAP-85) for the page on screen, the
  View/Edit modes and the single origin that makes the displayed page directly
  reachable rather than a foreign document.
- **Depends on the write path** (STORY-100 / CAP-86) for addressing, field
  derivation, validation, atomicity and the refusal shape. This story owns none
  of that: it produces the change map and renders whatever the write path
  answers, which is what keeps the editor a second *producer* of structured
  edits and not a second write path.
- **Depends on the edit rendering** (CAP-84) for the region addresses, the page
  coordinate stamped on the rendering, the marker that identifies a rendering as
  editable, and what a highlighted region looks like. The gesture only says
  *which* region is live; the rendering says how live looks.
- **The form is a shared component, not hand-rolled.** The intent is explicit
  that typed controls and the confirm/cancel model come from the shared UI
  component set; this story's job is deriving the field list from a region. The
  component is confirmed in *buffered* mode, which is what makes one Save one
  change rather than one change per field.
- **One implementation of the address reading.** The logic that turns a clicked
  element back into a region address is the same source the rendering's stamping
  is defined against, delivered to the browser rather than re-written for it. A
  second hand-written copy would be free to drift from the markup it reads.
- **Intent/code divergence, deliberate and recorded.** The intent's original
  criterion says clicking a region with no editable fields "opens nothing"; the
  implementation opens a plain *nothing to edit here* message instead, on the
  grounds that silence reads as breakage while a sentence reads as "not this
  one, try the text inside it". The later ticket sections adopt the message as
  the intended behaviour, and the ACs here follow it. The first version of that
  message could not be dismissed at all — by button, Escape or backdrop — which
  is why dismissal is its own criterion rather than an assumed property of a
  dialog.
- **A standing failure mode, not a one-off.** Renderings live on disk, so one
  built before the page coordinate existed stays clickable-looking. The guard
  is stated as a criterion because stale renderings recur by construction until
  request-time rendering replaces on-disk renderings.
- **Known coverage caveat.** The shared UI components are consumed from an
  out-of-band install that nothing in this repository's manifests records, so on
  a machine that has not run that install the browser evidence for this story
  **skips with a stated, reported reason** rather than failing. The skip is
  loud on purpose — a quiet skip on the only test of the actual gesture is
  indistinguishable from a pass — but the gesture is genuinely unverified there
  until a private registry exists.
- **Known defect, deliberately not fixed here**: saving a copy change rewrites
  the whole page definition with different unicode escaping, so a one-word
  change produces a large diff. Pre-existing, cosmetic, and carried as its own
  ticket.

## Dependencies

- Plan item 1 — the builder workspace, chrome and origin (STORY-99)
- Plan item 2 — the structured copy-edit write path (STORY-100)

## Story Points

3
