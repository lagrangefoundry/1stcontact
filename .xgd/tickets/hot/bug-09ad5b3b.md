---
uid: bug-09ad5b3b
id: BUG-314
type: bug
title: 'Operator Console: an Access-refused admin request shows ''Sign in again'',
  which loops back to the builder'
created_by: EPIC-19
created_at: '2026-10-29T16:51:51.891501+00:00'
updated_at: '2026-10-29T18:32:11.534410+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a31b911e
  commits:
  - working_sha: 8a8108e0c1aeec9eb2e1ead1d2ac1582157dd93f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 5f1ed2eae4a4224bd285a7640010d8f670e9d8fd
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.700
  story_points: 3
---

## Symptom

On production, 2026-10-29, after REQ-475's Access narrowing, the operator opened the Operator Console from the builder:
- The console showed a banner telling them to sign in again.
- Pressing **Sign in again** reloaded into the builder, where their app session is valid, so the console was no further on.

The workaround worked: visit `https://app.1stcontact.io/sign-in/access` once (Cloudflare PIN). That sets the Access cookie, and the console then loads.

## Root cause

- The console page is a builder page, admitted by the app session (REQ-475).
- Its data comes from `/api/admin/*`, which is an operator path (`apps/control-app/src/operator-paths.js`) that Cloudflare Access guards.
- With an app session but no `CF_Authorization` cookie, the edge refuses those requests, typically as a redirect to `*.cloudflareaccess.com`, which a `fetch` sees as a failure or an opaque response.
- The builder client reads any such refusal as "your session ended" (BUG-52) and offers **Sign in again**. That reloads the builder, which is a public path, so it never reaches Access. The loop can't be escaped from the UI.

## Fix

1. **Tell the two refusals apart.** A refused `/api/admin/*` (or other operator-path) request whose app session is still valid is "needs operator sign-in", not "session ended". Detect it from what the client can see: an opaque redirect, or a non-JSON or cross-origin response, on an operator path while `/api/businesses` still answers. Or add a cheap probe such as `GET /sign-in/access/status`, behind Access, that the console calls first.
2. **The console's banner for that case** says "The Operator Console needs your operator sign-in", with a button to `/sign-in/access?return=<console>`.
3. **`/sign-in/access` honours a same-host `return`** to a builder path (the console), and lands back there after the PIN exchange. Only same-host builder paths are accepted (see REQ-482 for the general return rule; reuse its check).
4. **An expired app session still shows today's "Sign in again".**

## What changed

- **Telling the refusals apart (client, `builder/api.js`).** Every builder call to `/api/admin/*` (bare or under `/b/<id>`) is sent with `redirect: 'manual'`. The Worker never redirects those routes, so a held redirect there (`opaqueredirect` in a browser, a raw 3xx elsewhere) or a 401 is the Access edge's refusal. The client then asks `/api/businesses`, which only the app session gates:
  - a 401 there means the session itself has ended, and the builder shows today's **Sign in again** (fix item 4);
  - any other answer means the session stands, and the client announces a new reason, `operator`.
- **The banner for that case (`builder/session.js`).** It reads "The Operator Console needs your operator sign-in." Its button, **Operator sign-in**, goes to `/sign-in/access?return=<builder document>%23console`. The builder document is `/` or `/b/<id>/`.
- **The operator banner gives way.** If the session itself then ends, the "Sign in again" banner replaces the operator one, because only it recovers both (`builder/app.js`). Every other banner stays latched as before.
- **`/sign-in/access` honours `return` (`sign-in.ts`, `builderReturn`).** The 303 after the PIN exchange goes to the `return` target, keeping its query and fragment, but only if the target is a builder document on the same origin: `/` or `/b/<id>/`. Anything else lands on `/`, including:
  - another host, `//host` or `/\host`;
  - a sign-in or API path;
  - a `javascript:` URL.

  REQ-482 has no check yet, so this is the one it can reuse.
- **The console reopens on landing.** `main.js` reads a `#console` fragment once, clears it with `history.replaceState`, and passes `openConsoleOnStart` to `mountBuilder`. `mountBuilder` opens the console after the builder is drawn, but only for a session that owns the platform business.

## Design decisions

- The probe uses an existing public route (`/api/businesses`). There is no new `/sign-in/access/status` endpoint.
- The client recognises operator calls with its own `/api/admin/` pattern. `operator-paths.js` is not served to the browser, and `/api/admin/*` is the only operator path the builder calls.
- The operator refusal travels as a `SessionEndedError` with reason `operator`, on the one existing notice channel, rather than as a second mechanism.

## Test plan

- `tests/test_UAT_FC_BUG-314_operator_sign_in.test.ts` drives the real builder client through a real `bin/access-sim` process. The simulator stands in front of a stub builder that admits on an app-session cookie.
  - `test_UAT_FC_BUG-314_access_refusal_is_not_session_expiry`: with a session and no Access cookie, a console call is refused with reason `operator` and announced once. The notice wording and the `return` URL are checked. With the Access cookie, the same call answers and nothing is announced.
  - `test_UAT_FC_BUG-314_expired_session_still_says_sign_in_again`: with neither cookie, the reason is `expired` and the button reads **Sign in again**.
  - `test_UAT_FC_BUG-314_console_reopens_on_return_from_sign_in`: mounting with `openConsoleOnStart` opens the console. With the Access cookie still missing, the builder's banner is the operator one, not "Sign in again".
  - `test_UAT_FC_BUG-314_expired_session_still_says_sign_in_again_in_the_builder`: the same mount with no session shows the expired banner.
- `test_UAT_FC_BUG-314_operator_sign_in_returns_to_console` is in `tests/test_UAT_FC_REQ-475_one_login.workers.test.ts` and reuses that suite's Access fixtures.
  - `/sign-in/access?return=/#console` answers 303 to `/#console`, and `return=/b/<id>/#console` answers 303 to `/b/<id>/#console`, each with a session cookie.
  - Foreign and non-builder targets answer 303 to `/`.