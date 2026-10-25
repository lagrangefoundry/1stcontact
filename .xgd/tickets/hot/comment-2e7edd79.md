---
uid: comment-2e7edd79
id: COMMENT-3017
type: comment
title: Comment on request REQ-257
created_by: xgd
created_at: '2026-09-16T03:49:09.926753+00:00'
updated_at: '2026-09-16T04:19:30.164788+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-616e56ac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "790935c7-2da9-4683-bb8d-ae248ad7a71f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c156063b-d2e1-4505-abb4-7917341abf6c-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T03:48:51.717456+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c156063b-d2e1-4505-abb4-7917341abf6c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T04:19:29.850586+00:00" -->
#### Claude
Now cutting the branch.

Now the Cloudflare client.

Now I'll add the route constants and handlers.

Now the handlers. Let me find the end of the `ADMIN_BUSINESSES_PATH` handler to insert after it.

Now register the migration in the test fixture.

Now the second ticket append, covering behaviours the UATs assert.

Now commit the code on the branch.

REQ-257 is implemented, landed on `xgd-working`, and the ticket is at `free_coded`.

## What was built

**`db/migrations/0010_zones.sql`** — the `zones` table. `id` is `zon_…` from `newId` (never Cloudflare's id, which changes when a zone is deleted and re-added — the trap on-ramp). `apex` carries the unique index that decides a race. `origin` records how the zone arrived; `status` mirrors Cloudflare's. `released`/`revoked` are declared and unwritten, the way `site_domains.kind`'s `custom` is.

**`apps/control-app/src/cloudflare.ts`** — ten enumerated operations, no method taking a path. Absent token → `null` from the constructor, throw from the requiring form.

**`apps/control-app/src/resolver.ts`** — live DNS over DoH (workerd has no UDP, as `fetch-guard.ts` already records). Seven DKIM selectors probed by name; mail/web/SPF classified through declared tables; an unrecognised host is reported *as the host*, never as an absence.

**`apps/control-app/src/zones.ts`** — both guards in code, the operator backfill, the drift check (reports, writes nothing).

**Three operator routes** behind `ownsPlatformBusiness`, 404 to everyone else, plus `bin/deploy.d/secrets/40-cloudflare-dns-token`.

## Three decisions worth flagging

1. **The credential is `CLOUDFLARE_DNS_TOKEN`, not `CLOUDFLARE_API_TOKEN`.** Those exist already as the embedder's Workers-AI REST transport and are both-or-neither — declaring `CLOUDFLARE_ACCOUNT_ID` in `wrangler.toml` so production could see it would throw `PartialAiCredentialError` and take the project knowledge base down to configure DNS.

2. **No account-id key at all.** It's read off a zone the token can already see and memoised — one fewer value to get wrong, and it can't drift from the account the token actually reaches.

3. **The zone token joins `router.ts`'s `secretsOf`.** The REQ-146 structural UAT caught me returning `err.message` unscrubbed; the Cloudflare client repeats Cloudflare's own words in refusals, so that path is exactly the leak shape AC4 exists for.

## Evidence

35 UATs across three files (11 workers against real D1 + the real migration list, 24 node). Full suite: **workers 1021/1021 green**, **node 3397 passed, 2 failed** — `bug32-webui-scope-rebrand` and `test_UAT_FC_BUG-67_backend_settings`, both in files this change does not touch, so pre-existing.

Ticket body carries the design rationale in two appended sections, so reconciliation has language for every assertion. Version bumped to `0.2.217`; SHAs `73cf7260` and `d2fce8ef` recorded; branch cleaned up. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->