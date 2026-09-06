---
uid: comment-70a8f021
id: COMMENT-2298
type: comment
title: Comment on request REQ-200
created_by: xgd
created_at: '2026-09-06T19:45:54.827375+00:00'
updated_at: '2026-09-06T20:51:08.780109+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4af0cf7f
  kind: chat_transcript
---

<!-- xgd-turn id="f82d57cf-195c-41c5-99c4-8ed016e3edb8-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:45:09.481814+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f82d57cf-195c-41c5-99c4-8ed016e3edb8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:16:45.800779+00:00" -->
#### Claude
Now the behaviour props seam:

Now register it in the catalog, registry, and exports:

Now the L2 preset:

Now wire the renderer to hand capabilities down:

Now `public-site`: session reading and the apex.

Now the routes change for the apex, then `index.ts`:

Now the UATs:

Now the public-site UATs:

<!-- xgd-turn id="7053a0fe-277e-48a4-b1aa-f7a0932e3349-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:30:46.045289+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="7053a0fe-277e-48a4-b1aa-f7a0932e3349-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:51:08.397563+00:00" -->
#### Claude
Now commit on the branch.

Now fast-forward `xgd-working`.

REQ-200 is free-coded and landed on `xgd-working`.

**What shipped** — the implementation was already written in the prior session; this turn verified, corrected the record, and landed it:

- `account-chrome` L2 behavior module (`packages/framework/src/modules/account-chrome/`) beside `contact-form`, with a slot preset registered by behavior id, gated on `site.config.capabilities.accounts`.
- All three states render into the published snapshot; `public-site` rewrites one attribute on the module root to name the current one, so the anonymous path is the identity transform and keeps its bytes, etag and shared cacheability.
- Session reader (`apps/public-site/src/session.ts`) — two narrow reads, no writes, cookie-domain checked, failed read means signed out. Session-dependent responses get `private, no-store` + `vary: cookie`, no etag, and never touch the shared cache in either direction.
- `APEX_BODY` gone; the apex resolves against `APEX_SITE_KEY`, and `storage/sites/1stcontact/` is the authored front page.

**Test results, stated plainly.** Both REQ-200 UAT files pass (21 tests), all seven amended regression files pass (66 tests), the post-merge scope including REQ-201 passes (103 tests), `pnpm -r build` typechecks clean.

The full suite has **24 failing files / 120 failing tests** — but I ran the whole suite twice, once with this ticket's changes stashed, and the failing file list is identical both times. They are environment failures in untouched areas: the shared `@lagrangefoundry/ticketing` package in `node_modules` has moved ahead of this checkout's D1 fixture (`no such table: ticket_changes`), taking down every `workers` suite that writes a ticket, plus the known-failing webui-scope and knowledge suites. The ticket body's earlier claim of "six pre-existing failures" was stale, so I replaced that paragraph with what I actually measured.

**Two commits**, both `[FREE-CODED]`: `9ff59758e8` (the work) and `75e14bcf4c` (version bump to 0.2.119 on the merged tip — `xgd-working` had already taken 0.2.118 from another ticket). Ticket is at `free_coded` with both SHAs recorded; branch and worktree cleaned up.

**One operator step remains**, as the ticket records: the apex site is committed but not published. Until `bin/publish --production 1stcontact` runs and `APEX_SITE_KEY` in `apps/public-site/wrangler.toml` is set to the minted key, the apex answers 404 and `bin/smoke`'s `apex_resolves` check fails. The key is opaque and minted at provisioning, so it could not be committed ahead of the site existing.

<!-- xgd-chat-end -->