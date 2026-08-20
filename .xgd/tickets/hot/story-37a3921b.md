---
uid: story-37a3921b
id: STORY-100
type: story
title: Change the words, how they are set, which images appear on my page and how
  a picture is seen — through one validated, all-or-nothing edit, the same path the
  AI uses
created_by: xgd
created_at: '2026-08-07T02:01:01.053881+00:00'
updated_at: '2026-08-20T03:00:27.926188+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-f753cecd
  story_kind: upgrade
  story_points: 3
  updated_by: request-8a132869
  uat_coverage: fail
---

## Story

**As a** person who owns a site on this platform — or the AI acting on my
instruction — **I want** to change what a region of a page holds by naming the
region and the new values — its words, how those words are set, what colour
they are painted in, which image goes there and how that picture is framed,
shaped and colour-adjusted, or which image and which colour are painted behind
it — and have that
change either land completely or not at all, **so that** I can edit my own site
without ever being able to break it, and without it mattering whether the change
came from me pointing at it or from me asking for it.

## Description

This is the **write path for a content edit**: the one place a change to a
page's words, to how those words are set, to what colour they are painted in,
to which image a region shows and how that picture is seen, or to
which image and which colour are painted behind a panel, is applied. It exists
as a
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

**How a picture is seen** — where in its box it sits, what shape it is cut to,
how it is turned and scaled, and how its colour is adjusted — arrives by that
same route a fourth time, and is the point at which this surface stops being
about *which* thing a region holds and becomes about the *parameters* of the
thing it holds for images as well as for copy. It is the deferral this story
used to carry, and the condition it was deferred under has been met: the
controls are projections over exactly the parameters the capture pipeline
already measures and folds into a page — the fill mode, the position within the
box, the colour adjustment, the shape, the turn and the scale — rather than a
parallel vocabulary invented for the editor. The whole of it is thirteen more
answers the derivation gives and one more branch of the same write: no new
command, no new endpoint, no new field shape, and no control that can express a
length, a colour function or a path.

**Colour** arrives by the same route a fifth time, and it is the deferral this
story carried the longest: **a run's own colour, and the colour a painted panel
is filled with**. The condition it was deferred under was that a colour on this
surface must be a pick from the *site's palette* rather than a hex a user can
invent, and the palette surface that makes such a pick possible now exists. So
the rule that bounds it is the same one that bounds every other pick here, only
stated over a different closed list: **from a segment, the only colour that can
be written is one the site already has**. A colour value on this surface is a
palette *reference*, never a hex — which is what makes editing a palette entry
move every use of it, and what keeps an off-system colour off the page by the
one route the design closes. Inventing a colour is a palette edit, a deliberate
and separate act on a different surface. Reading is asymmetric on purpose: a
colour field *reports* whatever the region actually holds, which on a folded
site is a hex literal, and only ever *writes* a reference — so opening a folded
run to fix a typo works, and picking a colour there refines a literal into a
reference.

Colour is also the first thing this surface exposes whose value is **not a
scalar**: a reference is an entry name and, optionally, a position on that
entry's light↔dark range. It is carried as a typed value rather than flattened
into a string, because flattening would put a parser between the control and
the page, and a parser is exactly the free-form surface the rest of this
vocabulary exists to avoid.

And colour is what turns the story's single read-only control into a **stated
rule**. A control is offered only when it is **faithful**: the value it shows is
the whole truth about what the element holds, and setting it produces exactly
the change the operator expects. Where that is not true the control is offered
**unavailable, with the reason** — never hidden, and never quietly lossy.
Faithfulness breaks three ways, and all three get the same treatment: the
control is *inert* because another parameter of the element overrides the one it
writes; it is *lossy* because the element holds a structure where the control
offers a single value; or it is *unsupported* because the site cannot honour
what it would set. The read-only italic control this story already carried is
one instance of that rule — the unsupported one — rather than the whole of it.
The test is "**is the write observable and complete?**", not "is another
parameter present": a translucent layer over a colour, or a scrim over a
photograph, shows what is under it, so a sibling parameter is not occlusion and
the control stays live.

