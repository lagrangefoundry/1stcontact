---
uid: bug-cd73ba5c
id: BUG-310
type: bug
title: 'Smoke: control_app_builder_shows_sign_in fails against a correct deployment
  (fetch overwrites Sec-Fetch-Mode)'
created_by: EPIC-19
created_at: '2026-10-28T20:34:00.368240+00:00'
updated_at: '2026-10-29T01:34:24.236774+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-60364ae1
  commits:
  - working_sha: fabc0202023f4375c600f87bac8d34547949b0f2
    reconcile_sha: null
    main_sha: null
  - working_sha: a6a5e27d76ef79c7cdcd10786c6232a36db22213
    reconcile_sha: null
    main_sha: null
  version: 0.2.697
  story_points: 2
---

## Symptom

After REQ-475's Access narrowing on 2026-10-28, `bin/smoke` reports:

    FAIL control_app_builder_shows_sign_in — GET https://app.1stcontact.io/ returned 401, expected a redirect to /sign-in

The deployment is correct. `curl -H 'Sec-Fetch-Mode: navigate' https://app.1stcontact.io/` answers `303 → /sign-in`, and a browser reaches the sign-in form.

## Root cause

The Worker's gate (`apps/control-app/src/index.ts`, `isNavigation`) treats a request as a browser navigation only when `sec-fetch-mode` is `navigate`. It redirects those to `/sign-in` and answers 401 to everything else (REQ-475's design).

`tools/generate/bin/smoke.mjs` sends `NAVIGATE = { 'sec-fetch-mode': 'navigate', accept: 'text/html' }` through Node's `fetch` (undici). Undici sets `Sec-Fetch-Mode` itself (`cors`), because `Sec-` headers are forbidden request headers for fetch, so the smoke request never arrives as a navigation.

## Fix

- The smoke checks that need a navigation send their requests with a client that sends the headers as written, for example `node:https` `request`, for both `control_app_builder_shows_sign_in` probes (`/` and `/sign-in`).
- Each check reports what was actually sent. Leave the Worker's navigation test as it is: the gate is right.
- Check every other `NAVIGATE` use in `smoke.mjs` the same way.

## What changed

- `smoke.mjs` exports `navigate(url)`: a GET sent with `node:http`/`node:https` (chosen by the URL's scheme) carrying `NAVIGATE` exactly as written. It does not follow redirects. It resolves to a real `Response` whose `sent` property records the request headers as they went out.
- With no injected `fetch` (the real CLI), all three `NAVIGATE` probes go through `navigate`: `control_app_builder_shows_sign_in` (`/` and `/sign-in`) and `control_app_admin_demands_access`. An injected `fetch` (the UAT fakes) still serves them, because a fake sees headers as given.
- A failure of a navigation probe ends with `(sent with sec-fetch-mode: <value>)` when `navigate` recorded the headers. Nothing is appended when an injected fetch sent the request, because what fetch was handed is not what went out.
- A check that threw now reports the error's `code` when its message is empty. A refused `node:http(s)` connection is an `AggregateError` with an empty message, which used to render as a bare `threw:`.
- `navigate` looks up `http.request` / `https.request` through the module on each call, so a `--import` preload can replace that transport under the real process. The AC1336 suite's preload (`tests/reconciliation-platform-build-deploy-smoke.test.ts`, `FETCH_HOOK`) now answers `http(s).request` from the same table as `fetch`.
- The Worker's gate is unchanged.

## Design decisions

- Only the navigation probes moved off `fetch`. Every other check stays on `fetch`, where nothing is forbidden.
- Known limit: Node 24.2's `node:http(s)` ignores `HTTPS_PROXY`, so behind an egress-only proxy the navigation probes throw while the fetch checks pass. This was seen in the agent sandbox as `threw: EPERM`. A direct connection, as on the operator's machine, is unaffected.

## Test plan

`tests/test_UAT_FC_BUG-310_smoke_navigation.test.ts`, with no fake `fetch`, against real sockets:

- `test_UAT_FC_BUG-310_smoke_navigation_reaches_the_server_as_navigation`: against a local HTTP server that echoes request headers, `navigate`'s request arrives with `sec-fetch-mode: navigate` and `accept: text/html`, and `sent` records `navigate`.
- `test_UAT_FC_BUG-310_builder_shows_sign_in_passes_against_the_gate`: against the real control app under `unstable_dev` (its own `wrangler.toml`, local D1, no session, no Access token), `control_app_builder_shows_sign_in` passes with `303 → /sign-in`. Routing the probe back through `fetch` reproduces the field failure (401).
- `test_UAT_FC_BUG-310_builder_shows_sign_in_fails_when_a_navigation_gets_401`: against a server answering 401 to everything, the check fails with `returned 401, expected a redirect to /sign-in (sent with sec-fetch-mode: navigate)`.

Regression scope: the REQ-147, BUG-136, BUG-57, REQ-144 and REQ-394 smoke UATs, plus `reconciliation-platform-build-deploy-smoke` (AC1336 drives the real CLI through the extended preload). `test_UAT_AC1333` in that file also fails on a clean xgd-working; it is not related to this change.