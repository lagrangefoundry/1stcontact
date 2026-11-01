---
uid: acceptance_criterion-d63d7ff2
id: AC-2139
type: acceptance_criterion
title: The terms page renders every paragraph of the terms text and references no
  external resource
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:40:01.991672+00:00'
updated_at: '2026-11-01T10:40:01.991672+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
The served terms page renders the whole of the configured terms text: every paragraph of the single terms-text source appears in the page as its own paragraph, with HTML special characters escaped. The page is self-contained. It references no external stylesheet, no external or module script, and no import map, and it includes its styling and accept behaviour inline. So it renders and works for a session that is refused every asset.

## Verification
Fetch the terms page as an unaccepted person. Assert each blank-line-separated paragraph of the terms text appears inside a `<p>` element, and that the HTML contains no `<link rel="stylesheet">`, no `<script src=...>`, no `type="module"` script, and no `importmap`, while it does contain an inline `<style>` and an inline `<script>`.