**No control on this surface touches a file.** That is the load-bearing claim of
image editing, not a side effect of it. Framing, shaping and adjusting a picture
write structured parameters that the renderer applies; they never bake, copy,
resize or re-encode an asset. One uploaded picture therefore serves many
framings; an adjustment is an ordinary structured diff, gated by the same
validator and reversible by the same means as any other edit; no
image-decoding pipeline joins the attack surface; and the adjustment stays
legible to the AI, which can read "saturation 40%" and cannot read pixels. The
cost is named rather than hidden: a large picture cropped small still ships at
its full size, which is a performance concern with an additive fix and no
consequence for what this surface writes.

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
  copy that is its words **first**, then **what colour those words are painted
  in**, and then how the run is set: its size
  in pixels as a bounded whole number, its weight as a closed pick, whether it is
  italic, and how it is capitalised. Size is offered only where the run declares
  one of its own and weight only where the site offers more than one, because a
  fabricated number and a chooser holding its only option are both controls that
  lie about what they do. What that list of weights holds, and whether italic can
  be changed at all, are decided by the **faces the document itself declares** —
  the served glyphs the page ships — which is a property of the document rather
  than of the region and is supplied to the derivation exactly as the site's
  image listing is. The colour field is decided the same way, from a property of
  the **site**: the entries of the site's own palette, which travel back with the
  descriptors so a client cannot draw a swatch against one palette and post a
  reference against another. A colour is offered whether or not the region
  declares one and whether or not the site has a palette yet, because the picker
  it opens is also where a first entry gets added, and withdrawing the field
  would make the palette unreachable from the only surface that wants one; a
  region that declares no colour of its own reports no value rather than the
  colour it inherits. For an image region the answer **leads with which image goes
  here** —
  a choice from a closed list of the site's images, narrowed to what an image can
  actually point at, and always including the handle the region holds now — and
  then its alt text, in that order, because a client that opens straight into the
  picker depends on which field comes first. After the pair comes **how that
  picture is seen**: how it fills its box, where within the box it sits across
  and down, what shape it is cut to, how much its corners are rounded, how far it
  is turned and how much it is scaled, and how bright, contrasty, saturated,
  black-and-white and hue-shifted it is, and how much it is blurred. Each of
  those is a bounded whole number or the closed set of words the parameter itself
  admits — never a free-form value — and each is offered on an image region
  alone. A picture that declares none of them answers not with blanks but with
  the values a browser would actually paint it at, because a control that cannot
  say what a thing is now is a control nobody can use. For a **painted panel** it
  is **what colour it is filled with** — every panel that paints anything at all
  offers this, including one whose only paint today is a rounded corner or an
  image — and, **when it carries one**, **which image sits behind it**: one
  closed pick from that same listing
  of the site's images, again always including the handle the panel holds now.
  Nothing else of the paint the panel carries is offered. Both of the image
  answers say not
  merely that the choices are a closed list but **what the choices are** — that
  every option is one of the site's images — so a client can show a picture
  rather than an address. That declaration is a hint about presentation and never
  a constraint: it rides on the field, it is the same on a region's own image and
  on a panel's background, and it changes nothing about which values may be
  chosen or how that is enforced. A run of copy is also told **which panel sits
  behind it** and what that panel is filled with, read-only, so the surface that
  drives this one has somewhere to send an operator who meant the panel rather
  than the words; it is the nearest painted ancestor, and absent when the run
  sits on nothing painted. For anything that exposes
  nothing — a behavior module's mounted seam, which holds no words of its own, no
  image and no paint — the
  answer is an **empty list**, and an empty list is a legitimate
  answer rather than an error: "there is nothing to edit here" is a property of
  the region, decided once, not a check every caller has to remember.
