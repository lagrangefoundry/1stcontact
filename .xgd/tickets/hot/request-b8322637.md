---
uid: request-b8322637
id: REQ-462
type: request
title: 'Brand: the header''s arrangement is part of the brand — logo centred and larger
  for a detailed emblem, logo left for a wordmark, and the address in the header when
  location is the pitch'
created_by: EPIC-19
created_at: '2026-10-25T21:12:10.716992+00:00'
updated_at: '2026-10-25T21:46:50.921967+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-60b3e18a
  commits:
  - working_sha: 622f62a57d5b71d0ab1d275ecc46f3456ad868bd
    reconcile_sha: null
    main_sha: null
  - working_sha: 38261cf52ce517f54a67b5fc396afb3eafd4dc63
    reconcile_sha: null
    main_sha: null
  version: 0.2.646
---

## Why

On First-Draft-Test Dina's Diner 2 the logo, now sized by BUG-276's brand, is
133×80 at desktop. The operator: "The logo is better but for this logo I still
think it is small. What I would do is put a logo like that in the middle at the
top, another 50% larger, and put the address in the top left."

Dina's logo is a detailed **emblem** (red script "Dina's" with a swash, a teal
"DINER" bar, a tagline). It needs more room than a plain wordmark, and it works
best as the header's centrepiece. But `site.design.brand` (BUG-276) states only
the logo's **size**. Every header is laid out the same way (logo left, links
right), and the seed sizes every logo the same way. So the system can't express
the header the operator describes, except by a builder hand-building it
off-system.

## What changes

1. **The brand states the header's arrangement** as well as the logo's size:
   - `logo_left`: logo at the start, navigation and actions at the end (today's
     layout);
   - `logo_centred`: logo in the middle, secondary details on either side (for
     example the address on the left, phone and Get directions on the right).

   On a phone, either arrangement reduces to the logo plus the most important
   action. This is a typed choice, not a template: the principal picks it per
   site, and it can change with a look (REQ-448).
2. **The seed reads the logo's character.** The host seeds the arrangement and
   size from the logo itself:
   - a detailed emblem (dense artwork, near-square or with several lines of
     lettering) starts `logo_centred` and about 1.5× the wordmark size;
   - a plain wordmark starts `logo_left`.

   The principal can change either.
3. **The header carries where you are when that's the pitch.** When the
   positioning card makes location part of the visitor's decision (a roadside
   stop, a shop people visit), the header shows the town or address in its
   secondary slot. This is REQ-460's visitor-first rule, applied to the top of
   the page.
4. The renderer builds the header from the brand's arrangement for header parts
   (REQ-422). The layout check's brand rule (BUG-276) measures against the
   arrangement's size.

## Test plan

`tests/test_UAT_FC_REQ-462_the_brand_sets_the_header.*`:
- `brand.header: logo_centred` renders the logo centred with the address at the
  start and the actions at the end at 1280 and 900, and logo plus main action at
  375. `logo_left` renders as today.
- The seed for Dina's emblem logo is `logo_centred` at about 1.5× the wordmark
  size. The seed for a plain wordmark is `logo_left`.
- With a location-led positioning card, the seeded header includes the address.
- The brand check measures the centred logo against its brand size.
- Re-run the BUG-276, REQ-447, REQ-448 and REQ-422 UATs.