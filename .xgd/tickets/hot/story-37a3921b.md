---
uid: story-37a3921b
id: STORY-100
type: story
title: Change the words, how they are set, and which images appear on my page through
  one validated, all-or-nothing edit — the same path the AI uses
created_by: xgd
created_at: '2026-08-07T02:01:01.053881+00:00'
updated_at: '2026-08-12T18:10:28.214197+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-f753cecd
  story_kind: upgrade
  story_points: 3
  updated_by:
  - request-5946d045
  - request-a8ccd0dd
  uat_coverage: pass
---

## Story

**As a** person who owns a site on this platform — or the AI acting on my
instruction — **I want** to change what a region of a page holds by naming the
region and the new values — its words, how those words are set, which image goes
there, or which image is painted behind it — and have that
change either land completely or not at all, **so that** I can edit my own site
without ever being able to break it, and without it mattering whether the change
came from me pointing at it or from me asking for it.

## Description

This is the **write path for a content edit**: the one place a change to a
page's words, to how those words are set, to which image a region shows, or to
which image is painted behind a panel, is applied. It exists as a
*shared* surface on purpose. The operator editing in the builder and the AI
editing on request are **two producers of the same kind of change**, not two
mechanisms — so there is one addressing scheme, one validator, one atomicity
rule and one refusal shape between them. The test every part of this surface
answers to: *could the AI have produced this exact edit through its own tool
surface?*

Image selection is deliberately the **second half of the same surface, not a
second mechanism**: there is no separate image command and no separate image
endpoint. An image edit is named, read, applied, validated, refused and
re-rendered by the identical operations a copy edit is. The whole of what image
selection adds is in *what a region answers when asked which fields it exposes*
— and the closed list of choices that answer carries.

A **painted panel's background image** arrives the same way, and is the evidence
that this generalises rather than having been a special case for images:
choosing what sits *behind* a region is the same closed pick, over the same
listing of the site's images, as choosing what sits *in front* of it. It adds no
command, no endpoint, no second write path and nothing the client has to learn —
only one more answer the derivation can give. It is **selection only**: the
picker can change the image a panel already paints, never add one to a panel
that paints none.

A run of copy's **typography** — how big it is, how heavy, whether it is italic,
whether it is capitalised — arrives by the same route again, and is the first
thing this surface exposes that is a **parameter of the run rather than its
content**. That difference is not cosmetic. Content is a scalar you overwrite; a
parameter can be *responsive*, which is to say the page holds not a number but a
rule sampled at several viewport widths, of which the value a region reports is
only the representative one. So a size edit writes a whole rule, in proportion,
rather than a value — and a control that wrote the value alone would appear to
do nothing while a control that flattened the rule would break the page at a
width nobody looked at. Everything else stays where it was: no new command, no
new endpoint, no new value vocabulary, one more answer the derivation can give
and one more branch of the same write.

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
  copy that is its words **first**, and beside them how the run is set: its size
  in pixels as a bounded whole number, its weight as a closed pick, whether it is
  italic, and how it is capitalised. Size is offered only where the run declares
  one of its own and weight only where the site offers more than one, because a
  fabricated number and a chooser holding its only option are both controls that
  lie about what they do. What that list of weights holds, and whether italic can
  be changed at all, are decided by the **faces the document itself declares** —
  the served glyphs the page ships — which is a property of the document rather
  than of the region and is supplied to the derivation exactly as the site's
  image listing is. For an image region the answer is **which image goes here** —
  a choice from a closed list of the site's images, narrowed to what an image can
  actually point at, and always including the handle the region holds now — plus
  its alt text. For a **painted panel that already carries a background image**
  it is **which image sits behind it** — one closed pick from that same listing
  of the site's images, again always including the handle the panel holds now,
  and nothing else of the paint the panel carries. Both of those answers say not
  merely that the choices are a closed list but **what the choices are** — that
  every option is one of the site's images — so a client can show a picture
  rather than an address. That declaration is a hint about presentation and never
  a constraint: it rides on the field, it is the same on a region's own image and
  on a panel's background, and it changes nothing about which values may be
  chosen or how that is enforced. For anything that exposes
  nothing — a panel that paints no background image, a module instance — the
  answer is an **empty list**, and an empty list is a legitimate
  answer rather than an error: "there is nothing to edit here" is a property of
  the region, decided once, not a check every caller has to remember.
