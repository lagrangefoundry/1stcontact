---
uid: acceptance_criterion-5020e47b
id: AC-2370
type: acceptance_criterion
title: A body from which no text can be derived is refused by both adapters before
  any network call or recording
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T04:11:56.636851+00:00'
updated_at: '2026-11-08T04:11:56.636851+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Both the delivering and the recording sender refuse a message whose body is non-empty but yields no plain-text part (for example, a body made only of markup, or only of `<style>` content). The refusal is an invalid-message error saying no plain-text part could be derived. It happens through the same check both senders share and before anything else: no network call is made and nothing is recorded. The two senders therefore agree on what a sendable message is, and the text part that is sent is the same text that check derived.

## Verification
Send a body that yields no text (for example `<p></p>` or `<style>p{}</style>`) through the credentialed sender with a recording provider double, and through the uncredentialed sender. Assert:
- both reject with an invalid-message error naming the failure to derive a text part;
- the provider double received zero requests;
- the captured list is unchanged.

Send a body that does yield text through both senders. Assert both accept it, and that the text the provider received equals the text derived from that body.
