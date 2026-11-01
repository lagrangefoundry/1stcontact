---
uid: acceptance_criterion-85e54e48
id: AC-2126
type: acceptance_criterion
title: An asset loaded from inside a rendered preview is served from the same business
  as the page that referenced it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:27.557104+00:00'
updated_at: '2026-11-01T10:36:59.059692+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When a preview page is requested under `/b/<A>/preview/<slug>/<channel>/…`, the sub-resources it references document-relatively (such as images) are requested under the same `/b/<A>/` prefix and served from business A. This holds even when another business the caller holds has an asset at the same path. The preview never shows another business's assets inside A's page.

## Verification
Seed two businesses with same-named sites and same-path assets that have different bytes. Fetch A's preview, resolve an asset reference relative to the page URL, fetch it, and assert the bytes are A's.