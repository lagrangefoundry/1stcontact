---
uid: comment-4c5baa7e
id: COMMENT-5756
type: comment
title: Comment on bug BUG-295
created_by: xgd
created_at: '2026-10-26T15:40:43.026695+00:00'
updated_at: '2026-10-26T16:10:06.850372+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-aa409755
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b71b26d3-ac33-487a-8aa8-2d92bdd6a01e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2b35e700-5e11-495d-a280-a48c0ac77e64-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:38:57.654721+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2b35e700-5e11-495d-a280-a48c0ac77e64-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T15:45:13.996102+00:00" -->
#### Claude
Reading the three change-feed routes and their server implementations before scoping the design.

I've read the ticket and the code it points at. Before I build anything I need one scope decision from you, because the ticket asks for three fixes and I think only two of them are worth their upkeep.

**What I found**
- Each builder tab opens three separate update streams in `apps/control-app/src/builder/api.js`: the preview's at `/api/sites/changes`, the Library's at `/api/material/changes` and Contacts' at `/api/people/changes`. They're served by three separate stream routines in `router.ts`.
- `bin/dev` runs `wrangler dev` (4.111) on `http://127.0.0.1:8789`. Wrangler can't speak HTTP/2 to the browser, so fix 1 needs a small proxy in front of it. Browsers only use HTTP/2 over HTTPS, so that proxy needs a certificate.

**What I recommend**
1. **Dev serves HTTP/2 (do it).** `bin/dev up` would start a small Node HTTPS proxy with HTTP/2 enabled in front of 8789, using Node's built-in `http2` module and a self-signed certificate made once with the system `openssl`. That adds no new dependencies. With this, any number of tabs share one connection, as on Cloudflare. Two details:
   - Your browser address would become `https://127.0.0.1:<new port>`. I'd leave plain 8789 running so access-sim, the Playwright suites and the repro tooling keep working unchanged.
   - Chrome will show a certificate warning once, and you click through it. The alternative is `mkcert`, which installs a trusted local certificate authority but is an extra tool you'd have to install.
2. **One update stream per tab (do it).** A single `/api/changes` stream would carry site, Library and Contacts changes, replacing the three. That's less code than today, and it means at most two long-lived connections per tab (updates plus the turn) even over HTTP/1.1.
3. **Tabs share one update connection (drop it).** Two tabs for *different* businesses can only share a stream if the server can send several businesses' changes on one connection and check access to each. On top of that the browser side needs a SharedWorker that picks a leading tab and passes updates to the others. Once dev and production both use HTTP/2, that code only helps the rare client stuck on HTTP/1.1 behind a proxy, and the stream merge in fix 2 already shrinks that case. It's a lot of code to maintain for little benefit.

**My questions**
- **A.** Shall I do fixes 1 and 2 and drop 3? I'd update the ticket body and test plan to match, so the third UAT would check "six tabs over HTTP/2, a new image and a page navigation still complete." Or do you want all three?
- **B.** For fix 1, is a self-signed certificate with a one-time Chrome warning OK, or would you rather install `mkcert` and have no warning?
- **C.** For fix 1, should the browser use a new HTTPS port while 8789 stays as it is for tooling (my preference), or should 8789 itself become HTTPS? That would also mean moving access-sim, the cookie and every suite that calls 8789.

Once you answer, I'll update the ticket, cut the `free-BUG-295` branch and build it.

<!-- xgd-turn id="fccab8a7-5eb6-4487-9496-b41f7ce9fbb0-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:49:01.015722+00:00" -->
#### You
A - yes
B - its ok for dev - I can't have warnings on prod though
C - access sim uses 8799. I see no value in backward compatibility for 8789 if we move to HTTP2 lets do it and make it work

<!-- xgd-turn id="fccab8a7-5eb6-4487-9496-b41f7ce9fbb0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T16:10:05.601125+00:00" -->
#### Claude
Updating the ticket to the agreed scope first.

Testing how wrangler reports `request.url` behind a proxy, which decides how the HTTP/2 front forwards.

The upstream flags work: the Worker sees `https://127.0.0.1:8789/…`. Now reading the dev service table.

Design is settled. Updating the ticket body to the agreed scope, then cutting the branch.

Writing the server half of fix 2: the three per-kind feeds become reusable closures, and `/api/changes` composes them.

Now the merge helper itself.

Typecheck is clean. Looking at an existing workers UAT for the feed harness.

Writing the origin-side UAT.

All three pass. Re-running the existing per-kind feed suites against the refactor.

Server side is green, and the existing feed suites still pass. Now the client: one shared `EventSource` per tab behind the three existing `subscribe*` signatures.

Checking whether those 6 failures are mine or pre-existing.

These fail because the worktree has no built assets (a location artifact, not the change). Copying the built assets in to get a real reading.

That failure is pre-existing: 17 other routes lack probes, and `/api/changes` isn't among them because I added its probe. Now the client-side UAT with a fake `EventSource`.

Fix 2 is green, including the five existing live-pane suites. Starting fix 1: first checking the system `openssl` can mint the certificate.