- **Applying one change as one change.** A change map — the fields of a single
  region and their new values — is applied, validated and written **together**.
  However many fields it names, it produces exactly one change to the site: a new
  image and a new alt text chosen in the same form land in one diff, not two, and
  so do new words and a new size. A map that is bad in any part writes nothing at
  all: no half-applied edit, ever. A map that asks for nothing new changes
  nothing and says so.
- **Writing a parameter as the rule it is.** Where a run's size varies by
  viewport, changing it scales every keyframe of that rule by the same ratio, so
  the shape the page was captured with survives and only its magnitude moves. A
  parameter set back to the value it has when nothing is declared is *removed*
  rather than written in at its default. And a parameter write lands in the
  parameters the region already carries rather than over them, so everything else
  the region holds survives byte-identical.
- **Validating the whole result, not the edit.** Before anything is written, the
  *resulting complete definition* is validated by the same validator the
  platform's other structured-edit operations run. Sharing that validator is
  what makes this a second producer rather than a second path — an edit cannot
  be accepted here under looser rules than the AI's edits face. This holds for
  every edit through the surface, not only for copy.
- **Refusing legibly.** A rejected edit leaves the draft and the already-rendered
  page **byte-for-byte unchanged** — the page the operator is looking at is still
  accurate, which is what makes "show the error and carry on" safe — and reports
  a structured failure carrying the fault's code, the path it occurred at and a
  hint naming what to do, in both human and machine-readable form, with a
  failing exit status. A value that is not one of the options the region itself
  offered, a value of the wrong shape for the field it names, a value outside a
  field's stated bounds, and any value at all for a field the region offered
  read-only, are each refused at the field, before the shared validator runs,
  because a well-formed value the site cannot honour is *safe* and would
  otherwise be accepted into a silently broken page. A value outside a bound is
  refused, never clamped.
- **Making the change visible.** A successful edit is visible in the rendered
  page without a further manual step, in **both** the editable rendering and the
  plain draft rendering — because an edit changes the page and not one rendering
  of it, and a change that reached only one view would leave the other showing an
  indefinitely stale page with nothing to signal it. From the command line the
  edit re-renders both and reports where each was written. Through the builder's
  origin there is nothing for the save to re-render: both renderings are produced
  from the definition when they are next requested, so the save writes the draft,
  replies, and both views are current at the origin the operator's browser reads.
- **Being incapable of raw code.** The only controls this surface can offer are a
  plain string, a pick from a closed list the surface itself supplied, a whole
  number inside stated bounds, and a yes/no. Markup typed into a string is stored
  and rendered as literal text; it creates no element and no style. The other
  three are *narrower* still — a closed list can only return a value the surface
  already put in front of the caller, and a bounded number and a bit cannot carry
  a character. "There is no raw-editing mode" is therefore a property of the
  surface's shape, not a rule it has to enforce, and the vocabulary grows along
  the axis that keeps it that way.
- **Changing nothing but structured fields.** Choosing an image — the one a
  region shows, or the one a panel is painted with — points that region at a
  different handle. It writes, copies, resizes or processes no file, and it
  leaves every other parameter the region carries untouched, including the fill,
  the corner radius, the opacity and the overlay a panel holds alongside its
  background, and including wherever framing parameters eventually land. The same
  is true of a typography edit: the parameter named moves and no other does.

**Out of scope**

- The browser gesture that turns a click into an address, the modal it opens and
  the frame refresh that follows — a separate capability that *drives* this one.
- The rendering that stamps addresses onto elements (the edit render channel).
- **Listing the site's assets** as a surface in its own right — the store that
  supplies this surface's image choices is a separate capability, reachable
  without any editing gesture.
- **Image framing** — crop, scale, scrim, rotation, edge effects, free
  positioning. Deferred rather than forgotten: the capture/fold pipeline already
  folds those parameters into the definition, and this surface must eventually
  write **the same fields**, not a parallel vocabulary (DOC-28 §13 Q5).
- Asset **upload**, and any image processing. The picker offers what already
  exists.
- **Adding** a background image to a panel that paints none, and **removing**
  the one a panel has. The background picker is selection only and offers no
  empty choice. A panel is an editable region only because it paints something,
  so a panel whose only paint was its background would stop being a region the
  moment it was cleared, and could never be reached again to restore it.
  Removal remains reachable through the AI's surface, which addresses the
  parameter directly.
