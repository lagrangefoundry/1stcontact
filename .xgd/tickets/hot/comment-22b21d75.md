---
uid: comment-22b21d75
id: COMMENT-2278
type: comment
title: Comment on bug BUG-52
created_by: xgd
created_at: '2026-09-05T20:18:05.317872+00:00'
updated_at: '2026-09-05T20:38:10.382983+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-38efa295
  kind: chat_transcript
---

<!-- xgd-turn id="96ded8be-f6ea-4583-92a8-e203fcf2635d-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T20:17:25.280245+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="96ded8be-f6ea-4583-92a8-e203fcf2635d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T20:35:48.527008+00:00" -->
#### Claude
Ticket is well-specified. Let me start the free-coding flow.

Now the new `session.js` module:

Now the `api.js` changes — a single send path that classifies 401 and rejection:

Now route every call site through `send`:

Now update the three load-path calls to stop converting a 401 into a default:

Now `app.js` — subscribe to the signal and stop the 401 emptying the builder:

Now `main.js` — the load path draws the notice instead of an empty builder:

Let me restructure so the session vocabulary lives in one place and the load decision is testable:

Now trim `api.js` to import the vocabulary rather than redefine it:

Now fix the imports in `app.js` and `main.js`:

Now the CSS for the notice, and the harness token lifetime:

Now the mid-session mount suite:

Now the harness-lifetime UAT, then a broad regression run:

Now the regression scope — every suite that mounts the builder or exercises `api.js`:

Now a full node-project run to catch anything else:

Meanwhile, let me update the ticket body so every UAT is motivated by ticket language:

Now lock, merge back, and mark `free_coded`:

Done. BUG-52 is at `free_coded`, merged into `xgd-working`.

## What I built

**`session.js` is new** — the session became a thing. It holds the two ways a session ends, the error naming them, the subscription that reports one, the sentence shown to the operator, and the notice carrying it. The split against `api.js` is transport versus meaning: `api.js` recognises a 401 and a rejected fetch, `session.js` says what they mean and who is told. Dependency runs one way, so the entry point and the shell ask about identity without importing transport.

**Every request now goes through one `send()` in `api.js`.** Nothing outside that module calls `fetch`, so noticing a 401 is mechanical rather than a convention the next route has to remember. A 401 is announced and handed back; the three load-path calls additionally throw instead of returning their defaults. The other ~20 callers keep their existing error contracts — the banner reaches the operator either way, and rewriting them all would be a bigger change than the bug. A 500 is unchanged: only a 401, which answers the question with *"not you"*, stops being a default.

**A rejected fetch is classified as an authentication failure** with reason `unreachable`, kept distinct from `expired` for one purpose — the sentence hedges (*"could not reach the server — your session may have ended"*), because it's a lapsed Access cookie most of the time and a downed origin the rest, and the client genuinely cannot tell. One button recovers from both.

## Decisions I made

**Nothing is disabled and nothing navigates by itself.** This is the one place I departed from REQ-173's block, and it follows from your own line that the person most likely to hit this is mid-edit. `inert` removes a subtree from hit testing, so blocking the shell would put their half-typed text behind a barrier they can't even select it out of, immediately before the reload discards it. So: strip above a live, undimmed shell, and recovery is a button. Concretely, the refused site listing now stops before the four lines that rewrite the pane, Library and People tab from a store this session can't read.

**The load decision lives in `session.js`, not `main.js`** — that file imports three modules by absolute URL only a browser can resolve, so a decision written there is one no suite can drive.

**Harness tokens are seven days**, behind a named constant, still overridable so the deliberately-expired mints keep working.

## Verification

14 UATs across two files, all passing. Full node project run: the 9 failing files are pre-existing worktree artifacts — `dist-assets` not built (`1c assets`), no KB index, and a `session-knowledge.ts` typecheck error I confirmed fails identically on the stashed baseline. The two builder suites that appeared in that list pass in isolation with my changes.

One thing worth knowing: mounting the builder against no origin now surfaces the notice, because the default chat/library/people transports fetch and reject. That is honest behaviour, but it means suites mounting the real shell want transports injected — my mount tests do.

<!-- xgd-turn id="09b98070-6c44-44eb-9128-02bf131366d7-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T20:38:09.633134+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->