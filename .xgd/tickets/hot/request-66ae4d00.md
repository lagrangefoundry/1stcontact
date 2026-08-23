---
uid: request-66ae4d00
id: REQ-34
type: request
title: 'First-pass flexibility probe: reproduce ~18 small-business sites, log gaps'
created_by: xgd
created_at: '2026-07-03T16:31:21.615566+00:00'
updated_at: '2026-08-20T21:38:06.815018+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-569d776b
---

## Goal

A **first-pass flexibility probe** for the framework: hand-pick ~18 small-business websites, reproduce each one through the existing capture → reproduce → eyes loop, and record where the framework falls short. This is the manual, scoped-down precursor to the [[REQ-18]] crawler + batch-coverage engine ([[DOC-15]]) — not thousands of sites, just enough breadth to find the important gaps in representing a simple Wix/WordPress/Squarespace site.

The output that matters is the **results table** at the bottom: for each site, a link to the original, a link to our reproduction, and a link to a per-site **report ticket** listing the observed differences and the framework changes that would close them.

## Approach — why these sites

The selection is **coverage-driven, not volume-driven**. Sites are chosen to spread across four axes so each one stresses a different part of the framework rather than repeating the same hero-over-image pattern:

- **Platform:** Wix · Squarespace · WordPress/Astra · Elementor · real-world / hand-built

- **Structure:** single-page (anchor-nav) vs multi-page (tabs/dropdown)

- **Vertical** (the [[DOC-4]] targets): caterer · consultant · coach · tradesperson · photographer · restaurant

- **Density/style:** minimal-whitespace vs image-heavy vs text-heavy

**Sourcing note ([[DOC-15]] §6):** the bulk are public template-gallery / theme-demo sites (meant to be viewed; the IP-safe path and the canonical shapes most real small-business sites are built from). **3 real live small-business sites** are included deliberately to surface the real-world grit a demo never has. Capture is transformative / internal capability-learning, not content redistribution.

⚠️ **URL verification:** Wix `view/html/<id>` and the confirmed Squarespace/Astra demo URLs are stable, direct capture targets. A few Squarespace/Astra demos follow a stable slug pattern (`<name>-fluid-demo.squarespace.com`, `websitedemos.net/<slug>/`) that must be **verified live at capture time** — flagged 🔎 below. Do not assume; confirm before capture.

## Site list

### Real sites (the "where's the meat" set)

Site

URL

Stresses

Cafe Natalie Catering

https://cafenataliecatering.com/

Real caterer · multi-page · image-heavy · WordPress · real content density

Remedy Plumbing (OH)

https://www.remedyplumbing.net/

Real tradesperson · template-built · service-area / trust-cue patterns

M&R Plumbing

https://www.mandrplumbing.com/

Older/plainer real trade site — the "grit" case

### Wix (direct `view/html` — cleanest capture targets)

Template

URL

Grid cell

Food Photographer

https://www.wix.com/website-template/view/html/1911

single-page · image-heavy · photographer

Photographer Portfolio

https://www.wix.com/website-template/view/html/2839

gallery-driven · photographer

Chef Restaurant

https://www.wix.com/website-template/view/html/3095

multi-page · restaurant · reservations/menu

### Squarespace (interactive template demos)

Template

URL

Grid cell

Cedar

https://cedar-fluid-demo.squarespace.com/

text-heavy · multi-page · consultant

Clove 🔎

`https://clove-fluid-demo.squarespace.com/` (verify)

service-based · coach/wellness

Hester 🔎

`https://hester-fluid-demo.squarespace.com/` (verify)

general small business

### WordPress / Astra starter demos (dominant real-world WP shape)

Template

URL

Grid cell

Digital Agency

https://websitedemos.net/agency-02/

single-page · agency

Web Agency (consulting)

https://websitedemos.net/web-agency-04/

multi-page · consultant

Professional Services

https://wpastra.com/templates/websitedemos-net-professional-services-02

services · trust-cue heavy

Cafe 🔎

`https://websitedemos.net/cafe-04/` (verify)

restaurant/cafe

Artist/Photographer 🔎

`https://websitedemos.net/artist-04/` (verify)

photographer · gallery

### Elementor template kits (page-builder shape — messiest capture)

Template

URL

Grid cell

Superv Cafe

https://themeforest.net/item/superv-cafe-restaurant-elementor-template-kit/33118579

cafe · clean/simple (live preview behind product page)

## Per-site process

For each site, in order:

1. **Capture** — `1c capture page <url>` into the corpus (raw.html + screenshot + metadata). Transcribe from raw.html, not the screenshot (see [[faithful-repro-runbook]] / [[DOC-19]]).

2. **Reproduce** — build the site config with the current framework/module set.

3. **Eyes** — screenshot-diff reproduction vs original; note visual and structural deltas.

4. **Report ticket** — create one report ticket per site listing: (a) observed differences, (b) which are covered / generalizable / genuinely-new gaps, (c) proposed framework changes to close each gap (prefer generalizing an existing module — dial/variant/treatment — over a new module; see the module-generalization principle and [[REQ-32]]).

5. **Record** — add the row to the results table below.

## Results

_(Filled in as each site is reproduced.)_

Original site

Our reproduction

Report ticket

_pending_

## Out of scope

- The [[REQ-18]] crawler, corpus-at-scale, and automated batch classifier (this ticket is the manual precursor).

- Customer-facing "build me a site like X" ([[DOC-15]] §7).

- IP/legal sign-off for at-scale public crawling.