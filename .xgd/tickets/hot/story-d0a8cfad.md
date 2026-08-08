---
uid: story-d0a8cfad
id: STORY-83
type: story
title: L1 layout substrate rendered safe by construction
created_by: xgd
created_at: '2026-07-22T19:31:28.526898+00:00'
updated_at: '2026-08-08T00:44:15.691085+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  uat_coverage: fail
  updated_by: bundle-15c1f647
---

## Story
**As a** site owner, **I want** my site's layout defined as validated structured
data that only ever reaches the browser through a single safe emitter, **so
that** my published site is faithful to its intended design, renders equivalently
across every browser, and can never be broken or hijacked by malformed or
malicious content.

## Description
This story documents the **L1 layout substrate** — the one low-level,
CSS-faithful layout representation introduced by the framework pivot (REQ-79) to
replace the former semantic layout modules. A site's layout is a typed element
tree: `box`, `text`, `image`, `slot` and `control` leaves plus
`stack | row | grid` containers. Each node carries typed literals or closed enums
— never a freeform CSS/HTML/JS string. Responsive layout is expressed as
**per-viewport geometry keyframes** with a per-segment `interpolate | snap` flag;
per-axis sizing (`fixed | fluid | hug`), distribution, alignment, and
viewport-range visibility are the structure primitives that capture leaves empty
and an author recovers. The `slot` leaf is the Phase-D seam: it carries a required
name and an optional **`behavior`** field naming the behavior module intended to
mount there.

### Language power — a typed axis for every pixel-mover
The axis vocabulary has grown to cover every captured **pixel-mover** the
substrate previously had no way to express (the DOC-27 rule: an axis earns its
place iff it moves a pixel).

**The vocabulary is shared, not parcelled out per node kind.** It was once a
table of which kind was permitted which axis — `box` painted but did not lay out,
`container` laid out but did not paint, `slot` carried neither, and each new kind
re-litigated the question by hand. Two groups are now carried, with the identical
shape, by every kind that renders a box (`box`, `container`, `text`, `image`,
`slot`, and the `control` leaf):

| Group | Axes |
|---|---|
| **surface (paint)** | solid fill, surface gradient (linear or radial), repeating texture pattern, background image (scheme-checked), translucent scrim overlay, uniform border, left-accent border, corner radius, drop shadow, backdrop blur, opacity, blend mode |
| **node-level** | per-width geometry, sizing, viewport-range visibility, transform, mask, padding, per-width padding, interaction state, scroll reveal |

A kind declares only what is genuinely its own: a run adds its type axes
(gradient fill painting the glyphs, decoration line, glyph shadow, small-caps,
list marker), an image adds `object-fit`, a container adds its layout, a slot its
seam name, a control the name of the module element it paints. Three consequences
follow directly:

- **A painted, internally laid-out element is ONE node**, not a painted box
  wrapped around a laying-out container.
- **A text run declares its own measure** — the max line length that is the most
  fundamental control in typography — with no wrapper container whose only
  purpose is to carry a `max-width`.
- **A mounted behavior module is sized through its slot**, so a seam can be
  measured as well as painted.

### The control leaf — the seam where L1 wraps the module
A `slot` is the module rendering its chrome *around* an L1 subtree, which works
only when the behavioural element is a container. It is structurally unreachable
for a **leaf**: an `<input>` is a void element and a `<textarea>`'s content is its
value, so no L1 subtree can go inside one. Under the slot model alone a behavior
module therefore *had* to paint its own controls, and no validator could catch it
— the language had no vocabulary for "this element's look belongs to L1", which
is precisely the hole a zero-CSS module contract cannot tolerate.

The `control` leaf is that vocabulary. It names one element the mounted behavior
declared and carries the same paint and node-level axis bags a text run does, and
the sole emitter renders **the module's element with L1's class, geometry and
every paint axis** while the module contributes only its attribute bundle. Three
emitter obligations make the inversion safe rather than merely possible:

- **A zero-look baseline.** A form control arrives with user-agent chrome —
  border, fill, padding, its own font and colour — that paints *through* an L1
  subtree which simply declined to set those axes. The emitter neutralises it once,
  ahead of the authored axes (so any axis the instance did author still wins),
  rather than every module carrying a reset stylesheet.
