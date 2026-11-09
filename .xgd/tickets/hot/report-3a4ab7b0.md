---
uid: report-3a4ab7b0
id: REPORT-11631
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T00:31:11.088020+00:00'
updated_at: '2026-11-09T00:31:11.088020+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7ba3af93
  plan_item_index: '7'
---

```
Story #7 created for reconciliation bundle-7ba3af93

Story UID: story-f2e5032c (STORY-177)
Title: Public forms accept a submission: anonymous lead capture with asset delivery and anti-abuse controls
Type: feature
Acceptance Criteria: 17 created (AC-2500 – AC-2516)

Progress: 7 of 8 plan items complete
```

The story sits in capability-e5939ceb (CAP-114). Its 17 criteria cover:
- **The endpoint and tenant:** capture on the site's own origin, including the apex path; repeat submissions of the same address (any case) make one contact; the tenant comes only from the URL.
- **Responses:** one byte-identical acknowledgement for every outcome that depends on who submitted; an HTML confirmation page when JavaScript is off.
- **What is recorded:** a provenance event per submission. The consent wording comes from the site's published definition, and every declared checkbox is recorded whether ticked or not.
- **Controls:** the honeypot, Turnstile with fail-closed behaviour, a rate limit keyed on site and source IP, body and field limits, and a 503 refusal when the deployment can't record a submission.
- **Asset delivery:** at most once per address, with only authored content in the mail; addresses with a bounced or complained message are never sent to.
- **The internal seam:** the write path into the control app is a named RPC entrypoint that no URL reaches.
- **The form itself:** the checkbox field type, the per-form instance id, the edit render still unable to post, and the Turnstile sitekey and script added when pages are served.

Where REQ-223 was silent, I settled the point at reconciliation and recorded it under `## Reconciliation Decisions`. These include what happens with an unknown site or a submission with no address, the 503 refusal, a half-declared asset, and the order of the controls. I found no case where the code contradicts the intent.

**Decision for you:** the Security Policy (§5) says published sites load no third-party script except Stripe.js. REQ-223 deliberately adds Cloudflare's Turnstile script on pages with a form. The code follows REQ-223, so this isn't a code defect, but the policy document needs a second named exception. I've flagged it in the story's Technical Context.

The `complained` status and the change to the published site's read-only rule are left for plan item 8.

All ticket writes succeeded as local commits. Each one also tried to reach `github.com:22`, and the sandbox blocked it, so these commits are local only until the outer workflow pushes them.