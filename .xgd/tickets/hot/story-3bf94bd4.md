---
uid: story-3bf94bd4
id: STORY-101
type: story
title: Click the words on my page and change them, and watch the page update in front
  of me
created_by: xgd
created_at: '2026-08-07T02:15:12.017937+00:00'
updated_at: '2026-08-20T03:36:06.339504+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-12fee326
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-d9226698
  uat_coverage: stale
---

## Story

**As a** person who owns a site on this platform, **I want** to point at the
words on my own page and change them right there — see what I am about to edit,
type the new text into a form, set how those words look and what colour they are,
and watch the page update in front of me — **so that** editing my site is
something I do by looking at it, without knowing an address, a command, or
anything about how the page is stored.

## Description

This is the **edit gesture**: everything between the operator's pointer and the
change landing on their page. It is the story the whole editing phase exists
for. The workspace that shows the page is a separate capability, and the
validated write path that applies the change is another; this one is the loop
that joins them and the thing the operator actually performs.

The loop, as the operator experiences it: *hover an editable region and it
lights up → click it and a form opens over exactly what that region exposes —
the words in a run of copy and how that run is set, which image goes in an image
region, what colour it is painted → change it and Save → the page reloads showing
the change, still editable.* The same loop the AI drives on the operator's
instruction; only the first two steps — pointing and filling in a form — are the
operator's.

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
  exposes its words, and beside them what colour they are and how that run is set
  — how big, how heavy, italic or not, capitalised or not; an image region exposes
  **which image goes here** — a closed picker of the site's own images, always
  including the handle already in place — alongside its alt text; a painted panel
  exposes the colour it is painted. It is a **form over structured
  fields** — not editing on the page itself, not a rich-text surface, and with no
  route to markup or styling: every control this dialog can be asked to draw is
  one of a small closed set of shapes, and the set is the write path's to state.
  The gesture is deliberately **kind-agnostic**: it resolves a click to a region
  and opens a form over whatever that region exposes, so a region kind that gains
  fields reaches the operator through this same loop with nothing here to change
  — which is exactly how image selection arrived, then a run's typography after
  it, and then colour after that. One confirmed form is **one change** no matter
  how many fields it held or how many controls those fields were spread across,
  so the operator's Save is the single moment anything is written — and a form the
  operator changed nothing in is not an edit at all: confirming it and cancelling
  it are the same answer, with nothing written and nothing re-rendered. Opening a
  form to look is not an edit.
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
- **Choosing a colour without leaving the words.** A region that exposes a
  colour — a run's own colour, a painted panel's background — gets a **row in the
  parameter sheet** showing the colour that region actually paints and what it is
  called, and opening the site's palette to change it. No picker is built by this
  gesture: the palette surface already exists and already resolves to a choice,
  and this is the caller it was missing, which is why picking and *editing the
  palette* are one gesture rather than two screens. What comes back is a
  **reference into the site's palette and never a hex**, so from a region the
  operator cannot invent an off-system colour and an edit to the entry moves every
  use with it; a site whose palette is still empty — the common first state on any
  folded site — opens that surface in its *no colours yet, add one* state rather
  than an empty or broken control, so the field is a way in rather than a dead
  end. Backing out of the picker leaves the staged value exactly as it was rather
  than clearing it. The pick is **staged, never committed**: it travels in the same
  change map as the words beside it, so one dialog is still one diff.
- **Reaching the panel behind the words.** Background colour belongs to the panel
  rather than to the run, and innermost-wins means clicking the words never
  reaches it — on a panel fully occluded by its own copy there is nowhere else to
  click. So a run's dialog carries a **read-only swatch of the panel behind this
  text**, named the way any colour on this surface is named, with a route to that
  panel's own dialog. It answers *what is behind this?* as well as *where do I
  change it?*; the panel's fill is not duplicated as a second control, because
  that would break one-modal-one-diff. Following the route from a dialog holding
  unsaved changes **saves first** and says so before it is followed, rather than
  discarding the operator's work or refusing to move.
