---
uid: acceptance_criterion-736da502
id: AC-2147
type: acceptance_criterion
title: The account surface states each unselectable business's lapse reason in words
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:08.971575+00:00'
updated_at: '2026-11-01T10:49:08.971575+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The account surface states, in words beside each business it belongs to, why an
unselectable business cannot be operated: access expired (with the day it
ended when that is known, as a date that does not depend on the reader's locale;
an expiry with no date still says access ended), access was
revoked, access has not started yet, or access was never granted. Two
businesses lapsed for different reasons each show their own reason. A
selectable business shows no reason. A lapse the client does not recognise, or
an unselectable business arriving with no reason at all, shows the "access
ended" marking and no sentence — never a placeholder or a raw value. The
switcher itself carries only the short suffix, never the sentence.

## Verification

Open the account surface with one live business and businesses lapsed for each
known reason (one expiry with a date and one without). Assert each lapsed row
carries its own sentence, the dated expiry names its day, the live row carries
none, and an unknown or missing reason yields the marking only. Assert the
switcher's option labels contain the suffix and not the sentence.
