---
uid: report-22b124dd
id: REPORT-11484
type: report
title: 'Report: mode_override for STORY-99'
created_by: xgd
created_at: '2026-11-08T14:53:46.735331+00:00'
updated_at: '2026-11-08T14:53:46.735331+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: STORY-99
  anchor_ticket: bundle-0d00566a
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-0f13d2a4
  quality_mode: reconcile
  justification: AC-2232 states 'Every covered control takes its size from that token.
    None restates the size as a literal' and names the Contacts dialog inputs. The
    composer rule restates 13px as a literal. No intent in scope and nothing in the
    reference favours the literal (it renders the same size the token resolves to),
    so the test stands and the one declaration must change to the token.
  files:
  - apps/control-app/src/builder/builder.css
  rung: 3
  tip_evidence:
  - file: apps/control-app/src/builder/builder.css
    lines: 4082-4094
  - file: apps/control-app/src/builder/builder.css
    lines: 3951-3965
  - file: apps/control-app/src/builder/builder.css
    lines: 118-118
  external_cause: null
  planner_trust_boundary: false
  granted_head: 07efe0e79e65339d7f211f39d5f5438ca2c8f904
---

# Mode override granted: code_frozen

AC-2232 states 'Every covered control takes its size from that token. None restates the size as a literal' and names the Contacts dialog inputs. The composer rule restates 13px as a literal. No intent in scope and nothing in the reference favours the literal (it renders the same size the token resolves to), so the test stands and the one declaration must change to the token.

Planner instructions for the batch:

The only remaining failure is AC-2232's mounted-ancestry typography test, which reports the Invite composer's Subject input and To-list/Body textareas as 'sized, but not by the control token → 13px'. The builder's iteration-1 diagnosis holds and is now unblocked by the code_frozen override on builder.css: in the `.builder-people__subject, .builder-people__tolist, .builder-people__body` rule (working tree builder.css:2041-2053), replace the trailing literal `font-size: 13px;` with `font-size: var(--builder-control-font-size);`, keeping it immediately after `font: inherit;` as AC-2232's source-order clause requires. Change nothing else in the stylesheet. Leave the test and AC-2232 alone. The other nine tests were fixed in iteration 1 as stale tests (person rename per REQ-194, site_assets by site_id, WEBUI_SCOPE, three Contacts dialogs, /api/material/changes probe). Confirm they are still green and do not rework them. Ignore AC965's wrangler/api.cloudflare.com timeout: it is a sandbox network limit and not in this batch.
