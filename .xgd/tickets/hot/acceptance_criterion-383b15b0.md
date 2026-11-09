---
uid: acceptance_criterion-383b15b0
id: AC-2539
type: acceptance_criterion
title: An upload refused on the Library route is reported in the Library with the
  platform's own reason, and the next handover clears it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:46:08.011521+00:00'
updated_at: '2026-11-09T20:20:32.729823+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

A refused upload tells the client why, from whichever drop area they used.

- **A Library-route handover that the platform refuses is reported in the Library.** The Library
  shows a notice that names each refused file and gives the platform's own reason for it. The
  refused file does not just fail to appear in the list with no explanation.
- **The sentence is the platform's own.** The builder passes on the reason the platform gave and
  does not write its own version of it. Only where there is no reason to pass on (a dropped
  connection, an answer that could not be read) does the builder supply a generic one.
- **A conversational handover is not reported twice.** A refusal in a handover begun in the
  conversation is reported in the conversation (as already required) and not repeated in the
  Library's notice.
- **The notice is cleared by the next handover.** Each new handover clears any earlier notice
  before it starts, so a notice never stays above a list that has since accepted the file. Files
  that were accepted in the same handover still appear in the list, which is re-read as before.

## Verification

Drive a Library-route handover of two files against a platform that accepts one and refuses the
other with a stated reason. Assert the Library notice names the refused file and contains that
reason, and the accepted file is listed. Then drive a handover that succeeds and assert the
notice is empty. Drive a conversational handover that is refused and assert the Library notice
stays empty while the conversation turn carries the reason.