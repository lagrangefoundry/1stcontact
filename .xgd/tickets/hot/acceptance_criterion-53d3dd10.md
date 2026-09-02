---
uid: acceptance_criterion-53d3dd10
id: AC-1487
type: acceptance_criterion
title: Attached bytes are stored in the material store under the account's own address
  and are absent from the store the public site is served from
created_by: xgd
created_at: '2026-09-02T00:17:06.306345+00:00'
updated_at: '2026-09-02T00:17:06.306345+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

After bytes are attached to a ticket:

- The bytes are present in the platform's **material store** at an address composed of the account
  the store handle is scoped to and the content address carried on the attachment record — the
  account's own namespace, not a shared one.
- The **same address holds nothing in the store the public site is served from.** The bytes are not
  there in any form: not at that address, and not under the account-scoped address the material store
  used. The two stores are distinct destinations, not one destination reached two ways.

This holds regardless of how the material is classified: nothing on the material's rights or
provenance record changes which store its bytes go to. Confidential and freely republishable material
alike are stored where the public-facing half of the platform has no access.

## Verification

Inside the deployment's runtime, with both stores present as real object stores rather than
substitutes, attach bytes to a material ticket and then look for them in both: the material store must
return an object at the account-scoped content address, and the public site's store must return
nothing for it. Because both stores are real, the check proves where the bytes actually landed rather
than what the configuration says about it.

Mutation check that gives this criterion its teeth: re-point the store's byte layer at the public
site's store and this criterion must fail.
