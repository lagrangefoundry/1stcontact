---
uid: report-d8f8a034
id: REPORT-12597
type: report
title: 'Report: mode_override for story-aacb7060'
created_by: xgd
created_at: '2026-11-11T03:26:27.737947+00:00'
updated_at: '2026-11-11T03:26:27.737947+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-aacb7060
  anchor_ticket: bundle-374f88d6
  rule: code_frozen
  quality_mode: reconcile
  rung: 1
  justification: BUG-84 (in scope) requires the seed/push rights refusal to name the
    file and its source and stay distinguishable; push.ts appended Cloudflare Access
    advice to the import route's rights 403. Planner grant COMMENT-8317 (push.ts only).
  files:
  - tools/generate/src/cli/push.ts
  tests:
  - test_UAT_AC2589_1c_push_reports_the_import_routes_rights_403_by_asset_and_bundle_without_access_advice
  tip_evidence:
  - file: tools/generate/src/cli/push.ts
    lines: 226-243
  - file: apps/control-app/src/router.ts
    lines: 1728-1735
  planner_trust_boundary: false
  granted_head: ad91a3f9479c05f6b391780c92097af8eeabfcaa
  grant_source: comment-acabc1df
---

# Mode override granted: code_frozen (push.ts only)

Grant: planner decision COMMENT-8317 (comment-acabc1df) on bundle-374f88d6, answering report-c67d242e for gap G1 of report-4f7fbff8 and restated as gap G1 of report-e87a1fe5.

BUG-84 (in scope) requires the seed/push rights refusal to tell the operator which file and where it came from, and to stay distinguishable from BUG-51's 409. At HEAD, `tools/generate/src/cli/push.ts:226` sets `refusedByAccess = bounced || res.status === 401 || res.status === 403`, and lines 239-242 append the Cloudflare Access service-token advice to every 403. That includes the import route's rights refusal, `json(403, { error, slug, asset, bundle, member })` (`apps/control-app/src/router.ts:1728-1735`, `MirroredAssetError`).

Trust boundary: none. The change alters only the message the CLI reports for a refusal it already reports. What is pushed, what is refused, the gate and credential handling are all unchanged.

## What was done (per the grant's instructions)

1. `pushSite`: when `res.status === 403` and the body parses as JSON with a string `asset`, the error names the asset and its bundle (and the member, where present). It says the bytes were mirrored from a captured page and cannot be published, and that nothing was written. It carries no Cloudflare Access advice and no `--force` advice.
2. Unchanged: 401, redirect/status 0, a 403 whose body is not the rights shape (keeps the Access advice), and 409 (keeps the `--force` advice).
3. Parsing is defensive. `rightsRefusal()` catches the `JSON.parse` failure and returns `undefined` for non-objects and for a missing or non-string `asset`, so such bodies fall through to the existing branch.
4. No file other than `push.ts` is touched in production code (`router.ts`, `asset-rights.ts` and `readSitePayload` are unchanged).

## Spec and evidence

- AC-2589 (acceptance_criterion-502bb729) gains the CLI clause.
- UAT `test_UAT_AC2589_1c_push_reports_the_import_routes_rights_403_by_asset_and_bundle_without_access_advice` in `tests/test_reconciliation_site_asset_push_rights_gate.test.ts` drives `run(['push', ...])` with `fetch` doubled at the HTTP boundary: (a) the route's rights body, (b) a plain HTML 403, (c) a JSON 403 without `asset`.
- STORY-143's "Code issue" note is replaced by a RESOLVED decision.
