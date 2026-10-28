---
uid: acceptance_criterion-9c3a196d
id: AC-2057
type: acceptance_criterion
title: No file in the working tree carries the legacy role word except the alias declaration
  (system knowledge base exports excluded)
created_by: xgd
created_at: '2026-10-28T04:10:06.831792+00:00'
updated_at: '2026-10-28T04:10:06.831792+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The rename leaves no straggler. No source, configuration, test or documentation
file in the repository's working tree contains the role's former name, in any
case, except the single file that declares the read-only compatibility alias for
it. Excluded from the scan are the system knowledge base exports and their
inlined copy (rebuilt from the ticket store, so they catch up on the next
knowledge-base build), stored conversation data (deliberately not migrated),
dependencies and build output, and dot-directories (the ticket store and runtime
caches).

## Verification
Walk the repository working tree, skipping the excluded categories, and read
every `.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.html` and `.css` file. The
only file whose text matches the former role name case-insensitively is the
alias declaration; the list of offenders is empty.