- **Offering a control only when it is faithful.** Where the value a control
  shows is not the whole truth about what the element holds, or setting it would
  not produce the change the operator expects, the field is still offered, in
  the same position, still reporting what the element holds — and marked
  **unavailable, with a plain-English reason** naming what the element is doing
  and how to get it changed. It is never dropped: an absent row reads as "this
  build has no such control" while an unavailable one reads as "not for this
  element", and the two have very different fixes. The reason travels with the
  descriptor to every reader of it — the browser, the command line and the AI's
  own tool surface — so none of them offers a control it will then be refused
  for.
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
  field's stated bounds, a colour that is not a reference into this site's own
  palette, and a *change* to a field the region offered unavailable, are each
  refused at the field, before the shared validator runs,
  because a well-formed value the site cannot honour is *safe* and would
  otherwise be accepted into a silently broken page. A value outside a bound is
  refused, never clamped. A refusal for an unavailable field carries the very
  sentence the field's own reason gave, so the explanation a greyed control shows
  and the explanation a refused write returns can never be two different
  stories.
- **Refusing a change and never the status quo.** Every one of those field
  refusals measures the value against what the region *just reported*, and lets a
  value equal to it through whatever it is. A saved form carries every field the
  region exposed, not only the ones that were touched, so a re-post of an
  unchanged value has to be a no-op: otherwise a run captured beyond a bound, a
  run holding a literal colour, or a run whose colour is unavailable would become
  uneditable in its *words* merely because someone opened it.
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
  number inside stated bounds, a yes/no, and a reference into the site's own
  palette. Markup typed into a string is stored
  and rendered as literal text; it creates no element and no style. The other
  four are *narrower* still — a closed list can only return a value the surface
  already put in front of the caller, a bounded number and a bit cannot carry
  a character, and a palette reference can only name an entry the site already
  declares. "There is no raw-editing mode" is therefore a property of the
  surface's shape, not a rule it has to enforce, and the vocabulary grows along
  the axis that keeps it that way.
- **Changing nothing but structured fields.** Choosing an image — the one a
  region shows, or the one a panel is painted with — points that region at a
  different handle. It writes, copies, resizes or processes no file, and it
  leaves every other parameter the region carries untouched, including the fill,
  the corner radius, the opacity and the overlay a panel holds alongside its
  background, and including the framing parameters the region carries. The same
  is true of a typography edit, of a colour edit and of a framing edit: the
  parameter named moves
  and no other does, and **adjusting** a picture bakes no file for exactly the
  reason **choosing** one does not — every tool here writes a parameter the
  renderer applies, and none of them is an image processor.
- **Leaving no trace when nothing changed.** Every parameter this surface writes
  has a value at which it says nothing, and setting a control back to it
  *removes* the parameter rather than recording it — and if that empties the
  group the parameter lived in, the group goes too, so a picture that arrived
  carrying no parameters at all is left carrying none. A colour reference is
  written in its canonical form for the same reason: the positions a resolver
  treats as absent are pruned rather than stored, so a picker that always sends
  its slider position cannot turn a colour that did not move into a diff. An
  edit that changes nothing is reported as changing nothing and leaves the stored
  draft byte-for-byte as it found it.

**Out of scope**

- The browser gesture that turns a click into an address, the modal it opens and
  the frame refresh that follows — a separate capability that *drives* this one.
  That includes the control that lets an operator *choose* a colour, the way an
  unavailable field is drawn, and where the reason is shown: this surface says a
  field is unavailable and why, and the gesture decides what that looks like.
- The rendering that stamps addresses onto elements (the edit render channel).
- **Listing the site's assets** as a surface in its own right — the store that
  supplies this surface's image choices is a separate capability, reachable
  without any editing gesture. The same is true of the site's **palette**: adding,
  renaming, recolouring and removing an entry is its own surface, and this one
  only reads the entries it offers as choices.
- **Zooming into a picture** — a true crop of a source rectangle, as opposed to
  choosing which part of the picture its box shows. What this surface offers is
  the pan; magnifying a region of the source needs a primitive the substrate does
  not yet carry, and the obvious CSS one is not supported by all three engines.
- **Tinting a picture with a colour**, as distinct from adjusting the colour it
  already has. A scrim over a picture paints behind replaced content and so does
  not tint it.
- **Framing a painted panel's background.** A panel's background is still pinned
  to one fitting, so the same intent lands on a different family of parameters
  there, and unpinning it is its own change. Framing is offered on an image
  region alone.
- **Dragging handles over the picture** to crop or reposition it. What exists is
  a control per parameter; a direct-manipulation gesture belongs to the editor
  gesture capability and would need a way to preview a drag without a round trip
  per pointer move.
