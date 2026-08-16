---
uid: acceptance_criterion-f06d0451
id: AC-1056
type: acceptance_criterion
title: 'Two sites are two conversations: a turn changes only its own site, and each
  transcript holds only its own turns'
created_by: xgd
created_at: '2026-08-10T08:35:52.915839+00:00'
updated_at: '2026-08-16T05:22:32.651868+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Each site has its own conversation with its own identifier. Two conversations may
be open at once; a turn run in one changes only that site's draft and appends only
to that conversation's turns. The other site's draft and transcript are untouched.

## Verification
Open conversations for two sites and confirm the identifiers differ. Run a
site-changing turn in each in turn: after each, only the addressed site's draft
carries the change. Re-open both conversations and confirm each holds only its own
turns.