---
uid: comment-c3e2405b
id: COMMENT-3019
type: comment
title: Comment on request REQ-258
created_by: xgd
created_at: '2026-09-16T17:23:27.945287+00:00'
updated_at: '2026-09-16T18:19:42.145760+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a6540f61
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3abaa7be-b517-495b-9171-4dcfb5d2818e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f68e784b-a367-4407-932e-7e0c9318c70f-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T17:22:46.735082+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f68e784b-a367-4407-932e-7e0c9318c70f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T17:53:58.425377+00:00" -->
#### Claude
I have what I need. Before coding, I settled the one risk the ticket says must be settled first — and it's settled from wrangler's own source rather than needing a live zone experiment.

Now the migration — the one schema addition.

Now the claim path's canonical handling and the new custom-domain operations.

Now the mechanism module.

Now the public-site side — host→site resolution.

Now the store read in `public-site`.

Now `index.ts` — the request flow.

The ticket's named risk turns out to be **real**. Let me settle it properly.

The risk is real: wrangler `PUT`s the whole route list and its own source says *"PUT will delete previous routes on this script."* That changes the config side of the ticket.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="a62adba4-eb12-423d-835a-94a85c9396ab-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:07:56.397847+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="a62adba4-eb12-423d-835a-94a85c9396ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:19:41.545990+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state first.

All 26 REQ-258 UATs pass; full workers project (1041 tests) green; the only node failure I caused was REQ-257's enumeration assertion, now updated. The other two node failures are pre-existing on `xgd-working` (verified in the main checkout).

Now let me bring the branch current and update the ticket body before committing.

Now let me update the ticket body to record what was actually built, before committing.

Now lock and merge back into `xgd-working`.

REQ-258 is free-coded and landed.

**What shipped** — commit `3d35f86d5a`, version `0.2.220`, merged into `xgd-working`, branch cleaned.

The ticket's named risk was the gate, and it is settled from wrangler's own deploy path rather than a throwaway-zone experiment: a `routes` entry *without* `custom_domain` is a zone route, published with a `PUT` carrying the whole list — wrangler's source comments the line *"PUT will delete previous routes on this script."* One such entry would make every deploy delete every customer domain. Runtime routes are therefore viable **provided this Worker declares no zone route at all**. `*.1stcontact.io/*` was the only one, was declared and by its own comment never served, and is gone; a static UAT holds the rule because the failure mode is silent and total.

The three mechanisms:

- **`apps/control-app/src/serving.ts`** — records → routes → row, every step undone in reverse on failure. Proxied records at RFC 5737 / RFC 6666 addresses (deliberately unroutable, so a bypassed proxy fails rather than reaching a stranger), a no-op when already correct, replacements reported rather than swallowed, depth beyond Universal SSL's one label refused at the door.
- **`hostname.ts`** grew the custom-domain operations, which **delete** rather than revoke — a domain the business bought is not the scarce first-come namespace `1stc.site` is, and a tombstone would make us the reason they cannot move it. `0011_site_domains_canonical.sql` adds `canonical` plus a partial unique index, because `www` makes two hosts reach one site in the ordinary case.
- **`public-site`** resolves `Host:` → `site_domains` → site, with `siteOfRoute` as the single spelling of the cross-tenant guard: a bound host serves exactly its own site, `/site/<its key>/…` 301s to root-relative so already-mailed gated-download links keep working, and any other key 404s — including on the lead endpoint, which would otherwise file enquiries into another tenant's contact list.

**Tests**: 26 new UATs across three files, all passing. Full workers project green (1041 tests). Node project green apart from two failures I verified as pre-existing on `xgd-working` (`bug32-webui-scope-rebrand`, `BUG-67 backend settings`) — unrelated to this work. `tests/test_UAT_FC_REQ-257_cloudflare_client.test.ts` needed one entry added for `listRoutes`; the assertion is still an exact equality.

The ticket body now carries a "What was built" section covering the consequential behaviour the original scope did not name — the rollback, the release path and its `listRoutes` read, the admin entry point, the `replaced` report, the syntactic refusals, and the one-hop redirect rule — so reconciliation has language to attach every UAT to.

Ticket is at `free_coded` with `story_points: 8`. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->