- **Colour** — a run's own colour, a panel's background colour, and the rest of a
  panel's paint (pattern, overlay, gradient, fill). Deferred for one reason: a
  colour on this surface must be a pick from the *site's palette* rather than a
  hex a user can invent, and neither the palette control nor the colour-valued
  field shape exists yet (REQ-133). This surface gained a run's type and a
  panel's background handle, not a paint panel.
- **Font family**, and a run's geometry — position, size of its box, spacing
  between its lines and letters. Family because changing it needs the site's
  served faces to be chosen, not just read; the rest because DOC-28 §3's rule is
  that friendly parameters live here and geometry stays with the AI. Line height
  and letter spacing are rules sampled across viewports for the same reason size
  is, and are deferred rather than approximated.
- **Text alignment.** Nothing implements it, and it is inert on the glyph-tight
  box a folded run renders into, so it would be a control that visibly does
  nothing on most of our sites.
- **Per-run restyling** — styling part of a run rather than the whole of it — and
  any structural change: add, remove, reorder, resize, reposition. Styling one
  word of three means *splitting* the run, which is structural, and structure is
  not editable from this surface at all. Where a page already carries three
  differently-styled runs those are three regions, each individually clickable
  and individually stylable; what is refused is this surface *creating* a split.
- Undo. The only reversal in phase 1 is not saving.

## Technical Context

- **One shared validator, over the whole definition.** Validation is not scoped
  to the edited field: an unrelated pre-existing violation elsewhere in the page
  refuses an edit for the identical reason it refuses the platform's other
  structured-edit commands. That property is the operative evidence that the two
  producers share a validator, and it is asserted by consequence rather than by
  inspection — including for an image edit, which could not fail identically to
  an unrelated structured-edit command if it ran a validator of its own.
- **The field vocabulary has grown twice, and every growth is a narrowing.** A
  field was a plain string and only a plain string, deliberately, as the exposure
  rule expressed as a type. It became a plain string *or* a pick from a closed
  list, and it is now also a whole number inside stated bounds *or* a yes/no.
  None of that loosens the raw-code guarantee: a closed list can only return an
  option the surface itself supplied, and a bounded number and a bit cannot
  express a character at all, so each new shape is strictly narrower than a free
  string. Widening along this axis raises what can be *said* without moving what
  can be *smuggled*, which is why it is the axis the vocabulary grows along
  rather than a one-off — the colour-from-the-palette control the next phase needs
  is the same move again.
- **A field's value is no longer always text, and the descriptor is the authority
  on both sides.** Values travel as they are — a size as a number, italic as a
  bit — rather than being stringified out and parsed back against a descriptor
  that already says exactly what they are. The write side takes its check from
  the same key the client takes its control from, so a control can never produce
  a value this surface refuses, and anything that does came from something other
  than the control.
- **A closed list also says what its options are, and that is a hint rather than
  a second constraint.** Knowing the choices are the site's *images* is what lets
  a client draw them as pictures instead of as a dropdown of paths; a path is a
  poor thing to choose a picture by, and a meaningless one once assets stop
  living in a filesystem. The declaration is carried on the field itself so every
  surface reading the same derivation learns the same thing, and it is attached
  by *kind of field* rather than by kind of region — an image region's own image
  and a painted panel's background both carry it, the alt text beside the former
  does not. It narrows nothing: membership is still enforced against the closed
  list alone, so a client that ignores the hint is not thereby offered a wider
  set of values, and a client that honours it cannot commit anything the list
  does not contain. The name and shape deliberately match the form widget's own
  pairing for colour swatches, so the descriptor already speaks the vocabulary a
  thumbnail control would need if that control ever moves into the widget, and an
  unrecognised hint is inert there today.
- **Why a region's current value is always among its own options — twice over.**
  A folded reproduction can hold an image handle the site's asset directory never
  mirrored (a remote URL), and it can hold a *weight the site declares no face
  for*: roughly one run in six on a real measured page is set in a weight its own
  site never served. A chooser whose options omit its own value presents the
  *first* option as selected — so an operator who opened the form to fix the alt
  text, or the words, and saved would have silently swapped the image or
  re-weighted the heading. Offering the current value is a correctness rule, not
  a convenience, and it is the same rule in both places.