- **The placeholder follows the authored colour.** A placeholder is painted by a
  pseudo-element that does not inherit `color`, so a placeholder-labelled field
  would keep the browser's grey inside the box; the emitter re-points it at the
  element's own colour.
- **An unbound name renders nothing.** A control naming an element no mounted
  module declares emits no element at all — the isolation-correct degradation,
  since a bare `<input>` would paint UA chrome and collect a field nothing submits.

The inversion moves presentation and nothing else: the emitter escapes every
attribute value and refuses `class`, `style` and `on*` attribute names outright,
whoever declared them, so there is no freeform route back to raw CSS or to a
script sink, and the behavioural attributes (`type` / `name` / `required`, the
label association, the endpoint) stay module-authored.

Each non-scalar family is carried as a **typed structured form** — a gradient is
either linear (an angle plus hex stops) or radial (a typed origin drawn from the
nine box positions plus an extent keyword, never an `at 30% 40%` string), and the
two branches do not mix; a texture is a named shape (dot grid, hairline grid,
rules) plus a tile period, a line width, a hex colour and a tilt; a shadow is
offsets/blur/spread/hex colour/inset; a border is width/hex colour/line style; a
mask is a named shape plus a feather width; a transform is rotation and scale; a
scrim is a hex colour plus opacity.
The renderer re-derives the CSS from those numeric, enum, and hex fields, so a
structured axis is never a passthrough style string, and an identity or no-op
value (unit transform, `normal` blend, `none` decoration/marker) is omitted
rather than emitted.

**Texture is drawn, not fetched.** The repeating-surface family — the dot grid,
the hairline grid, the rule set that separates a premium page from a flat one —
is compiled by the renderer into repeating gradient layers, so it costs no binary
asset, distorts at no viewport, and puts no design decision back into a
hand-authored file. A node's background composites as an ordered layer stack,
top-most first: **scrim → texture → gradient wash → image → solid fill**. Because
a tiled texture and a `cover` backdrop want different sizing, the sizing triple is
emitted **per layer** whenever a texture is present, and stays the single value it
always was when none is — so an untextured surface renders byte-for-byte as
before.

### Language form — handles bound to substance
L1 also carries a **document-level resource table** that closes the *form* hole
in the language: a leaf's `fontFamily` axis is only a **handle** (a name), and
without something binding it to the **substance** that determines its glyphs —
a served font asset — a named face paints as a generic serif fallback. The table
binds `family → served src` (with optional weight and style), and the renderer
emits one `@font-face` rule per entry through the same sole safe sink, ahead of
the rules that reference the family. Images need no entry: an image leaf already
carries its own source.

### Page colour is the document's, and there is exactly one colour system
The substrate carries the **page-level** colours as fields of the L1 document
itself: a `background` and an inherited **text colour**, both validated as
ordinary colour axes and both emitted by the sole emitter as body-level rules.
Every text leaf paints its own colour, so the document's is the floor a leaf that
declares none falls back to — a leaf declaring no colour emits no colour
declaration at all and inherits.

Their previous home was the **theme token palette** — a closed 15-role colour
group emitted as `--color-*` custom properties, with the page bound to
`--color-bg` / `--color-text` by a stylesheet rule outside L1. That group is
**deleted, not deprecated**: a closed role set that never reached L1 alongside
L1's own palette model would be two colour systems, which is the legacy-mode
state the project forbids. Deleted with it are the second closed colour-role
vocabulary a *layer* treatment could name for its border and its text, the
scheme-conditioned dark-mode override that existed only to re-declare those
roles, and the module-side resolvers that turned a role name into
`var(--color-<role>)` in a callout bar, a text run and a gradient stop.

The observable guarantee is a **negative one, asserted rather than assumed**: no
stylesheet the renderer emits — the theme stylesheet, the document's own L1 CSS,
or the CSS a behavior module ships — declares or references a colour custom
property, and no site definition carries a theme palette. A module colour is a
hex literal and nothing else; a value that is not one is dropped rather than
emitted, so the sink stays fail-closed.

The cut is **the colour group only**. Typography, spacing, radius, shadow,
container and breakpoint tokens are a different axis family with no replacement
here: they validate and emit exactly as before.

