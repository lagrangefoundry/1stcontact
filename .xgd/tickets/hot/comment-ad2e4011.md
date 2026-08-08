---
uid: comment-ad2e4011
id: COMMENT-837
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-08T00:17:50.664490+00:00'
updated_at: '2026-08-08T00:17:50.664490+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-90d1930c
  kind: note
---

**REPORT-1670** (`report-90d1930c`) created — schema verified: `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-ae9d65d6`, `level=ac`, violations 3 / warnings 4 / needs_review 0.

## Result: FAIL

**Important context:** the story-level cycle ran immediately before this one (REPORT-1668, 5 violations) and **no repair landed** — the only commits after it are the report, its comment, and the workflow marker. So I used story bodies as the working reference except in the two areas story level proved unreliable (STORY-82's body; the REQ-93 silence), where I went to intent and code directly.

**Surface checked:** 98 ACs across 7 stories — up from the 24 the last ac cycle (REPORT-1315, 2026-08-05) saw. **74 have never been through an ac cycle in this container**; all were read in full.

**Violations (3)**

1. **AC-718** — four distinct drifts in one AC: retired `capability` type name (×6, incl. a Verification step naming a symbol family that no longer exists); the deleted `submit`/`intro` slots (`meta.ts:57-77` declares one required `form` slot with `submit` as a *control*); a stale config set (`submitLabel`, `fields[].labelMode` missing); and a flat negative on placeholder labelling that REQ-93 re-introduced as a captured a11y fact.
2. **AC-719** — "(or a named overlay role)". REQ-114 deleted the colour-role vocabulary; siblings AC-935 and AC-928 assert the opposite. **Second consecutive ac cycle to raise this clause** — REPORT-1315 Finding 2 flagged it on the older grounds and it survived unrepaired.
3. **REQ-93 coverage hole** — page-level slot binding (`site-schema/src/schema.ts:483-599`, five rejection classes) and the render-time mount (`l1/render.ts:1998-2014`) are live and named in no AC. AC-723 isn't *wrong*, but it now reads as the whole truth about a slot. Sequenced after the story-level fix.

**Warnings (4):** AC-716 restates AC-928/AC-931 (widened by REQ-114 without trimming the newer ACs); AC-932 asserts retrofit-conversion behaviour STORY-80 scopes out and STORY-97 already owns in AC-941…944; AC-703's client-side half duplicates AC-877; AC-686 ¶2 duplicates AC-849.

Nothing new is wrong in the 74 newly-visible ACs — STORY-90, STORY-91, STORY-81 and STORY-83's additions all verify. Both violations sit in the same two `pending` ACs under the one story with `uat_coverage: stale`. No code issues; every code claim was checked in this worktree rather than carried over.
