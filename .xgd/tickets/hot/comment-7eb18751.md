---
uid: comment-7eb18751
id: COMMENT-5355
type: comment
title: Comment on request REQ-394
created_by: xgd
created_at: '2026-10-10T14:02:01.296398+00:00'
updated_at: '2026-10-10T14:38:19.791803+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-77a257dd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "75bbbabe-32b8-4526-ba48-4d2b7769e367",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c222455c-6f8a-4ef0-90e3-dedce23cd06a-user" -->

<!-- xgd-chat role="user" ts="2026-10-10T14:01:27.484055+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c222455c-6f8a-4ef0-90e3-dedce23cd06a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-10T14:15:02.184552+00:00" -->
#### Claude
Reading the Worker's host-binding code (`rootSite`) and the provisioning patterns before cutting the branch.

Checking how deploy enumerates hooks and how Node scripts load the TS Cloudflare client, so the provisioning step reuses it rather than re-implementing the API.

Starting the free-coding steps: mark the ticket `free_coding` and cut the branch.

Writing the provisioning module (reuses `servingRecords`, `routePatternFor`, `PUBLIC_SITE_SCRIPT`, `PLATFORM_APEX` and the existing `CloudflareClient`).

Path depth matches. Now the `bin/platform-route` launcher and the Worker-side apex redirect.

Now the smoke checks.

Writing the three UAT files.

Now the provisioning and smoke UATs.

Known fresh-worktree artifact (control-app `generated/` is untracked). Copying it in from the main checkout to run the workers suite.

All 14 pass, including REQ-258's bound-host suite. Now the wider regression scope: smoke, public-site, wrangler.toml static checks, REQ-258 serving.

Expected fallout: the existing smoke suites pin the exact check list. Inspecting them (and the REQ-180 one, which may be pre-existing).

REQ-180 is pre-existing (`tenant-cost.js`, not mine). Looking at the BUG-57 map and the other two pinned lists.

Smoke suites all green (87). Now typecheck and a quick CLI run of `1c platform-route` without a token, to confirm it loads and refuses cleanly.

Typecheck clean for both apps. Adding the usage line to `bin/smoke`, then checking my notes on this project's version-bump gate before committing.

Everything's green. Updating the ticket body (appending an implementation section, keeping the existing text) before committing.

Ticket updated with the original body kept. Committing on the branch (explicit paths, so the copied `generated/` stays out).

A test run rewrote `module-assets.ts` (a known side effect), so I'm reverting it. Then lock and merge back.

Running the two-step manual form the lock output gave instead:

Merged (0 overlay candidates, nothing to rematerialize). Moving the ticket to `free_coded`, letting the gate do the version bump itself:

REQ-394 is built, merged into `xgd-working` and parked at `free_coded`. Commits: `d333582fd2` for the code, and `207d3ca91e` for the version bump, which the gate made itself. Nothing is live yet. I haven't touched the Cloudflare account or deployed, because both change production and need your go-ahead.

**What changed**
- **The apex site's platform hostname now redirects.** A new public-site setting, `APEX_HOST`, is set to `1stcontact.io` in production and left empty elsewhere. Any other hostname for the `APEX_SITE_KEY` site, such as `1stcontact.1stc.site/<path>?<query>`, now gets a 301 to `https://1stcontact.io/<path>?<query>`. I did this as configuration rather than adding a database row for the apex. A row would make the apex serve only one site and break the `/site/<key>/` links it still serves for every other site.
- **Unclaimed hostnames now 404.** I found this gap while writing the tests. Before, any hostname with no database row fell back to the apex site. So once `*.1stc.site` was routed, every unclaimed `<label>.1stc.site` would have served the front page plus every site under `/site/<key>/`. Now, when `APEX_HOST` is set, it is the only unlisted hostname that serves anything. Everything else gets the same 404 as an unpublished site. Local dev, where `APEX_HOST` is empty, is unchanged.
- **New `bin/platform-route` command** (a wrapper around `1c platform-route [--dry-run]`). It uses the existing Cloudflare client and the record and route helpers from `serving.ts`, and needs `CLOUDFLARE_DNS_TOKEN`.
  - It checks that `1stc.site` is in the account and active, and fails naming it if not.
  - It adds a proxied wildcard DNS record if none exists, and adds the `*.1stc.site/*` route on `1stcontact-public-site` if it's missing.
  - Running it again writes nothing. It never deletes or updates anything.
  - If it finds an unproxied wildcard record, or the route pointing at another Worker, it stops and says so rather than replacing it.
  - It doesn't touch `wrangler.toml` or the `zones` table.