### A captured width is a floor once the words can change
Geometry is captured from a reference page, so a keyframe's width is what the
**reference text** measured. That is exact while the text is the reference text
and silently destructive the moment anyone edits it: a longer string overflows a
box pinned to the old string. Where a display run is painted the way display
headings usually are — a gradient clipped to the glyphs, with the run's own
colour transparent — the overflow is not clipped, not ellipsised and not
spilling. It falls outside the painting area and the run's own colour paints
nothing, so it is never drawn at all: an edit that landed correctly in the
definition and in the rendered bytes reads on the page as an edit that failed.

So a **text-like run that cannot wrap** hands its captured width over as a
**floor** rather than a cap — the box keeps the captured geometry as its minimum
and grows with its content, and the painting area grows with it. A `control` leaf
is a text leaf on the same axes and qualifies on the same terms.

The relaxation is **gated in two directions**. A run that still wraps at a given
width keeps its hard width there, because that width is what decides its line
breaks — relaxing it would let an absolutely-positioned run stretch to its
shrink-to-fit width and reflow every line — so the floor begins at and above the
width from which the reference stopped wrapping, and nowhere below it. And a
**container never relaxes at all**: a box's width is structure, sizing its
children and bounding its background.

The rungs of a geometry ladder are **cumulative overrides of one property**: the
rule fitted to the smallest segment stays in force at the largest and is merely
overridden above it. A rung that relaxes to a floor therefore also **resets the
fixed width on that same rung** — without the reset the upper rungs stop
overriding anything, and the lowest rung's interpolation stays live far outside
the segment it was fitted to, sizing a run by a line fitted for a phone at
desktop widths.

The whole change is **pixel-neutral for text that has not been edited**: the
floor's value is the captured width, so a page rendered from its reference
content lays out identically at every width on the ladder.

### Where the output lands — a relocatable snapshot
The emitter also decides, at every place a URL reaches the browser, **what a
root-relative reference becomes**. A site keeps *authoring* its assets
root-relatively (`/assets/…`), but what is emitted is **document-relative**:
relative to the snapshot the page sits in rather than to a serving host's root. One
rule governs all three sinks — the `url()` values in the stylesheet (fonts,
background images, texture masks), an image's source, and a link's target — and it
runs *after* each sink's safety check, so it reshapes an already-vetted value and
can never admit one.

The consequence is that a rendered snapshot is **relocatable**: the same bytes
serve correctly from a host root and from any path prefix, so the serving location
is not baked into the artifact and the renderer needs no base-path or host
configuration. Only a root-relative reference changes: absolute URLs, a
protocol-relative remote host, a bare fragment and an already-relative value all
emerge byte-identical, and no emitted reference ever reintroduces a leading slash.

Two remainders stop reading as relative *path* references once the slash is
dropped, and both keep their base by being emitted as explicitly relative paths: a
reference with an **empty first segment** (`/#how`, `/?q=1`, bare `/`), which would
otherwise resolve against the current page instead of the snapshot root; and one
whose **first segment carries a colon** (`/javascript:…`), which would otherwise be
read as a URL scheme and hand back the live scheme the safety check had cleared
only because the leading slash made it relative.

All of this rests on every page sitting **flat at the snapshot root** — a page one
directory down would resolve every reference it carries against its own
subdirectory. Rendering therefore fails loudly, before writing anything, on a nested
page slug, naming the invariant rather than emitting a page whose every reference is
silently wrong.

### The safety envelope
The substrate's value is a **safety envelope by construction** — security,
robustness, and cross-browser fidelity, not aesthetic constraint. Two layers
enforce it:
- an **envelope validator** that accepts only documents whose axes are typed and
  in-range, whose objects carry no unknown keys, whose colours are hex, whose
  image sources pass a URL-scheme allowlist, and whose tree respects depth and
  node-count caps; and
- a **single safe renderer** — the only path from an L1 tree to HTML/CSS — that
  re-checks and neutralises every value at emit time (escaped text, re-validated
  hex colours, sanitised font-family, numeric lengths, unsafe image sources
  dropped) and compiles geometry keyframes to media-queried CSS.

