---
uid: comment-da313e70
id: COMMENT-855
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-09T01:02:00.844087+00:00'
updated_at: '2026-08-09T01:02:00.844087+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-147806d9
  kind: note
---

Survey complete. **REPORT-1709** (`report-147806d9`) created — kind `overlap_survey`, subject `report-69e94af9`, result **fail** (clusters found), `fields.items` carrying 10 clusters. No tickets were modified.

## Scope surveyed

21 capability tickets, but only **8 are active and hold stories**. The other 13 are already retired — every one carries `status: superseded|deprecated` plus `merged_into` / `superseded_by_uid` pointing at a surviving aggregate, and holds zero stories. They raise no competing claim, so I did not flag them; several do usefully *document* the seams their merges created, and the report cites CAP-83, CAP-80 and CAP-66 on that basis. All 25 stories are assigned; no orphans.

## The 10 clusters

| # | Boundary | Capabilities | Stories |
|---|---|---|---|
| 1 | Editing transport & client code | CAP-85 / CAP-86 / CAP-87 | 99, 100, 101 |
| 2 | Two serving surfaces (builder origin vs delivery) | CAP-82 / CAP-85 | 96, 95, 99 |
| 3 | Cross-cutting `1c` CLI correctness | CAP-63 / CAP-71 / CAP-89 / CAP-82 | 79, 97, 102 |
| 4 | Gradient: diffed axis vs authorable value | CAP-63 / CAP-70 | 76, 80 |
| 5 | Palette model vs palette retrofit | CAP-70 / CAP-89 | 80, 97 |
| 6 | Geometry math: renderer vs gate evaluator | CAP-70 / CAP-71 | 86, 83, 81 |
| 7 | Module contract accreting consumer-specified members | CAP-70 / CAP-87 / CAP-86 | 85, 98, 82, 100 |
| 8 | Closed set of asset choices | CAP-89 / CAP-86 / CAP-87 | 102, 100, 101 |
| 9 | The standard width ladder | CAP-89 / CAP-70 / CAP-71 | 93, 83, 84 |
| 10 | Pre-ship licence gate vs the deploy that refuses | CAP-89 / CAP-82 | 92, 94 |

## The strongest three

- **Cluster 2** — STORY-96 says in its own body that "the agreement is the capability, not the mapping" and that it "was closed only when both halves changed", the halves being the local preview server and the deployed site. It is filed entirely under Site Delivery while half its subject is the builder-origin serving surface.
- **Cluster 3** — the textbook "infrastructure inside one domain" signal. STORY-79 enumerates `help`, `list`, `repro`, `l1-gate`, `capture`, `values-diff`, but `repro`/`l1-gate` are CAP-71's, `1c colors` is CAP-89's, deploy/serve is CAP-82's. The merge of CAP-66 into CAP-63 specifically is what created the asymmetry.
- **Cluster 7** — "add a required member to the behavior-module contract" has *already* been filed in two capabilities: STORY-85 in CAP-70, and STORY-98 in CAP-87 imposing behaviour-off declaration on every module.

Clusters 1, 6 and 9 are boundaries the capability bodies drew deliberately (explicit out-of-scope clauses, and STORY-101 naming the split in prose) — they are flagged not because the current assignments are wrong but because no rule exists for the *next* story of that shape.
