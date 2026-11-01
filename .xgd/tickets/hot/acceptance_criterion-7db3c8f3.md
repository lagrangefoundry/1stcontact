---
uid: acceptance_criterion-7db3c8f3
id: AC-2212
type: acceptance_criterion
title: An admitted account requesting /account receives the portal page of the business
  it is an account of, regardless of which business it is operating
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:03.677651+00:00'
updated_at: '2026-11-01T20:26:46.670730+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted caller sends GET /account on the control-app origin, the response is 200 with an HTML page titled "Your account". It is the portal of the business whose accounts include the caller (for a 1st Contact customer, the 1st Contact business). That holds when the caller's current business scope names a different business they operate: the page is the host business's portal, not the operated business's. It also holds when the caller holds no live grant on any business, so no business is selectable: the portal is still served and is not refused for lack of a selectable business.

## Verification
Admit a caller who is an account of business H and operates business O. Request /account with O as the current scope and check the response is H's portal (seed distinguishable `portal` content in H and in O). Repeat with every grant of the caller lapsed and check a 200 portal page is still returned.