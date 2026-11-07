---
uid: report-0857c4fa
id: REPORT-11173
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-07T21:10:57.660952+00:00'
updated_at: '2026-11-07T21:10:57.660952+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7988e925
  plan_item_index: '7'
---

STORY-119 and its ACs now describe what the reworked `bin/smoke` does. Each update reported success, and STORY-119 now lists 21 child ACs, including the two new ones.

**Story (STORY-119):**
- The smoke section now says ten checks instead of eleven. Eight cover the public site, all on the published channel addressed by `--site-key`, and two check that the operator surface is private.
- There is no draft channel any more.
- `--control-origin` defaults to `https://app.1stcontact.io` only when `--origin` is the apex; no other origin gets a derived control origin.
- No check can only skip, and every skip names the one argument that would make it run.
- Decisions 10–14 are recorded under Reconciliation Decisions.

**Where I went beyond or against the plan:**
- **Two extra ACs changed.** AC-1337 still listed a "preview page lost its non-indexable marking" breakage, which no longer exists. BUG-57 also says one breakage may fail every check that shares its response, so AC-1337 now expects the owning check plus exactly those. AC-1425 said "no options means both control checks skip", which is no longer true at the apex. AC-1340 just had "slug" renamed to "site key".
- **The check count is ten, not nine.** BUG-57's "Expected result" figures (3 run / 6 skipped, 8 run / 1 skipped) add up to nine. Its own list of checks, and the code, have ten. The ACs say: no arguments against the apex gives 3 run and 7 skipped; adding `--site-key` gives 9 run and 1 skipped (the workers.dev check); with every input supplied, nothing skips.
- **No robots assertion on the published channel.** The deleted draft checks asserted one, but BUG-57 didn't port it, and a published site is meant to be indexed.

No runtime code or UATs were touched.

When the ticket updates ran, the sandbox blocked an outbound connection to `github.com:22`, most likely xgd trying to sync over git. The local ticket writes all went through; whatever it was trying to push or fetch did not.

```
Upgrade mutations applied for plan item 7 of 7

Target Stories: story-d5167ced
Primary Story UID: story-d5167ced
Stories Modified: 1
ACs Modified: 6
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d5167ced"
  acceptance_criteria:
    modified: ["acceptance_criterion-2e6c1d2d", "acceptance_criterion-aa845464", "acceptance_criterion-c63f0d1c", "acceptance_criterion-60d437e6", "acceptance_criterion-80ef1d5e", "acceptance_criterion-febb0210"]
    added: ["acceptance_criterion-04d9d9ce", "acceptance_criterion-41e34bac"]
    removed: []

Progress: 7 of 7 plan items complete
```