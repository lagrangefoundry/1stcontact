---
uid: report-078b06e6
id: REPORT-11069
type: report
title: 'Report: mode_override for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T21:57:53.478839+00:00'
updated_at: '2026-11-05T22:07:35.062231+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-179b8c06
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-84738adf
  quality_mode: reconcile
  justification: REQ-200, an intent in scope, requires a closed capabilities record
    ('so a typo is a validation error'); story-179b8c06 records the open record as
    a code issue; AC-2329 encodes exactly that and is right, the non-strict schema
    is wrong.
  files:
  - packages/site-schema/src/schema.ts
  rung: 1
  tip_evidence:
  - file: packages/site-schema/src/schema.ts
    lines: 1097-1107
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6f5d3da385d72a45bc48e896846f6427b35de5ca
  files_touched:
  - packages/site-schema/src/schema.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

REQ-200, an intent in scope, requires a closed capabilities record ('so a typo is a validation error'); story-179b8c06 records the open record as a code issue; AC-2329 encodes exactly that and is right, the non-strict schema is wrong.

Planner instructions for the batch:

AC-2329 is correct. REQ-200 (in scope) requires the capabilities record to be closed so a typo is a validation error, and the story already records the open record as a code issue. Make siteCapabilitiesSchema in packages/site-schema/src/schema.ts reject unknown keys, so validateSite on capabilities {acounts: true} returns ok=false with an issue naming the key, while an absent record and {accounts: true|false} still validate. Check that no committed site definition (e.g. storage/sites/1stcontact) carries any other capability key. Keep the account-chrome gating tests (AC-2330..2332) and the REQ-200 apex/session suite green.

## Diff

```diff
diff --git a/packages/site-schema/src/schema.ts b/packages/site-schema/src/schema.ts
index c34b4c42fd..17211d97fd 100644
--- a/packages/site-schema/src/schema.ts
+++ b/packages/site-schema/src/schema.ts
@@ -917,7 +917,7 @@ export const siteCapabilitiesSchema = z.object({
    * so `account-chrome` renders nothing rather than a control leading nowhere.
    */
   accounts: z.boolean().optional(),
-})
+}).strict()
 
 /** Business profile, contact, and integration config. */
 export const siteConfigSchema = z.object({

```