- **The words in a box, the parameters under it.** A run's words open in the
  **dressed editing box** that mirrors the page's own presentation — both the
  paint *behind* the words and, where a run's glyphs are painted by its own
  background rather than by a colour, the paint that *is* the words, so no run
  ever opens as an empty box the operator is typing into blind;
  how that run is set opens in a **quiet sheet beneath the box**, labelled, with
  the words still the thing the operator came for. Which half a field lands in is
  decided by **the kind of control the field declares** — never by the region's
  kind and never by the field's name — so the day a region exposes a second run
  of words, or a fifth parameter, neither half needs an edit. The box is only
  drawn where there are words to put in it: a region exposing no text at all gets
  no framed void under its picker, and a region exposing only a colour gets the
  sheet alone. The sheet keeps its labels, because a bare
  number is meaningless unlabelled, and it is bounded so that however many
  parameters a region exposes the footer — and therefore Save — stays reachable.
  Clicking words still puts the cursor **in the words**: the affordance that
  opens a lone field ready to type is counted over the box, so a run that also
  exposes four parameters and a colour is still one field of words.
- **The box follows the sheet, all the way to the glyphs.** Changing a parameter
  in the sheet immediately restyles the words in the box above it, so the operator
  judges the change by looking at it and then chooses between Save and Cancel —
  rather than choosing blind, saving, and reloading the page to find out what they
  chose. All four parameters reach the words as each is confirmed, by whichever
  gesture confirms it — how big, how heavy, italic or not and **capitalised or
  not** — and one turned back **off** clears what it set rather than leaving the
  last value standing. The mirroring reaches the glyphs in the other direction
  too: a run the page sets **tracked** opens previewing at the page's own
  tracking, and a run that asks for none is given none. What is being asserted in
  both cases is the **element the words are actually drawn in**, not the box the
  presentation is set on — measuring the box proves a value was written, which is
  the thing that stayed true all the way through the defect this closes.
  Nothing here is a write: the change is staged exactly as before, so Save is
  still the single moment anything is written and one dialog is still one change.
  A **changed size** is previewed at the scale the box was dressed at when it
  opened — what it showed per unit of what the run is set to — rather than being
  brought into the editing range again, because a run set above that range opens
  sitting on its upper bound and would otherwise answer every increase with no
  visible difference at exactly the runs where size is worth changing. The
  legibility floor is kept and there is no ceiling, because the box scrolls. Only a
  parameter the operator **actually changed** overrides the box: every
  untouched axis — the run's family among them, which has no control at
  all — keeps precisely what the opening dressing gave it.
- **A control that cannot tell the truth is shown unavailable, and says why.**
  Where the write path declares a control unfaithful — the value it would show is
  not the whole truth about what the element holds, or setting it would not produce
  the change the operator expects — the row is drawn **unavailable rather than
  merely dimmed**: it keeps its label, it keeps reporting what the element
  actually paints, and it cannot be reached by pointer, keyboard or screen reader,
  because a control that looks unavailable and still opens a picker is worse than
  no lock at all. The **reason travels with the lock** and is drawn as body text
  under the row it explains — not as a tooltip, which would hide the answer from
  the reader who needs it — and it reads the same whichever control drew the row,
  because *which control happened to draw it* is exactly the detail the operator
  must not be shown. A row with nothing to explain carries no note: a reason on
  every row would make the ones that matter invisible.
- **A dialog that composes several controls and still saves once.** The dialog
  decides **per field** which control draws it: the image grid and the colour row
  it draws itself, the words and the parameters each a separately mounted instance
  of the shared form component. So an image region's picker and its alt text sit in
  one dialog, a copy region's words, its colour and its typography sit in one
  dialog, and a region that exposes only a background image gets no text-editing
  box at all. Every part is staged and none is committed on its own: Save merges
  them into a **single change** carrying only what the operator touched, one
  unsaved-changes state spans all of them, and a dialog closed with nothing
  touched in **any** control still writes and re-renders nothing. One dialog is
  one diff however many controls it took to fill in.
- **The page updating.** A successful Save leaves the operator looking at their
  page with the change on it — the new words, the new size, the new colour, the
  chosen image — with no further step to take, and the gesture still live on the
  page they are now looking at: the page was replaced, and clicking again must
  work.
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

