---
uid: comment-99cf9971
id: COMMENT-2455
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T04:02:17.816213+00:00'
updated_at: '2026-09-10T04:02:17.816213+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-801f3867
  kind: note
---

**REPORT-3656 (report-801f3867) — FAIL**: 2 violations, 1 warning, 0 needs_review.

**Intent ledger**: REQ-151 (locale identity + rendered `lang`/`dir`) and REQ-153 (locale-shaped slug reservation), both `free_and_reconciled` under BUNDLE-20. No later intent retires anything here, so all 10 ACs are active — none deprecated. Three behaviors are intent-silent but recorded under the story's `## Reconciliation Decisions` (AC-1435, AC-1436, part of AC-1428); treated as grounded, not re-opened.

**AC verdicts**: 10 pass. Every AC has a substantive UAT in `tests/reconciliation-site-locale-identity.test.ts`; I ran the file — 10/10 green. The evidence is genuinely good: rendering claims are read off rendered `<html>` tags through both real emitters (`tools/generate/src/render/render.ts:208` and `packages/framework/src/l1/render.ts:2507`, which share only the resolver), the slug guard is proven at the real `editPageAdd` authoring command, and the stored-site enumerations carry non-empty guards. Nothing internal is mocked.

**Story verdict**: fail — one gap, found at the story level rather than the AC level:

> The story body and REQ-153 both state the slug reservation consults **the entire ISO 639-1 registry, "not a curated subset"** — REQ-153 names the failure mode as a collision discoverable only once a site is published under it, which is irreversible. No AC states this and no test can distinguish it. Every code currently exercised (`de`, `fr`, `en`, `ga`, `pt`, `es`) is among the most common languages, so an implementation carrying only those passes all ten UATs. The shipped code is correct (all 184 codes at `packages/site-schema/src/locale.ts:292`) — this is an evidence gap, fixed with ac-add + uat-add, no production change.

**Warning (does not affect pass/fail)**: AC-1428's published-revision loop is currently vacuous — both stored sites have `{"revisions": []}`. Correct as written; REQ-151 records zero published revisions as the reason the capability was built when it was. It becomes live on first publish with no edit.

I also flagged one near-finding as **deliberately rejected** so the editor doesn't "fix" it: the country table's 66-row breadth is unpinned on purpose — it's an open, growing data surface, and a count assertion would fight the "adding a country is a one-row data edit" property. The language registry is closed at 184, which is why pinning that one is cheap and pinning the other isn't.
