---
uid: story-02f21b8a
id: STORY-88
type: story
title: A reproduced page is its L1 layout plus the behaviours mounted into it, each
  bound to a named seam
created_by: xgd
created_at: '2026-08-03T03:19:56.678668+00:00'
updated_at: '2026-08-03T03:33:05.783303+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-4ff83a8b
  capability_uid: capability-68df54bd
  story_kind: feature
  story_points: 3
---

## Story

**As a** site-reproduction operator, **I want** a page to be able to carry both a
full L1 layout and the behaviours that layout contains — each behaviour mounted
at the seam the reference gave it — **so that** a captured page that is 100%
layout plus one working form reproduces as a whole page, with its controls real
and usable, instead of stranding every behavioural element as something the
reproduction can never render.

## Description

A real captured marketing page is layout plus behaviour. Until this capability
existed, a page had to be *either* a stack of behavior modules *or* a single L1
document — never both — so the behavioural half of every reproduction (four form
controls on the motivating page, the worst delta on every cell of the width
ladder) was permanently unrepresentable. The fold was right to refuse to fake a
raw control into L1 — a form control belongs to a vetted behavior module — and
the capture already recorded everything the module needed. The missing thing was
the page's ability to say *this behaviour mounts here*.

The rule the old exclusivity was protecting is "no two competing page bodies",
and that is preserved in a narrower form: the L1 document remains the single page
body, and a behavior module may accompany it only when it is **bound by name to a
seam that exists in that body**.

In scope:

- **The composed page shape.** An L1 body plus module instances, each naming the
  seam it mounts into. Binding is resolved, never best-effort: an unbound module,
  a name that matches no seam, a seam claimed twice, a seam named on a page with
  no L1 body, and an ambiguous (duplicated) seam name are each a validation
  failure carrying a machine-readable location an automated caller can correct
  from.
- **Recovering seams from a capture.** Captured form controls cluster into the
  forms they visibly belong to and each group becomes one seam, pinned at the
  group's own union rect at every sampled width, accompanied by exactly one
  binding naming it. A control the capture placed nowhere has nothing to mount at
  and remains a named gap.
- **Claiming the reference's own submit control.** A captured button sitting
  within the same gap scale that separates fields *within* a form is that form's
  submit control: the seam grows to contain it and it stops being a page-level
  element, so the reference's one button is painted once, not twice. A button
  belonging to no form stays where the page put it.
- **Mounting at render.** A bound seam renders the module's markup inside the
  same positioned box the seam occupies; an unbound seam stays an inert, labelled
  placeholder. Several instances of one behaviour on a page mount independently.
- **Obligations in the shipping position.** A behaviour's universal obligations
  are checkable against the mounted composition, not only against a standalone
  instance.

Out of scope (owned elsewhere): deriving a mounted behaviour's configuration
from the capture and binding its assets, which belong to the reproduction import;
the labelling mode and submit-paint surrender inside the contact-form behaviour
itself; the typed seam node and the rest of the L1 axis vocabulary; and how the
gate accounts for oracle text a mounted region covers.

## Technical Context

- Supersedes three matrix statements that assert this capability cannot exist:
  a seam always renders inert (STORY-83 / CAP-70), a behaviour's slots are
  presentation-only (STORY-85 / CAP-72), and a captured form control is always an
  unfoldable residual (STORY-84 / CAP-71). Each is modified in place under the
  same reconciliation bundle; read those changes together with this story.
- Depends on the fold's surface reconstruction and on the L1 seam node plus the
  envelope that validates it.
- **Divergence from the stated intent, flagged for regression.** The intent lists
  six binding failures; page validation implements five. The sixth — a seam in
  the tree that *no* module binds (an orphan seam) — is not rejected at page
  validation: an orphan seam renders as the inert placeholder. The same condition
  IS caught later, at reproduction import, where a seam without a binding fails
  the import loudly. So the intent's guarantee holds across the pipeline but not
  at the layer the intent named. The acceptance criteria below state the five
  rejections that page validation actually performs.
- **Deliberate trade recorded in the intent.** A claimed submit control loses its
  page-absolute per-width position on the way into the seam (page-absolute
  keyframes would resolve against the seam's origin), so its placement becomes
  flow-approximate within its seam. This was chosen over leaving a second, inert
  button on the page, and recovering the exact position is handed to a successor
  intent rather than claimed here.
- Control clustering is **geometric only** — nearest-rect grouping at the widest
  sampled width. The intent describes grouping by captured form action where one
  is present, falling back to proximity; the captured action is in fact used only
  to derive the form's endpoint, not to group. On the motivating page both rules
  agree, so this is a narrower implementation of the same stated outcome.

## Dependencies

- Plan item 2 — the fold's surface hierarchy reconstruction (STORY-84).
- Plan item 3 — the L1 typed axes, envelope and safe renderer (STORY-83).

## Story Points

3