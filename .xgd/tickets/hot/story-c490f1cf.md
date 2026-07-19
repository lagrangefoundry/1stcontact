---
uid: story-c490f1cf
id: STORY-80
type: story
title: 'Absolute-or-overlay values: every colour, length, and radius dial accepts
  a literal or a named overlay'
created_by: xgd
created_at: '2026-07-19T03:09:25.918607+00:00'
updated_at: '2026-07-19T03:17:35.290638+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-6e088083
  story_kind: feature
  story_points: 3
---

## Story

**As a** site author reproducing a captured site (or designing one from scratch),
**I want** every colour, length, and radius dial to accept either an exact absolute
value or a named overlay (palette role / spacing step / corner shape), **so that** I
can land a captured site's concrete values precisely while still using the themeable
design vocabulary when I want it.

## Description

The reproduction mandate is *absolute values are the base; a palette / step scale is
an overlay of constants*. A captured site's values are concrete (a `#hex`, an exact
px), so a reproduction author must be able to declare them literally; a from-scratch
author keeps the named vocabulary. This story makes that true across all three
value TYPES a module dial can carry:

- **Colour** — the card accent bar, the per-card checklist tick, the footer
  text/link colours, and the submit-button fill each accept a `#hex` literal (used
  verbatim) OR a palette role name (resolved to the themed palette colour).
- **Length** — spacing (top/bottom), gap, logo size, content offset, content inset,
  panel padding, and content width, across every spacing-bearing module (text-block,
  services-grid, contact-form, hero, header, footer), each accept an absolute length
  (a px value, a physical unit, a relative `%`/`vw`/`em`, or a `fit-content` keyword)
  used verbatim OR a named step resolved to its token. A malformed length is rejected
  at validation.
- **Radius** — the CTA shape and panel corner accept an absolute px radius used
  verbatim OR a named shape resolved to its radius token.

**In scope:** the literal-or-overlay language for the three value types above, and
loud validation of malformed lengths.

**Out of scope:** multi-role surface treatments (surface/panel/submit/scrim
background+text pairings) stay treatments, not pure-colour dials; genuine modes
(alignment, layout, list marker, height, etc.) stay enums; recovering *which*
relationship a captured px actually represents (fixed vs %) requires the
multi-viewport ladder and is handled elsewhere — this story models the language only.

## Technical Context

- The colour seam is a schema field `type: 'color'` (validated literal-or-role) plus
  a shared resolver: a `#hex` passes through, a role becomes a palette variable.
  Colour dials route through per-instance CSS variables so a literal and a role are
  interchangeable at the call site.
- The length seam is a schema field `type: 'length'` with a classifier that
  recognises absolute / token / relative / content / bleed kinds, plus a shared
  step resolver: a named step maps through the module's step overlay to its token,
  an absolute value passes through verbatim.
- Named-step and role values remain **byte-identical** to the prior per-class
  behaviour — the same site definition renders the same CSS. Only the literal
  escape hatch is new.
- **Intent vs code note:** the operator's principle is "every value dial takes a
  literal or a role". The code deliberately stops short of that for multi-role
  *surface treatments* (kept as bg+text pairings) — a documented scope boundary,
  not a divergence to correct. Length *relationship inference* (deciding whether a
  captured px is really a % or fixed) is deferred to the multi-viewport work; the
  language can express a relative/content length directly today.

## Dependencies

None.

## Story Points

3