- **The family a run asks for is a stack; the family a face declares is a bare
  name.** Every run on a real measured page carries a fallback chain
  ("Satoshi, Helvetica Neue, Arial, sans-serif") while every declared face names
  one family ("Satoshi"). Comparing them whole is not a near miss but a
  guaranteed one: it would find no faces anywhere and withdraw the weight control
  from the entire site, silently and with nothing to notice. The match is on the
  first family of the stack, which is the one the run actually asks for.
- **Why italic locks only on positive evidence of absence.** The intent as first
  written said italic is locked where no italic face is declared. That would
  disable a working control: a family declaring *no* faces at all is painted by
  the reader's own system font, which has real italics. The lock is a claim about
  a webfont the site ships, so it needs the webfont — the family declares faces,
  and none of them is italic. It shows the row read-only rather than dropping it
  because a missing row reads as "this build has no italics" while a locked one
  reads as "this site's font has none", and the two have very different fixes.
- **Why a size edit writes a rule and not a number.** A run's size can be
  responsive: the page holds keyframes at several widths and the value a region
  reports is the representative (widest) one. Roughly one run in four on a real
  measured page carries such a ladder, so this is load-bearing rather than
  defensive. Writing the representative value alone leaves the ladder to win at
  every width it covers, so the edit appears to do nothing on the page the
  operator is looking at; flattening the ladder deletes the narrow-viewport
  keyframe and breaks a width they never opened. Scaling every keyframe by the
  ratio preserves the shape the fold measured and moves the whole rule, which is
  what "bigger" means. The flags describing how the rule behaves *between*
  keyframes are carried through untouched, because a uniform scale moves no
  boundary. The ladder moves in the same write as the value it belongs to — never
  independently and never afterwards, because a second write path is a second
  chance to disagree about which value is representative.
- **Why a bound binds a change and not the status quo.** A saved form carries
  every field the region exposed, not only the ones that were touched. A run the
  page was captured with at 160px would therefore be refused, or silently
  resized, merely because someone opened it to fix a typo. So a value equal to
  the one the region just reported passes whatever it is, and only a genuinely
  new value is measured against the range. Out-of-range is refused rather than
  clamped for the same family of reason the whole surface exists: quietly
  reshaping a page nobody edited is the worse failure, and it is invisible.
- **Why absent is the default rather than the default being written in.** Turning
  italic off on a run that never declared a style, or setting capitalisation back
  to none, removes the parameter rather than writing the initial value into it.
  Writing it in would grow the definition on every save and turn an edit that
  changed nothing into a diff — and "a change map that changes nothing is
  reported as changing nothing" is what keeps the modal from putting a history in
  the draft that the operator never asked for.
- **Why membership is checked here and not left to the validator.** The shared
  validator refuses an *unsafe* handle, but a handle to an asset the site simply
  does not have is perfectly well-formed and safe — it would be accepted and the
  page would render a broken image with no error. A client holding a stale asset
  listing is the realistic source. Membership is therefore checked at the field,
  server-side, rather than being a property of the widget. The same argument
  applies to a weight the site declares no face for: it is a safe value that the
  page cannot honour, and the browser answers it with a synthetic face rather
  than an error.
- **One listing serves both pickers.** What a region can sit *in front of* and
  what a panel can sit *behind* are offered from the same enumeration of the
  site's images, so the two can never disagree about what the site has. A region
  with no picker at all — a run of copy — still costs no listing read, and
  conversely the font table is read only for the runs that consume it.
- **The faces come from the page's own document, even inside a module's slot.**
  A served face is declared once per rendered document, so the weights a slotted
  run can actually paint in are the page's. Reading them from anywhere else would
  offer a weight the render cannot serve — which is the same failure the closed
  list exists to prevent, arriving by a different door.
- **Why there is no empty option, expressed as a type rather than as a check.**
  The background field is one that *must* hold a value. If a panel's only paint
  were its background, offering removal would drop it out of the set of editable
  regions on the very next rendering, with no address left to click to put it
  back. Requiring a value puts that outcome out of reach by construction rather
  than guarding against it with a special case. The same rule read from the
  value side is why a panel carrying an empty handle is treated as painting no
  background at all: a picker there would be offering to *add* one.
