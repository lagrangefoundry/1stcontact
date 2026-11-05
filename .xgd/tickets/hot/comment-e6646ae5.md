---
uid: comment-e6646ae5
id: COMMENT-5827
type: comment
title: Comment on request REQ-485
created_by: xgd
created_at: '2026-10-29T19:59:43.450533+00:00'
updated_at: '2026-10-29T20:42:27.539827+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-714556fc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1fa1bf29-5c72-4e1f-8639-b18a8d3129cd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="38297a68-7ce6-4ac1-af12-53e39ca46bfa-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:55:12.671836+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="38297a68-7ce6-4ac1-af12-53e39ca46bfa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T20:42:22.193109+00:00" -->
#### Claude
Reading the control-app entry point (`index.ts` fetch) to find the single egress point for headers.

Still surveying: mapping the inline scripts/styles and how the builder shell is served so the CSP can be right.

Checking how preview pages are rendered (inline scripts/styles) so the preview CSP allows exactly what a published page needs.

Checking the builder's two other iframes (panel.js, reader.js) since they decide `frame-src` and the material-file sandbox.

Survey done; reading one existing Worker-fetch UAT (REQ-475) as the test template, then I'll cut the branch and implement.

Design is settled. Moving the ticket to `free_coding` and cutting the branch.

Worktree is ready. Now writing the central module, `security-headers.ts`.

Making the terms page's inline script a constant (version moves to a `data-version` attribute) so it can be hashed once.

Now the central module.

Typecheck is clean. Now the `bin/smoke` check — reading how existing checks are written.

Adding the `bin/smoke` header check; first finding the shared fake origin the smoke UATs use so I update it rather than break them.

While that runs, writing the Worker-level UAT file.

Now writing the UAT suite.

Updating the smoke suites' expectations for the new check, then re-running them to see the full failure list.

All 6 Worker UATs pass. Now the node scan test, the updated BUG-57 suite, and regression on adjacent Worker suites (terms, sign-in, preview, material).

Running the 95 other Worker-fetch suites in foreground batches to check for regressions.

Two turn-timing suites failed; checking whether they fail in isolation and on the clean main checkout (baseline) before attributing them.

BUG-249 fails on the clean checkout too (pre-existing); BUG-294 passes in isolation (load flake). Batch 2:

These look body-content, not header, related. Baseline check on the clean checkout:

All four fail identically on clean working — pre-existing. Batch 3:

All remaining failures are identical on the clean checkout, so nothing regressed. Updating the ticket body with what landed (appending, existing text kept).

Body updated (original sections kept). Committing the work on the branch.

Now landing it: lock, merge working in, bump, fast-forward back, then mark free_coded (as a retry loop, since other sessions commit tickets concurrently).

REQ-485 is done. Every response from the control app now gets its security headers from one function on the way out of `fetch`. The work is merged into xgd-working and the ticket is at `free_coded` (version 0.2.705). I didn't deploy, so `bin/smoke`'s new header check will fail against the live site until the next deploy.

**What every response gets**
- HSTS (`max-age=31536000; includeSubDomains`, no `preload`), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a `Permissions-Policy` that turns off camera, microphone, geolocation, payment, usb and the like.
- `frame-ancestors 'self'` is enforced from day one.
- The builder doesn't use the microphone or any other listed feature. It does write to the clipboard, which isn't in the deny list, so that keeps working.
- If a route sets one of these headers itself, its value stays. If it sets its own CSP, ours is added alongside it, which can only make things stricter.
- The seven per-route `nosniff` lines in `router.ts` are gone. A route added later gets everything without doing anything.

**Content-Security-Policy, by kind of response**
- **App pages** (builder shell, sign-in, terms, the API) get the CSP from the ticket, in report-only mode. The three inline scripts are allowed by hash. So the hashes can't drift, the terms page script is now a constant: the version it accepts moved onto the button as a `data-version` attribute.
- **Preview pages** get a policy shaped for a published page: inline scripts and styles, Turnstile, remote images. Also report-only.
- **Material files** (`/api/material/file`) get an enforced sandbox, so an uploaded SVG or HTML file opened directly can't run script.

**Decisions I made that differ from the ticket text**
- **Portal:** the ticket lists it as an app page, but it's rendered by the same code as previews, with per-page inline scripts that hashes can't cover. It gets the preview policy instead.
- **`form-action` is `'self' https:`, not `'self'`.** A sign-in link's POST redirects back to wherever the sign-in started (the apex or a customer domain), and browsers check that redirect against `form-action`.
- **PDFs are not sandboxed.** Browsers won't display a PDF in a sandboxed document, and the builder's reader shows PDFs in a frame.
- **No violation-reporting endpoint.** It would have to accept unauthenticated posts. For now, violations show up in the browser console.

**Still to do (in scope, as a later commit):** switching to enforcing once a beta session shows no violations. That's a one-line change to `PAGE_POLICY_HEADER` in `security-headers.ts`.

**Tests**
- 6 new UATs run through the Worker's `fetch`, plus a source scan confirming nothing else sets `nosniff`; all pass. The page test checks that every inline script each page actually serves is allowed by its hash, so turning enforcement on shouldn't break those pages.
- A new `bin/smoke` check confirms `/sign-in` returns HSTS and `frame-ancestors`. I updated the fake control apps in four existing smoke suites to serve those headers and list the new check.
- I ran the 95 other Worker suites that use `fetch`. Failures in BUG-249, REQ-148, REQ-180, REQ-295, REQ-204, REQ-342 and AC1333 also fail on clean xgd-working, so they were already broken. BUG-294 failed only under load and passes on its own.

<!-- xgd-chat-end -->