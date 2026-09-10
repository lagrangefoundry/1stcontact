---
uid: acceptance_criterion-285b8c08
id: AC-972
type: acceptance_criterion
title: Publishing from the workspace produces a new revision of the displayed site
  through the platform's existing publish path
created_by: xgd
created_at: '2026-08-07T01:44:45.365275+00:00'
updated_at: '2026-09-10T11:07:18.047982+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Invoking publish from the workspace publishes the site currently displayed —
not a default or previously selected one — producing a new entry in that site's
revision history with the same semantics as publishing from the command line.
No publish semantics exist only in the workspace: the workspace reaches the
platform's existing publish path and adds nothing to it.

That the published channel is then *served* from the origin, and that what comes
back is what publishing produced, is not asserted here. AC-1035 owns it, in the
stronger form — the response equals the artifact publishing produced, and the
published channel is not derived from the current draft. This criterion stops at
the invocation and the revision it appends, which is the half that is the
workspace's own. The story's out-of-scope line is the reason for the split: what
publishing does, and how published bytes are served, are the two halves of the
delivery capability and are owned there.

## Verification

Select a site in the workspace, invoke publish, and assert: a new revision is
appended to that site's history, and the revision is locked in the same form as
a command-line publish produces. Select a different site first and assert the
revision is created for that site, not for the previously selected one.

Do not restate the serving assertion — requesting the published channel over the
origin and comparing what comes back is AC-1035's probe and is not repeated
here.