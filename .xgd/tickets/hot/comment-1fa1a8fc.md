---
uid: comment-1fa1a8fc
id: COMMENT-760
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:12:08.595380+00:00'
updated_at: '2026-08-07T16:12:08.595380+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-833489a4
  kind: note
---

Cluster 7 is resolved and the report is filed.

## Decision: **Confirm — no change** for `story-e15a19ef` (STORY-79)

The cluster contained a single story, so merge was structurally unavailable; the real question was whether STORY-79's CLI-wide guarantees justify moving it off CAP-63 onto CAP-82 or CAP-89. They don't, on four grounds:

**1. CAP-63 explicitly claims this scope.** Its charter opens with "the `1c` capture → compare spine, **and the CLI surface that makes it scriptable**," and carries a dedicated scope bullet for CLI argument parsing and output hygiene. This isn't an incidental home — CAP-66 (`1c CLI Argument Parsing & Output Hygiene`) was a standalone capability, deliberately merged into CAP-63 on 2026-08-05 (`status: deprecated`, `merged_into: capability-aa030c83`) because it sat below the matrix minimum UAT threshold alone. Re-homing would reverse that decision.

**2. The other two capabilities appear only as negative space.** This was the deciding evidence. AC-1017 pins the dependency-preflight gated set as exactly `capture`, `shot`, `values-diff`, `adopt-gaps`, `crop`, `diff`, `gate`, `aligned-crops` — every one a capture/compare verb. CAP-82's `serve`, CAP-85's `builder`, CAP-86's structured-edit commands and CAP-71's `repro`/`refold`/`l1-gate` are enumerated in the **never gated** list. A capability named only in an exemption clause is not a candidate owner.

**3. No AC-level duplication in either direction.** I checked all ACs across CAP-82's three stories (AC-892–927) and CAP-89's four (AC-857–876, 939–947, 1018–1023). The adjacent-looking ones — AC-900 (deploy report lines), AC-868/AC-940 (per-command `--json` forms), AC-1022 (CLI reachability) — assert nothing about token consumption, stream routing, bootstrap suppression, flag forwarding, or preflight. The boundary is statable: **mechanics of the CLI surface (STORY-79) vs. the substance each command reports (owning capability)**.

**4. The one genuine contact point is a fixture, not a claim.** AC-739 uses "the empty starter" as an input case for the no-Astro-container assertion; CAP-89's STORY-93 owns what the starter *is*. No assertion overlaps.

**Verification:** story holds exactly one `capability_uid`; all 12 ACs still bound to it; no ticket mutations made. Report `REPORT-1581` (`report-833489a4`) created with `report_kind: overlap_resolution`, `subject_uid: report-17a279f7`, `cluster_id: "7"` (string, as the iterator requires), `result: pass`.