- **Stylising a picture** — turning it sepia or inverting it. Both are
  expressible in the definition and both are read back off a captured page, and
  neither is offered as a control: they are stylisation rather than adjustment,
  and the panel is already a full one. The AI addresses them directly.
- Asset **upload**, and any image processing at all — including on this surface's
  own framing controls, none of which decodes, resizes, re-encodes or bakes a
  file. The picker offers what already exists, and the framing controls change
  only how what already exists is seen.
- **Adding** a background image to a panel that paints none, and **removing**
  the one a panel has. The background picker is selection only and offers no
  empty choice. A panel is an editable region only because it paints something,
  so a panel whose only paint was its background would stop being a region the
  moment it was cleared, and could never be reached again to restore it.
  Removal remains reachable through the AI's surface, which addresses the
  parameter directly. The same holds of a panel's **fill**: it can be set and
  changed here, and clearing it back to nothing is the AI's business.
- **Inventing a colour.** A free hex cannot be entered anywhere on this surface,
  on either the run's colour or the panel's fill: it is refused even though it
  is a perfectly valid colour, because the one route by which an off-system
  colour could reach a page is the one this rule closes. Free hex entry lives in
  the palette surface alone.
- **The rest of a panel's paint** — its pattern, its overlay and its gradient.
  Each is a composition rather than a choice, and no closed list makes one
  friendly, so they stay with the AI. A run's own *gradient* is the same: it is
  four stops and an angle, which a single swatch could only flatten.
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
- **The field vocabulary has grown three times, and every growth is a
  narrowing.** A
  field was a plain string and only a plain string, deliberately, as the exposure
  rule expressed as a type. It became a plain string *or* a pick from a closed
  list; then also a whole number inside stated bounds *or* a yes/no; and now also
  a **palette reference**.
  None of that loosens the raw-code guarantee: a closed list can only return an
  option the surface itself supplied, a bounded number and a bit cannot
  express a character at all, and a palette reference can only name an entry the
  site declares — so each new shape is strictly narrower than a free
  string. Widening along this axis raises what can be *said* without moving what
  can be *smuggled*, which is why it is the axis the vocabulary grows along
  rather than a one-off — and the third growth is the prediction this story used
  to carry, landed. The one thing that *did* change with it is that a field's
  value need no longer be a scalar: a colour is a typed value with an entry name
  and a position, and it is carried as such rather than encoded into a magic
  string, because a string would need a parser and a parser is the free-form
  surface this whole vocabulary avoids.
- **The vocabulary did not have to grow for framing, and that is the evidence
  the axis was the right one.** Thirteen new controls for how a picture is seen
  arrived without a new field shape between them: every one of them is the
  bounded whole number or the closed pick that already existed. The client needed
  no change either — it already routes anything that is not a plain string into
  the parameter sheet. A growth in what an operator can *say* that costs nothing
  in what the surface can *carry* is the whole point of narrowing the vocabulary
  rather than widening it.
- **A control may be a projection of the parameter it writes, and this surface is
  the only place that knows which.** A picture's colour adjustment is held in the
  definition the way a browser reports it — saturation as `0.4` — because that is
  what the capture pipeline measures and must be able to write without
  converting. What an operator means, and what the control therefore offers, is
  "40%". The two differ deliberately and the names differ with them, exactly as
  the italic yes/no differs from the parameter it writes. Keeping the conversion
  in one place is what stops a second one appearing somewhere else with a
  different rounding rule.
- **Every one of these controls has a value at which it says nothing, and it is
  not the same value for all of them.** A fill mode has the browser's own initial
  fitting, a position has dead centre, a turn and a blur have zero, a scale and a
  saturation have "unchanged", and a colour reference has the shade and the
  opacity its resolver treats as absent. Writing any of them in rather than
  removing the
  parameter would grow a page's definition on every save, turn a no-op into a
  diff, and — for the fill mode in particular — put a value in the file that the
  capture pipeline deliberately omits, so a folded page and an edited page would
  disagree about what "unset" looks like. The same rule has to reach the
  *container*: a picture that had no parameters at all must not come back with an
  empty one, because an empty group renders as nothing while reading as
  something.
