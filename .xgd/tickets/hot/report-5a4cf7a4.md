---
uid: report-5a4cf7a4
id: REPORT-2101
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-16T09:43:06.493421+00:00'
updated_at: '2026-08-16T09:46:22.597778+00:00'
completed_at: null
last_field_updated: body
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 3
  warnings: 4
  needs_review_count: 0
---

placeholder - body appended below

TEST-PERMISSION-PROBE

PROBE-LINE-1
PROBE-LINE-2

PROBE-SIZE-TEST. The capability has exactly one story, STORY-99 (story-e674c60a, story_kind upgrade), carrying 30 active ACs. Cross-story exclusivity is therefore trivially satisfied; every question here is whether an AC follows from the body of STORY-99 and whether the 30 collectively cover it. The last ac-level check was REPORT-1626 dated 2026-08-07 with a PASS and zero findings, and it predates almost half of the current AC set. AC-1030 was authored on 2026-08-08. AC-1029, AC-1031 through AC-1036 and AC-1110 were authored on 2026-08-10, together with the REQ-119 rewrite of the STORY-99 body.

PROBE-MULTILINE-MD

**Result**: FAIL
**Violations**: 3

| # | Severity | Element |
|---|---|---|
| 1 | violation | AC-966 |

Cross-story exclusivity is trivially satisfied because the capability has exactly one story. The question at this level is whether each AC follows from the body of STORY-99 and whether the thirty of them collectively cover its behavioural surface without overlapping each other.



(The lines above are permission-probe artifacts from a session in which only append-writes were permitted. The report begins here.)

**CAPABILITY-INTENT ALIGNMENT — Builder Workspace: Chrome, Origin and Display Panel — LEVEL: ac**

**Result**: FAIL
**Violations**: 3
**Warnings**: 4
**Needs review**: 0


The capability has exactly one story — STORY-99 (story-e674c60a, story_kind: upgrade) — carrying **30 active ACs**. Cross-story exclusivity is therefore trivially satisfied; every question at this level is 'does this AC follow from the body of STORY-99, and do the 30 collectively cover it'.

**The last ac-level check was REPORT-1626 (2026-08-07, PASS 0/0/0). It predates almost half the current AC set.** AC-1030 was authored 2026-08-08; AC-1029, AC-1031 through AC-1036, and AC-1110 on 2026-08-10, together with the REQ-119 rewrite of the STORY-99 body from *serving a stored rendering* to *producing the channel on request*. Those seven ACs and the body change have never been ac-checked against each other. Two of the three violations below live exactly in that unchecked window.

**Cascade note.** The story-level cycle for this capability ran about a minute before this check and **FAILED** — REPORT-2100 (report-4d9be4ea, 2026-08-16T09:28Z, 2 violations, 1 warning), unrepaired at the time of writing. Its two violations are coverage gaps whose stated resolution is 'story-body-edit + **ac-add**'. The ac half of that resolution is findings 2 and 3 below. Per the level cascade the STORY-99 body is *not* a clean working reference for those two behaviours, so they are carried forward rather than assumed correct.

**CUMULATIVE INTENT CONSIDERED**

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-16 | bundle-15c1f647 | free_and_reconciled | 2026-08-07 (1741ee5d) | REQ-115 + REQ-117 + REQ-44; the intent_uid of STORY-99 | YES |
| REQ-115 | request-a6740b4a | free_and_reconciled | 2026-07-31, merged 08-07 | Builder shell: webui consumption, site tab, multi-mode panel and toolbar. Origin of AC-959 through AC-979 | YES |
| REQ-117 | request-395b67e6 | free_and_reconciled | 2026-07-31, merged 08-07 | Copy editing end-to-end. Contributes to **this** capability: /api/copy as a thin transport on the builder origin, and /framework/edit-client.js type-stripped from the source the renderer is built from | YES |
| REQ-44 | — | free_and_reconciled | 2026-08-07 | Install preflight; builder explicitly ungated — no ask lands here | YES (no ask) |