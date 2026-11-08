---
uid: bug-b3995ecd
id: BUG-361
type: bug
title: 'Consultant session: stuck after a model timeout, not robust to page reloads,
  product page lost its gap'
created_by: EPIC-19
created_at: '2026-11-05T21:49:19.621188+00:00'
updated_at: '2026-11-05T23:22:24.200293+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-61c0cc9e
  commits:
  - working_sha: 6e3b13c745cf31adb700f4a0b9a9a3cf0d540816
    reconcile_sha: null
    main_sha: null
  - working_sha: 79749e9aad591e2392ac9a491fc6470716344e05
    reconcile_sha: null
    main_sha: null
  version: 0.2.793
---

## Symptom (operator, 2026-11-05, dev, a shop site; times UTC)

1. **The conversation is stuck: a red stop button and no activity.**
   - At 21:40:52 a consultant turn started. At about 21:41:54 its model request failed with `Request timed out.`
   - The host showed "Something went wrong on my side. I'm picking it back up" and wrote the resume instruction ("Carry on with the same task…") to the session's `pending_turn`, with `status: error`.
   - **No resume turn ever ran.** `turn_log` has nothing after the 21:40:52 turn, which ended `error` at 21:42:37.
   - The client's next message, at 21:42:23, is in the transcript but **never started a turn**.
   - The builder shows the stop button (a turn in flight) with nothing running. The client can't tell whether to wait, and sending again does nothing visible.
   - The operator had reloaded the builder just before this. It's unproven whether the reload caused the timeout or only coincided with it.
2. **A product page was rebuilt with no space between the photos and the details.**
   - The builder rebuilt the product-page slot to follow the product-page guidance, and its root grid came out with no `space` or `gapPx`. The photo column and the details column touched.
   - The starter (`catalogProductPagePreset`) has the gap (`lg`, or 32px), but the rebuild dropped it.
   - **The host's layout check didn't report two columns touching,** so the consultant only found out when the client said so.
3. **The fix didn't show until a reload.** Now tracked in **BUG-362**, filed by the consultant.
4. **Buy didn't show on an available piece.** The cause is confirmed: payments aren't connected and there are no shipping zones, so `canBuy` is false. The client and the consultant aren't told why. Now tracked in **BUG-363**.
5. **The stuck message had to be sent again.** The 21:42:23 message was answered only after the operator re-sent it at 21:58:05, and **both copies are in the transcript.**

## Fix

1. **A turn that ends in error is always followed by something visible.**
   - If the host promises to pick the work back up, the resume turn actually starts once the failed turn has ended.
   - If it can't start, the client is told plainly and the composer returns to Send.
   - A client message that arrives while a resume is queued is folded into that resume, or starts the next turn. It is never left unprocessed.
   - The stop button shows only while a turn is actually running, as the runner reports it (architecture rule 33: only the runner declares liveness). It is never shown from a leftover `pending_turn`.
   - **Robust against page reloads (operator, 2026-11-05).** A reload, or a closed and reopened tab, at any point in a turn changes nothing about the work:
     - the turn keeps running on the server;
     - the reopened builder shows it as running, with its progress lines so far, and its reply arrives when it ends;
     - a message sent just before the reload is neither lost nor duplicated;
     - the composer state (Send or stop) comes from the runner, never from the page's own memory.
     Find out whether the reload contributed to this timeout, and fix that if it did.
2. **Product page spacing.**
   - The builder keeps the starter's spacing when it rebuilds a product page. The builder's guidance for slot rebuilds says to start from the starter and keep its gaps.
   - The layout check reports **two side-by-side columns with no space between them** (for example under 8px, measured on what is drawn), with a fix line the builder can act on, in the same way as its other row checks.
Items 3 and 4 moved to BUG-362 and BUG-363.

## Findings (2026-11-05, from the dev junction log and the dev worker log)

