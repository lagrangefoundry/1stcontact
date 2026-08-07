---
uid: acceptance_criterion-3d85c7cc
id: AC-863
type: acceptance_criterion
title: 'Outstanding licence work warns without failing: the run passes and the report
  names each family with open actions, the actions themselves, and the sites that
  reference it'
created_by: xgd
created_at: '2026-08-06T03:30:32.003032+00:00'
updated_at: '2026-08-07T18:45:00.842311+00:00'
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
Recording a font is provenance, not approval. A family whose record carries
outstanding licence work does not fail the check on that account: the run's
overall result is a pass, and the report carries an advisory entry for that family
naming the outstanding items verbatim and listing every site that references it,
so an open obligation has a visible blast radius. A family with no outstanding
work produces no advisory entry.

## Verification
Build a project whose record carries one family with one outstanding action, and a
site referencing it. Run the check and assert: overall pass, exactly one advisory
entry, its family is the recorded one, its actions match the recorded text, and
its listed sites are the ones referencing that family. Remove the action and
assert no advisory entry is produced.