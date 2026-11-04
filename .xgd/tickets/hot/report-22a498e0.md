---
uid: report-22a498e0
id: REPORT-10876
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T17:32:47.852973+00:00'
updated_at: '2026-11-04T17:32:47.852973+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '6'
---

```
Story #6 created for reconciliation bundle-5052a63c

Story UID: story-7d255580 (STORY-168)
Title: Outgoing messages: author templates per business, render them under a refusing placeholder contract, and send through one port that cannot mail from a test
Type: feature
Acceptance Criteria: 12 created (AC-2275 – AC-2286)

Progress: 6 of 8 plan items complete
```

- **Capability:** no existing capability covered mail, so I created CAP-116 (capability-dfeb586b), "Outgoing Mail: Message Templates, Composition & Sending". Plan item 7 (REQ-198, the email record and delivery webhook) can go under it too.
- **What the ACs cover:**
  - **Sending (REQ-196):** AC-2275–2280. Sending through Resend returns the provider's message id. With no credential, the local adapter records the message, sends nothing and returns a `local_` id; the credential is the only switch. Both adapters refuse the same malformed messages. Send failures reach the caller. The From address must be configured. The API key is handled as a secret, including the deploy hook and the DNS runbook.
  - **Templates (REQ-197):** AC-2282–2286. The template ticket type, lookup where the newest template wins and a default is seeded once, token substitution, the three refusals, and the three business-neutral seed templates.
- **Code contradicts intent (AC-2281 will fail until the code is fixed):** REQ-197 says a message body is HTML so the invite's button works. The Resend adapter in `apps/control-app/src/mail.ts` still sends the body as plain text, so an invite would show raw `<a href…>` markup and no button. REQ-196 anticipated this as a one-field, one-line change that never landed. AC-2281 states the intended behaviour, and the story's Reconciliation Decisions record this as a code issue.
- **Gaps formalized as ACs:** five behaviours the intent doesn't spell out are recorded as decisions in the story. Placeholders are accepted as either `name` or `{{name}}`. Tokens in the subject are filled in, but declared tokens are checked against the body only. All three seed templates use the button plus a pasteable link. Archiving every template for a key brings the default back. The deploy hook warns and continues when the key is missing.

Every ticket was created and committed locally. Each write also tried to reach `github.com:22` over SSH, and the sandbox blocked it, so these commits have not been pushed.