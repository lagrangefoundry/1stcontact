---
uid: bug-00f418cf
id: BUG-346
type: bug
title: 'Dev deploy: the snapshot check probes the builder unauthenticated, so it reports
  401 whenever Access is on'
created_by: EPIC-16
created_at: '2026-11-04T20:29:50.869256+00:00'
updated_at: '2026-11-04T21:59:29.770244+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d03c760e
  commits:
  - working_sha: 1ffbe44c4356fa0a701d2d0113ab75d57a037a89
    reconcile_sha: null
    main_sha: null
  - working_sha: 152107fb171f2e8abb55b31c8a074ca172d78e45
    reconcile_sha: null
    main_sha: null
  version: 0.2.764
  story_points: 3
---

## Symptom

`bin/deploy --env dev` builds, deploys and starts every dev service, then reports failure:

> Dev is NOT up — 1 service(s) are not serving the new snapshot:
> dev-worker (port 8786): http://127.0.0.1:8786/builder/main.js answered 401, not the snapshot's builder/main.js.

The services are in fact up. `1c ps` lists dev-worker 8786, public-site 8787, front 8789, filing 8790 and access-sim 8799 all running from this checkout, and the worker log shows `Ready on http://localhost:8786`. The 401 is the Access gate correctly refusing an unsigned request: `https://127.0.0.1:8789/` answers the same 401, "Sign in to continue." So the deploy reports a failure for a healthy environment, and when this check is trusted its report is wrong.

Observed 2026-11-04 with Access configured from the operator's environment (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `SERVICE_TOKEN_IDENTITIES` "kept from your environment"; `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` taken from the dev secrets file).

## Root cause

The snapshot freshness check added by BUG-342 (`123a626838`; `tools/generate/src/cli/dev.ts` around lines 1214–1235; the `probe: 'builder/main.js'` entry in `dev-snapshot.ts`) fetches the probe asset with a plain unauthenticated GET. By design, builder assets are served only after the Access gate: they fall through to `env.ASSETS` at the end of `fetch`, as a security control (`router.ts` route note, `wrangler.toml`). So whenever Access is configured, the probe can only ever get 401. It passes only in dev-open mode (Access unset), which is presumably the mode BUG-342 was tested in.

## Why a service token cannot fix it (found while scoping)

The first proposal was to have the probe send the dev service token. That cannot work. The worker accepts an Access credential only on the operator paths (`operator-paths.js`: `/api/admin/*`, `/sign-in/access`, the copy routes). Every other path, `/builder/main.js` included, is admitted only on an app session cookie and otherwise answers 401 "Sign in to continue." (`index.ts` `signInRequired`). Locally the worker never reads `CF-Access-Client-Id`/`Secret` either; only access-sim exchanges that pair. Operator chose option C (sign in, else say so by name).

## Fix (option C)

The check must still verify the bytes being served, without weakening the gate. `/builder/*` stays behind it.

- **Mode is read from the worker's own env layering** (`readDevEnv` over `apps/<app>`, the files the worker is started with). Both `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` empty is dev-open mode: the probe fetches unauthenticated, exactly as today.
- **Access on and `ACCESS_TEAM_DOMAIN` is a loopback origin (the local access-sim):** the probe signs in the way the operator does (`ACCESS.md` recipe). It mints a token from `<ACCESS_TEAM_DOMAIN>/mint?email=<address>`, exchanges it at the service's `/sign-in/access` (expects a 303 carrying a session `Set-Cookie`), and fetches the probe asset with that session cookie, then compares bytes. The address is the first one `SERVICE_TOKEN_IDENTITIES` maps to, else the first `PLATFORM_ADMINS` entry. Signing in writes one dev session row per deploy; that is accepted.
- **When the probe cannot sign in, it says so by name and does not report a failure.** The service is listed as "not compared" with the reason, and the deploy still reports success if nothing else failed. Reasons: `ACCESS_TEAM_DOMAIN` is not a local simulator; no address to sign in as; the mint request failed; `/sign-in/access` did not issue a session (for example, no account for that address). The same applies if the signed-in request is still refused by the gate with 401 or 403, such as terms not yet accepted; the reason quotes the gate's answer.
- **A real mismatch is still a failure**, exactly as BUG-342 intends: wrong bytes ("serving an older build"), or any non-200 other than the gate's 401/403 refusal.
- The success line names any service whose bytes were not compared, and why. A run is not reported as "serving the new snapshot" for a service whose bytes were not checked.

## Test plan

UATs `test_UAT_FC_BUG-346_*`, driving `devRefresh` with its injected `fetchAsset` and dev env (no real sockets, no real secrets file):
- Access on, local sim: the probe mints for the mapped address, exchanges at `/sign-in/access`, sends the session cookie on the asset request, and passes when the bytes match.
- Access on, local sim, signed in, but bytes differ: still fails with "serving an older build".
- Access on, `ACCESS_TEAM_DOMAIN` not a local simulator: no failure; the outcome and the success line name the service as not compared and why.
- Access on, no address to sign in as / `/sign-in/access` refuses: no failure; named as not compared.
- Dev-open mode: unchanged; it fetches unauthenticated (no cookie, no mint) and passes.
- Regression scope: the existing BUG-342 `devRefresh` suites.

## Relationship

This is a defect in BUG-342's landed behaviour. BUG-342 is at `ready_to_reconcile`, so this is filed separately, per the operator, rather than reopening it. It is unrelated to the 11-04 resync damage (BUG-344): the pre-resync tree already had this check.

## Implementation notes (as landed)

- `devRefresh` (`tools/generate/src/cli/dev.ts`) takes an injectable `devEnv(app)` (default: `readDevEnv` over `apps/<app>`). `FetchAsset` takes optional headers, does not follow redirects, and returns `setCookie`. `probeAccess` decides open / session / unavailable. The outcome gains `unverified: {name, port, probe, reason}[]`, and `formatRefresh` appends `<service> (port N): <probe> was NOT compared with the snapshot — <reason>.` on both the success and failure reports.
- The existing BUG-342 and BUG-307 `devRefresh` suites now pass `devEnv: () => ({})` (dev-open) so they never read the operator's secrets file. Their assertions are unchanged.
- Checked live on 2026-11-04 against the running dev worker (Access via access-sim on 8799): mint, then `/sign-in/access` answered 303 with a `session` cookie, then `/builder/main.js` answered 200, byte-identical to the snapshot.
- UATs: `tests/test_UAT_FC_BUG-346_dev_probe_passes_the_gate.test.ts` (5 tests), all passing. BUG-342: passing. BUG-307 `deploy_restarts_what_serves_the_snapshot` was already red on the baseline, before this change (its `front` stand-in is reported "something was answering … after it had been stopped"). That service has no probe, so the failure is unrelated to this fix.