**Out of scope** (the intents' declared non-goals): a run's **family**; free hex
entry, which is a deliberate, separate act inside the palette editor rather than
anything a region can reach; line height, letter spacing, alignment and every
other paint axis, and the rest of a panel's paint — pattern, overlay, gradient;
per-run restyling inside a passage; image **framing** — crop, scale, scrim,
rotation, edge effects and free positioning — together with asset upload and any
image processing; structural editing — adding, removing, reordering, resizing or
repositioning anything; and undo beyond cancelling the open form.

## Technical Context

- **Depends on the workspace** (STORY-99 / CAP-85) for the page on screen, the
  View/Edit modes and the single origin that makes the displayed page directly
  reachable rather than a foreign document.
- **Depends on the write path** (STORY-100 / CAP-86) for addressing, field
  derivation, validation, atomicity and the refusal shape. This story owns none
  of that: it produces the change map and renders whatever the write path
  answers, which is what keeps the editor a second *producer* of structured
  edits and not a second write path. In particular, **which parameters a run
  exposes, what they are bounded by, which colour values are admissible, which
  controls are locked and what a save does to a responsive size ladder are all the
  write path's**; this story only knows that some descriptors are words and the
  rest are parameters, and that a lock arrives with the sentence that explains it.
- **Depends on the palette surface** (STORY-113, the palette command group with
  its census and guards; STORY-114, the popup) for the picker itself. The colour row builds no picker: the popup
  already implements a pick mode and already resolves to a palette reference, and
  what this story adds is the caller it never had. That is also what makes an
  empty palette workable rather than a dead end — the surface an operator picks
  from is the surface they add the first entry in — and it is why the recovery
  from "no colours yet" is one gesture rather than a trip to another screen.
- **Depends on the edit rendering** (STORY-98, in this capability) for the
  region addresses, the page coordinate stamped on the rendering, the marker
  that identifies a rendering as editable, and what a highlighted region looks
  like. The gesture only says *which* region is live; the rendering says how
  live looks.
- **Kind-agnosticism proved three times, not merely claimed.** Image selection
  reached the operator without a single change to the gesture; a run's typography
  reached it by adding one branch to the same per-field question; colour reached it
  by adding a second. The derivation — one function on the write-path side — is
  the only place a region kind is taught what it exposes, and this story reads that
  list and knows nothing about kinds. Enum membership and palette membership are
  both re-checked on the write side, so the closed picker is a property of the
  surface rather than of this UI. The dialog routes each field to one of four
  controls, and it does so **by descriptor and never by region kind**: a field
  whose descriptor declares that its options are images is drawn as the grid
  whatever region produced it, a field that declares a colour is drawn as the
  colour row whatever region produced it, a field that declares plain text is
  drawn in the box, and everything else is drawn in the parameter sheet. An image
  region is itself the proof — it carries a grid field and a form field at once,
  which is why *which control* cannot be a per-region question.
- **The colour row is drawn by this dialog, for the same reason the grid is.**
  The shared component pairs a closed list with a *this is a colour* hint to mean
  "swatch grid", and its value is a hex **string**; the value this surface writes
  is a typed palette reference, which is not reachable through the component's
  seams. So the row is the dialog's, split on the **descriptor** exactly as the
  image picker is, so the day a third surface exposes a colour it is answered
  there too. It sits **first in the sheet**, which is where the derivation puts it:
  a control this dialog draws itself must not silently reorder the list the write
  path chose, because that list is the contract about what a segment exposes *and*
  in what order it reads.
- **The escalation row closes a navigation gap, not a capability gap.**
  Background colour is already editable — on the panel, in the panel's own dialog.
  What was unreachable was the panel, because innermost-wins sends every click on
  the words to the run and a container can be fully occluded by its lone text run.
  A read-only swatch was chosen over a bare link deliberately: it teaches *where
  backgrounds live* rather than merely routing there, and it costs one row.
  Duplicating the fill control in the run's dialog was rejected outright — it would
  break one-modal-one-diff. Saving before navigating is the only one of the three
  options (warn-and-discard, disable-while-dirty, save-then-open) that leaves the
  operator holding nothing they can lose; the cost is that a navigation gesture is
  also a commit, so the label says so whenever there is something to commit, and it
  is refreshed as the row is approached rather than on every keystroke — a colour
  pick happens inside a popup and fires no input event in this dialog, so listening
  for edits would miss the one kind of change the dialog draws itself.
- **The lock's face is drawn once, over both control families.** The shared form
  component marks its own locked rows but has no vocabulary for a *reason*, and the
  colour row is not the component's at all — so the colour row carries the same
  row marking and the same field attribute the component stamps, and one pass over
  the sheet hangs each reason under the row it explains. One selector, one rule,
  one place that renders reasons. On the colour row the lock is honoured a second
  time at the control itself, natively rather than by styling: a class closes
  neither the keyboard nor the screen reader, and the picker behind a merely
  dimmed row can still write a colour the page would never paint. Before this,
  nothing in either stylesheet drew a locked row at all — the first lock this
  surface shipped was enforced on the write side and invisible on screen, which is
  the failure mode the presentation rule exists to end. A missing row is inert: a
  lock with nowhere to hang its note draws none rather than throwing inside the
  dialog's construction and leaving the operator with a modal that never opened.
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
  asked whether anything is staged, and both are torn down on close. The colour
  rows are read alongside them and answer for their own fields.
- **The sheet is styled through the component's own seams.** Its bound on height
  is the same rule the thumbnail grid obeys from the other direction, and its
  type size is set through the component's own size token rather than as a font
  size on the sheet, so a component update cannot strand whichever rule was doing
  the work. Nothing here reaches into the component's internal classes.
- **The live preview is one property per change, and that shape is the
  argument.** The box already reads every axis it shows through custom
  properties, and the sheet already announces each field as it is confirmed, so
  the whole of the live half is a subscription that maps one confirmed field to
  one property. The obvious alternative — re-derive the whole dressing from the
  sheet's values on every change — is what the shape is chosen against: the
  opening dressing is read from the page **as rendered** (the cascaded result),
  while a parameter's value is only what the run itself **overrode**, so a run
  that inherits weight 700 while declaring none reports 400 and re-deriving
  would lighten the box before the operator touched anything. Writing one
  property per change never asks an untouched field what it thinks, which keeps
  the opening-dressing criteria true by construction rather than by care.
- **Scaled, not re-clamped, and the difference is silent failure.** The scale is
  measured once at open — previewed size over authored size — and folds together
  two reductions worth nothing separately: the editing range, and the difference
  between the size a run is authored at and the size the page is rendering it at
  the current width, since a size is a responsive track sampled across widths.
  Re-applying the range to each new size is the reuse that looks obvious and
  fails for exactly the clamped runs, showing nothing while appearing to work.
  It degrades to previewing at the authored size whenever either end of the
  ratio is missing, rather than to previewing nothing — a guard rather than a
  criterion, because a run that declares no size of its own is given no size
  control at all, so there is no gesture through which an operator can reach
  that path and no assertion an AC could carry for it.
- **Two reads that both answer "what colour are these words", and the one
  background that is not a backdrop.** The dressing asks two separate questions
  and a run can answer either one. The backdrop read deliberately begins **one
  element past** the edited run, because its question is what sits *behind* the
  copy; an ancestor-or-sibling layer qualifies and the run's own background does
  not. That is correct for a surface and wrong for the single case where the
  run's background is not a surface at all: a gradient-filled run is compiled the
  way every browser expects it — a background image on the run itself, clipped to
  the text, with a transparent fill colour — so the glyphs **are** that
  background showing through their own shape. Read separately the two halves are
  each individually invisible, which is exactly what happened: the box copied a
  transparent foreground over a correct backdrop and showed nothing. So the clip
  is the condition that makes an element's own background readable as glyph paint
  rather than as a surface, and it is carried across as its own set of
  properties. It lands on the **control that draws the words**, not on the box,
  for a mechanical reason: `background-image` does not inherit, and the box's own
  background is the mirrored backdrop, which is a different thing. Each
  declaration falls back to the property's initial value, so a run with no glyph
  fill — every run in `storage/` but one — computes exactly what it computed
  before those declarations existed. That same run is the one whose colour row is
  locked, and the two facts are one fact: a gradient paints the glyphs, so the
  colour axis under it paints nothing.
- **A foreground that paints nothing is not reproduced, and that is the general
  backstop.** A resolved foreground that computes fully transparent is withheld
  rather than written, leaving the box on the chrome's own colour — the same
  fallback every segment with no preview already gets. It is deliberately not
  scoped to the gradient case: it is what makes any future axis that paints its
  glyphs some other way degrade to *legible but not yet mirrored* rather than to
  invisible copy, which is the one failure the operator cannot diagnose by
  looking.
- **The parameter-to-preview mapping is a table, and the interesting part is
  what is absent from it.** A parameter with no entry shows nothing rather than
  a default that would dress the box in a value the page will not use. A run's
  **colour** was the live example of an absence and is now the live example of an
  entry: the descriptor exists, the row is present, and the box takes its colour
  from the page as it always did. Read a later omission the way colour was read
  before it landed — as a row this table gains when its control does, not as a
  branch it has today.
- **The two inherited text properties the font shorthand cannot carry, and why
  their failure looked like two different bugs.** The box is a wrapper and the
  words are drawn by the shared form component's control, which takes the box's
  typography by inheriting the whole `font` shorthand. That shorthand carries
  family, size, weight and style — exactly the four axes that previewed correctly
  from the first day — and carries neither **capitalisation** nor **tracking**,
  both of which the browser's own styling of form controls resets besides. So both
  landed on the wrapper and reached no glyph, from one cause, one line apart in one
  rule. They surfaced differently only because one of them is an editable
  parameter: capitalisation read as a dead control and was reported, while tracking
  is part of the opening dressing and read only as the box quietly mis-mirroring
  any headline set tight — which is why it went unreported for as long as it did,
  and why deleting its half of the fix left every suite green. Both are closed by
  re-declaring the inheritance the reset broke, scoped to the editing box, which is
  the only host in the chrome that dresses a control in the **page's** typography
  rather than its own. The previously recorded divergence — "capitalisation is
  written and does not arrive", with a covering criterion deliberately claiming
  three parameters rather than four — is therefore **closed**, and its standing
  prediction (that the evidence would fail the day the words were drawn in
  something that carried the property) was overtaken by the other route: the words
  are drawn in the same control, which now inherits both properties.
- **The evidence for those two is browser-driven, and that is not a preference.**
  jsdom ships no UA stylesheet and resolves no inherited properties through the
  cascade, so it can represent neither half of the mechanism — the reset that broke
  the inheritance nor the re-declaration that restores it — and an assertion there
  reads identically before and after the fix. A regex over the stylesheet is worse:
  a declaration existing is precisely the thing that stayed true throughout the
  defect. So both are measured in a real engine, on the **words** rather than on
  the wrapper, against the shipped stylesheets; and the parameter sheet's own
  controls are asserted to stay dressed as chrome, so a later widening of the
  scoped rule fails in a test rather than in the operator's eyes. Where no browser
  can be launched the criterion is reported **loudly as unverified** rather than
  quietly reduced to something weaker.
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
  still dismissible by every route. The **worked example has moved again**: it was
  the image until an image exposed fields, then the painted container until a
  painted container became re-colourable, and it is now a behavior-module instance
  — a region that is stamped and clickable but holds no copy, no asset and no
  paint of its own. An *unpainted* box or container is a different thing and never
  reaches this path at all: it is not stamped, cannot be clicked, and has no
  address. The property is unchanged — a region with no fields offers none, by
  derivation.
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
  pick. The staged maps are merged with the dialog's own controls reported last,
  so the control that drew a field is the one that answers for it. This defends
  the existing one-Save-one-change invariant at a seam that did not exist before
  rather than extending it, and the same discipline carries the parameter sheet
  and the colour rows: each instance is handed its own slice and answers only for
  it.
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
  reader does not "fix" the collision by putting paths back on every tile. The
  colour row makes the same distinction the other way round: a reference is named
  by its **entry**, because that is what the operator chose and what an edit to the
  palette would move, while a literal on a folded site is named by its hex — and
  seeing a raw hex where every other region shows a name is the honest signal that
  this one is not on the palette yet.
- **Known defect, deliberately not fixed here**: saving a copy change rewrites
  the whole page definition with different unicode escaping, so a one-word
  change produces a large diff. Pre-existing, cosmetic, and carried as its own
  ticket.

## Dependencies

- Plan item 1 — the builder workspace, chrome and origin (STORY-99)
- Plan item 2 — the structured copy-edit write path (STORY-100)
- The palette command group (STORY-113) and its popup (STORY-114) — the surface
  the colour row opens

## Story Points

3
