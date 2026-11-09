---
uid: report-9412b57d
id: REPORT-12027
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-44'
created_by: xgd
created_at: '2026-11-09T21:45:59.493697+00:00'
updated_at: '2026-11-09T21:45:59.493697+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-44
---

Cherry-pick of 486810a855 ("fix(tests): the suite is evidence again — 17 failures, six causes [FREE-CODED]") conflicted on four files. All four are resolved and staged; no unmerged entries remain; CHERRY_PICK_HEAD is intact for cherry_pick_finalize_resolution.

## Files resolved

- `tests/support/scripted-model-client.ts`: code file (2c), overlapping region. Incoming is a superset of HEAD (2c.3a): HEAD added `systemText` only; incoming adds `turnTailText`, `sentText` and its own `systemText`. Took incoming fully. Note: incoming `systemText` joins system blocks with `''` where HEAD joined them with `'\n'`; incoming's doc explains why (the blocks are slices of one assembled string, so concatenation reproduces it exactly).
- `tests/reconciliation-builder-workspace-origin.test.ts`: code file (2c), overlapping region. Incoming is a superset (2c.3a): HEAD added one `/api/material/changes` freshness probe; incoming adds probes for `/api/material/name`, `/api/material/recipe` and `/api/material/changes`. Took incoming and dropped HEAD's duplicate `changes` entry so the route is not probed twice. HEAD's separate, non-overlapping change (`dist-assets.*` excluded from the walk) is kept.
- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`: code/UAT test file (2c/2f), mutually exclusive imports (HEAD builds specifiers from `WEBUI_SCOPE`; incoming uses `importWebui`). Incoming wins (2c.3c). The `WEBUI_SCOPE` import was removed because nothing else in the file uses it. No test function removed.
- `tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts`: UAT test file (2f), a single comment line both sides reworded differently. Incoming wording kept (2c.3c). No test function touched.

## Incoming changes preserved

`git diff --cached 486810a855` over the four files shows that scripted-model-client, BUG-42 and REQ-199 match the incoming commit exactly. The only difference in workspace-origin is HEAD's own non-overlapping `dist-assets.*` walk exclusion. No incoming hunk was dropped, and the BUG-1301 exception was not used.

## Spot checks

Each suite run on its own with the Node vitest config:
- test_UAT_FC_BUG-83_suite_is_evidence_again: 5/5 passed
- test_UAT_FC_BUG-42_markdown_rendering: 6/6 passed
- test_UAT_FC_REQ-207_image_describer_session (HEAD caller of `systemText`): 8/8 passed
- test_UAT_FC_REQ-182_priming_is_configuration: 12/12 passed
- test_UAT_FC_BUG-63_priming_configuration: 6/6 passed
- reconciliation-builder-workspace-origin: NOT VERIFIED. Its `beforeAll` starts a local server, and this sandbox refuses local port binding (`listen EPERM 0.0.0.0`). The resolved region is the probe table, which needs a run where local binding is allowed. Flagged for post-merge review.

## Post-merge review flags

The enrichment marked all four files as intent-unknown on one side ("flag for post-merge review"). The flag matters most for workspace-origin, which could not be run here. The REQ-199 workers suite was not run.