- **The background is offered on the panel, not on everything that can carry
  one.** A run of copy or an image region can carry a background parameter too,
  but exposing it there would turn the copy form into a paint surface and blur
  the map from the region the operator clicked to what they meant by clicking
  it. The handle is offered on the region an operator clicks to mean "this
  panel". The same boundary is why a run's *own* box is not offered a fill: a
  folded run's box is glyph-tight, so filling it paints a tight rectangle behind
  the words, which is almost never what a person means by "the background".
- **Applying a value writes into the parameters the region already carries,
  rather than over them.** The change lands on the one parameter named and
  every other parameter on the region survives byte-identical — which is what
  makes "choosing a background disturbs nothing" true of the whole region and
  not merely of the asset store, and what makes the same claim true of a run's
  forty-odd parameters when one of them is retyped.
- **The picker's choices ride the read call.** Asking a region what it exposes
  already returns the option list inside the image field's descriptor, so a
  chooser costs no extra round trip and cannot display options the write path
  would reject. The independently reachable asset listing exists for the asset
  store's own consumers, not for this surface. The weight list arrives the same
  way, from the document rather than from a listing.
- **Where "both views are current" is now observed, and why the claim did not
  change.** This surface's two origin-facing criteria used to be read off stored
  renderings, because a save through the builder re-materialised both channels
  before it replied — whichever it skipped would have gone on serving the page as
  it used to be. The workspace now produces those two renderings from the
  definition when they are requested, so that step is gone and there is no
  artifact left to inspect. The claim is preserved exactly: an edit changes the
  page, not one rendering of it. Only the observable moved, to the origin — which
  is the stronger one anyway, being the bytes the operator's browser is actually
  shown — and "before it reports success" falls away with the artifact it was
  about. The command line is unaffected: it still renders both channels and
  reports where each was written.
- **Relationship to neighbouring capabilities.** The addresses this surface
  resolves are written by the edit render channel (CAP-84 / STORY-98), whose
  stamp vocabulary and resolution rule live in the shared definition site this
  capability owns. The builder workspace (CAP-85 / STORY-99) exposes this same
  surface over its origin as a thin transport — the same operations, not a
  parallel implementation — so a rejected edit reaches the browser carrying the
  validator's own code, path and hint rather than a generic server failure. The
  option list this surface offers for an image comes from the site asset store
  capability, narrowed to images.
- **The browser gesture needed no change to accommodate images.** When image
  selection arrived, the in-page editor passed the descriptors straight through
  to its form widget and the widget already understood a closed-list field. This
  is recorded as evidence that the loop is genuinely region-kind-agnostic. What
  the gesture does with a descriptor since — including reading the images hint,
  deciding which control draws the field, and how it lays the words and the
  parameters out — is that capability's business, not claimed as an acceptance
  criterion here.
- **Where the intent and the implementation differ.** Two places, both recorded
  rather than absorbed. (1) The intent states that clicking a region with no
  editable fields "opens nothing"; this surface's part of that is the empty field
  list, and the shipped browser behaviour instead shows a dismissible "nothing to
  edit here" message — that divergence lives with the editor gesture, not here.
  (2) The intent for typography proposed that a run declaring *no* size of its own
  should seed its control from the value it renders at, so the first change writes
  an explicit parameter. What shipped withholds the size control from such a run
  instead, on the ground that the rendered value lives in the browser rather than
  in the page and a fabricated number is worse than an absent control. The
  measured folds carry a declared size on every run, so the case has no observed
  instance; the intent's version remains open rather than refuted.
- **Known cosmetic defect, deliberately not fixed.** A saved edit rewrites the
  whole page document with different unicode escaping, so a one-word change
  produces a large diff. Pre-existing behaviour of the shared write helper;
  recorded in the intent as wanting its own ticket.
- **Editing inside a module's slot depends on the module declaring its seam.**
  Only the module knows which of its elements is the slot; a module that marks
  none yields addresses that cannot be scoped and therefore cannot be resolved.

## Dependencies

The image choices this surface offers come from the site asset store listing.
The weights and the italic lock come from the page's own declared font faces,
which the page definition already carries. Everything else is independently
usable and independently provable through the command line alone — arguments in,
structured result and exit status out.

## Story Points

3