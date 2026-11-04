---
uid: acceptance_criterion-96104d2f
id: AC-2276
type: acceptance_criterion
title: Without a mail credential, a send is recorded locally, makes no network call
  and returns a distinct local_ id; the credential is the only switch
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:10.877961+00:00'
updated_at: '2026-11-04T18:00:35.869006+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment holds no mail-provider credential (absent or blank), sending a valid message delivers nothing: no network request is made, the message is recorded (in send order) among the messages captured locally, one console line names the recipient and subject and says it was not sent, and the send resolves to `{ providerId }` whose value starts with `local_` and differs between sends. The presence of the credential is the only thing that selects between delivering and recording — no mode, environment-name or "is test" setting changes it — and the test suite's own runtime carries no credential, so no test can reach a real provider.

## Verification
With no credential configured, send messages while observing all outbound fetches. Assert zero network calls, the captured list contains the messages in order, each `providerId` matches `local_` + non-empty suffix and the ids are distinct. Separately assert the test runtime's environment has no mail-provider credential, and that setting a credential (and nothing else) switches the same send to the provider path.