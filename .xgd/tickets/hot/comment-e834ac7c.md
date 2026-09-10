---
uid: comment-e834ac7c
id: COMMENT-2509
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T09:51:06.589777+00:00'
updated_at: '2026-09-10T09:51:06.589777+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-863a9c80
  kind: note
---

Done. Two mutations, both `ac-edit`, closing all three actionable findings.

**AC-966** (findings 1 + 2 — the one violation): its criterion asserted the pre-REQ-119 artifact-serving model and excluded "a re-generation," which is exactly the shipped mechanism (`apps/control-app/src/router.ts:578`, `:599` — I re-verified the assessor's citation rather than trusting it). I took the report's **primary** route, narrowing rather than deprecating, because one claim genuinely survives and is made nowhere else: the *ordinary* viewing mode's pane is bound to the real rendering path. AC-967 owns the selector, AC-1029 owns the editable mode — neither asserts the ordinary mode renders the operator's real site instead of a stand-in. The three now partition cleanly instead of overlapping, which is what also closes warning 2.

Byte-identity was deferred to AC-1032 and no-artifact-on-disk to AC-1031, both by reference; neither AC was touched (the report specifically warned against weakening AC-1032 to match). The new Verification explicitly *forbids* asserting byte-equality against a file on disk, naming AC-1031's guarantee — that's the guard against the stale assertion returning via the uat cycle. The title carried the stale claim verbatim, so I corrected it too.

**AC-1036** (finding 3, a warning standing through two checks): narrowed the confinement paragraph to the unknown-page and unknown-site claims AC-978 doesn't make, and stated the traversal deferral explicitly rather than leaving it implicit.

Two things worth your attention:

- **No story-body edit was needed** — STORY-99 already carries the request-time model correctly. Worth noting the default `xgd ticket get` truncates that body at ~1.5k of 39,660 chars, so a grep over it returns nothing and reads as "clean"; I checked via `--json`.
- **Downstream, not fixed here**: AC-966's evidence test (`tests/reconciliation-builder-workspace-origin.test.ts:121-147`) still repeats the deleted exclusion as a comment and asserts against a pre-rendered file that only exists because the suite pre-renders it. It now asserts more than the AC claims — a `uat-edit` for the uat cycle. I left `uat_coverage` untouched on both ACs.

Report filed as REPORT-3710 (`report-863a9c80`): `fixes_applied: 2`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. Nothing forwarded as `needs_review`.
