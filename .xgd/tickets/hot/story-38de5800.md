---
uid: story-38de5800
id: STORY-66
type: story
title: Render path fails loud on dangerous content (unsafe URL schemes + injectable
  HTML)
created_by: xgd
created_at: '2026-07-10T00:33:10.136121+00:00'
updated_at: '2026-07-10T00:47:51.191350+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-df065afc
  capability_uid: capability-4c6800c5
  story_kind: feature
  story_points: 2
---

## Story
**As a** site author (an AI or human generating content for the platform),
**I want** the framework to reject dangerous content — unsafe URL schemes and
injectable HTML — loudly at build/render time and tell me exactly which field and
value is at fault,
**so that** untrusted content can never become a live injection vector in a
published site, and I can see the error and correct the content I generated rather
than have it silently stripped behind my back.

## Description
The product thesis is untrusted content: page copy, links, and assets are supplied
by an AI author or a customer. The framework treats each module as the
**sanitization boundary** for that content. Previously, content-field values flowed
to raw output sinks (link/resource/form-action interpolation, markdown-link URLs,
and raw-HTML markdown output) with **no scheme or injection enforcement** — a
`javascript:` link rendered live and a raw `<script>` in a markdown body executed
on page load.

This capability makes the render path **fail loud** instead:
- A URL whose scheme is outside the safe set (`http`, `https`, `mailto`, `tel`,
  relative, `#anchor`, and `data:image/*` for image sources only) is rejected at
  every link/resource/form-action sink. `javascript:`, `vbscript:`,
  `data:text/html`, `file:`, etc. are unsafe.
- Rendered markdown carrying a `<script>`/`<iframe>`/`<object>`/`<embed>` tag, an
  inline `on*` event handler, or a link/resource attribute with an unsafe scheme is
  rejected before it can reach the page.
- Rejection is a distinct, actionable **content failure** that names the field
  context and the offending value, so the generating author can fix and retry (a
  recoverable failure, not a system error).

**In scope:** rejection of unsafe URL schemes and injectable HTML across the
framework render path (markdown output, nav targets, and every module
href/src/action sink — hero, services-grid, contact-form, header, footer).

**Out of scope:** the injection *detector* (the conformance harness security
dimension — CAP-54); dependency/supply-chain scanning; authentication; and CSS
sanitization (no live CSS-breakout vector exists because every inline style is
framework-computed from closed enum dials, never from free content).

## Technical Context
- Enforcement lives in the **render layer**, not the structural content validator.
  The leaking URL sinks are not all declared as typed `url` fields (e.g. a CTA is
  an untyped object), so a validator keyed on field type would miss them; the
  renderer is the single complete boundary where every URL/HTML value actually
  materializes. This refines the original REQ-46 "reject at the validator" contract
  — the operator's as-built direction is "reject at render, fail loud".
- Inline dangerous HTML is **rejected, not neutralized**. The original brief assumed
  the markdown engine already drops dangerous HTML; the security conformance
  dimension (CAP-54) proved it does not — a raw `<script>` executed — so raw
  dangerous HTML is now a hard error, consistent with URL rejection.
- The definition of "unsafe" is **single-sourced** and mirrors the CAP-54
  security probe, so the detector and the enforcer forbid exactly the same
  artefacts. A module that *refuses* to emit unsafe content is counted as
  conformant (a safe rejection) by that harness.
- The raised error is a distinct public error type surfaced when a site renders;
  its message names the sink context (field) and includes the offending value.

## Dependencies
None. (Shares the "unsafe" definition with CAP-54 but does not depend on it at
build time; CAP-54's security dimension is the detector that motivated and
validates this enforcement.)

## Story Points
2