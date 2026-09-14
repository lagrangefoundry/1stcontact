---
uid: acceptance_criterion-fc82655f
id: AC-1819
type: acceptance_criterion
title: The page beside the conversation follows the assistant's writes as they land,
  and a failed reload never costs the reply
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:52:59.169670+00:00'
updated_at: '2026-09-14T08:23:52.139397+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

Each time a turn reports that the site moved, the page shown beside the conversation is
fetched again, so a request answered by several edits arrives edit by edit while the
assistant is still working rather than all at once when it stops talking. The operator
does not have to reload anything by hand to see what they asked for.

A turn that moves nothing leaves the page alone. Asking a question therefore does not
throw away where the operator had scrolled to in order to show them the same bytes.

Fetching the page again is the workspace's business and its failure is not the
conversation's: when it fails, the turn still finishes and the assistant's reply is still
shown in full.

## Verification

Run a turn whose stream reports two writes and confirm the displayed page is fetched again
twice — once per write, as each is reported, rather than once after the reply. Run a turn
that reports none and confirm the page is not fetched again at all. Make the re-fetch
throw, run a turn that reports a write, and confirm the assistant's reply still arrives
complete in the pane.