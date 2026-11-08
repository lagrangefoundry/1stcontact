---
uid: acceptance_criterion-0c564bfd
id: AC-2432
type: acceptance_criterion
title: A dialog node renders as an accessible panel inside a covering shell
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:07.973484+00:00'
updated_at: '2026-11-08T13:25:17.058845+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
A node carrying `dialog` renders with `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`, and `aria-label` equal to the role's `ariaLabel` when one is given (no `aria-label` when absent). The panel element keeps its own `id`, class and declarations and is wrapped by a separate shell element. The panel is not replaced by the shell.

## Verification
Render a document with a labelled panel and an unlabelled one. Assert the panel attributes, that the panel's `id` is on the panel and not on the shell, and that the panel is the shell's child.