- **Whether a panel is a segment is asked of the renderer, not restated here.**
  A box or a container is an editable region exactly when it paints something,
  and that question has one right answer: the one the emitter used when it
  decided what to stamp with an address. This surface asks it rather than keeping
  a second list of paint parameters in step with the first by hand — otherwise
  the day a paint parameter is added, the modal would start offering controls on
  regions nobody can click, or refuse them on regions that are outlined. It is
  the same reason the escalation from a run finds "the panel behind this text" by
  asking the same question of each ancestor and stopping at the first hit:
  nearest rather than outermost, because the panel a person means is the one
  immediately behind the words, and a link that opened an empty modal would be
  the symptom of guessing.
- **Why every painted panel now has something to edit.** Before colour, a panel
  painting only a rounded corner or only an image answered with an empty field
  list: a region an operator could see outlined, click and open, to be told there
  was nothing inside it. The parameter it was missing is precisely the one this
  phase adds, so the set of regions that expose nothing shrank again — as it has
  at every phase — and the worked example of "nothing to edit here" moved off the
  painted panel and onto a behavior module's seam, which genuinely holds no
  words, no image and no paint of its own.
- **The shape list carries whatever the picture already carries — the same rule,
  for the third time.** The offered shapes are the geometric ones a
  non-technical operator would recognise, but a picture folded from a capture or
  shaped by the AI can hold an edge treatment that is not among them. A chooser
  whose options omit its own value presents the *first* option as selected, so
  without the union an operator who opened a picture to fix its alt text and
  saved would have silently squared it off. This is the identical correctness
  rule as the image handle that is not in the site's directory and the weight the
  site declares no face for.
- **A shape is written bare, and its tuning stays with the AI.** The parameters a
  shape carries — how far a leaning quadrilateral leans, how rough and by which
  seed an organic outline is generated — belong to the shape that names them and
  are meaningless on any other, so choosing a shape from this control writes the
  shape alone and takes the renderer's own defaults for the rest. An operator who
  wants a rougher outline asks the AI, which addresses the parameter directly.
- **A field's value is no longer always text, or even always a scalar, and the
  descriptor is the authority
  on both sides.** Values travel as they are — a size as a number, italic as a
  bit, a colour as an entry name and a position — rather than being stringified
  out and parsed back against a descriptor
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
  does not contain.
- **The palette rides the read call, for the reason the image choices do.** The
  entries a colour field may name travel back with the descriptors that reference
  them, in one answer. Fetching them separately would let a client draw a swatch
  against one palette and post a reference validated against another, and the
  window for that is exactly the window a modal is open in — which is also the
  realistic source of the stale reference the write side refuses.
- **Why membership is checked here and not left to the validator — and why a
  colour is the sharpest case.**
  The shared validator refuses an *unsafe* handle, but a handle to an asset the
  site simply
  does not have is perfectly well-formed and safe — it would be accepted and the
  page would render a broken image with no error. A client holding a stale asset
  listing is the realistic source. Membership is therefore checked at the field,
  server-side, rather than being a property of the widget. The same argument
  applies to a weight the site declares no face for, and to a colour naming a
  palette entry the site does not hold: the validator would catch the colour too,
  but it could not say *which field*, and "which entry" is the whole answer when
  the cause is an entry renamed or deleted while the modal was open. The colour
  check is stricter than membership alone for the same reason: the position and
  the opacity a reference carries are bounded, and a key the reference has no
  business carrying is refused rather than dropped, so a value this surface
  admits is always one the shared validator will admit too.
