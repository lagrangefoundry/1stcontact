---
uid: request-b63bbed5
id: REQ-101
type: request
title: 'No font-acquisition path or licence provenance: font registry + 1c fonts check'
created_by: xgd
created_at: '2026-07-26T01:26:56.621937+00:00'
updated_at: '2026-07-26T01:26:56.621937+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

## The gap

There is **no font-acquisition path for an authored site**, and no record of
where any font came from or what its licence permits.

`l1FontFaceSchema` binds a family handle to a served `.woff2` under
`draft/assets/`. Every font currently in the repo arrived inside a **capture
bundle** — the reproduction path supplies fonts as a side effect. Authoring has
no library, no CLI verb to add a face, and no bundled default, so an authored
site silently falls back to a system stack.

Found while authoring xgd.dev ([[request-d41fd017]], REQ-95), where the page
read generic until Satoshi + JetBrains Mono were downloaded and wired by hand.
On a text-driven site, type is most of the impression.

## Operator direction (2026-07-25)

Development-time downloading of **free** fonts is approved. What is required is
**tracking**: what we have, where it came from, and what licence actions remain
outstanding.

## Why this is a compliance artifact, not documentation

These findings constrain the **1st Contact product**, not just this repo:

1. **1st Contact can never buy one commercial licence and serve it across
   customer sites.** Commercial webfont licences are per-licensee, typically
   per-domain or by pageview, and agencies / hosting providers are explicitly
   barred from sharing one licence across client sites. Adobe Fonts additionally
   forbids self-hosting *and* uploading to a website design platform.
2. **Three legitimate models**: free-only default (V1); customer brings their own
   licence and attests; platform/OEM licence negotiated per foundry (what
   Wix/Squarespace do — not V1).
3. **Serving a licensed font from a public CDN without access controls counts as
   redistribution beyond scope.** Self-hosted free fonts sidestep this and stay
   inside the DOC-24 / DOC-2 envelope as static assets rather than third-party
   runtime dependencies.

The distinction that matters operationally: *"may I use this on xgd.dev"* and
*"may I ship this to 10,000 customer sites"* are **different questions with
different answers**. The registry must force both to be answered at download
time, not discovered later.

## Proposed change

**1. A project-level registry** (`fonts/registry.yaml` or similar) — project
level, not per-site, because licence obligations attach to the font, not the
site, and because this file is the seed of 1st Contact's eventual font menu.

```yaml
fonts:
  - family: Satoshi
    foundry: Indian Type Foundry
    source: https://www.fontshare.com/fonts/satoshi
    downloaded: 2026-07-25
    licence:
      name: ITF Free Font Licence
      url: https://www.fontshare.com/licenses/itf-ffl
      commercial_use: true
      self_host: true
      redistribute_in_product: REVIEW_REQUIRED   # ← load-bearing
    actions:
      - "Legal review before inclusion in the 1stcontact font menu — licence is
         non-transferrable and terminable."
    files:
      - { path: satoshi-700.woff2, weight: 700, style: normal }
```

YAML rather than JSON: this is human-curated and the licence notes need
comments.

**2. Enforcement — `1c fonts check`.** Scan every site's
`l1.resources.fonts`, join families against the registry, fail on any family
that is unregistered or carries an unmet action. Without this the file is
documentation, and documentation drifts — the exact failure mode XGD exists to
prevent.

Font **files** stay per-site under `draft/assets/` (a site must be
self-contained and portable); the registry is the provenance index over them.

## Backfill required

Register what is already on disk: Satoshi 400/500/700/900 and JetBrains Mono
(latin subset) under `storage/sites/xgd/draft/assets/`, plus the fonts that
arrived via capture bundles under `storage/references/**` and
`storage/sandbox/**` — the latter are reproduction inputs and their
redistribution status is almost certainly **not** clear.

## Acceptance

- A registry file records family, source URL, download date, licence name + URL,
  commercial-use / self-host / redistribute-in-product flags, outstanding
  actions, and the file list.
- `1c fonts check` fails on an unregistered family referenced by any site.
- `1c fonts check` fails on a family whose `redistribute_in_product` is unmet
  when that site is marked as product-distributed.
- Existing on-disk fonts are backfilled, including capture-derived ones.
