---
uid: comment-dfe30e11
id: COMMENT-1435
type: comment
title: Comment on bug BUG-36
created_by: xgd
created_at: '2026-08-23T22:09:32.635330+00:00'
updated_at: '2026-08-23T22:18:33.381437+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-db356ff8
  kind: chat_transcript
---

<!-- xgd-turn id="7cb06ce2-4300-4e47-8c59-395797800b78-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T22:08:22.521913+00:00" -->
#### You
When I logged into app.1stcontact.io I get:

The builder did not start.

**What failed:** Error: GET /api/sites → 503

**GET /api/sites:** 503 No tenant '1stcontact'.

The store has no tenant yet. Run `bin/publish <slug>` to import a site, which registers it.

The document loaded; its client did not. Full detail is in the browser console.

<!-- xgd-turn id="7cb06ce2-4300-4e47-8c59-395797800b78-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-23T22:13:51.124899+00:00" -->
#### Claude
Diagnosed. The boot guard is working correctly — it named the real cause, and the fault is upstream of it.

**What's happening:** production D1 has the schema but no `tenants` row. `apps/control-app/src/store.ts` has two ways to open the store, and they disagree about that:

| | on a fresh D1 |
|---|---|
| `storeFor` — every read/write route | `forTenant` throws `UnknownTenantError` → 503 |
| `storeForImport` — `POST /api/import` only | `createTenant` first, then `forTenant` → succeeds |

Both read the same `TENANT_ID` var (`"1stcontact"`, `apps/control-app/wrangler.toml`). So the write path registers the configured tenant and the read path refuses it. `bin/deploy` applies migrations (`bin/deploy.d/migrate/10-d1-site-store`) but seeds no rows — the tenant only ever gets created as a side effect of the first `bin/publish`. A freshly deployed builder is dead on arrival until someone runs a CLI from a dev machine.

It takes the whole page down rather than one panel because `main.js` awaits `/api/sites` at top level, so the rejection kills the module graph. `apps/control-app/src/builder/app.js:66` already handles an empty list, so the builder boots fine against zero sites once the store opens.

(The error is `UnknownTenantError`, not a SQL error, so the migrations did run — only the row is missing.)

**Unblock you right now, no code change:**

```bash
CF_ACCESS_TOKEN=<service-token-jwt> bin/publish --production 1stcontact
```

Token per `apps/control-app/ACCESS.md`. I can't run it from here — this sandbox has no network.

**Proposed fix** (drafted into BUG-36, not yet coded): collapse the two openers into one. `storeFor` ensures the configured tenant exists exactly as `storeForImport` does; `storeForImport` and the router's `deps.importStore` seam are deleted. Cold path only — try `forTenant`, and on `UnknownTenantError` create-and-retry once, so there's no extra query warm and no write per request. `d1r2SiteStore.forTenant` still refuses an unknown tenant; what changes is only the Worker's own bootstrap, which can name exactly the one tenant its config already names. That's the argument `storeForImport`'s docstring already makes — this just applies it to the read path, where its absence is what produced the dead builder.

Worth noting the fix gets you a *booting* builder against an empty store, not a usable one — there's no create-site route, so `bin/publish` remains the only way to get a site in. If you want the deploy to stop producing a dead builder at all, seeding the tenant in a `bin/deploy.d/` hook is the alternative (or complement) — say the word and I'll scope that instead.

Ticket body is populated with the full diagnosis and test plan. Confirm the scope and I'll cut the branch and code it.

<!-- xgd-turn id="5487ae7a-8187-400e-941c-10e9ef0fd420-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T22:18:33.213701+00:00" -->
#### You
You should have a pretty powerful API token in the environment - I do not have a CF_ACCESS_TOKEN

<!-- xgd-chat-end -->