- **The promised resume did run.** It ran as step 1 of the same job (the turn log has one row per job, not per round). Its model request also failed with `Request timed out.`, so the message ended. Nothing went quiet between the two rounds.
- **What got stuck was the client's 21:42:21 message.** It arrived through `/api/ai/interpose` while the resume round ran, so a talker opened beside the round to answer it (21:42:23). The resume round then failed. The framework waits at most 10 s (`closeTimeoutMs`) for a talker before rethrowing the round's error. The talker was still replying, so the error reached the host as a throw, and `withProgress` rethrew at once without settling its talkers. The job step returned and the job ended (21:42:37). The container stopped with the talker mid-reply, and the talker's turn never got a `turn_end`.
- **The stop button:** the panel's talker bubble had its start frame and never got a `done`. Once the work's stream had ended, the panel waited forever for the rest of that reply, so Stop stayed up with nothing running.
- **The reload did not cause the timeout.** The reload was at about 21:40:56–21:41:04. Model requests go straight from the job's container to the provider: not through the page, and not through the Worker's request path. Both failures look like the SDK's connection timeouts, retried and then exhausted: 33 s and 43 s. A reload only touches the browser's own requests (session, reattach, await-turn), and the dev worker log shows those answered normally.

## What changed

1. **Host** (`progress-core.ts` `withProgress`): when a turn's stream throws, its talkers are settled first, and their frames drained onto the stream, exactly as after a turn that ends. Then the error goes on. The client's message is answered, and the talker's turn closes before the step returns.
2. **Panel** (`builder/chat.js` talk desk): once every work stream has closed, a talker reply still unfinished closes, and its message runs as the next prompt naming its id. The composer returns to Send, and the message is answered rather than left waiting. Before, only messages no talker had taken were run.
3. **Layout check:** a new `row_gap` finding in the `rows` check. Two side-by-side columns closer than `rows.minGapPx` (8px), measured on what is drawn, are reported with a fix line: give the box that holds them a gap (its `space`, as the starter sets it), or padding on each column's inner side. Text against anything is the fault. Two pictures, or a picture against a filled panel, meeting edge to edge is a composition and is not reported. The finding counts as craft (`CRAFT_KINDS`).
4. **Builder guidance** (`l1-surface.json`, `add_component`): rebuilding a product page starts from the starter and keeps its spacing. The gap between the photos and the details (`space` on the box that holds them) stays.

## Test plan

- `tests/test_UAT_FC_BUG-361_a_turn_after_a_model_timeout.workers.test.ts` (host, real router and junction, scripted model):
  - the first model request of a turn times out; the host says it is picking it back up, the resume round answers, the pending record clears, and a reopened builder finds nothing running;
  - a message sent while the resume round runs is answered by its talker, on the stream the client holds, even when the resume round also times out while that talker is still replying (longer than the framework's 10 s wait). The answer is in the reopened conversation. Fails without fix 1.
- `tests/test_UAT_FC_BUG-361_the_composer_follows_the_runner.test.ts` (panel, jsdom, the real panel and webui-chat):
  - a talker reply cut off by the end of the work does not hold Stop, and its message runs next naming its id (fails without fix 2);
  - a leftover errored record with nothing running shows Send.
- `tests/test_UAT_FC_BUG-361_columns_that_touch.test.ts` (layout check, real Chromium): a two-column product page with a 0px gap is reported with the fix line, and not on a phone, where the columns stack. 32px passes. A photo meeting a filled panel edge to edge is not reported. The threshold is configuration.
- Regression scope (branch against clean `xgd-working`, identical results): the 30 jsdom/Chromium layout suites, 27 workers suites for the host, talker and job, and 35 panel suites. The failures already on clean `xgd-working` are the same.
- **Not covered here:** a real-browser UAT reloading at the start of a turn, mid-tool and mid-reply. The reload did not contribute to this incident (see Findings). Rejoining a running job after a reload is existing behaviour (REQ-624 `live` from the running job; BUG-294/BUG-343 for a dead one). The "shop whose first product is sold" and "checkout with no product" items belong to BUG-363.