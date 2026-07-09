---
uid: request-150b5ebf
id: REQ-28
type: request
title: Small module dials for gigabytealchemy import (hero heading / header align
  / stacked grid)
created_by: xgd
created_at: '2026-07-02T21:52:37.086720+00:00'
updated_at: '2026-07-09T23:59:12.575340+00:00'
completed_at: '2026-07-09T23:59:12.575340+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  commits:
  - 70ff18245077844179d2eda45d91afc73f93312e
  version: 0.0.20
  bundled_in: bundle-adc60ee8
---

## Scope — module capability

`hero` has no dial to set the heading colour/treatment independently of the surface text colour. Under `surface: inverse` the heading renders white; there is no structured way to make it the site accent (gold) as the reference does.

Surfaced by the **gigabytealchemy.ai** import (REQ-20): the reference hero heading is **gold** (site accent `#fbba72`), not white. Our reconstruction renders it white because the only lever is the inverse surface's default text colour.

## Acceptance criteria

- `hero` exposes a structured heading colour/treatment dial (e.g. `theme` token or `plain`/`accent`/`gold` treatment) selectable per instance.
- No raw CSS in the site definition.
- gigabytealchemy hero heading renders in the site accent gold over the inverse hero band, matching the captured value.

## Related

Sibling of REQ-24 (`logoTreatment: gold` on `header`) — if a shared text-treatment dial is generalised there, this hero heading case is a natural consumer.


## Consolidated scope (2026-07-02)

Per operator steer ("use fewer reqs"), this ticket is the **umbrella** for three small module dials surfaced by the gigabytealchemy.ai import (REQ-20). It **subsumes REQ-29 and REQ-30** (both archived, pointing here). All three are structured dials/variants — no raw CSS in the site definition.

1. **Hero heading treatment** (was this ticket) — `hero` gains a `headingTreatment` dial (`plain`/`accent`/`gold`) that sets the heading colour independently of the surface text colour; `gold` reuses the header wordmark's metallic gradient (REQ-24). Reference hero heading is gold over the inverse band.
2. **Header alignment** (was REQ-29) — `header` gains an `align` dial (`left`/`center`, shared `ALIGN_DIAL`); `center` groups the wordmark/nav centrally. Reference wordmark is centered.
3. **services-grid stacked variant** (was REQ-30) — new `stacked` variant holds each card full-width in one column at every breakpoint (multi-col variants only spread from `md` up). Reference "Building" cards stack.

## What was implemented (free-coded — commit recorded in fields.commits)

- `dials.ts`: new `HEADING_TREATMENT_DIAL` (`plain`/`accent`/`gold`); header reuses existing `ALIGN_DIAL`.
- `hero/meta.ts` + `hero/index.astro`: `headingTreatment` dial → `treatment-*` class on `<h1>`; `accent` = solid accent fill, `gold` = gradient clipped to glyphs.
- `header/meta.ts` + `header/index.astro`: `align` dial → `align-*` class; `.header.align-center .header__inner { justify-content: center }`.
- `services-grid/meta.ts` + `index.astro`: `stacked` added to `variants`; explicit single-column rule.
- gigabytealchemy `draft/pages/home.json`: hero `headingTreatment: gold`, header `align: center`, "Building" grid `variant: stacked`.
- UATs: `tests/req28-module-dials.test.ts` (9 tests: meta, per-module render, full render pipeline). All pass; quality gate green (lint/typecheck/coverage 95%).