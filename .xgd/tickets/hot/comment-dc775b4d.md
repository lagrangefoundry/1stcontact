---
uid: comment-dc775b4d
id: COMMENT-6541
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-02T04:16:55.202191+00:00'
updated_at: '2026-11-02T04:16:55.202191+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-900a9b04
  kind: note
---

I wrote UATs for the two criteria in this story that had no tests yet, AC-2235 and AC-2236; both pass. The other 28 ACs (AC-1291…1306, 1632/1633, 1647–1649, 2058/2059, 2099–2103) already have UATs in the sibling `reconciliation-system-knowledge-base*.test.ts` files, so I didn't write duplicates.

- **AC-2235:** runs the real `buildKb` on a scratch tree with four fixture documents, with a map from a "previous build" already in place. It checks the build doesn't fail with "no index for", that all four stages produce their output, that the old map is replaced by a newly generated one, and that status reports the map as built. A search keyed by `shipped` then returns the right document first.
- **AC-2236:** the real probe reports the installed knowledge component as compatible. When the probe is made to refuse, the error carries the component's own message, is an `ENVIRONMENT` error (exit 6), names the "one index per source" shape, and the hint names the install command and the call sites. Running `1c preflight` exits 0 and prints the seam result on its own line after the "Preflight passed: …" line, with neither line mentioning the other's subject.

**Setup step:** this worktree had never had `1c assets` run, so the generated `apps/control-app/src/generated/` modules were missing. Every suite that imports the `1c` CLI, including the existing sibling suite, failed to load. I ran `node tools/generate/bin/1c.mjs assets` to create them. That writes only gitignored build output, no source. After it, the sibling suite and the BUG-55 FC test pass too (21/21).

**Not checked:** I couldn't lint the new file. `npx eslint` tried to download eslint, and the sandbox blocked access to registry.npmjs.org. No runtime code or existing tests were changed.

```
UATs generated for story story-c4f329d3 (plan item 1 of 8)

Story: story-c4f329d3
Test file(s) created:
  - tests/reconciliation-system-knowledge-base-read-seam.test.ts

Tests written: 2
Tests passed: 2
Tests failed: 0

test_files_created:
  - "tests/reconciliation-system-knowledge-base-read-seam.test.ts"
```
