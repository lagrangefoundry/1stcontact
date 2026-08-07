---
uid: comment-6ad8763e
id: COMMENT-799
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T20:05:00.450815+00:00'
updated_at: '2026-08-07T20:05:00.450815+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-472feebd
  kind: note
---

**Result: FAIL** — REPORT-1619 (`report-472feebd`), 1 violation, 3 warnings, 0 needs_review. Working tree clean; no tickets, tests or code modified.

**Attempt 1's three findings are verified repaired.** STORY-99 now expresses the edit transport (with the "one seam, claimed once" split against CAP-86/STORY-100), the unconfigured-vs-unreachable origin failures, and carries zero `CAP-84` references; CAP-85's body was widened to match. STORY-100 still holds only the complementary half, so no exclusivity problem was introduced.

**The new violation is a different defect, found by running the origin rather than reading the matrix.** STORY-99's freshness bullet and AC-977 both state a universal — "every response … is served as non-cacheable", "one exempt response is enough". It ships false: `json()` at `tools/generate/src/cli/builder.ts:129-137` writes only `content-type`/`content-length`, and all five JSON routes use it. I started `bin/1c builder --port 4291` against this checkout: `GET /api/sites` and `GET /api/assets?slug=1stcontact` both return 200 with **no `cache-control` at all** — no freshness directive and no validator, exactly the combination COMMENT-601 calls "the worst available", sitting on `/api/copy` (the field values the modal shows) and `/api/sites` (the selector's list). The code's own comment at `:166` asserts the opposite. Cheapest repair is one line of code, not a matrix edit; the AC-977 UAT probes only `/builder/*`, `/preview/*`, `/` and `/webui/*`, which is why the hole is green (warning #2, same pass).

The two other warnings are the same under-expression species as attempt 1: the origin's "what it serves" enumeration omits the edit bridge served at `/framework/edit-client.js` (REQ-117, shipped at `builder.ts:311`, claimed by no story), and the story body is silent on the tab-declaration integrity that active AC-976 claims.
