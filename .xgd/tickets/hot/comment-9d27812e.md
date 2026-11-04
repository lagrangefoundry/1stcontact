---
uid: comment-9d27812e
id: COMMENT-7769
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-04T17:44:06.328835+00:00'
updated_at: '2026-11-04T17:44:06.328835+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1da9821d
  kind: note
---

I filed the iteration-2 fix plan as **REPORT-10883 (`report-1da9821d`)**. It allows `apps/control-app/src/mail.ts` to be changed in this batch so the failing test can pass.

**Why the test fails:** the Resend adapter sends the message body in the provider's plain-text field (`text: message.body` at `apps/control-app/src/mail.ts:200`). The provider never gets an `html` field, so `test_UAT_AC2281_message_body_reaches_the_provider_as_html` fails. Last iteration's builder found this, made no edits because production code is frozen in this mode, and asked for the freeze to be lifted.

**My ruling:** grant the override, decided at rung 1 of the ladder (the intents in scope).
- REQ-197 is later than REQ-196 and both are in this bundle. REQ-197 says: *"The body is HTML, and it is one part"* (`request-704fe21e.md:123`). REQ-196 had already predicted this as "one line in the adapter".
- The reference state agrees on the `html` field (`mail.ts:391`).
- The reference also sends a second, plain-text copy of the body. That comes from REQ-205, which isn't in this bundle, so the builder is told not to add it.

**One batch, with these instructions for the builder:**
- Send the body as `html`, one part only, in `mail.ts`, and fix the code comment that still says the adapter sends plain text.
- Rewrite one assertion in `test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id`. It checks the exact payload and still expects `text:`, so it would break once the adapter changes. REQ-197 replaces that expectation with `html:`. I put it in the same batch as the failing test so both are settled together.
- Keep every other test that uses `mail.ts` passing: the FC_REQ-196 suite and the tests for AC2275–2278 and AC2286.

**Weak tests I flagged:**
- `test_UAT_AC2275_` never checks the body field, which is why it couldn't catch this bug.
- That test and the FC_REQ-196 adapter-shape test check almost the same thing.

The report was saved, but a connection to `github.com:22` was blocked by the sandbox during the call, so it has not been pushed to the remote.