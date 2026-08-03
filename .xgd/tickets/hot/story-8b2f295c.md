---
uid: story-8b2f295c
id: STORY-89
type: story
title: An imported reproduction serves the reference's own bytes and configures its
  behaviours only from what the capture recorded
created_by: xgd
created_at: '2026-08-03T03:46:07.871166+00:00'
updated_at: '2026-08-03T04:01:05.852463+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-4ff83a8b
  capability_uid: capability-cbc62ad9
  story_kind: feature
  story_points: 3
---

## Story

**As a** site-reproduction operator, **I want** importing a capture bundle to
produce a site that serves the reference's own mirrored bytes and mounts each
captured behaviour from facts the capture actually recorded, **so that** the
reproduction renders and can be graded with the target host unreachable, and I
am told what the capture could not tell it instead of shipping a silent hotlink
or an invented endpoint.

## Description

Importing a capture bundle writes a site whose home page **is** the bundle's
folded layout, plus one behaviour instance per form the fold recovered, each
bound to the seam emitted for it. On the reproduction's values the import adds
and subtracts nothing — it is the adapter that lets the ordinary
render / serve / shot / diff / values-diff loop operate on a folded document.

Two properties make that import a reproduction rather than a viewer:

**Self-containment.** Every media handle the fold transcribes is the absolute
URL the original page served. Left alone, the imported site *hotlinks the
target*: it renders only while that host is up, every perceptual comparison
measures the target against a page serving the target's own bytes — a hole in
the gate, not merely in the output — and each render silently egresses to a
third party. The import therefore binds every asset-bearing handle (image
sources, section background images, font faces) to the bundle's own mirror, and
normalises handles that are already site-local so they resolve from any page
depth. An absolute handle with no mirrored counterpart **fails the import**,
naming each one: a reproduction is self-contained or it does not exist. There is
deliberately no partial mode and no fallback-to-origin path, because keeping the
origin for "just this one asset" preserves exactly the gate hole. Conversely,
mirrored image/font bytes that the imported page references nowhere are reported
as a fold gap rather than silently shipped.

**Derivation, not invention.** The layout half and the behaviour half of a
bundle are written by one fold at capture time, so they can never disagree about
which seams exist; a bundle whose two halves *do* disagree is part-stale and
fails loudly rather than importing behaviours that would render as inert
placeholders. Each mounted behaviour's configuration is then derived from the
capture alone — the field's label from the control's captured accessible name,
its type from the captured control type, its labelling mode from the captured
name source, the submission endpoint from the captured form action. What the
capture never recorded is reported as a residual on the import summary and left
absent; an endpoint that was never observed is never fabricated, and a captured
endpoint that is not a safe URL is dropped and reported.

In scope: what the import must produce from a bundle — localized media handles,
the loud failures that keep it honest, the reported gaps, and the derived
behaviour configuration.

Out of scope: the command's argument surface and output hygiene (CAP-66); how a
capture becomes L1 nodes (CAP-71); the page-shape rule and the render-time mount
of a bound behaviour (CAP-78); the analytic gate, which re-folds a bundle
read-only and is unaffected by this import.

## Technical Context

- Delegates to CAP-71 for the fold itself: the import packages the fold's output
  and changes no reproduction value. All reproduction fidelity is determined
  upstream by the fold, the L1 language and the renderer.
- Delegates to CAP-78 for the composed page shape (a behaviour instance bound by
  name to a seam in the L1 body) and for mounting the bound fragment at render.
- The binding to the mirror happens on the *site's* copy of the document. The
  bundle's own folded artifact stays a faithful transcription of what the capture
  read, so the read-only 3-probe gate (CAP-73), which re-folds the bundle
  directly, is untouched by the import.
- **Intent/code divergence to flag.** The intent states that a derived field's
  `required` flag comes from the captured control. The capture records no such
  fact today, and the import marks every derived field not-required. The
  behaviour is honest (nothing is invented) but the stated intent is
  unimplemented; no acceptance criterion asserts it, and closing it needs the
  capture's recording contract (CAP-77) to carry the flag first.
- **Known reporting artifact (not this story's).** On the motivating page the
  *capture's* asset-coverage check reports a section background image as
  unreferenced because no captured element names it. That is a different signal
  from this import's unreferenced-asset report, which does count a section
  background image as a reference.
- The reference's own submit chip loses its exact per-width position when it is
  claimed into a form's submit seam — a deliberate, recorded trade (one working
  control instead of two, one inert), handed onward rather than hidden.

## Dependencies

- STORY-88 (page composition — behaviours mounted into L1 seams): the import
  binds behaviour instances to seams that composition defines and validates.

## Story Points

3