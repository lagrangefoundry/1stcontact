---
uid: acceptance_criterion-96104d2f
id: AC-2276
type: acceptance_criterion
title: Without a mail credential, a send is recorded locally, makes no network call
  and returns a distinct local_ id; the credential is the only switch
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:10.877961+00:00'
updated_at: '2026-11-04T21:35:30.462671+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment holds no mail-provider credential (absent or blank), the sender selected for it is the local capturing adapter, and sending a valid message delivers nothing: no network request is made, one console line per message names the recipient and subject and says it was not sent (in send order), and the send resolves to `{ providerId }` whose value starts with `local_` and differs between sends. The local capturing adapter records every message it is given, in send order, in its `sent` list; through the deployment's selected sender that list is internal and not exposed — the console line is the observable record there. The presence of the credential is the only thing that selects between delivering and recording — no mode, environment-name or "is test" setting changes it — and the test suite's own runtime carries no credential, so no test can reach a real provider.

## Verification
With no credential configured (absent and blank), send messages through `mailerFor` while observing all outbound fetches. Assert zero network calls, one console line per message naming recipient and subject in send order, each `providerId` matches `local_` + non-empty suffix and the ids are distinct. Drive `capturingMailer` directly and assert its `sent` list equals the messages in send order, with no network calls. Separately assert the test runtime's environment has no mail-provider credential, and that setting a credential (and nothing else) switches the same send to the provider path.

## Reconciliation Decisions
- (review report-0cfddba5 gap 1) The in-memory `sent` list belongs to `capturingMailer`; `mailerFor` discards the adapter object and returns only its `send`, so the capture list is asserted on the adapter directly and the console line is the record observed through `mailerFor`.