- **`bin/smoke` gains two checks:** a claimed platform hostname reaches its site, and an unclaimed one 404s. With no arguments it checks that `1stcontact.1stc.site` redirects to the apex. A new `--platform-host <host>` option checks any other claimed hostname.

**Tests:** three new test files, 13 tests, all passing. They cover the redirect (path and query kept), another site's hostname serving that site, unclaimed hostnames getting a 404 identical to an unknown site, the provisioning step creating nothing on a second run and never deleting, and `wrangler.toml` still having no zone routes. Three existing smoke test files pinned the exact list of checks, so I extended them for the two new ones. The related suites pass (smoke, public-site, REQ-258), and both apps typecheck. One test elsewhere, `test_UAT_FC_REQ-180_business_vocabulary`, fails on a file this ticket doesn't touch (`tenant-cost.js`), so it was already failing.

The ticket body now has an implementation section below your original text, which I left as it was. I set story points to 5.

**To take it live, in this order:**
1. `bin/platform-route --dry-run`, then `bin/platform-route`
2. `bin/deploy public-site`, so the `APEX_HOST` setting ships
3. `bin/smoke`

<!-- xgd-turn id="898dd043-642e-4873-b0ca-e20f23e0bd8c-user" -->

<!-- xgd-chat role="user" ts="2026-10-10T14:37:31.379548+00:00" -->
#### You
trying to join the mailing list gets this response:
"This site cannot take messages at the moment."

<!-- xgd-turn id="898dd043-642e-4873-b0ca-e20f23e0bd8c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-10T14:38:19.626492+00:00" -->
#### Claude
That message comes from `apps/public-site/src/lead.ts`, which refuses with this exact sentence for five different reasons. Checking which one production hits:

Production's public-site has **no secrets at all** (`[]`), and `TURNSTILE_SITEKEY` is `""` in `wrangler.toml`. Checking whether deploy has a hook that's supposed to provide the secret:

I haven't changed anything for this yet: the cause is missing Turnstile credentials in production, and the fix needs your go-ahead.

**Cause:** the mailing-list form posts to public-site's lead endpoint, which refuses any submission it can't check with Turnstile. That's deliberate (REQ-223): a deployment without the secret takes no leads rather than unverified ones. In production, both halves are missing:
- **The secret:** `wrangler secret list --env production` for `1stcontact-public-site` returns `[]`, so there is no `TURNSTILE_SECRET`.
- **The public key:** `TURNSTILE_SITEKEY = ""` in `apps/public-site/wrangler.toml`, so the page shows no verification widget either.
- **Nothing in the deploy provides it:** none of the hooks in `bin/deploy.d/secrets/` handles a Turnstile secret, and each of them exits early unless the app is control-app.

Lead intake, the rate limiter and the honeypot check all come before Turnstile in the code. Even if one of those were also broken, the missing secret alone guarantees this refusal on every submission. It affects every form on every published site, not just the mailing list.

**Fix, three parts:**
1. **Create a Turnstile widget** in the Cloudflare dashboard (Turnstile → Add widget) for `1stcontact.io`, `*.1stc.site`, and later the customers' own domains. It gives a site key and a secret. I can create it through the API instead if you have a token with Turnstile edit permission, but that changes the account, so I'd want your go-ahead first.
2. **Set the site key** in the production block of `wrangler.toml` (`TURNSTILE_SITEKEY = "<key>"`). It's public by design, so it goes in the file.
3. **Push the secret.** Either once by hand with `printf '%s' "$SECRET" | npx wrangler secret put TURNSTILE_SECRET --env production` in `apps/public-site`, or with a new deploy hook that pushes it from your secrets file. The hook would follow the pattern of the existing `40-cloudflare-dns-token` hook and fail the deploy if the secret is missing, so this can't silently recur.

Then `bin/deploy public-site`. That also ships REQ-394's `APEX_HOST` change.

Two decisions for you:
- **Which ticket?** This is a separate problem from REQ-394, which is about platform hostnames. Should I add it to REQ-394 anyway, or will you file a separate ticket? I won't create one unless you ask.
- **Hook or one-off?** Do you want the deploy hook, or will you just push the secret by hand? Steps 1–2 plus a manual push need no code. The hook needs the full ticket process.

If you send the site key, I'll make the `wrangler.toml` change now.

<!-- xgd-chat-end -->