- **A hex is refused although it is a valid colour, and that is the point.** The
  picker offers entries, so a hex arriving on the wire came from something other
  than the picker. Honouring it would be the one route by which an off-system
  colour reaches a page — and yet a hex is also what every folded site's regions
  actually *hold*, and what this surface reports back for them. The two are
  reconciled by the status-quo rule and by nothing else: the colour a region just
  reported passes whatever shape it is in, and only a genuinely new value has to
  be a reference. Without that, colour's arrival would have broken editing the
  *words* of every run on every folded site.
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
- **The faithfulness rule, and why the italic lock is one instance of it rather
  than the whole of it.** A control is unavailable when it is *inert*, *lossy* or
  *unsupported*, and the three have one treatment and one shape: the descriptor
  carries the unavailability and its sentence as a single value, so a control
  cannot be marked unavailable without saying why. That pairing is the mechanism,
  and it is what makes the sentence usable on three different readers at once —
  the browser draws it, the command line prints it, and a refused write returns
  it verbatim.
  - *Unsupported* is the italic case, and it is the one the rule was generalised
    from. The intent as first written said italic is locked where no italic face
    is declared. That would disable a working control: a family declaring *no*
    faces at all is painted by the reader's own system font, which has real
    italics. The lock is a claim about a webfont the site ships, so it needs the
    webfont — the family declares faces, and none of them is italic. Its reason
    names the font rather than the build, because adding a face to the site is
    the fix.
  - *Inert* is the colour of a run whose glyphs are painted by a gradient. The
    renderer paints such a run by clipping background layers to the text, which
    requires the flat colour to be transparent — so the parameter the picker
    writes is still there, still valid, and paints nothing. The operator picks a
    colour, saves, and the words do not move, which is the worst failure
    available to this surface because it looks like the editor lost the edit.
    Measured: one run across every stored site — a wordmark that carries a real,
    editable, *meaningless* colour underneath its gradient, which is exactly the
    row worth withdrawing.
  - *Lossy* is the same gradient seen from the other side: four stops and an
    angle, which one swatch can only flatten. Even a picker that painted
    something would be writing a projection back as the whole truth.
  - And the rule's *negative* half is load-bearing: the test is whether the write
    is observable and complete, **not** whether another parameter is present. A
    translucent layer over a fill shows the fill through it, and a scrim over a
    photograph tints the photograph rather than hiding it — so both keep their
    controls. Locking on the mere presence of a sibling parameter would withdraw
    working controls across the measured folds.
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
- **Why a refusal binds a change and not the status quo — and why that is a rule
  of the surface rather than of any one control.** A saved form carries
  every field the region exposed, not only the ones that were touched. A run the
  page was captured with at 160px would therefore be refused, or silently
  resized, merely because someone opened it to fix a typo. So a value equal to
  the one the region just reported passes whatever it is, and only a genuinely
  new value is measured against the range. Out-of-range is refused rather than
  clamped for the same family of reason the whole surface exists: quietly
  reshaping a page nobody edited is the worse failure, and it is invisible. The
  rule holds of every bounded control alike, of the colour check, and of the
  unavailability refusal — and it bites hardest in the last two. Images are the
  clearest bounded case: a fully-round picture is folded from a capture carrying a
  corner
  rounding far past anything the control offers, so without this it could not be
  opened and re-saved at all. Colour is the clearest membership case: every
  folded region holds a hex. And unavailability is the clearest of all — the one
  measured run whose colour is unavailable is a headline, and refusing its
  re-posted colour would have made its *words* uneditable, so an unavailable
  control would have frozen the whole region over one row.
- **Why absent is the default rather than the default being written in.** Turning
  italic off on a run that never declared a style, setting capitalisation back
  to none, returning a picture to dead centre or its saturation to unchanged,
  removes the parameter rather than writing the initial value into it.
  Writing it in would grow the definition on every save and turn an edit that
  changed nothing into a diff — and "a change map that changes nothing is
  reported as changing nothing" is what keeps the modal from putting a history in
  the draft that the operator never asked for. A colour reference obeys the same
  rule from the other direction: the shade and the opacity a resolver treats as
  absent are pruned before the write, so a picker that always sends its slider
  position writes the reference the document means rather than a fatter one that
  resolves the same.
