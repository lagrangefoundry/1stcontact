---
uid: report-96aef569
id: REPORT-11085
type: report
title: 'Report: mode_override for story-179b8c06'
created_by: xgd
created_at: '2026-11-07T06:16:18.206996+00:00'
updated_at: '2026-11-07T06:22:54.471087+00:00'
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
  granted_head: 693c1d6607eb05863539a6a56ec2dc1cba727a25
  files_touched:
  - tests/reconciliation-behavior-account-chrome.test.ts
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
diff --git a/tests/reconciliation-behavior-account-chrome.test.ts b/tests/reconciliation-behavior-account-chrome.test.ts
index ee4615ac5e..7ae65c15df 100644
--- a/tests/reconciliation-behavior-account-chrome.test.ts
+++ b/tests/reconciliation-behavior-account-chrome.test.ts
@@ -173,7 +173,17 @@ describe('story-179b8c06 — account-chrome is gated by a site declaration', ()
     // The record is CLOSED: a misspelt capability key fails site validation
     // rather than being silently dropped.
     const typo = buildSite({ capabilities: { acounts: true } })
-    expect(validateSite(typo).ok).toBe(false)
+    const typoResult = validateSite(typo)
+    expect(typoResult.ok).toBe(false)
+    if (!typoResult.ok) {
+      const capIssues = typoResult.errors.filter((e) => e.path.includes('capabilities'))
+      expect(capIssues.length).toBeGreaterThan(0)
+      expect(capIssues.map((e) => e.message).join(' ')).toContain('acounts')
+    }
+    // ...while the spelt-correctly record (and its absence) still validates.
+    for (const capabilities of [undefined, { accounts: true }, { accounts: false }]) {
+      expect(validateSite(buildSite({ capabilities })).ok).toBe(true)
+    }
   })
 })
 

```
