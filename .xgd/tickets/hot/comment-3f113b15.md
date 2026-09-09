---
uid: comment-3f113b15
id: COMMENT-2354
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-09-09T23:00:17.160844+00:00'
updated_at: '2026-09-09T23:00:17.160844+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-55d8a179
  kind: note
---

Survey complete. Report **REPORT-3561** (`report-55d8a179`) created — kind `overlap_survey`, subject `report-e37a6b4a`, result **fail** (6 clusters), with all 6 items in `fields.items` and the full body persisted.

## What I surveyed

All 35 capabilities and all 45 stories. 22 capabilities are `active` and each holds ≥1 story.

**The biggest thing I ruled out:** 13 capabilities hold zero stories while stories with near-identical titles sit elsewhere (e.g. CAP-64 "1c Gradient Fidelity" empty, STORY-76 on gradients filed under CAP-63). That looked like 13 overlap clusters. It isn't — every one is `deprecated`/`superseded` with a resolution marker (`merged_into: capability-aa030c83`, body: "ABSORBED 2026-08-05 (structural rebalance)"). That's the intended post-rebalance state, so I excluded it and said so explicitly in the report.

I also applied a consistent discriminator: most capability bodies here carry an `## Out of scope` section naming neighbours by UID. Where a clause resolves the boundary in both directions, I didn't flag it — nine such pairs are listed as checked-and-resolved in the report.

## The 6 clusters

| # | Boundary | Capabilities | Stories |
|---|---|---|---|
| 1 | Deployed capture vs. the builder's own sign-in gate | CAP-63 / CAP-103 / CAP-85 | STORY-125 |
| 2 | Capture as deployed-runtime capacity vs. platform deploy config | CAP-63 / CAP-102 | STORY-124 |
| 3 | Canonical site bytes once the store moves to Cloudflare | CAP-101 / CAP-82 | STORY-121, STORY-94 |
| 4 | The change log: store write-contract vs. its own capability | CAP-101 / CAP-99 | STORY-121, STORY-115 |
| 5 | Two AI-reachable routes to change a page's words and pictures | CAP-86 / CAP-93 | STORY-100, STORY-106 |
| 6 | Two colour censuses over the same definition | CAP-98 / CAP-89 | STORY-113, STORY-97 |

Two worth calling out. **Cluster 3** is a stale-premise failure, not a vague adjacency: CAP-82 separates itself from CAP-101 with "site definitions stay canonical on the operator's machine" — and STORY-121 relocates them into D1+R2, deleting the fact that clause rests on. **Cluster 5** is a real gap in an otherwise careful partition: CAP-93 cedes only "the operator's own click-to-edit form" to CAP-86/87 — the *human gesture* — while STORY-100 claims to be "the same path the AI uses", so the AI route to changing words and images is claimed by both.

Cluster 6 is the weakest and I've marked it as such in the report — the boundary *is* documented in both directions; I flagged it per the err-toward-flagging instruction because the two artifacts collide in name, mechanism and output shape.

No tickets were modified — survey only.
