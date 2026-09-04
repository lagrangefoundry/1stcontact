---
uid: acceptance_criterion-2242f74f
id: AC-1547
type: acceptance_criterion
title: Material that may not be republished can never reach a site's asset library
created_by: xgd
created_at: '2026-09-04T03:53:52.916760+00:00'
updated_at: '2026-09-04T03:53:52.916760+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

Material that may not be republished can never be placed into a site's asset library. This is the
most damaging single action available in the system — it would publish someone else's copyright
under the client's own domain — and the refusal is unconditional:

- The decision is read from the material's **own record**, not from anything the caller asserts.
  There is no argument by which a caller can declare a piece of material publishable.
- A refused promotion is reported as forbidden — the request was well formed and the answer is a
  matter of rights, not of syntax — names the material refused, and explains in the client's terms
  that the file came from elsewhere and may be used as reference instead.
- Nothing is written to the site: the site's asset library is unchanged, and no bytes cross into
  the store the public site is served from.
- Material with no file attached is refused separately, saying there is nothing to publish.

## Verification

Retrieve a permitted address so that a non-republishable piece of material exists. Attempt to place
it into a site's asset library and assert: the attempt is refused, the refusal is reported in the
forbidden form rather than the malformed-request one, the message names the material and reads as
an explanation to the client, the site's asset listing is unchanged, and the site's store contains
no new object. Repeat while asserting publishability in the request and assert the outcome is
unchanged. Attempt to place a material record that has no file attached and assert a distinct
refusal saying there is nothing to publish.
