---
uid: acceptance_criterion-a4fd4459
id: AC-2159
type: acceptance_criterion
title: No generic 'is this caller an administrator' predicate exists anywhere in the
  builder's server source
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:34.399547+00:00'
updated_at: '2026-11-01T12:03:12.383843+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
No non-comment line in the builder's server source defines or uses an identifier of the form is/require/assert/ensure/check…Admin (for example `isAdmin` or `requireAdmin`). Privilege is never expressed as a reusable "administrator" check. The operator-only message and path constants (`ADMIN_ONLY_MESSAGE`, `ADMIN_BUSINESSES_PATH`) are not predicates and are not flagged.

## Verification
A static guard scans every non-comment line of the builder's server source (excluding generated output) and asserts no match. A self-check asserts `export function requireAdmin(...)` is caught, and that the two constant declarations are not caught.