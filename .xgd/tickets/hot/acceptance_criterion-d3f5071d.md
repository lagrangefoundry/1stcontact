---
uid: acceptance_criterion-d3f5071d
id: AC-2504
type: acceptance_criterion
title: The tenant comes only from the URL (site path, or preview slug via the store);
  a body field naming another tenant writes nothing there
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:17.577690+00:00'
updated_at: '2026-11-09T19:56:10.886401+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
The tenant a submission is written into is decided only by the request URL. On the published site it is the site the path names. In the builder's draft preview it is the site the `<slug>` in `/preview/<slug>/draft/api/lead` resolves to, through the operator's own store. A body field naming another site key, tenant or business does not change where the contact lands: nothing is written into the other tenant. The field is kept as one more answer the visitor typed.

## Verification
With two sites A and B, POST to site A's published endpoint with body fields claiming site B's key or B's business id. Assert that A's business gains the contact, B's business gains nothing, and the claimed value appears among the event's recorded answers. Repeat through `/preview/<A's slug>/draft/api/lead` on the control app, with the same claims in the body, and assert the same outcome.
