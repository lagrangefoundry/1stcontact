---
uid: acceptance_criterion-9e80a8dd
id: AC-2102
type: acceptance_criterion
title: One release command runs export, index, map and packing in the fixed order
  and stops at the first failing step
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:04:52.944734+00:00'
updated_at: '2026-11-01T09:04:52.944734+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

One **release command** (`bin/kb-release`) builds the system knowledge base and packs it, in a fixed order, as a single operator action:

1. the knowledge-base build — which itself exports the corpus, writes the projected references, builds the document index and the passage index, and generates the awareness map, in that order;
2. the application asset build, which packs the result (and refuses a skewed one);
3. a report of what is built.

It **stops at the first step that fails** and exits with that step's failure, so packing never runs on top of a failed build. `--status` reports what is built without building anything; `--help` prints usage and exits successfully; any other argument is refused with a failing exit and builds nothing.

## Verification

Read the release command and assert the knowledge-base build is invoked before the asset build, and that the script runs under fail-fast shell options (exit on error, unset variable, and pipeline failure). Assert the command exists and is executable. Assert an unknown argument exits non-zero.
