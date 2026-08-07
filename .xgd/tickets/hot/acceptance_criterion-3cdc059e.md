---
uid: acceptance_criterion-3cdc059e
id: AC-859
type: acceptance_criterion
title: A recorded family whose entry does not list the particular file a site serves
  fails the check, naming that file
created_by: xgd
created_at: '2026-08-06T03:29:36.366074+00:00'
updated_at: '2026-08-07T18:44:56.988094+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Accounting is per file, not per family. When a site serves a font whose family is
recorded but whose particular file is not among the files that record covers, the
check fails with a violation of the unregistered-file kind naming the site, the
family, and the unlisted file, and offering the remediation of either recording
that file or pointing the page at a recorded one. A second weight or style added
by hand therefore cannot ride in on its family's existing record.

## Verification
Build a project whose record lists one weight of a family and whose site serves
two. Run the check and assert: failure overall, exactly one violation, kind
unregistered-file, and the message names the weight that is not listed and not the
one that is.