---
uid: comment-4f6b5d9b
id: COMMENT-2295
type: comment
title: Comment on request REQ-196
created_by: xgd
created_at: '2026-09-06T18:42:27.236296+00:00'
updated_at: '2026-09-07T18:28:06.150855+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-920e1a2c
  kind: chat_transcript
---

<!-- xgd-turn id="72ed4db8-6e8b-4047-ad1d-48202d6eec87-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:41:50.499159+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="72ed4db8-6e8b-4047-ad1d-48202d6eec87-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:05:04.452729+00:00" -->
#### Claude
Now the wrangler config:

Now the deploy secret hook:

Now update the now-stale `invitePerson` docstring:

Now the workers UAT for the port:

Now the shared secret-hook harness and the configuration UAT:

Now rewrite REQ-149's test to use the shared harness (same test names and assertions):

Now the configuration UAT:

Now typecheck:

Now lock, merge back, and mark free_coded:

Done — REQ-196 is at `free_coded`, merged into `xgd-working`, branch cleaned.

## What landed

**`apps/control-app/src/mail.ts`** — the port and both adapters:

- `sendEmail({ to, from, subject, body }) -> { providerId }`, exactly the specified shape. `body` is plain text (Resend's `text`); no HTML alternative, because a second field is a second thing every template in REQ-197 has to decide about and nothing sends yet.
- **Resend adapter** — POSTs to `api.resend.com/emails`, returns the provider's `id`. Accepted-with-no-id is a *failure*, not a success: REQ-198 has no other way to join a bounce back to what we sent.
- **Local adapter** — records in memory, calls nothing, logs one line under `wrangler dev`. Returns a `local_`-prefixed `providerId` so REQ-198's record path has the same shape in a test as in production, and so a UAT can assert which adapter answered.
- Both adapters **share their validation**, so the local one refuses exactly what the provider refuses — otherwise every fixture passes and the first real send is the first check.
- `mailerFor(env)` selects on the credential and nothing else. No mode var, no `NODE_ENV`, no "is this a test" predicate. That's what closes the falsifier; a UAT asserts the suite's runtime carries no `RESEND_API_KEY`.
- `mailFrom(env)` throws rather than defaulting — a fallback sending address would appear exactly when the configured one went missing.

**Configuration** — `MAIL_FROM = "no-reply@1stcontact.io"` in `wrangler.toml` on both sides (verified by `wrangler deploy --dry-run`). `RouterEnv` extends `MailEnv` rather than restating the keys; `RESEND_API_KEY` joins the router's redaction set.

**`bin/deploy.d/secrets/20-resend-api-key`** — same three-way decision as the Anthropic hook, except absent-everywhere **warns and exits 0** rather than aborting. Reason recorded in the hook and the directory README: a control app with no model key does nothing at all, while one with no mail key runs the local adapter — survivable exactly as long as nothing sends. Aborting today would stop the pipeline over a capability with no caller and a DNS dependency with waiting in it.

**`apps/control-app/MAIL.md`** — the operator runbook for the long pole: the SPF/DKIM/DMARC records on `1stcontact.io`.

**No caller.** `invitePerson`'s docstring no longer claims there is no sender — it says there is one, that the invite doesn't call it, and that the message is REQ-197's.

**Tests** — 8 UATs in workerd (`test_UAT_FC_REQ-196_mail.workers.test.ts`), 6 configuration/hook UATs in node. I extracted REQ-149's stub-`npx` hook harness into `tests/support/secret-hook.ts` and moved that test onto it unchanged — the contract belongs to the hooks directory, not to either hook.

Two things worth flagging: the merge raced repeatedly with concurrent REQ-193/REQ-197 sessions, so the branch carries a few version-bump commits (the recorded SHAs are the implementation commit and the final bump to 0.2.98). And `tests/bug32-webui-scope-rebrand.test.ts` fails in this tree over two files I didn't touch — pre-existing, confirmed against the base.

<!-- xgd-chat-end -->