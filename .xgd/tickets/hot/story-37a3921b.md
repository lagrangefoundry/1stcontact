---
uid: story-37a3921b
id: STORY-100
type: story
title: Change the words and choose the images on my page through one validated, all-or-nothing
  edit — the same path the AI uses
created_by: xgd
created_at: '2026-08-07T02:01:01.053881+00:00'
updated_at: '2026-08-10T08:24:29.509655+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-f753cecd
  story_kind: upgrade
  story_points: 3
  updated_by:
  - request-66e4c630
  - bundle-e59210c5
  uat_coverage: pass
---

## Story

**As a** person who owns a site on this platform — or the AI acting on my
instruction — **I want** to change what a region of a page holds by naming the
region and the new values — its words, which image goes there, or which image
is painted behind it — and have that
change either land completely or not at all, **so that** I can edit my own site
without ever being able to break it, and without it mattering whether the change
came from me pointing at it or from me asking for it.

## Description

This is the **write path for a content edit**: the one place a change to a
page's words, to which image a region shows, or to which image is painted
behind a panel, is applied. It exists as a
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
  copy that is its words. For an image region that is **which image goes here** —
  a choice from a closed list of the site's images, narrowed to what an image can
  actually point at, and always including the handle the region holds now — plus
  its alt text. For a **painted panel that already carries a background image**
  it is **which image sits behind it** — one closed pick from that same listing
  of the site's images, again always including the handle the panel holds now,
  and nothing else of the paint the panel carries. For anything that exposes
  nothing — a panel that paints no background image, a module instance — the
  answer is an **empty list**, and an empty list is a legitimate
  answer rather than an error: "there is nothing to edit here" is a property of
  the region, decided once, not a check every caller has to remember.
- **Applying one change as one change.** A change map — the fields of a single
  region and their new values — is applied, validated and written **together**.
  However many fields it names, it produces exactly one change to the site: a new
  image and a new alt text chosen in the same form land in one diff, not two.
  A map that is bad in any part writes nothing at all: no half-applied edit, ever.
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
  offered is refused at the field, before the shared validator runs, because a
  well-formed handle to something the site does not have is *safe* and would
  otherwise be accepted into a silently broken page.
- **Making the change visible.** A successful edit is visible in the rendered
  page without a further manual step, in **both** the editable rendering and the
  plain draft rendering — because an edit changes the page and not one rendering
  of it, and a change that reached only one view would leave the other showing an
  indefinitely stale page with nothing to signal it. From the command line the
  edit re-renders both and reports where each was written. Through the builder's
  origin there is nothing for the save to re-render: both renderings are produced
  from the definition when they are next requested, so the save writes the draft,
  replies, and both views are current at the origin the operator's browser reads.
- **Being incapable of raw code.** The only controls this surface can offer are
  a plain string and a pick from a closed list the surface itself supplied.
  Markup typed into a string is stored and rendered as literal text; it creates
  no element and no style. A closed list is *narrower* still — it can only return
  a value the surface already put in front of the caller. "There is no
  raw-editing mode" is therefore a property of the surface's shape, not a rule it
  has to enforce.
- **Changing nothing but structured fields.** Choosing an image — the one a
  region shows, or the one a panel is painted with — points that region at a
  different handle. It writes, copies, resizes or processes no file, and it
  leaves every other parameter the region carries untouched, including the fill,
  the corner radius, the opacity and the overlay a panel holds alongside its
  background, and including wherever framing parameters eventually land.

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
- **Background colour**, and the rest of a panel's paint — pattern, overlay,
  gradient, fill. Deferred for colour's reason: it needs the site palette and a
  colour-valued control, neither of which exists. This surface gained one
  handle, not a paint panel.
- Text properties (size, colour, weight, family), per-run restyling, and any
  structural change — add, remove, reorder, resize, reposition.
- Undo. The only reversal in phase 1 is not saving.

## Technical Context

