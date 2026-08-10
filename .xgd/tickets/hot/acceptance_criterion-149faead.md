---
uid: acceptance_criterion-149faead
id: AC-958
type: acceptance_criterion
title: 'The edit channel is a render mode: its own output location, always rendered
  from the draft, and never entering the site''s revision history'
created_by: xgd
created_at: '2026-08-06T21:27:40.830127+00:00'
updated_at: '2026-08-10T08:49:52.498910+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Requesting a site's edit render:

- writes to an output location distinct from the preview and published channels'
  — a page that deliberately does not work can never be served from the working
  page's location;
- renders the site's **draft**, whichever source was otherwise selected: a
  revision is immutable, so asking for the edit render of one settles on the
  draft rather than combining the two, and the command reports the edit channel
  as what it rendered;
- creates no revision: the site's revision history is unchanged by any number of
  edit renders, and nothing about the edit render is publishable or
  content-addressed.

## Verification

Render a seeded site's edit channel from the command line and assert its reported
output location differs from the preview channel's and identifies the edit
channel. Request an edit render while selecting a stored revision as the source
and assert the rendered content is the draft's. Assert the site's revision
history contains no entry produced by any of these renders.