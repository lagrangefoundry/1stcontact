---
uid: story-3bf94bd4
id: STORY-101
type: story
title: Click the words on my page and change them, and watch the page update in front
  of me
created_by: xgd
created_at: '2026-08-07T02:15:12.017937+00:00'
updated_at: '2026-08-12T18:28:16.693908+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-12fee326
  story_kind: upgrade
  story_points: 3
  updated_by:
  - request-5946d045
  - request-a8ccd0dd
  uat_coverage: fail
---

## Story

**As a** person who owns a site on this platform, **I want** to point at the
words on my own page and change them right there — see what I am about to edit,
type the new text into a form, set how those words look, and watch the page
update in front of me — **so that** editing my site is something I do by looking
at it, without knowing an address, a command, or anything about how the page is
stored.

## Description

This is the **edit gesture**: everything between the operator's pointer and the
change landing on their page. It is the story the whole editing phase exists
for. The workspace that shows the page is a separate capability, and the
validated write path that applies the change is another; this one is the loop
that joins them and the thing the operator actually performs.

The loop, as the operator experiences it: *hover an editable region and it
lights up → click it and a form opens over exactly what that region exposes —
the words in a run of copy and how that run is set, which image goes in an image
region → change it and Save → the page reloads showing the change, still
editable.* The same loop the AI drives on the operator's instruction; only the
first two steps — pointing and filling in a form — are the operator's.

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
- **A form over that region's fields.** The form is built from whatever fields
  the region exposes and the values currently in the draft: a run of copy
  exposes its words, and beside them how that run is set — how big, how heavy,
  italic or not, capitalised or not; an image region exposes **which image goes
  here** — a closed picker of the site's own images, always including the handle
  already in place — alongside its alt text. It is a **form over structured
  fields** — not editing on the page itself, not a rich-text surface, and with no
  route to markup or styling: every control this dialog can be asked to draw is
  one of a small closed set of shapes, and the set is the write path's to state.
  The gesture is deliberately **kind-agnostic**: it resolves a click to a region
  and opens a form over whatever that region exposes, so a region kind that gains
  fields reaches the operator through this same loop with nothing here to change
  — which is exactly how image selection arrived, and then a run's typography
  after it. One confirmed form is **one change** no matter how many fields it
  held or how many controls those fields were spread across, so the operator's
  Save is the single moment anything is written — and a form the operator changed
  nothing in is not an edit at all: confirming it and cancelling it are the same
  answer, with nothing written and nothing re-rendered. Opening a form to look is
  not an edit.
- **Choosing an image by looking at it.** The closed list an image field carries
  is presented as a **grid of thumbnails** — one tile per image the region
  offers and nothing else in the grid, with the dropdown of paths it replaces
  gone rather than offered alongside it. Each tile shows the picture the origin
  actually serves for that handle, resolved the way the page being edited
  resolves its own image sources, so the grid costs no new endpoint and copies no
  asset. Each is labelled with the image's **file name** and nothing else: the
  directory part of a handle is an internal address rather than a property of the
  picture, and it stops meaning anything at all once assets are held in a store
  rather than a filesystem. The **value is untouched** — a tile commits the full
  handle the write path validates, and the file name is only what the operator
  reads. The full handle survives as the tile's tooltip, which keeps two images
  sharing a name in different sub-directories tellable apart without putting a
  path on screen for every tile that never needed one. A handle whose bytes this
  origin cannot serve keeps its named, selectable tile behind a placeholder
  frame: the handle a region holds now is always offered and may name bytes that
  are not here, so a tile that vanished would take with it the only way to keep
  the image the region has. The grid is one single-selection group, reachable and
  announced without a mouse, and it holds the keyboard from the moment the
  dialog opens — on the tile the region currently holds.
