---
uid: acceptance_criterion-3e7131f9
id: AC-2138
type: acceptance_criterion
title: Changing the current terms version re-prompts a person who accepted an earlier
  version
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:40:00.589274+00:00'
updated_at: '2026-11-01T10:46:02.239528+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
A person who accepted an earlier terms version is prompted again once the current version changes. Their navigations receive the terms page showing the new version, and their non-navigation requests are refused with 403, exactly as for a person who never accepted. The person's stored accepted version is not cleared or rewritten until they accept again. The re-prompt depends only on the stored version differing from the current one, whichever of the two changed.

## Verification
Accept the terms as an admitted person and confirm the builder is served. Then (a) run the gate with a bumped current version and (b) separately change the stored accepted version to an older value. In both cases assert a navigation receives the terms page carrying the current version and an asset request receives 403. After a fresh acceptance, assert the stored version equals the new current version.