---
uid: story-79e068e5
id: STORY-69
type: story
title: 'Fidelity capture/diff blind-spot fixes: modern-CSS colour resolution and stale-reference
  geometry flagging'
created_by: xgd
created_at: '2026-07-13T20:12:58.838322+00:00'
updated_at: '2026-07-13T20:12:58.838322+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-3aac6f84
  story_kind: feature
  story_points: 2
---

## Story
**As an** operator reproducing a captured website with the fidelity tooling,
**I want** the capture/comparison to resolve modern-CSS colours to real sRGB
values and to loudly warn when a reference lacks the geometry needed to verify
position and width, **so that** genuine colour and layout differences surface
mechanically instead of hiding behind an unresolved-colour sentinel or a
silently-passed geometry check.

## Description
Two closely-related correctness fixes to what the fidelity comparison can
actually see (REQ-52 blind-spot fixes, commits 4b0282b4 and 3cd464e7 fix2):

**(a) Modern-CSS colour resolution.** The capture colour resolver converts any
browser-understood computed colour — including the `oklch()` / `lab()` / `lch()`
/ `color()` forms that Tailwind v4 and other modern sites emit — into an
`#rrggbb` value by painting it and reading back real sRGB bytes. Before this, a
resolver that understood only `rgb()`/`rgba()` failed to parse those formats,
marked every such run as colour-inferred, and fell back to a `#000000` sentinel
— which the comparison then suppressed as low-confidence, hiding real body/
heading colour gaps. The "fully transparent / unpaintable → inferred sentinel"
contract is preserved, and plain `rgb()`/`rgba()` colours still resolve where
full colour rendering is unavailable (the unit-test environment).

**In scope:** faithful resolution of computed colours across formats; the
transparent→inferred sentinel contract; fallback resolution of standard
`rgb()`/`rgba()` colours without a rendering surface.

**(b) Stale-reference geometry flagging.** When a reference object is paired with
a reproduction object that carries box geometry but the reference object itself
carries none, the object's box parameter is reported as a mismatch rather than a
silent pass, and the comparison report prints a loud STALE-REFERENCE warning
counting the reference objects with no box geometry and advising a re-capture.
Before this, a reference captured before per-element geometry existed rendered
its box row as an OK — the blind spot that let a real width defect pass
unnoticed in the value comparison.

**In scope:** one-sided-geometry detection surfacing as a box mismatch; the
loud stale-reference summary with an actionable re-capture message.

**Out of scope:** the object-grouped report layout itself (CAP-56 / item 1);
tolerance policy — what counts as a match (item 2); repairing a stale reference
(re-capture is a data/network follow-up, not part of this capability).

## Technical Context
- Colour resolution paints each computed colour onto a 1×1 canvas and reads the
  pixel, giving format-agnostic sRGB bytes; a two-sentinel probe preserves the
  prior "unparseable → null → inferred" contract, and a zero-alpha pixel still
  returns null (unpainted / fully transparent). Where no 2D canvas is available
  (e.g. jsdom), a legacy `rgb()`/`rgba()` regex parse is the fallback.
- Stale-geometry detection lives on the per-object card produced for the
  object-grouped report; it depends on the object-card structure introduced by
  item 1 (Object-grouped fidelity comparison report, CAP-56 / STORY-67).
- Intent/code agreement: the operator's REQ-52 notes describe both fixes exactly
  as implemented (colorInferred 44→0, `"Most apps"` body resolving to `#314158`;
  the STALE-REFERENCE summary reporting reference objects with no box geometry).
  No divergence noted.

## Dependencies
Item 1 — Object-grouped fidelity comparison report (STORY-67 / CAP-56): the
stale-reference flag is evaluated on the per-object card structure.

## Story Points
2