- **The words in a box, the parameters under it.** A run's words open in the
  **dressed editing box** that mirrors the page's own presentation around them;
  how that run is set opens in a **quiet sheet beneath the box**, labelled, with
  the words still the thing the operator came for. Which half a field lands in is
  decided by **the kind of control the field declares** — never by the region's
  kind and never by the field's name — so the day a region exposes a second run
  of words, or a fifth parameter, neither half needs an edit. The box is only
  drawn where there are words to put in it: a region exposing no text at all gets
  no framed void under its picker. The sheet keeps its labels, because a bare
  number is meaningless unlabelled, and it is bounded so that however many
  parameters a region exposes the footer — and therefore Save — stays reachable.
  Clicking words still puts the cursor **in the words**: the affordance that
  opens a lone field ready to type is counted over the box, so a run that also
  exposes four parameters is still one field of words.
- **A dialog that composes several controls and still saves once.** The dialog
  decides **per field** which control draws it: the image grid it draws itself,
  the words and the parameters each a separately mounted instance of the shared
  form component. So an image region's picker and its alt text sit in one dialog,
  a copy region's words and its typography sit in one dialog, and a region that
  exposes only a background image gets no text-editing box at all. Every part is
  staged and none is committed on its own: Save merges them into a **single
  change** carrying only what the operator touched, one unsaved-changes state
  spans all of them, and a dialog closed with nothing touched in **any** control
  still writes and re-renders nothing. One dialog is one diff however many
  controls it took to fill in.
- **The page updating.** A successful Save leaves the operator looking at their
  page with the change on it — the new words, the new size, the chosen image —
  with no further step to take, and the gesture still live on the page they are
  now looking at: the page was replaced, and clicking again must work.
- **Being told no, without losing anything.** A refused edit keeps the form open
  holding exactly what the operator typed or picked, showing the reason the edit
  was refused, with their page and their draft untouched. This is the one failure
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

