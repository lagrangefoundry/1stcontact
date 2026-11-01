---
uid: acceptance_criterion-eb9e7c36
id: AC-2132
type: acceptance_criterion
title: An unaccepted admitted person's page navigation is answered with the terms
  and an accept control at the requested URL
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:49.285678+00:00'
updated_at: '2026-11-01T10:46:03.550824+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted person whose recorded accepted terms version is missing or differs from the current version makes a page navigation to any builder URL (unprefixed or business-prefixed `/b/<id>/...`), the response is: status 200, content type `text/html`, body containing the heading "Terms of service", the current version identifier, and an "I agree to these terms" accept control. The builder's own content is not served. The URL is not redirected: the terms are served at the URL that was requested. A person who has never accepted and a person whose accepted version is stale receive identical treatment.

## Verification
Invite and admit a person with a real Access token, leave their accepted version empty (and separately set it to an older version), then GET the builder root and a business-prefixed builder path with `Sec-Fetch-Dest: document`. Assert 200, HTML, the version and accept control are present, no redirect `Location` header, and the recognisable builder-asset body is absent.