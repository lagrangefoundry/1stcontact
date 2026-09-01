---
uid: request-20bd7d63
id: REQ-166
type: request
title: 'Capture to ticket: bundles become corpus members'
created_by: xgd
created_at: '2026-08-31T21:38:56.541751+00:00'
updated_at: '2026-08-31T22:57:13.252664+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-162
  - REQ-163
  auto_merge_back: true
  needs_review: false
---

# Capture → ticket: bundles become corpus members

## The asymmetry this closes

[[REQ-163]] makes an uploaded file into a `material` ticket the AI can find.
Captures produce far richer material — a whole rendered site, its copy, its
palette, its imagery — and produce **nothing the AI can search**. Bundles land in
the ReferenceStore and stop there.

The result would be invisible from the outside and hard to explain: the client
uploads a PDF and the AI can discuss it; the client points us at the site they
admire, we capture it in full, and the AI cannot recall a thing about it.

## A bundle is N attachment records on one `reference` ticket

Settled in [[DOC-38]] §9, and the reason is [[DOC-13]] §9's *"capture once,
re-map forever"*. Re-extraction reads members **selectively** — `capture.json`,
then a screenshot, falling back to `rendered.html` — so:

- **One record over an archive** would force a Worker to pull an entire 11–23MB
  bundle to read one member of it. (Measured: three real single-page captures at
  11MB / 14MB / 23MB, 11 to 99 members each.)
- **A manifest inside one record** is N records with an extra indirection and no
  listing.

Each member carries `meta.member` naming its role (`capture.json`,
`screenshot.full.png`, `assets/hero.jpg`).

**Dedup falls out.** Addresses are content-derived, so recapturing a site
re-uses every unchanged blob — an unchanged hero image is one blob across every
capture that ever saw it. That matters far more for [[DOC-15]]'s permanently
retained internal corpus than for any single tenant.

## The body is the description of the site

The `reference` ticket's body is what the KB indexes ([[DOC-38]] §6), so it must
describe the captured site as prose: what the business appears to be, how the
page is structured, the palette and type treatment, the tone of the copy. Written
once at capture time from `capture.json` plus the screenshot.

A bundle with a weak description is a bundle the AI cannot find, however complete its
members are.

## Rights are inferred, never asked

[[DOC-38]] §10.1, and captures are the case that motivates it:

| Captured URL | `republishable` | `exportable` |
|---|---|---|
| matches the client's declared domain (3a — their own old site) | yes | **no** — it is their business |
| any other domain (3b — a reference) | **no** | yes — public marketing, structure only |

The two bits invert between the cases ([[DOC-38]] §4.2), which is why neither is
derived from the other. The only question ever put to the client is on a domain
mismatch — *"is this your site?"* — a question of fact, not of law.

**The invariant this exists to enforce:** a capture-sourced asset may never be
promoted into a site's asset library unless its bundle is `republishable`
([[DOC-38]] §5). Publishing a competitor's hero image under the client's own
domain is the most damaging single action available in the system.

## Out of scope

- **The capture pipeline itself** — [[REQ-154]] / [[REQ-155]]. This consumes what
  they produce.
- **Retention and the internal corpus** — [[DOC-38]] §12's detach timer and the
  export into the system tenant. Separate ticket.
- **The quarantine write gate** ([[DOC-38]] §11) — v1 is the prompt-level
  constraint plus the asset gate above.

## Acceptance

- A completed capture yields one `reference` ticket with one attachment record
  per bundle member, each addressable without reading the others.
- The body describes the captured site well enough to retrieve it by what it *is*
  — *"the bakery with the dark green palette"* — not merely by hostname.
- `republishable` / `exportable` are set from the URL, and a domain mismatch
  prompts the one factual question rather than assuming.
- Recapturing an unchanged site creates new records but no new blobs.
- Re-extraction reads a single member without materialising the whole bundle.
