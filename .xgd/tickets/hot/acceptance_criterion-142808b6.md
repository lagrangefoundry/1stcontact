---
uid: acceptance_criterion-142808b6
id: AC-1612
type: acceptance_criterion
title: A modern-colour-space gradient captures its full ordered stop list resolved
  to hex in-browser
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:50:44.588885+00:00'
updated_at: '2026-09-09T23:50:44.588885+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
A gradient authored in a modern colour space captures with its **full ordered stop
list resolved to `#rrggbb`**, not as a direction with an empty stop list. The
resolution happens **inside the page**, before the stop list crosses back to the
tool, for **both** gradient kinds — the panel/card surface gradient and the text-fill
(`background-clip: text`) gradient alike.

This is the precondition the stop-position axis (AC-634 / AC-635) and the
surface-gradient axis (AC-636) stand on. A Tailwind-authored gradient computes to
`oklch(...)` / `oklab(...)` / `color(...)`, which the tool-side stop parser cannot
read; a stop list it cannot read is an **empty** stop list, so the gradient captures
as direction-only and those axes have nothing to compare — both sides record no stops
and diff clean while the gradients visibly differ.

Resolution must be the browser's own conversion, read back off the page, rather than
colour-space maths reimplemented in the tool against whatever syntax the reference
site's build happened to emit. That is what makes the captured stop list
syntax-independent by construction, and therefore comparable by simple colour
equality.

## Verification
Capture a page carrying a surface gradient and a text-fill gradient whose stops are
authored in a modern colour space (`oklch(...)` / `color-mix(...)`). Assert each
captures with its stop list non-empty, in painted order, every stop colour a
`#rrggbb` literal matching the sRGB value the browser paints. Capture the visually
identical pair authored in `#hex` / `rgb()` and assert the two captures agree stop for
stop. Then diff a reproduction whose modern-syntax gradient has a differing stop
colour and assert a gradient delta is reported on each kind — the case that passed
clean while the stop list was empty.
