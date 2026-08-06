---
uid: story-d2b5cb1c
id: STORY-90
type: story
title: 'L1 interaction state and scroll motion: typed hover, focus and entrance axes
  with a renderer-owned safety floor'
created_by: xgd
created_at: '2026-08-06T02:02:27.445968+00:00'
updated_at: '2026-08-06T02:02:27.445968+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-ae9d65d6
  story_kind: feature
  story_points: 3
---

## Story
**As a** visitor to a published site, **I want** the page's controls to respond
when I point at them or reach them with the keyboard, and its sections to arrive
as I scroll to them, **so that** the site feels alive and navigable rather than
static — while never hiding content from me, never losing my keyboard focus
indicator, and always honouring my request for reduced motion.

## Description
This story documents L1's vocabulary for **interaction state** and
**scroll-driven entrance motion** — the state axis and the time axis the
substrate previously had none of. Before this work L1 could express only static
paint: no hover, no focus treatment, no transition, no entrance, no notion of
"has this scrolled into view". Since the substrate became the sole owner of
appearance (behavior modules ship zero CSS), an interaction or motion treatment
L1 cannot express is one that cannot exist anywhere.

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

**The two obligations this capability carries.**
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

**Structured-only holds.** A pseudo-class is a *selector* and an entrance is an
*animation*; no L1 document names either. The instance declares typed value bags
only — the renderer is the sole pseudo-class sink and the sole animation sink,
and the only motion script on a page is a fixed, site-independent one carrying
no instance data. Every state object is closed, so a `selector` key, a `css`
key, a raw cubic-bezier or a `javascript:` URL in a hover-only background is
rejected rather than smuggled through.

**Out of scope.** Parallax, scroll-scrub and marquee remain behavior-module
territory (a different driver and a different contract). Entrance carries no
horizontal travel and no entry scale — only the axes a real page demanded. No
per-site motion script and no author-facing override of reduced-motion exist.

## Technical Context
- Both features are node-level axes carried uniformly by every node kind; the
  *uniformity* itself is documented by STORY-83's shared node-level axis-group
  criteria (this story documents what the two axes mean and do).
- The two features deliberately share one timing vocabulary rather than minting
  a second, and their transitions are merged into a single declaration set —
  emitted independently, whichever came second would silently cancel the first
  (a revealing button losing its hover feedback, invisible to either feature's
  own tests). A page that declares no entrance renders exactly as it did before
  motion existed.
- The safety envelope bounds the new surface: transition, entrance and stagger
  durations are range-bounded, ring width is bounded and positive, and an
  interaction state's paint delta passes the same surface checks (hex-only
  colours, URL-scheme allowlist) as the base node's own axes.
- **Known limitation recorded by the intent, not a defect in this story.** At
  the time this capability landed, only a control bound to a behavior module was
  keyboard-focusable, so a plain painted call-to-action could respond to a
  pointer but not to a keyboard. The intent names this explicitly and places the
  fix outside this capability: it needs a navigation surface, which is the L1
  link role documented separately (plan item 7). Regression should expect
  pointer-state ACs to hold for every kind and the focus-indicator floor to be
  asserted on focusable controls.
- Related: the vetted default look for a contact form authors both states (a
  border that warms on hover, a ring in the form's own accent colour, a submit
  that lifts) — that preset belongs to the behavior-module/preset story, not to
  this one.

## Dependencies
- Plan item 1 — the shared L1 axis groups (interaction and reveal are node-level
  members of those groups).

## Story Points
3
