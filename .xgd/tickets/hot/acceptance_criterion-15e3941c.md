---
uid: acceptance_criterion-15e3941c
id: AC-2294
type: acceptance_criterion
title: The delivery webhook refuses a request whose signature is missing or does not
  verify over the exact bytes received, and writes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:28.504257+00:00'
updated_at: '2026-11-04T18:14:38.049197+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
A POST to the delivery webhook is refused with HTTP 401 and the body "Refused." in any of these cases:
- the id, timestamp or signature header is missing;
- none of the signatures listed in the signature header matches an HMAC-SHA256, under the configured secret, of `id.timestamp.raw-body`;
- the body has been altered in any byte after signing, including a re-serialisation with a different key order.

The refusal looks identical for every cause. No record is changed in any business. A request is accepted if any one of several space-separated signatures in the header verifies, which is how a secret is rotated. Headers are accepted under either the `webhook-` or the `svix-` prefix.

## Verification
Sign a delivery event with the scheme's documented algorithm. Then post it with a wrong signature, with no signature headers, and with the same JSON re-serialised in a different key order but the original signature. Assert each gets 401 "Refused." and that the target record's status is unchanged. Post with a header listing a wrong signature followed by the correct one and assert it is accepted.