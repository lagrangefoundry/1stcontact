---
uid: comment-b4c437df
id: COMMENT-804
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T20:45:42.799032+00:00'
updated_at: '2026-08-07T20:45:42.799032+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7285dd57
  kind: note
---

**REPORT-1624 (report-7285dd57) — FAIL: 1 violation, 1 warning, 0 needs_review.**

Working tree clean; nothing modified (read-only check).

## What this cycle found

**This is the first `ac`-level run** — the "3 previous attempts" were the story-level cycle, which passed as REPORT-1623.

**Violation (coverage → `ac-add`):** No AC asserts that the workspace **registers an editable mode showing the site's edit channel**. STORY-99 claims it in three separate passages, it ships at `apps/control-app/src/builder/app.js:64-68`, and nothing covers it — AC-966 is View mode only; AC-968 and AC-969 are deliberately mode-agnostic (both pass with zero shipped edit mode); STORY-98's 13 ACs own the channel's *output*, not its registration; and CAP-87's AC-993/AC-1005 *presuppose* "the workspace's edit mode" in their verification without asserting it. Drop the mode and those two become unverifiable rather than failing.

**The story-level report's forwarded directive must not be actioned.** REPORT-1623 finding #1 told this cycle to add an AC for the edit transport's reachability and refusal shape. That is already claimed, once, by **AC-992** (STORY-100, CAP-86) — including the `/api/copy`-at-the-origin half and the code/path/hint client-fault refusal. Same for the served edit bridge, already claimed by **AC-1006** (STORY-101, CAP-87). The story-level cycle checked neighbouring story *bodies* but not their *ACs*, which is why it read the seam as unclaimed. Following it would have traded a coverage defect for a cross-capability duplicate — both are closed as `info` with the AC text that closes them.

**Warning (`ac-edit`):** AC-964 is written about the proxy ("forwarded verbatim", "the front reinterprets nothing", compare against "the same route fetched directly from the origin") while its own story body states the ACs are "written about *one origin* … not about a proxy, so they survive that change unaltered". When REQ-119 (`draft`) deletes the front, that comparison degenerates to self-comparison and goes **vacuously true** rather than failing.

Also verified: the truncation hazard REPORT-1623 flagged did not apply here — STORY-99's CLI body is the complete 11745 B body (blob 12235 B minus 490 B frontmatter), confirmed by substring test against `git show HEAD:.xgd/tickets/hot/story-e674c60a.md`.
