---
uid: report-132efb58
id: REPORT-10884
type: report
title: 'Report: mode_override for story-7d255580'
created_by: xgd
created_at: '2026-11-04T17:47:59.658860+00:00'
updated_at: '2026-11-04T17:56:22.680774+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: story-7d255580
  anchor_ticket: bundle-5052a63c
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-1da9821d
  quality_mode: reconcile
  justification: REQ-197 (later intent in scope) requires the message body to reach
    the provider as HTML in one part; mail.ts:200 sends it as text, so the settled
    AC-2281 test is right and the adapter is wrong. REQ-196 itself named this exact
    one-line adapter change.
  files:
  - apps/control-app/src/mail.ts
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/mail.ts
    lines: 380-392
  external_cause: null
  planner_trust_boundary: false
  granted_head: e65182775d25d1543b76488146c7a823bf2dc19f
  files_touched:
  - apps/control-app/src/mail.ts
  - tests/test_UAT_FC_REQ-196_mail.workers.test.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-197 (later intent in scope) requires the message body to reach the provider as HTML in one part; mail.ts:200 sends it as text, so the settled AC-2281 test is right and the adapter is wrong. REQ-196 itself named this exact one-line adapter change.

Planner instructions for the batch:

Root cause confirmed by the iteration-1 builder: apps/control-app/src/mail.ts:200 sends `text: message.body`, so the provider never receives `html` and AC-2281 fails. REQ-197 (request-704fe21e.md:123, later than REQ-196) decides "The body is HTML, and it is one part", and REQ-196 itself prescribed this as one line in the adapter. code_frozen is lifted for mail.ts in this batch: change the Resend payload to carry the body as `html` (one part only; do NOT add a derived text part or port textFrom, because multipart is REQ-205 and out of scope), and correct the Message.body doc comment (~lines 52-53) that says the adapter sends it as text. The exact-shape assertion in test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id expects `text: ...`; REQ-197 supersedes that, so rewrite only that field expectation to `html:`, keeping the rest of the exact payload/endpoint/bearer/id checks. All mail.ts consumer tests (FC_REQ-196 suite, AC2275-2278, AC2286) must stay green.

## Diff

```diff
diff --git a/apps/control-app/src/mail.ts b/apps/control-app/src/mail.ts
index c7ea30fa8f..0968f83bf8 100644
--- a/apps/control-app/src/mail.ts
+++ b/apps/control-app/src/mail.ts
@@ -49,13 +49,12 @@ export interface Message {
   from: string
   subject: string
   /**
-   * PLAIN TEXT. The port shape [[REQ-196]] specifies is `body`, singular, and
-   * this is it — the Resend adapter sends it as `text`.
+   * HTML, IN ONE PART. The port shape [[REQ-196]] specifies is `body`, singular,
+   * and this is it — the Resend adapter sends it as `html`.
    *
-   * No HTML alternative, deliberately: a second field is a second thing every
-   * template must decide about, and nothing sends a message yet. When [[REQ-197]]
-   * writes one that wants markup, adding it is one field here and one line in the
-   * adapter — which is a smaller change than the guesswork of carrying it now.
+   * [[REQ-197]] decided the body is HTML because its templates carry their call to
+   * action as a button, and a button does not exist in plain text. There is no
+   * derived plain-text alternative: multipart is a later intent's concern.
    */
   body: string
 }
@@ -197,7 +196,7 @@ export function resendMailer(apiKey: string, fetchImpl: typeof fetch = fetch): S
           // An array because the API takes one, even for a single recipient.
           to: [message.to],
           subject: message.subject,
-          text: message.body,
+          html: message.body,
         }),
       })
     } catch (err) {
diff --git a/tests/test_UAT_FC_REQ-196_mail.workers.test.ts b/tests/test_UAT_FC_REQ-196_mail.workers.test.ts
index 782de84df2..6651d83a80 100644
--- a/tests/test_UAT_FC_REQ-196_mail.workers.test.ts
+++ b/tests/test_UAT_FC_REQ-196_mail.workers.test.ts
@@ -61,7 +61,7 @@ describe('REQ-196 — a sendEmail port, with Resend behind it', () => {
       from: 'no-reply@1stcontact.io',
       to: ['alice@example.com'],
       subject: 'Your 1st Contact invitation',
-      text: 'Alice — your builder is ready.',
+      html: 'Alice — your builder is ready.',
     })
   })
 

```