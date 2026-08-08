---
uid: story-d2b5cb1c
id: STORY-90
type: story
title: 'L1 interaction state, scroll motion and pointer accent: typed hover, focus,
  entrance and cursor-tracked axes with a renderer-owned safety floor'
created_by: xgd
created_at: '2026-08-06T02:02:27.445968+00:00'
updated_at: '2026-08-08T00:44:18.389843+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-e0143ffa
  uat_coverage: pass
---

## Story
**As a** visitor to a published site, **I want** the page's controls to respond
when I point at them or reach them with the keyboard, its sections to arrive as I
scroll to them, and its textures to answer the place my hand is, **so that** the
site feels alive and navigable rather than static — while never hiding content
from me, never losing my keyboard focus indicator, and always honouring my
request for reduced motion.

## Description
This story documents L1's vocabulary for **interaction state**,
**scroll-driven entrance motion** and **pointer-tracked accent** — the state
axis, the time axis and the pointer axis the substrate previously had none of.
Before this work L1 could express only static paint: no hover, no focus
treatment, no transition, no entrance, no notion of "has this scrolled into
view", no notion of where the reader's cursor is. Since the substrate became the
sole owner of appearance (behavior modules ship zero CSS), an interaction or
motion treatment L1 cannot express is one that cannot exist anywhere.

All three axes are the same shape of thing, which is why they live in one story:
the instance declares a **typed value bag**, the renderer alone knows what it
compiles to, and a single vetted site-independent script — carrying no instance
data — drives it, gated on a marker so the page fails *visible* when the script
cannot run.

**In scope — interaction state.** A node declares a *transition* (a duration
plus a closed timing-curve enum) and *hover* / *focus* state deltas. A state is
a delta bag of the same paint axes the base node already carries (the shared
surface group plus text colour and underline) plus a typed motion (x/y offset,
scale, rotation). The transition is declared on the interaction as a whole, not
inside a state, because a transition governs the *leave* as well as the enter;
nested in one state it would describe half the motion and make un-hovering
instant. Focus carries an additional *ring* — a focus indicator.

**In scope — entrance motion.** A node declares a *reveal*: the vertical offset
and the opacity it comes *from*, its duration, its timing curve and a delay. The
node settles at the geometry and opacity it already declares, so a reveal never
restates the design. A container declares a *stagger* interval that spaces its
revealing children by position; a child's own delay adds to its stagger share.

**In scope — pointer accent.** A node declares a *pointer accent*: a colour, how
far the region reaches from the cursor, how soft its edge is, and how rough its
outline is. The node's **own texture** — the repeating pattern it already paints,
or failing that its background image — is redrawn in the accent colour inside a
rough region centred on the reader's cursor. The accent is never a second design:
it is the same texture declaration with one colour substituted, so changing the
texture's spacing or angle moves the accent with it and the two can never drift
apart. A node that declares the accent but paints no texture emits nothing at
all, because there is nothing to redraw and a bloom of flat colour following the
mouse is not what was asked for.

Which side of the compositing pair the texture takes is decided by what the
texture *is*, not by an author dial: a typed pattern can be drawn in any colour,
so it paints and the region shapes it; an image asset carries only alpha the
renderer cannot recolour, so the asset shapes and the region paints — which also
lets a faint asset be brought up to full accent weight rather than being capped
by its own faintness. A texture authored fully transparent therefore paints
nothing at rest and exists **only** under the cursor; that behaviour falls out of
the construction rather than being a special case, but a real page depends on it,
so it is pinned in its own right.

