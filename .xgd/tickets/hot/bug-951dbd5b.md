---
uid: bug-951dbd5b
id: BUG-399
type: bug
title: 'Builder: a dropped request shows ''Sign in again'' though the session is fine'
created_by: EPIC-23
created_at: '2026-11-09T06:19:46.555747+00:00'
updated_at: '2026-11-09T14:47:52.500247+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-ee37a03f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c53b282f
  commits:
  - working_sha: aa78b4d82f324b18d8dbfd5548def84220587a49
    reconcile_sha: null
    main_sha: null
  - working_sha: 4e8881999c33dede80770325885309425b6423dc
    reconcile_sha: null
    main_sha: null
  version: 0.2.841
  story_points: 2
---

## Symptom

The operator often sees the yellow builder notice "The builder could not reach the server — your session may have ended. Sign in again to carry on." Clicking **Sign in again** asks for no credentials: the builder simply reloads, because the session was fine all along. The reload then takes 30 seconds or more, and all unsaved state in the panels is lost.

## Evidence (production Workers Logs, 2026-11-08)

- Right before the operator's reloads at 21:36 and 22:09 (Pacific), the server recorded **no 401, no 5xx, and no refusal**. The only events at those moments are the builder's open requests (`/api/ai/await-turn`, `/api/changes`) being cut off (`canceled`) by the reload itself.
- In 12 hours there were only 8 genuine 401s.
- So the notice came from a request that failed in the browser (a rejected `fetch`) and never reached the Worker.

## Root cause

1. **A rejected request is announced as the session ending.** Every builder request goes through `send()` in `apps/control-app/src/builder/api.js`. When `fetch` rejects (no response at all), `send` immediately announces `SESSION_UNREACHABLE`, and the builder shows the sign-in notice. That reading was chosen when Cloudflare Access guarded the builder (a lapsed Access cookie showed up as a rejected cross-origin redirect). Since REQ-475 the builder is public at the edge, so a rejection on a non-operator path is almost always a passing network problem: the laptop waking from sleep, a Wi-Fi change, a reset HTTP/3 connection.
2. **A request is now always open.** Since BUG-348 (2026-11-04) the chat panel keeps a long poll to `/api/ai/await-turn` open around the clock, so it can follow turns it didn't start (`awaitUnseenTurns` in `chat.js`). That loop already expects failures and retries with backoff, but `send` has put the notice up before the loop ever sees the error. A request that is always in flight turns every network hiccup into "Sign in again".

`postSurface` already avoids `send` for exactly this reason ("a transient blip while they change tabs would then produce a sign-in banner over work that is fine"). The await-turn loop and any other background call need the same protection, and the fix belongs in `send` so the next background call is covered too.

## Fix

**Part A: a failed request never claims the session ended unless the session has ended.**

- When a builder request is rejected (no response), the builder checks the session before saying anything, with one quick call that only the app session gates. The operator-path code already uses `/api/businesses` this way (`operatorRefusal`).
  - **The check answers 401:** the session has ended, so show the notice exactly as today.
  - **The check answers anything else:** the session stands. No notice. The original request fails to its caller as an ordinary failure (not a `SessionEndedError`), so the caller's own error handling runs. For the await-turn loop that means a quiet retry with its existing backoff.
  - **The check is rejected too:** the server is unreachable. Still no sign-in notice: the session is not known to have ended, and reloading cannot help while the network is down. Optional: a non-blocking "Connection lost, retrying" strip that clears itself when a request next succeeds. No reload button.
- A real 401 from our own origin still shows the notice at once, as today.
- Operator paths (`/api/admin/*`, Cloudflare Access) keep their current handling (BUG-314).
- Concurrent rejections share one check rather than each sending their own.

**Part B: the reload after a notice is slow (30 s+).** Right after the 22:09 reload, the draft-preview requests (`/b/<key>/preview/<site>/draft…`) took about 8 seconds each and answered 500, and several settings reads answered 503 "store busy" (`/api/settings/payments`, `/api/shop/taxonomy`, `/api/publish/status`). The same burst follows the 21:49 reload. Find why a cold builder load produces a burst of preview 500s and store-busy 503s, and fix it, so a reload is quick and every preview renders. Part A removes most of these reloads; Part B makes the remaining real ones bearable.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, driving the real builder client modules (`api.js`, `session.js`, `chat.js`) with only `fetch` stubbed at the network boundary:

1. A rejected request while the session check answers 200: no session-ended notice is announced, and the caller gets an ordinary error.
2. A rejected request while the session check answers 401: the notice is announced as today.
3. A rejected request while the session check is also rejected: no sign-in notice.
4. The await-turn loop meets a rejected request with a live session: it retries and goes on following turns, and no notice appears.
5. A plain 401 from a builder call still announces the notice immediately (regression guard for BUG-52).
6. Part B: a UAT pinning whatever the cause turns out to be, e.g. a cold builder load's preview and settings reads answer 200 under the concurrency a reload produces.

## What changed (Part A, landed)

- **`send()` in `builder/api.js` asks before it says anything.** When a builder request is rejected (no response), it makes one session check: `GET /api/businesses`, scoped to the business in view (the same call the load uses). The original request is not repeated.
  - **Check answers 401:** the session has ended. A `SessionEndedError` with reason `expired` ("Your session has ended. Sign in again to carry on.") is announced **once** and thrown to every waiting caller.
  - **Check answers anything else:** nothing is announced. The caller gets the original failure (the `TypeError` from `fetch`) as an ordinary error, so its own handling runs. The await-turn loop retries quietly with its existing backoff and goes on following turns.
  - **Check is rejected too:** the network is down. Nothing is announced and the caller gets the original failure. No "Connection lost" strip was added (it was optional).
- **One check is shared by every rejection in flight.** A dropped connection rejects every open request at once, so only one question is asked.
- A plain 401 from a builder call still announces at once, with no check. Operator paths (`/api/admin/*`, BUG-314) are unchanged.
- **`SESSION_UNREACHABLE` is removed** from `session.js`, with its "could not reach the server — your session may have ended" wording. A rejection is no longer a reason of its own. The only way the session is known to have ended is a 401.
- **Explicit supersession of BUG-52:** the BUG-52 case `test_UAT_FC_BUG_52_a_rejected_fetch_is_an_authentication_failure_not_a_transport_error` pinned the old reading, so it is deleted. A rejected fetch on its own is no longer an authentication failure. The BUG-52 recovery case now uses the `expired` notice.
- Consequence at load: if `/api/businesses` itself is rejected and the check is not a 401, `fetchBusinesses` falls back to its existing defaults for "an origin that could not answer" (REQ-173/REQ-179). It no longer shows the sign-in page.

## Part B: duplicate of BUG-395 (not yet deployed)

Production Workers Logs for the 22:09 reload (06:09:44 UTC): every preview `draft/shop-photos/<item>/0`, `draft/theme.css` and `draft/capabilities.js` answered 500 after ~8.3 s of wall time with 22 ms of CPU. `settings/payments` and `shop/taxonomy` answered 503 after 3.2 s, and `publish/status` answered 503. No `x-store-busy` handling appeared. This is exactly BUG-395's burst: every Library-photo read scanned every attachment and pushed D1 over its 10-second budget.

BUG-395's fix (commits `19daefc2961b`, `2c86933fa0bc`, 17:40 PT on 2026-11-08) is on xgd-working. The production control-app was last deployed at 16:05 PT on 2026-11-08 (version `e9e8842b`), before that fix, and both the 21:49 and 22:09 reloads ran on that version. **Part B needs a production deploy, not new code.** No Part B UAT was added because BUG-395's UATs pin the cause.

## Test coverage (as built)

`tests/test_UAT_FC_BUG-399_dropped_request_is_not_a_signed_out_session.test.ts` drives the real `api.js`, `session.js` and `chat.js`, with only `fetch` stubbed:
- `test_UAT_FC_BUG-399_rejection_with_a_live_session_is_an_ordinary_failure`: test plan 1. Also checks that the check is the scoped `/b/<biz>/api/businesses`.
- `test_UAT_FC_BUG-399_rejection_with_an_ended_session_announces_it`: test plan 2.
- `test_UAT_FC_BUG-399_rejection_while_the_origin_is_unreachable_says_nothing_about_signing_in`: test plan 3.
- `test_UAT_FC_BUG-399_concurrent_rejections_share_one_session_check`: three concurrent rejections lead to one check and one announcement.
- `test_UAT_FC_BUG-399_a_plain_401_still_announces_at_once_without_a_check`: test plan 5.
- `test_UAT_FC_BUG-399_await_turn_loop_retries_a_rejection_and_keeps_following_without_a_notice`: test plan 4, through the real chat panel's loop.

All of these fail on the old code except the plain-401 guard. Regression: 42 jsdom suites import `api.js`/`session.js`. The 20 failures there are the same on the old code (pre-existing in the worktree).