---
uid: comment-c3e2405b
id: COMMENT-3019
type: comment
title: Comment on request REQ-258
created_by: xgd
created_at: '2026-09-16T17:23:27.945287+00:00'
updated_at: '2026-09-16T19:17:59.400115+00:00'
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

<!-- xgd-turn id="03776d74-875d-4777-9258-98bd04b00c85-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:29:31.361372+00:00" -->
#### You
With this ticket what can I see on the UI? Do I need to deploy, asset, restart the server to see it?

<!-- xgd-turn id="03776d74-875d-4777-9258-98bd04b00c85-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:31:06.881484+00:00" -->
#### Claude
Short answer: **nothing in the UI.** This ticket deliberately has no customer-facing surface — the ticket says so outright: *"No customer-facing surface; ticket C is what puts a button on this."* Let me verify what the local story actually is rather than guess.

**No UI. Nothing to see in the browser.** That's by design, not an omission — the ticket says *"No customer-facing surface; ticket C is what puts a button on this."* The diff touches zero webui files. `/api/admin/domains` joins `/api/admin/zones` (REQ-257) as a curl-only operator surface; neither has a front end.

So the question is really "can I exercise it", and here's the honest state, checked rather than assumed:

### The one thing that's genuinely required: the migration

Your local control-app D1 is at `0010_zones.sql`, and `site_domains` has **no `canonical` column**. Nothing in this ticket works until that's applied:

```
cd apps/control-app && npx wrangler d1 migrations apply DB --local
```

(`bin/seed` documents this same form.) For remote, `bin/deploy.d/migrate/10-d1-site-store` runs it with `--env "$DEPLOY_ENV" --remote`.

### `./bin/1c assets` — not needed

No builder JS was touched. Assets only matter for `src/builder/*.js`.

### Restart — yes, both

Both Workers' source changed: control-app (`serving.ts`, `router.ts`, `hostname.ts`, `zones.ts`, `cloudflare.ts`) and public-site (`index.ts`, `routes.ts`, `site-store.ts`, `gate.ts`). `./bin/1c builder` and `wrangler dev --port 8787` respectively.

### The catch for local demoing

public-site's local D1 is a **separate database** from control-app's — no `--persist-to` sharing, and it shows: 4 KB and empty versus control-app's 2.8 MB. It has no `site_domains` table at all. That is exactly the case `readHost`'s catch block was written for, so locally the resolver logs `host_resolution_failed` and answers "unbound" — which means public-site behaves precisely as it did before this ticket.

So the interesting half — a bound host serving one site at its root, `/site/<key>/` 301ing, another key 404ing — isn't demoable locally without hand-seeding public-site's own D1 with the `site_domains` schema and a row for `localhost`. Doable, but it's `wrangler d1 execute` by hand, not a one-liner.

### Deploy is what makes it real

A custom domain needs a real zone in the account, real proxied records, a real Worker route and a real certificate — none of which exist locally. Deploying also matters for one thing specifically: **the `*.1stcontact.io/*` route removal only takes effect on a `wrangler deploy` of public-site.** Until that deploy, the account still holds a zone route for this script, which is the exact condition that makes the next deploy wipe runtime-created routes. Nothing is attached yet, so nothing is at risk today — but that deploy should land before the first customer domain does.

Want me to seed public-site's local D1 so the resolver is demoable on `localhost:8787`? It's a schema copy plus one row, and it'd let you see the root serving, the 301 and the cross-tenant 404 for real.

<!-- xgd-turn id="8ea36c28-d754-4dd5-bea3-005351296f4f-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T19:17:58.723854+00:00" -->
#### You
So I (this account) own gigabyealchemy.ai, xgd.dev and 1stcontact.io is can we test with those?

<!-- xgd-chat-end -->