Both layers grew with the vocabulary rather than beside it: the envelope bounds
the structured effect lengths and the transform scale, requires hex stops and
border colours, runs a background image **and every font-face source** through
the same URL allowlist as an image source, bounds a declared font weight to the
CSS range, and — because every structured form is closed — refuses an unknown key
rather than ignoring it. Because the surface group is shared, **the envelope
bounds it once for every kind**: a background-image URL is scheme-checked, a
left-accent border's width is bounded, and a texture's tile period and line width
are bounded wherever they are declared, rather than only on the kinds that were
checked by hand. The texture's period carries a **floor** as well as a ceiling —
a sub-pixel period tiles a full-bleed band millions of times, which is a way to
hang a compositor rather than a matter of taste — and because the check is shared,
an interaction-state texture delta is bounded by the identical rule as the base
node. The renderer drops a non-hex colour,
an off-allowlist URL, and an unsanitisable font name instead of emitting them, so
no raw CSS escapes the sink through any of the new families.

**The envelope holds the authoring path, not only the reproduction path.** It is
not a stage of the capture pipeline: it runs wherever a site definition is
validated, so every page carrying an L1 body clears it — a body folded from a
capture and a body typed into a definition file by a person or an AI meet the
identical bounds. That matters most for the classes with **no second line of
defence at all**: an out-of-range numeric axis, a node count past the cap, a
duplicate node id and a geometry track anchored to a column the document never
declares are invisible to the emitter, which renders them without complaint. A
violation is reported against the page that carries it, so the error names the
offending node in the file being edited rather than a detached document-local
path, and because one validation stands behind every consuming operation, the
same answer is given whether the site is rendered, published, edited or
imported. The renderer keeps its **own independent** neutralisation at every URL
sink regardless — this is a line of defence added, never one replaced.

A **round-trip identity gate** wired to the existing capture/values-diff spine
measures `capture(render(L1)) ≈ L1` on the authored (literal) axes, and a
cross-browser check confirms equivalent layout across the three engines.

**In scope**: the typed L1 shape (including the shared axis groups, the `control`
leaf, the document resource table, and the document's page-level background and
text colour), the envelope validator **and its
enforcement on every validated site definition, authored or reproduced**, the
safe renderer
(including geometry keyframe compilation, `@font-face` emission, the control
emitter's zero-look baseline / inert degradation / attribute refusal, and
relocatable document-relative URL emission with its flat-snapshot invariant), the
one-colour-system guarantee over everything the renderer emits, and
the round-trip / cross-browser fidelity guarantees.

