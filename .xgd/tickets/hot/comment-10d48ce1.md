---
uid: comment-10d48ce1
id: COMMENT-3147
type: comment
title: Comment on bug BUG-121
created_by: xgd
created_at: '2026-09-18T23:20:58.577804+00:00'
updated_at: '2026-09-19T00:11:46.017681+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-350d7a6f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "97d14dbf-70b3-46c4-833f-5c1ab20a7275",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="feb686aa-4d1d-449c-8d5e-9dc7be67beb9-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:20:37.090693+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="feb686aa-4d1d-449c-8d5e-9dc7be67beb9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:51:46.534169+00:00" -->
#### Claude
Now I have the full picture. Let me verify one more thing before scoping — the settings-session archive path and whether the business session homes on a chat ticket too.

Now I'll scope the ticket. First the body — preserving everything the operator wrote and appending the correction plus the build plan.

Environment works. Now the implementation. First the durable record of a turn's prompt:

Now the `HostDeps` seam, next to `delta`:

Now `roles.ts` — the signal fact and its renderer:

Now the provider registration for both roles:

Now the site path:

Now the helpers and the read side (`openSession` / `openBusinessSession`):

Now the configuration (prose) and the runtime wiring:

Now the runtime wiring in `ai.ts`, the chat-ticket schema, and the stale junction comment:

Now the pane. Let me see how the composer and `note` behave so the paint is right:

Now the UAT suite:

The tests raced the turn's own `finally` — production holds it open with `ctx.waitUntil`, so the tests must too:

Now the pane UAT:

The build is green. Now the ticket body must match what was actually built — two design details changed during implementation:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="2eef257f-c964-495b-9245-1dc279026c78-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:58:36.648104+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="2eef257f-c964-495b-9245-1dc279026c78-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:11:45.815996+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me first establish the current state — branch, commits, ticket.

Good — in the branch worktree with the prior session's uncommitted work. Let me review what's there.

Now let me fix the indentation in `streamPrompt`'s business branch and check the tests.

Now let me look at the tests and check the environment is ready to run them.

`says` is there as a const. Now let me run the workers suite.

All 5 workers UATs pass. Now the jsdom pane suite.

Both typecheck clean. Now the regression scope — the adjacent suites this touches (BUG-46's drain, the reminder channel, the chat pane, the ticket type pack).

All four fail identically with my changes reverted — pre-existing, not mine. Restoring my version.

Now let me update the ticket body to cover the behaviour the UATs assert but the body doesn't yet name.

Now the version bump and commit on the branch.

Code is committed. Now take the merge lock, bring xgd-working in, and bump on top.

Clean merge. Now re-run the BUG-121 UATs against the merged tree, then bump.

Now bump on top and fast-forward into xgd-working, in one pass.

Both commits are on `xgd-working`. Now claim the ticket.

BUG-121 is free-coded and landed on `xgd-working`.

## What I finished

The prior session had the implementation written but uncommitted in the branch worktree. I reviewed it, fixed two defects it had introduced, verified it, and landed it.

**Two fixes to the prior session's work:**
- `roles.ts` — the new `interruptedSignal` was inserted between `changeSignal` and its JSDoc, orphaning that doc onto the wrong function. Moved `interruptedSignal` below `changeSignal` so each carries its own.
- `host-core.ts` — the business branch's new `try` block left its body at the old indentation.

**The change itself** (unchanged from the prior session's design): a turn's prompt is written to the session's `chat` ticket (`fields.pending_turn`) before `promptStream` is reached — ahead of the first token and ahead of any tool write. It is forgotten when the turn completes and kept with its outcome (`aborted`/`error`) when it does not. `/api/ai/session` answers `interrupted: {text, at, recorded}`, reconciled against the transcript returned alongside it; the pane paints the operator's words back and refills the composer when `recorded: false`, and says the reply is a fragment when `recorded: true`. The assistant gets a one-line reminder on the next turn through the REQ-131/REQ-160 channel. A live turn is never reported.

**Verification, all in the foreground:**
- The two BUG-121 UAT files: 9 tests, pass.
- 23 adjacent suites (BUG-46 drain, BUG-38/64 session liveness, REQ-131/160/182/262 reminder channel, REQ-122/239/260 chat and settings panes, schema/priming validators): 214 tests, pass.
- `tsc --noEmit` clean in both `apps/control-app` and `tools/generate`.
- Full suite: 4983 passed, 5 failed across 4 files. I confirmed all 4 are pre-existing by reverting `host-core.ts` to its base and re-running — they fail identically without my changes (`bug32-webui-scope-rebrand`, `BUG-112 on_sample_layout_gate` ×2, `BUG-50 builder_env_files` — a genuinely flaky random-port assertion, `BUG-67 backend_settings`).

**One thing to flag:** partway through I ran `./bin/project/xgd_version_bump` while the shell's cwd had drifted to the main checkout rather than the branch worktree. It bumped `package.json` there and staged a stray `.dev.vars~`. I reset and restored both immediately; the main checkout went back to 0.2.275 with no commit made, and nothing was lost.

**Ticket:** body appended with a "Details settled during implementation" section covering the five behaviours the UATs assert that the body did not previously name (live-turn exclusion, composer-only-when-empty, settings-session parity, store failures never failing a turn, the declared `pending_turn` field). Status `free_coded`, `story_points: 5`, commits `0ff31ce19e` (code) and `0a25bb80c0` (version bump to 0.2.276), both verified ancestors of `xgd-working`. Branch and worktree cleaned up, lock released.

The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->