---
uid: comment-30fae4fc
id: COMMENT-798
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T19:55:12.569004+00:00'
updated_at: '2026-08-07T19:55:12.569004+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6d2f7dbd
  kind: note
---

All three actionable findings applied; completion report `REPORT-1618` (`report-6d2f7dbd`) created.

## What changed

**STORY-99 (`story-e674c60a`)** — 5 body edits:

1. **Finding #1 (violation, coverage)** — the single-workspace-origin in-scope bullet now enumerates the origin's operations as listing the store, publishing, **and** the write path's read-and-apply steps "as a thin transport that adds no semantics of its own", with a refused edit arriving as an *expected* refusal carrying the write path's own code/path/hint. The ownership split is stated explicitly so CAP-85 claims only reachability, not semantics.
2. Out-of-scope editing bullet amended so it no longer reads as excluding the transport it now claims.
3. New Technical Context bullet naming CAP-86 / STORY-100 as the definer and this story as the other half — resolving the mutual-deferral state where each story named the other as owner.
4. **Finding #2 (warning)** — both stale `CAP-84` pointers repointed to CAP-87 / STORY-98. Verified CAP-84 is `superseded_by_uid: capability-12fee326` and STORY-98 now carries CAP-87. Zero `CAP-84` occurrences remain in STORY-99.
5. **Finding #3 (warning)** — new bullet: unconfigured vs. unreachable origin are two distinct self-explanatory failures, tracking AC-965 without duplicating its verification clause.

**CAP-85 (`capability-a994b8f3`)** — the capability-half widening the finding explicitly asked for: origin scope bullet extended past "(listing the store, publishing)", plus an "Edit semantics" out-of-scope bullet.

Every behavioural claim was checked against the code first (`builder.ts:225`/`:353-362` for the transport and the 400 envelope; `control-app/src/index.ts:27-33`/`:43-48` for the 503/502 split), so these are matrix under-expression fixes — no code edits, and none needed.

**Forwarded, not done:** the AC for the transport is deferred to the `ac`-level cycle per finding #1's own wording; STORY-100's identical stale `CAP-84` pointer (body line 137) sits outside this capability and needs the same one-line repoint when CAP-86 is validated.