**Out of scope**: mechanically folding a multi-viewport capture into an L1
document — including *populating* the new axes and the resource table from a
capture, and folding a captured form control into a `control` node (REQ-83 /
REQ-92 / REQ-96's reproduction half, a separate story); the behavior-module
*contract* that declares which control elements exist, which are invariant, and
what a valid binding is (REQ-85 / REQ-96, STORY-85); and the end-to-end 3-probe
reproduction gate (REQ-86, a separate story); the **colour value model** itself —
what forms a colour axis admits, the site palette's shape, reference resolution
and dangling-reference rejection (REQ-114, STORY-80), of which this story carries
only the page-level document fields and the absence of any second colour system;
and the census/retrofit tooling that converts an existing site's literals to
palette references (REQ-114's `1c colors`, a separate story). In L1, a `slot` renders as an
inert labelled placeholder — a `div` carrying its slot name and, when declared,
its target behavior-module id, with no module code and no behaviour attached.

## Technical Context
- L1 is the substrate on which the platform's structured-only security boundary
  rests (Security Policy §1–2, DOC-2/DOC-7): the validator is the schema+envelope
  layer and the renderer is the sole emitter (defence in depth).
- The absolute-or-overlay value affordance, per-viewport variation, and module
  reproduction treatments formerly delivered by layout-module dials are re-homed
  in L1 leaf axes and geometry keyframes — tracked as supersessions in the
  STORY-80 / STORY-81 / STORY-82 upgrades in this same reconciliation.
- The round-trip gate reuses the capture + values-diff pipeline (CAP-63); this
  story adds the L1 render→capture wiring, not new diff axes.
- The nowrap width floor was reached through the copy-editing work (REQ-117)
  rather than declared by this story's own intent: an operator's rename was
  invisible on the rendered page and the cause lay in geometry emission. It is
  documented here because the behaviour is renderer-side and observable on
  rendered output. Its evidence covers the emission, the wrap-threshold gate and
  the per-rung reset over folded documents; that the relaxation never reaches a
  **container** is covered by a hand-authored document — no fold fixture cheap
  enough to build there produces a container carrying captured geometry — in
  which a geometry-tracked container wraps a floored run, and the container
  keeps a fixed width at every rung while the run inside it floors. Two
  independent layers are asserted there: the emitter reads the axis only for
  `text` / `control`, and the `.strict()` surface group refuses `nowrapFromPx`
  on a container as an unknown key, so a container cannot even reach the
  relaxation.
- The implementation matches the intent closely; no divergence between the
  REQ-82 spec and the code was found. Browser-dependent acceptance (round-trip,
  cross-browser) is proven with a real engine and skips cleanly where engines
  are unavailable, while the validator/emitter behaviours are engine-free.
- **REQ-87 slot-seam rename.** The slot leaf's optional module-id field was
  named `capability` until REQ-87 renamed the runtime module type to *behavior
  module*, freeing "capability" to mean only the XGD capability matrix. The
  field is now `behavior` and the emitted attribute is `data-l1-behavior`. The
  operator decided this explicitly (REQ-87 dialogue: pre-launch, no live site
  data, keeps the L1 schema consistent with the renamed type), and REQ-87
  forbids a back-compat alias. Because the slot object is `.strict()`, the
  consequence is stronger than a deprecation: a document authored with the
  legacy key is now *rejected* by the envelope as an unknown key — recorded in
  AC-686. Nothing about the typed-tree, envelope, round-trip, or cross-browser
  obligations changed; only the field's name.
- AC-723 pins the emitted `data-l1-slot` and `data-l1-behavior` attributes as an
  obligation of the L1 emitter itself, asserted directly by this story's
  reconciliation UATs rather than left to the incidental coverage they had in the
  CAP-72 / generate tests.
- **REQ-96 — the `control` leaf is L1's half of a two-directional contract.**
  The intent's argument is that a module which must paint its own leaf controls
  can never be layout-agnostic *by construction*, only by discipline — and
  discipline is not something a contract can enforce. The division of ownership is
  deliberate and narrow: L1 contributes class, geometry and paint and **only**
  those, so the safety envelope does not degrade from "guaranteed by construction"
  to "hopefully validated". The emitter is where the guarantee is constructed
  rather than assumed, which is why the attribute refusal (`class` / `style` /
  `on*`) is defence in depth over framework-authored modules. The module side of
  the seam — which elements are declared, which are required, which are
  obligation-pinned invariants, and how a binding is validated — is STORY-85's.
- **REQ-91 / REQ-90 — language power and form.** The two extensions were
  deliberately sequenced *before* the folder rebuild (REQ-88's "language first,
  then rebuild the folder once"): the folder is only worth rebuilding against a
  completed language. Both were **co-designed against real captures** rather than
  invented — the gigabytealchemy gold→orange wordmark gradient, its `#00d492`
  accent bar and panel gradient, a joyful drop shadow, a faelan hero scrim, and a
  joyful Oswald webfont were folded through the new axes as the design check and
  reused verbatim as test fixtures.
- **Where the new capability stops at this story's boundary.** Populating the new
  axes and the resource table *from a capture* is the folder's job and is
  documented on the capture→L1 fold story, not here. At the time REQ-91 landed
  the fold carried only the cleanly-structured text families; the box/image
  effect families and the resource table were folded in by the folder rebuild.
  This story's obligation is that the language accepts, bounds, and safely emits
  them — not that any particular capture produces them.
- **No raw-CSS escape hatch was added.** Every new family is a typed scalar,
  closed enum, hex colour, or closed structured object; the corresponding CSS is
  re-derived at emit time. This is the DOC-7 §6.3 rule in practice: when a design
  could not be expressed, a typed primitive was added to L1 rather than a
  passthrough style string opened.
- **REQ-98 / REQ-97 / REQ-105 — the axis groups became shared (this
  reconciliation).** The three intents state one argument and are documented as
  one capability: since REQ-96 made L1 the sole owner of appearance and a
  behavior module ships zero CSS, *an axis L1 cannot carry on the node that needs
  it is an axis a module must paint* — so a per-kind axis table is a hole in the
  REQ-96 contract, not an ergonomics complaint. The surface group and the
  node-level groups are each declared once and spread into every kind, so a kind
  added later inherits them rather than re-deriving its slice. The change is
  strictly additive: capture never populates these fields on the kinds that
  gained them, and the gigabytealchemy and joyful reproductions render unchanged.
- **Why the asymmetry existed.** It was an artefact of which face was exercised
  first, not a decision: capture folds text as absolutely positioned with a
  geometry track, so the *transcription* face never needed a measure on a run or
  a size on a seam. The *authoring* face does — both gaps were found while
  authoring a real page (REQ-95), each having cost a wrapper node that carries no
  content, no paint and no semantic role.
- **The analytic layout gate mirrors sizing for every kind, by necessity.** A
  text leaf's height is a function of its width, so a run declaring a measure
  wraps to more lines than its frame alone predicts; a gate that ignored the
  measure would report phantom drift against the browser. Making the narrowing
  generic rather than text-only also closes a pre-existing mirror gap — a wrapper
  container's `max-width` was previously invisible to the gate, so the wrapper
  form and the direct form did not evaluate identically. Recorded in AC-803.
- **`height` on a text run is admitted, not forbidden** (a design decision the
  intent left open): the shared sizing shape is accepted whole rather than a
  width-only variant minted for one kind, and the schema documents that a run's
  height is naturally from flow. Correspondingly, **no envelope change was made
  for sizing** — sizing is unbounded for every kind alike, so a run is consistent
  with the rest rather than a special case.
- **REQ-103 — texture is a typed axis, not an asset (this reconciliation).** The
  substrate could paint only flat colour or one *linear* gradient, and a
  background image was pinned to `cover`/`no-repeat` (BUG-13), so a 24×24 dot-grid
  could not tile. The only workaround was a full-bleed raster per section, which
  distorts at every unauthored viewport, costs a binary, and pushes the design
  decision out of L1 — precisely what the substrate exists to prevent (DOC-23,
  DOC-24). The intent chose the typed `pattern` axis plus the radial gradient
  branch, and explicitly **rejected** a `backgroundRepeat`/`backgroundSizePx` pair:
  that route re-opens BUG-13's default *and* still needs a real asset per texture.
  Linear-by-default is likewise a decision, not a shim — linear is the shape a
  capture folds to, so a discriminator every folded gradient would have to restate
  is noise on the common case; the fold is typed to the linear branch.
- **REQ-103 residual — the warped grid stays an asset.** The intent's framing
  ("the brand's defining graphic cannot be drawn by the substrate") is only partly
  answered: xgd.dev's hero and echo grids are a *perspective projection* with a
  fade mask, and a repeating gradient tiles a constant cell by construction. This
  axis reaches the motif at rest, not the motif in perspective; whether a
  projected/warped primitive is warranted is a separate design question, not a gap
  in this axis. Grain/noise remains out of scope for the original reason — it needs
  a generated asset, not an axis. Site-content use of the axis (the two cream
  bands on xgd.dev) is site definition data, not capability surface, and no
  criterion here is written against it.
- **Deliberately not in scope: merging `box` into `container`.** Once a container
  can paint, `box` is a strict subset of it, which by the project's
  no-duplicate-mechanisms rule argues for a merge. The intent explicitly defers
  it — the merge touches the fold, the renderer and both passing reproductions,
  and the evidence does not yet justify the risk.
- **Site content edited outside the commits.** REQ-97 and REQ-105 both record
  that `storage/sites/xgd/**` was collapsed in the working tree to prove the
  wrapper nodes were removable, but deliberately not committed under those
  tickets (it belongs to REQ-95's session). Site definition data is not
  capability surface; no criterion here is written against that site's content.
- **REQ-107 — the envelope was wired to the authoring path (this
  reconciliation).** The envelope validator had exactly two callers, both on the
  reproduction path (the fold and the layout probe), so an authored page cleared
  only the shape check. The intent's argument is that this was backwards: a
  reproduced document derives its values mechanically from a capture, while the
  authoring path is the one with a human or an AI free-typing numbers and URLs
  into a JSON file. It was observed rather than theorised — seven passes of
  authored xgd.dev documents bypassed the envelope entirely, and when REQ-106
  added the unique-id rule an authored page with two nodes claiming `signup`
  rendered without complaint; the rule existed and never fired, and was caught by
  reading emitted HTML, which is not a control. This is **not** a security hole
  closed: the renderer independently re-checks and degrades at every URL sink, and
  the intent is explicit that defence-in-depth is the argument for *keeping* that
  check, not for skipping the validator. The classes with no second line of
  defence at all — an out-of-range axis, a node-count blowout, a duplicate id, a
  dangling geometry anchor — are what the wiring actually buys, along with the
  envelope's error messages finally reaching the caller written to consume them
  (DOC-8 §6).
- **REQ-107 triage — no document was fixed and no bound relaxed.** The intent
  named the triage as the real work (turning an unenforced check on will fail
  documents that were out of envelope all along) and forbade resolving any
  failure by weakening the check. In the event every `storage/sites/**` document
  and every hand-written test fixture was already inside the envelope, so intent
  criteria 4 and 5 were satisfied vacuously rather than by change. The standing
  control that the committed corpus stays in envelope is carried as a test over
  `storage/sites/**` rather than as a criterion here: it asserts a property of
  this repository's content, not of the substrate's behaviour, and site
  definition data is not capability surface.

- **REQ-109 / BUG-30 — relocatable emission (this reconciliation).** The intent
  is a hosting one stated as an artifact property: root-absolute `/assets/…`
  references 404 the moment a snapshot is served under a path prefix, and
  `<base href>` is not a fix because it does not reach `url()` inside CSS, which
  is exactly where the fonts and grid images live. Relocatability is also the
  precondition for the immutable content-addressed snapshot model (DOC-12) —
  with the serving URL baked in, promoting a draft to published would need a
  re-render rather than a pointer flip. The intent's declared boundary was
  explicit and was held: **no change to the authored L1 schema, no change to any
  site definition, and no base-path or host configuration on the renderer**.
  BUG-30 then found the rewrite carrying two cases where dropping the slash
  changes *meaning* rather than shape. Its fragment case was the reported
  symptom; the colon case was found while answering the ticket's own request to
  check the rest of the sink, and is a **security** finding rather than a
  cosmetic one — `isSafeUrl` clears `/javascript:…` *because* the leading slash
  makes it relative, so an unconditional strip handed back the live scheme it had
  just refused. Both are recorded here, under this story's
  independent-lines-of-defence claim (AC-851), rather than on the navigation
  story: the emitter re-admitting a value its own sink declined is an emitter
  obligation, and one rule guards all three sinks.
- **The flat-snapshot invariant became reachable.** Every argument about
  resolving against a snapshot directory breaks at once if a page sits below the
  root, and that condition was unreachable until a real site grew a second page.
  The assertion in the site renderer is the guard, and BUG-30's evidence pins
  that it still fires, and fires before anything is written.
- **Re-baselined expectations, not weakened ones.** Because emitted bytes
  changed shape, nine expectations across eight existing suites were updated to
  the new URL form. Each still pins the same behaviour it pinned before
  (safe-only sink, font-face binding, layer order, anchor retagging,
  self-contained reproduction); only the URL's shape moved. No criterion in this
  story was relaxed as a consequence.
- **Gate verification carried forward from the intent.** The analytic 3-probe
  gate is evaluated over the L1 *document*, never over emitted URLs, so it does
  not see the change; capture resolves `url()` values to absolute URLs in the
  browser and the local preview server mounts a snapshot at its root, where the
  two URL shapes resolve identically. The intent records that a full reproduction
  gate re-run against `gigabytealchemy` was **not** possible in session (its
  in-repo reference bundle predates multi-state capture); rendering and shooting
  the site with every face loaded and every grid painting was the evidence taken
  instead. That gap is the intent's, carried here unresolved rather than papered
  over.
- **REQ-108 re-scoped one texture invariant (AC-831).** REQ-103's shipped-page
  `background-size` scan read every rule in the stylesheet. The pointer accent
  paints a renderer-owned overlay that legitimately carries a stack of region
  layers, so the scan started failing pages that declare no texture at all — the
  opposite of what the invariant protects. The claim was always about a node's
  **authored surface**, and is now scoped to say so. This narrows an assertion's
  reach, not the substrate's behaviour: no untextured authored surface may emit a
  multi-valued sizing triple, exactly as before.
- **REQ-114 — the token colour palette was retired and page colour re-homed on
  the document (this reconciliation).** The intent's argument is the project's
  own no-legacy-modes rule applied to colour: L1's palette model and a closed
  15-slot theme colour group cannot both survive, because two colour systems is
  exactly the state the rule forbids. The intent named each retirement target by
  file and line and required each to be *cut*, not stubbed — so this is a
  deletion documented as a guarantee, not a deprecation with a grace period. The
  ticket's own words: "Delete it and everything that exists only to serve it."
- **Why the guarantee is stated as a negative, and stated here.** "No colour
  custom property is emitted or referenced" is a property of the whole rendered
  output — cheap to satisfy once and easy to reintroduce silently, which is why
  it is a criterion rather than the ticket's one-off grep. It lives on this story
  because this is where page emission and the sole safe emitter live: the
  criterion is about what a rendered page may contain, which is this substrate's
  question. The colour *value model* it depends on is STORY-80's.
- **The deleted palette had no surviving criterion of its own.** Its delivery was
  already superseded by the REQ-79 pivot, and an AC sweep for palette / token /
  colour-role across the matrix found nothing asserting it. So nothing was
  removed in this upgrade — what was missing was the positive statement of the
  post-cut state, which the four added criteria now carry.
- **The dark-mode override was confirmed callerless before deletion, not
  ported.** It existed only to re-declare palette roles under
  `prefers-color-scheme: dark`; the intent is explicit that if dark mode is
  wanted later it is designed against the palette model rather than resurrected
  from the closed token set. The emitted stylesheet consequently carries no
  scheme-conditioned colour block at all.
- **What the module-side cut actually changed.** Deleting the colour-role
  resolvers narrowed a module colour from "a hex literal *or* one of fifteen role
  aliases" to a hex literal alone: content validation now rejects a role name,
  and the renderer drops a non-literal rather than emitting it (a gradient stop
  that is not a literal drops the whole gradient rather than painting a colour
  the author never chose). The callout bar, whose per-role rules were the last
  `--color-*` consumers outside the token palette, paints `currentColor`; the
  callout marker vocabulary survives as a closed *emphasis* set rather than a
  colour one. This is inside REQ-114 §4's declared scope, which named these three
  files as retirement targets.
- **Two footprint facts worth recording.** (1) A *revision* snapshot under
  `storage/sites/*/revisions/**` still carries a `theme.palette`, and correctly
  so: a published revision is immutable, and the criterion is written against
  what a site *declares* — the four drafts — not against frozen history. (2) The
  no-colour-custom-property claim is about **stylesheets the renderer emits**. A
  site's own mirrored assets may contain a captured third-party stylesheet that
  declares `--color-*` of its own (gigabytealchemy's imported blog CSS does);
  that is site content, not capability surface, and no criterion here is written
  against it.
- **Two of the four sites carry no palette, and that is the model working.**
  `1stcontact` and `harbor-cafe` hold pre-L1 module pages with no L1 colour axes,
  so dropping `theme.palette` left them with no palette at all — which validates,
  because a literal hex is always a valid colour and the palette is optional.

## Dependencies
None (this is the foundational substrate; plan items 2, 3, 4, 6, 7, 8 depend on it).

## Story Points
3

## Merged from STORY-81 (overlap cluster 2 resolution)
The reconciliation `upgrade` story STORY-81 ("Responsive dials …", CAP-68, now
archived) recorded that the former **per-breakpoint module length dials**
(`{ base, sm?, md?, lg?, xl? }`) and the header `navCollapse` dial were deleted by
the REQ-79 pivot. Their responsive-across-widths intent is re-homed here: per-viewport
variation is carried by this substrate's geometry keyframes (interpolate|snap).
`navCollapse` was removed with no L1 successor. STORY-81's sole AC (AC-717) was a
behavioural duplicate of AC-684 and was reassigned here; the AC-level dedup pass
(per REPORT-795) has since collapsed AC-717 into AC-684 — AC-717 is archived, its
provenance note folded into AC-684, and its duplicate test file
(tests/reconciliation-responsive-keyframes.test.ts) retired. That behaviour remains
covered by tests/reconciliation-l1-substrate.test.ts.