Note: the shell's working directory reset to the main checkout, so I'll use explicit worktree paths from here. Writing the HTTPS/HTTP2 front module.

Now the dev-snapshot constants, wrangler argv and banner.

Now `index.ts` (pass `front`, add `1c dev front`, reset's port), `ps.ts` and `dev.ts`.

Now access-sim: forward to the worker port, send browsers to the HTTPS address.

Now the UATs for fix 1: a real front with a real certificate, plus the service table, the wrangler argv and access-sim's redirects.

One test hangs. Narrowing down which step stalls.

The front works; the stall was my test's upstream only treating `/events…` paths as streams. Fixing the test paths.

All five pass. Running every existing suite that touches the dev tooling.

Hit the known long-filter quirk; running in smaller batches.

Before reading these as regressions, baselining the same files on the unmodified main checkout.

Pre-existing on the base: BUG-124 ×4, REQ-393, REQ-290 and one REQ-319 reap case. The rest (BUG-150, BUG-134, REQ-204, REQ-322, and two REQ-319 cases) are from my change. Reading those.

8790 is already the filing service's port, so the worker moves to 8791 instead.

Now updating the older tests that pin the previous topology. Reading each failing assertion.

Now REQ-204, REQ-322 and REQ-319.

Making access-sim's browse address default to an explicitly given `--builder`. That keeps REQ-204's single-address setup meaningful and restores the original banner line.

8791 collides with a sibling project's service in the measured sweep, so the worker goes to 8786 (in band, unclaimed).

Now the REQ-322 and REQ-319 pins.

`tsx` isn't available, so I'll drive the real `1c dev front` command instead, which is the better test anyway.

End-to-end confirmed: HTTP/2 negotiated, the Worker sees `https://127.0.0.1:8964` as its own origin, and the event stream arrives frame by frame. Checking config files for hard-coded dev URLs.

Clean. Before committing, reading the promotion-gate memory for how this project bumps the version.

Following that recipe. First a final typecheck and re-run of the BUG-295 UATs after the port moves.

No lint step exists. Updating the ticket body to match what was built (port 8786 rather than 8790), then committing.

Committing the work on the branch.

Now the merge-back sequence: lock, merge `xgd-working` in, bump, `xgd-merge`, then move to `free_coded`, retrying if another session's ticket commit races the tip.

Landed and at `free_coded`. Cleaning up the branch.

I've built fixes 1 and 2 and merged them to `xgd-working`. BUG-295 is at `free_coded` with both commits recorded, version 0.2.670 and 8 story points; it's parked there until you promote it.

**To pick it up you need to restart your dev environment.** What's running now is the old setup, with wrangler still on 8789:
```
bin/dev down && bin/dev up
```
After that, browse **`https://127.0.0.1:8789`**. Chrome will warn about the certificate once; click through. If you'd rather never see the warning, trust `storage/tmp/dev/tls/cert.pem` in Keychain Access. The certificate is made once and reused, so the exception keeps holding across restarts. Sign-in through access-sim on 8799 now sends you to the HTTPS address.

**Fix 1: dev serves HTTP/2 on 8789**
- `1c dev front` holds 8789 with HTTPS and HTTP/2, using Node's built-in `http2` and the system `openssl`, so no new dependencies.
- The control app's wrangler moved behind it to **8786**. 8790 is already the filing service, and 8791 is used by a sibling project.
- The Worker sees its own address as `https://127.0.0.1:8789`, so origin checks, magic links and sign-out redirects name the address you browse.
- `bin/dev` and `1c ps` now list two services: `dev` (the front) and `dev-worker` (wrangler).
- Tooling still uses plain HTTP: access-sim forwards to 8786.
- I ran real wrangler behind the real `1c dev front` on spare ports. HTTP/2 was negotiated, the Worker reported the HTTPS origin, and an event stream arrived frame by frame.

**Fix 2: one update stream per tab**
- A new `GET /api/changes` stream carries site, Library and Contacts changes together. It's built from the three existing feeds, which are still there.
- Each message carries every feed's position, so a reconnect picks each one up where it left off.
- In the builder, the preview, Library and Contacts keep their existing calls but now share one `EventSource` per tab.

**Fix 3 (sharing one connection across tabs)** is dropped, as you agreed.

**Tests**
- 11 new `test_UAT_FC_BUG-295_*` tests, all passing.
- The three existing per-feed server suites and five existing live-pane suites still pass.
- Older dev-tooling tests that pinned 8789 to wrangler (BUG-150, REQ-319, REQ-322) are updated to the new layout.
- Seven failures in the dev-tooling and access-sim suites also fail on the unmodified `xgd-working`, so they aren't from this change: BUG-124 ×4 (port 8790 is held by your running filing service), REQ-290, REQ-393, and the origin-probe test AC977. AC977 flags 17 other routes with no probe. I added a probe for `/api/changes`, so the new route isn't among them.

The ticket body now describes what was built, including the port choice.

<!-- xgd-chat-end -->