**Out of scope** (the intents' declared non-goals): a run's **colour** and its
**family**, and the **panel background** behind it — the palette control those
need is a later phase, and the colour a run takes is a reference into the site's
palette rather than anything typed here; line height, letter spacing, alignment
and every other paint axis; per-run restyling inside a passage; image **framing**
— crop, scale, scrim, rotation, edge effects and free positioning — together with
asset upload and any image processing; structural editing — adding, removing,
reordering, resizing or repositioning anything; and undo beyond cancelling the
open form.

## Technical Context

- **Depends on the workspace** (STORY-99 / CAP-85) for the page on screen, the
  View/Edit modes and the single origin that makes the displayed page directly
  reachable rather than a foreign document.
- **Depends on the write path** (STORY-100 / CAP-86) for addressing, field
  derivation, validation, atomicity and the refusal shape. This story owns none
  of that: it produces the change map and renders whatever the write path
  answers, which is what keeps the editor a second *producer* of structured
  edits and not a second write path. In particular, **which parameters a run
  exposes, what they are bounded by and what a save does to a responsive size
  ladder are all the write path's**; this story only knows that some descriptors
  are words and the rest are parameters.
- **Depends on the edit rendering** (STORY-98, in this capability) for the
  region addresses, the page coordinate stamped on the rendering, the marker
  that identifies a rendering as editable, and what a highlighted region looks
  like. The gesture only says *which* region is live; the rendering says how
  live looks.
- **Kind-agnosticism proved twice, not merely claimed.** Image selection reached
  the operator without a single change to the gesture, and a run's typography
  reached it by adding one branch to the same per-field question: the derivation
  — one function on the write-path side — is the only place a region kind is
  taught what it exposes, and this story reads that list and knows nothing about
  kinds. Enum membership is re-checked on the write side, so the closed picker is
  a property of the surface rather than of this UI. The dialog routes each field
  to one of three controls, and it does so **by descriptor and never by region
  kind**: a field whose descriptor declares that its options are images is drawn
  as the grid whatever region produced it, a field that declares plain text is
  drawn in the box, and everything else is drawn in the parameter sheet. An image
  region is itself the proof — it carries a grid field and a form field at once,
  which is why *which control* cannot be a per-region question.
- **The form is a shared component, not hand-rolled.** The intent is explicit
  that typed controls and the confirm/cancel model come from the shared UI
  component set; this story's job is deriving the field list from a region. The
  component is confirmed in *buffered* mode, which is what makes one Save one
  change rather than one change per field. The parameter sheet is a **second
  instance of that same component**, not a hand-rolled row of inputs: the
  parameters are typed descriptors carrying bounds, closed option lists and a
  read-only flag, and the component already renders and enforces all three. Two
  instances is the cheaper seam — one instance split across two parents is
  something the component has no vocabulary for — and the cost is paid once, in
  the dialog: both instances are read when the change map is built, both are
  asked whether anything is staged, and both are torn down on close.
- **The sheet is styled through the component's own seams.** Its bound on height
  is the same rule the thumbnail grid obeys from the other direction, and its
  type size is set through the component's own size token rather than as a font
  size on the sheet, so a component update cannot strand whichever rule was doing
  the work. Nothing here reaches into the component's internal classes.
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
  dialog. Every control the dialog can tear down on close is therefore declared
  before dismissal is bound, so a dialog that returns before its forms exist is
  still dismissible by every route. The worked example of "a region with nothing
  to edit" is now the painted container, not the image: once an image exposed
  fields, it stopped being a dead end. The property is unchanged — a region with
  no fields offers none, by derivation.
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
- **The picker is drawn by this dialog, and that is a stated staging post.** The
  shared component's control for a closed list is a dropdown whose option text is
  the value verbatim, and a thumbnail grid is not reachable through its seams —
  so the dialog draws these fields itself rather than patching or wrapping a
  component the policy says is closed upstream. The component already pairs a
  closed list with a *this is a colour* hint to mean "swatch grid", so the
  descriptor the derivation emits is already the shape the component would need
  if the control moves upstream, where its honest long-term home is; an
  unrecognised hint is inert there today, so nothing about the wire shape has to
  change on that day.
- **The controls are composed, not chained.** The shared component is handed
  only the fields it renders **and only their values**. Handed the whole map it
  reports every key back at the value the dialog opened with, which merged into
  the change map as an explicit "put the old image back" and silently undid every
  pick. The staged maps are merged with the grid's reported last, so the control
  that drew a field is the one that answers for it. This defends the existing
  one-Save-one-change invariant at a seam that did not exist before rather than
  extending it, and the same discipline carries the parameter sheet: each
  instance is handed its own slice and answers only for it.
- **Two earlier criteria were rescoped, not relaxed.** The dialog once held one
  form, so "the form" and "the dialog" were interchangeable in two criteria: the
  one that drops the visible label column, and the one that opens a lone field
  ready to type. Both are now read over the **box**. What the label drop was
  about was a column reading "Text" beside the words themselves; the parameter
  sheet is the opposite case and keeps its labels. What the auto-open was about
  was clicking words putting the cursor in the words; counting the whole field
  list would have retired that affordance the day typography landed.
- **The value/label distinction is load-bearing.** A tile commits the full
  handle; only what the operator reads is the file name. Stripping the path is a
  display projection, not a change to the vocabulary a region's field accepts,
  which is what keeps this a change of control rather than a change to the write
  path. Duplicate file names are therefore **tolerated rather than
  disambiguated** — the tooltip settles them, deliberately — so that a later
  reader does not "fix" the collision by putting paths back on every tile.
- **Known defect, deliberately not fixed here**: saving a copy change rewrites
  the whole page definition with different unicode escaping, so a one-word
  change produces a large diff. Pre-existing, cosmetic, and carried as its own
  ticket.

## Dependencies

- Plan item 1 — the builder workspace, chrome and origin (STORY-99)
- Plan item 2 — the structured copy-edit write path (STORY-100)

## Story Points

3