- **One shared validator, over the whole definition.** Validation is not scoped
  to the edited field: an unrelated pre-existing violation elsewhere in the page
  refuses an edit for the identical reason it refuses the platform's other
  structured-edit commands. That property is the operative evidence that the two
  producers share a validator, and it is asserted by consequence rather than by
  inspection — including for an image edit, which could not fail identically to
  an unrelated structured-edit command if it ran a validator of its own.
- **The field vocabulary grew by exactly one shape, and the shape is a
  narrowing.** A field was a plain string and only a plain string, deliberately,
  as the exposure rule expressed as a type. It is now a plain string *or* a pick
  from a closed list. That is not a loosening of the raw-code guarantee: a closed
  list can only return an option the surface itself supplied, so it is strictly
  narrower than a free string. It is also the shape later phases need (a colour
  from the site palette, a behavior module's config value), which is why it is
  the axis the vocabulary grows along rather than a one-off for images.
- **Why a region's current image is always among its own options.** A folded
  reproduction can hold a handle the site's asset directory never mirrored (a
  remote URL). A chooser whose options omit its own value presents the *first*
  option as selected — so an operator who opened the form to fix the alt text
  and saved would have silently swapped the image. Offering the current handle
  is a correctness rule, not a convenience.
- **Why membership is checked here and not left to the validator.** The shared
  validator refuses an *unsafe* handle, but a handle to an asset the site simply
  does not have is perfectly well-formed and safe — it would be accepted and the
  page would render a broken image with no error. A client holding a stale asset
  listing is the realistic source. Membership is therefore checked at the field,
  server-side, rather than being a property of the widget.
- **One listing serves both pickers.** What a region can sit *in front of* and
  what a panel can sit *behind* are offered from the same enumeration of the
  site's images, so the two can never disagree about what the site has. A region
  with no picker at all — a run of copy — still costs no listing read.
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
  panel".
- **Applying a background writes into the parameters the region already carries,
  rather than over them.** The change lands on the one parameter named and
  every other parameter on the region survives byte-identical — which is what
  makes "choosing a background disturbs nothing" true of the whole region and
  not merely of the asset store.
- **The picker's choices ride the read call.** Asking a region what it exposes
  already returns the option list inside the image field's descriptor, so a
  chooser costs no extra round trip and cannot display options the write path
  would reject. The independently reachable asset listing exists for the asset
  store's own consumers, not for this surface.
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
- **The browser gesture needed no change to accommodate images.** The in-page
  editor passes the descriptors through to its form widget unchanged, and the
  widget already understood a closed-list field. This is recorded as evidence
  that the loop is genuinely region-kind-agnostic; it is not claimed as an
  acceptance criterion here, because it belongs to the gesture capability and
  no test in this change drives it with an image.
- **Where the intent and the implementation differ.** The intent states that
  clicking a region with no editable fields "opens nothing"; this surface's part
  of that is the empty field list, and the shipped browser behaviour instead
  shows a dismissible "nothing to edit here" message. That divergence lives with
  the editor gesture, not here.
- **Known upstream limitation, deliberately not worked around.** The form
  widget's closed-list control renders each option's text as the value verbatim,
  so an image picker shows the handle (`/assets/hero.png`) rather than a friendly
  name or a thumbnail. Per DOC-8 §9.4 a component gap is closed upstream, never
  patched or wrapped locally, so no criterion here asserts a label or a preview.
- **Known cosmetic defect, deliberately not fixed.** A saved edit rewrites the
  whole page document with different unicode escaping, so a one-word change
  produces a large diff. Pre-existing behaviour of the shared write helper;
  recorded in the intent as wanting its own ticket.
- **Editing inside a module's slot depends on the module declaring its seam.**
  Only the module knows which of its elements is the slot; a module that marks
  none yields addresses that cannot be scoped and therefore cannot be resolved.

## Dependencies

The image choices this surface offers come from the site asset store listing.
Everything else is independently usable and independently provable through the
command line alone — arguments in, structured result and exit status out.

## Story Points

3