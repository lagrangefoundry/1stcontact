---
uid: acceptance_criterion-b9bf7274
id: AC-2344
type: acceptance_criterion
title: Requesting a sign-in link answers identically whether the address is known,
  unknown, inactive, over the cap, or fails internally
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:10.828540+00:00'
updated_at: '2026-11-07T08:23:10.828540+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
For a given submission encoding (form or JSON), the response to a sign-in request has the same status and the same body in each of these cases:
(a) a known active address; (b) an address nobody in the business holds; (c) an address of a person who is not active; (d) a known address that is over the rate cap; (e) a known address whose send fails inside the platform, for example a template that refuses or no sender configured.
In cases (b), (c) and (d) no message is sent and no login token is created. In case (e) the failure reason is written to the invocation log and is not shown to the caller.

## Verification
Submit each case and compare status and body byte-for-byte against case (a). Assert that no mail was captured for (b)–(d). Assert that no new login_tokens rows exist for (b) and (c). Induce a send failure for (e) and assert the response still matches.
