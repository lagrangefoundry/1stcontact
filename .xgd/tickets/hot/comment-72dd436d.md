---
uid: comment-72dd436d
id: COMMENT-1476
type: comment
title: Comment on bug BUG-39
created_by: xgd
created_at: '2026-08-25T23:19:03.219423+00:00'
updated_at: '2026-08-25T23:28:50.254156+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-23d1ec27
  kind: chat_transcript
---

<!-- xgd-turn id="11e7bac1-a97c-4b47-a885-b75228e32a58-user" -->

<!-- xgd-chat role="user" ts="2026-08-25T23:18:53.005410+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="11e7bac1-a97c-4b47-a885-b75228e32a58-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-25T23:28:50.012862+00:00" -->
#### Claude
Now I'll write the shared double.

Now migrate the Node chat-host suite.

Now the workerd chat-host suite (AC2) and the other stale doubles.

Now the three other Node suites carrying stale or duplicated doubles.

Now run the whole set of affected suites together, plus a typecheck.

Now the full sweep, detached so it survives the turn.

Done — landed on `xgd-working` at `759cd8740`, ticket at `free_coded`.

## What I did

The root cause was as the ticket diagnosed, but the blast radius was wider: **four** hand-maintained transcriptions of the Anthropic wire protocol existed at the injected `client` seam, and three Node suites were still on the pre-streaming contract — 15 failures, one cause.

Collapsed them into `tests/support/scripted-model-client.ts` (`scriptedClient` / `says` / `calls`), imported by every chat-host suite. **274 lines of duplicated protocol deleted, 57 added.**

| suite | before | after |
|---|---|---|
| REQ-122 chat host | 5 failing | **8/8 pass** |
| REQ-127 session binding | 3 failing | 1 failing (different cause) |
| reconciliation-assistant-conversation | 7 failing | 1 failing (same different cause) |
| REQ-131, draft-change-journal, REQ-146 workerd, BUG-38 workerd, conversation-knowledge | 3rd/4th/inline copies | import the shared one |

**AC3 (the three tests that already passed):** not vacuous — two assert on `client.seen[0]`, i.e. on what the model was *sent*, which a real call produced. But neither asserted a reply, so I strengthened both to assert the scripted answer reached the stream. The third uses a throwing double and never depended on the contract.

**Evidence for this ticket** — `tests/test_UAT_FC_BUG-39_model_double_contract.test.ts`:
1. the double driven through the real host produces prose *and* a tool call whose arguments survive the wire's fragmentation and change the site on disk (the assertion the broken suites couldn't make — the transport worked fine throughout);
2. a drift guard asserting the protocol is transcribed in exactly one file and nowhere in the pre-streaming shape. Repairing the suites proves they pass today; this is what stops the next protocol change splitting them again.

## Two things to decide

**1. A second, unrelated defect — I did not touch it.** These two still fail:
- `test_UAT_FC_REQ-127_an_unissued_session_id_is_refused_rather_than_opened`
- `test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed`

Both post `site-<slug>` — derivable but never issued — and expect 404; they get 200. They fail identically before my change and in isolation. The cause is **BUG-38, deliberately**: it deleted the per-process session registry (which couldn't survive isolate churn) and replaced its protection with `slugForSession`'s `hasDraft` store read. So "derivable ≠ issued", which both tests state in their own comments, is an invariant the code no longer holds by design. That's an intent conflict between BUG-38 and REQ-127/AC1055 — rewriting another intent's AC from inside this ticket seemed like the wrong place, so it's flagged in the body. Tell me if you'd like it handled here or filed separately.

**2. Full sweep:** 15 failures / 2000 tests. Two are the above; the other 13 (req115, req117, workspace-origin, platform-build-deploy-smoke, parameter-sheet) are pre-existing and unrelated — 11 of them pass in isolation, i.e. the known dist-assets-wiped-mid-suite artefact. Full log at `/tmp/xgd/bug39-sweep.log`.

One incidental note: a fresh worktree needs `./bin/1c assets` before these suites can even import (`Cannot find module './generated/ai-workers.js'`). Recorded in the ticket.

<!-- xgd-chat-end -->