**The three obligations this capability carries.**
1. *A focus indicator can never be authored away.* The vocabulary offers no way
   to say "no ring" (a ring's width is positive and has no `none` variant), and
   any focusable control that authors none is given one that inherits the node's
   own colour. This matters because the control emitter neutralises the user
   agent's own chrome — silence is what would actually strip the indicator.
2. *Motion fails visible.* The entrance pre-state is gated on a marker that is
   set only when motion is genuinely going to run. No scripting, no viewport
   observer, a thrown error, or a reduced-motion preference leaves the marker
   absent, the pre-state inert and the whole page settled. Hiding content in CSS
   and revealing it in script is how a scroll library turns a broken script into
   a blank page; this construction cannot do that.
3. *The accent fails visible and fails still.* Its marker is set only on a real
   pointer's first movement — not on load — so no scripting, a hoverless or
   coarse pointer, a reduced-motion preference, or a headless capture (which
   never moves a pointer) leaves the band painting exactly what it painted before
   the axis existed. **Every** declaration the axis adds waits behind that marker,
   including the stacking context the overlay needs, so the invariant has no
   exception to carve out. That is also what keeps the round-trip honest: the
   captured page is the unaccented page.

**Structured-only holds.** A pseudo-class is a *selector*, an entrance is an
*animation* and an accent overlay is a *pseudo-element*; no L1 document names any
of them. The instance declares typed value bags only — the renderer is the sole
pseudo-class sink, the sole animation sink and the sole pseudo-element sink, and
the only scripts on a page are fixed, site-independent ones carrying no instance
data. Every state object is closed, so a `selector` key, a `css` key, a raw
cubic-bezier or a `javascript:` URL in a hover-only background is rejected rather
than smuggled through.

**Out of scope.** Parallax, scroll-scrub and marquee remain behavior-module
territory (a different driver and a different contract). Entrance carries no
horizontal travel and no entry scale — only the axes a real page demanded. No
per-site motion or pointer script and no author-facing override of
reduced-motion exist. How many bumps make the accent's outline, and how hard the
accent asserts itself over a faint asset, are properties of the mechanism and are
not author-facing.

## Technical Context
- All three features are node-level axes carried uniformly by every node kind;
  the *uniformity* itself is documented by STORY-83's shared node-level axis-group
  criteria (this story documents what the axes mean and do). The pointer accent
  is a **sibling** of the texture axis rather than nested inside it, because the
  texture it accents may be either the typed pattern or a background image.
- The interaction and entrance features deliberately share one timing vocabulary
  rather than minting a second, and their transitions are merged into a single
  declaration set — emitted independently, whichever came second would silently
  cancel the first (a revealing button losing its hover feedback, invisible to
  either feature's own tests). A page that declares no entrance renders exactly as
  it did before motion existed; a page that declares no accent likewise.
- The safety envelope bounds the new surface: transition, entrance and stagger
  durations are range-bounded, ring width is bounded and positive, the accent's
  reach and feather are range-bounded lengths, its roughness is pinned to 0..1 by
  its own shape, and an interaction state's paint delta passes the same surface
  checks (hex-only colours, URL-scheme allowlist) as the base node's own axes.
- **Randomness placement is deliberate.** The accent's resting outline is
  produced by construction — fixed angles, fixed radii — so the emitted stylesheet
  is deterministic and two renders are byte-identical. The edge flicker that makes
  the region feel alive is genuinely random and lives entirely in the shared
  script, with its amplitude proportional to pointer speed; that is what lets
  "random while moving" and "stable while still" coexist rather than conflict, and
  why a still pointer schedules no frames at all.
- **Recorded from the intent's own dialogue, and corrected there.** The operator
  asked mid-implementation for two bands' visible grids to be *removed*; those
  bands now carry a fully transparent texture the accent redraws, so the grid
  exists only under the cursor. An initial claim that the overlay's stacking
  context moved ~5000 pixels on a resting band was **wrong** and was retracted on
  the intent: measured with entrance motion fully settled, a resting band is
  0 pixels different whether the stacking context is gated or not. The gating was
  kept for the exception-free invariant in obligation 3, not for a measured
  regression.
- **Known limitation recorded by the intent, not a defect in this story.** The
  hero's perspective grid is an image asset because L1 cannot yet express a
  perspective grid; that is why it needs the accent's asset branch and its
  weight-boosting at all. The architecturally clean fix is a typed
  perspective-grid primitive in L1, after which that band takes the pattern branch.
  Relatedly, the accent can only light lines that exist: over a band's blank fill
  it correctly does nothing, so a sparse decorative texture accents sparsely.
- **Known limitation recorded by the intent (interaction).** At the time the
  interaction capability landed, only a control bound to a behavior module was
  keyboard-focusable, so a plain painted call-to-action could respond to a pointer
  but not to a keyboard. The intent names this explicitly and places the fix
  outside this capability: it needs a navigation surface, which is the L1 link
  role documented separately. Regression should expect pointer-state ACs to hold
  for every kind and the focus-indicator floor to be asserted on focusable
  controls.
- **A defect found and fixed within the intent, now pinned.** The accent's
  visibility restore was originally folded into the one-time marker arming, so it
  ran exactly once per session: switching to another window and back left the
  accent faded out permanently. The two pieces of state are now distinct — the
  marker arming is irrevocable (it is what makes the page fail visible), the
  visibility is reversible — and the return after focus loss is an acceptance
  criterion rather than an implementation detail.
- Related: the vetted default look for a contact form authors both interaction
  states (a border that warms on hover, a ring in the form's own accent colour, a
  submit that lifts) — that preset belongs to the behavior-module/preset story,
  not to this one.

## Dependencies
- Plan item 1 — the shared L1 axis groups (interaction, reveal and pointer accent
  are node-level members of those groups).

## Story Points
3