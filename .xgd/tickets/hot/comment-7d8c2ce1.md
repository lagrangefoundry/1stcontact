---
uid: comment-7d8c2ce1
id: COMMENT-320
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-07-23T06:20:40.087329+00:00'
updated_at: '2026-07-23T06:20:40.087329+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-17fad7e0
  kind: note
---

The report landed correctly. `result: "pass"` is set (in frontmatter), and `fields` carries `report_kind: overlap_resolution`, `subject_uid: report-9260fc31`, and `cluster_id: "4"` (string, as required by the iterator).

## Cluster 4 resolved — both stories confirmed, no changes needed

**Boundary question:** For a CLI flag consumed by the diff commands, does parsing/propagation belong to CLI arg-hygiene (CAP-66) or to the diff capability that gives the flag meaning (CAP-65)?

**Analysis:** The two stories concern **different flags at different layers of concern**, so there's no true overlap to collapse:

| Story | Capability | What it actually owns |
|-------|-----------|----------------------|
| STORY-79 | CAP-66 (CLI Arg Parsing & Output Hygiene) | Flag-**shape**/composability mechanics that are agnostic to any flag's meaning — boolean-vs-value parsing (AC-656), `--json` stdout/stderr hygiene (AC-657/658/659), store-flag propagation (AC-720). The named flags (`--multi-viewport`, `--json`, `--sandbox`) are vehicles for a generic guarantee. **No AC touches `--size`.** |
| STORY-77 | CAP-65 (Size-Aware Diffing) | The `--size` selector's meaning end-to-end, including validating its accepted vocabulary (AC-645) — which is enum-checking a **domain vocabulary** defined by the viewport ladder, not a generic parsing rule. |

**Resolution:** Confirm both (Option C). The boundary is clean:
- Generic parse mechanics applicable to *any* flag → CAP-66
- A domain flag's meaning *including validation of its own value vocabulary* → the capability that defines that vocabulary (CAP-65)

No merge (no duplicated behavior), no reassignment (no misfiled AC). Both stories remain singly-assigned to the correct capability; all AC relationships intact.

**Report:** REPORT-780 (`report-17fad7e0`), result `pass`, `cluster_id: "4"` — the iterator will now detect cluster 4 as complete.
