---
uid: acceptance_criterion-212380fc
id: AC-2314
type: acceptance_criterion
title: A successful seed prints what was seeded, what was not, and how to sign in;
  --help explains the command
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:18.897524+00:00'
updated_at: '2026-11-04T18:28:58.399927+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
On success, `bin/seed` prints a report listing:
- every seeded address and business, with its state;
- a "NOT seeded" section naming the platform operator and sites;
- the `bin/access-sim` steps to sign in, including the `/login` URL.
Wrangler's per-statement output is not shown on success. `bin/seed --help` prints the usage, including the meaning of `--remote`, and exits 0 without writing anything.

## Verification
Run the seed and assert that the report contains each seeded address, the NOT-seeded section and the access-sim sign-in steps, and that it contains no per-statement JSON. Run `--help` and assert exit 0, that the usage text mentions `--remote`, and that no store is touched.