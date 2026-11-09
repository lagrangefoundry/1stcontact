---
uid: comment-c53b282f
id: COMMENT-8074
type: comment
title: Comment on bug BUG-399
created_by: xgd
created_at: '2026-11-09T06:32:00.843966+00:00'
updated_at: '2026-11-09T06:43:26.242677+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-951dbd5b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c65f9223-0564-4602-8b8b-8667374edebc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="76807587-6ef2-41a0-bce5-d36cdc01c227-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T06:30:44.968169+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="76807587-6ef2-41a0-bce5-d36cdc01c227-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T06:43:16.343484+00:00" -->
#### Claude
Not a duplicate (BUG-314 covers operator paths only). Reading the client code now.

Reading the existing BUG-52 / BUG-314 / BUG-348 tests to match their harness.

Now the `send` change.

Now session.js: remove the dead `SESSION_UNREACHABLE` reason.

Now update the superseded BUG-52 case and write the new UATs. First look at how the BUG-348 panel test drives the chat loop.

Writing the BUG-399 UAT file now.

All green. Quick RED check against the old `api.js`/`session.js`:

Part A is red→green. Now Part B — the slow reload (preview 500s, store-busy 503s). Checking what BUG-395 already did and what the logs show.

Still on Part B: reading the error lines inside the 22:09 burst's failed preview requests.

Checking which of these are mine vs pre-existing by re-running the failing files against the old `api.js`/`session.js`.

No regressions: the same 20 failures are on the old code too (pre-existing, worktree/webui artifacts). Checking for a lint step, then committing.

Committing the fix on the branch, then the lock → merge → bump → merge-back sequence.

Now merging back into xgd-working with `xgd-merge`.

Landed. Now the ticket body (preserving the existing content and adding the outcome), then free_coded.

BUG-399 is now `free_coded`. A dropped request no longer shows "Sign in again" while the session is fine. The fix is on xgd-working but not deployed yet. The slow reload (Part B) turned out to be BUG-395's bug, which is fixed but also not deployed.

**Part A: the false sign-in notice is fixed.** When a builder request gets no response at all, `send()` in `apps/control-app/src/builder/api.js` now makes one quick session check (`/api/businesses` for the business in view) before saying anything:
- **The check answers 401:** the session really has ended. The "Your session has ended" notice is shown once.
- **The check answers anything else:** no notice. The request fails to whatever made it as an ordinary error, so the chat panel's always-open poll just retries quietly.
- **The check fails too (network down):** no notice either, because reloading can't help. I didn't add the optional "Connection lost, retrying" strip.
- **Several requests failing at once** share one check and produce at most one notice.
- **A real 401** still shows the notice immediately, and the operator-console paths (BUG-314) are unchanged.

Two related changes:
- I removed the old "could not reach the server — your session may have ended" message. It no longer has a use.
- One older test from BUG-52, which required a dropped request to count as a sign-out, now contradicts this fix. I deleted it and recorded that in the ticket as a deliberate replacement.

**Part B: the slow reload duplicates BUG-395.** In the production logs for the 22:09 reload, the preview photos, `theme.css` and `capabilities.js` each took about 8.3 s and failed with 500. `settings/payments` and `shop/taxonomy` failed with 503. That is the same database-overload burst BUG-395 fixed. BUG-395 was committed at 17:40 PT, but production was last deployed at 16:05 PT, so both the 21:49 and 22:09 reloads ran on the old code. Part B needs a deploy, not new code, so I added no test for it.

**Tests:** six new tests in `tests/test_UAT_FC_BUG-399_dropped_request_is_not_a_signed_out_session.test.ts` run the real `api.js`, `session.js` and `chat.js`, with only the network faked. All pass, and the five covering the new behaviour fail on the old code. The 42 other builder suites that use these modules show 20 failures, the same 20 the unchanged code gives in the worktree, so none are caused by this change.

Commits: `aa78b4d82f32` (fix) and `4e8881999c33` (version 0.2.841). The ticket body keeps your original text and adds what was built and the Part B findings.

**Decision for you:** deploying the control-app from xgd-working ships both this fix and BUG-395's. I haven't deployed, because that's your call.

<!-- xgd-chat-end -->