- **One listing serves both pickers.** What a region can sit *in front of* and
  what a panel can sit *behind* are offered from the same enumeration of the
  site's images, so the two can never disagree about what the site has. A region
  with no picker at all — a run of copy — still costs no listing read, and
  conversely the font table is read only for the runs that consume it. The
  palette is the same idea over the site rather than the page: it is read once,
  from the site's own definition rather than the page's, because an entry is
  site-wide by construction and reading it per page is what would let two pages
  disagree about what an entry means.
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
- **A fill is offered on the panel, and so is the background — not on everything
  that can carry
  one.** A run of copy or an image region can carry a background parameter and a
  fill too,
  but exposing either there would turn the copy form into a paint surface and
  blur
  the map from the region the operator clicked to what they meant by clicking
  it. Both are offered on the region an operator clicks to mean "this panel". For
  a fill it would also be actively wrong: a folded run's box is glyph-tight, so
  filling it paints a tight rectangle behind the words rather than the background
  anyone means. That is why a run is instead *told which panel is behind it*, and
  told what that panel is filled with, read-only — the panel is already a region
  in its own right, so the capability exists and what was missing was a way to
  reach it. Innermost-wins addressing means clicking the words opens the run, and
  a container fully occluded by its own lone text run was measured on a real
  page, so "click just outside the words" is not always available.
- **Applying a value writes into the parameters the region already carries,
  rather than over them.** The change lands on the one parameter named and
  every other parameter on the region survives byte-identical — which is what
  makes "choosing a background disturbs nothing" true of the whole region and
  not merely of the asset store, and what makes the same claim true of a run's
  forty-odd parameters when one of them is retyped or recoloured.
- **The picker's choices ride the read call.** Asking a region what it exposes
  already returns the option list inside the image field's descriptor, so a
  chooser costs no extra round trip and cannot display options the write path
  would reject. The independently reachable asset listing exists for the asset
  store's own consumers, not for this surface. The weight list arrives the same
  way, from the document rather than from a listing, and so does the palette.
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
  capability, narrowed to images; the entries it offers for a colour come from the
  palette-management capability, which is also where an entry is added, renamed,
  recoloured or removed.
- **The browser gesture needed no change to accommodate images.** When image
  selection arrived, the in-page editor passed the descriptors straight through
  to its form widget and the widget already understood a closed-list field. This
  is recorded as evidence that the loop is genuinely region-kind-agnostic. What
  the gesture does with a descriptor since — including reading the images hint,
  deciding which control draws the field, drawing an unavailable field and
  showing its reason, offering the escalation to the panel behind a run, and how
  it lays the words and the
  parameters out — is that capability's business, not claimed as an acceptance
  criterion here. Colour is the one place a descriptor did *not* pass straight
  through: the form widget's own colour swatch is hex-valued and this one is a
  palette reference, so the gesture draws that row itself — which is the
  gesture's business too, and recorded here only because it is the first
  descriptor the widget could not answer for.
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
- **A framing control's resolution is the whole number it offers, and a value
  finer than that does not survive a re-save untouched.** Every framing control
  reports whole numbers, so a scale or an adjustment the AI set between two of
  them is reported at the nearer one, and a save that echoes the whole form back
  writes that nearer value and reports the field as changed. This is the one
  place the otherwise-general "a save that changes nothing changes nothing" rule
  is a claim about values the control can express rather than about all values.
  It is a deliberate consequence of offering whole numbers rather than free
  decimals, and its blast radius is a rounding, never a reshape — the alternative,
  suppressing the write when the rounded value matches, would silently discard a
  genuine edit made from the control. Colour is deliberately *not* like this: the
  position on an entry's range is continuous both in the definition and on the
  wire, so nothing is rounded and a colour that did not move is never a diff.
- **Known cosmetic defect, deliberately not fixed.** A saved edit rewrites the
  whole page document with different unicode escaping, so a one-word change
  produces a large diff. Pre-existing behaviour of the shared write helper;
  recorded in the intent as wanting its own ticket.
- **Editing inside a module's slot depends on the module declaring its seam.**
  Only the module knows which of its elements is the slot; a module that marks
  none yields addresses that cannot be scoped and therefore cannot be resolved.

## Dependencies

The image choices this surface offers come from the site asset store listing.
The colour choices come from the site's own palette, which the palette-management
capability owns; an absent or empty palette is a legitimate state and withdraws
nothing. The weights and the italic lock come from the page's own declared font
faces, which the page definition already carries. Whether a panel is a region at
all is asked of the renderer's own paint test. Everything else is independently
usable and independently provable through the command line alone — arguments in,
structured result and exit status out.

## Story Points

3