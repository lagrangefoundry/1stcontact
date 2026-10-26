---
uid: acceptance_criterion-b85050fa
id: AC-2017
type: acceptance_criterion
title: A promotion that lands makes one draft-journal entry naming the asset, so the
  assistant's next turn is told a picture arrived
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:26:41.141465+00:00'
updated_at: '2026-10-26T01:35:17.257597+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

A promotion that lands makes one entry in the site's draft change journal, the same kind of entry
any other asset added to the site makes, naming the asset under the name it landed as. Because the
assistant's next turn is told what the draft journal recorded since its last turn, the assistant
learns that a picture arrived on the turn after it arrives rather than having to discover it.

A promotion that does not land (refused by the rights gate, or failed softly) makes no journal
entry.

## Verification

Read the site's draft change journal, hand over a file for that site through the platform's
material entry point, and read the journal again. Observe exactly one new entry, recording an
asset added under the name the hand-over reported. Repeat with material whose rights forbid
republishing and observe no new entry.