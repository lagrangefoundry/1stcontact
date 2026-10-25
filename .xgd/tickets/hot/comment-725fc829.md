---
uid: comment-725fc829
id: COMMENT-4034
type: comment
title: Comment on bug BUG-155
created_by: xgd
created_at: '2026-09-27T00:36:52.819822+00:00'
updated_at: '2026-09-27T00:45:18.277823+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-25102815
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "74ca8dc3-cc46-4a5a-bc2a-4ad5e62f2710",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4ec6b20f-01c3-479d-ae3e-11fa1b9618ba-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T00:35:32.308687+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4ec6b20f-01c3-479d-ae3e-11fa1b9618ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T00:45:18.000306+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is fully specified. Let me examine the code.

Now the spawn site:

Clear scope. Let me check the test setup and then cut a branch.

Now I'll cut the branch.

node_modules is present. Now the source change:

Now the UAT:

Tests pass. Now let me add the wiring assertion — proving the spawn actually uses it, via the existing executable-override seam (a local stub, never a billed model):

The stub's message isn't a valid outcome block. Let me check what one looks like so the stub emits a real round:

`no-gap` needs only a status. Let me have the stub emit a real outcome block:

All four pass. Let me confirm the wiring test genuinely fails without the fix:

Confirmed RED without the fix, GREEN with it. Now the regression scope — the sibling repro-console suites:

Two failures in a `1c` step-runner suite, unrelated to ai.ts. Let me confirm they're pre-existing:

Same 2 failures on the clean tree — pre-existing and unrelated (the `1c` step runner needs built assets). Verifying my changes survived the stash round-trip:

Now the ticket body — I need to add language motivating the wiring UAT (which spawns a local stub, beyond the body's "no process spawned" line):

Now bump the version and commit:

Committed. Now lock and merge back into `xgd-working`:

Done. Let me verify the final state on `xgd-working`:

BUG-155 is implemented and landed on `xgd-working` at `free_coded`.

## The fix

The bug was that `attempt()` spawned `claude -p` with no `env`, so the child inherited the server's `process.env` verbatim — and the CLI prefers `ANTHROPIC_API_KEY` over the subscription login. Three additions to `tools/repro-console/src/ai.ts`:

- **`AI_STRIPPED_CREDENTIAL_ENV`** — the five names from the ticket's acceptance: `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`.
- **`claudeEnv(env)`** — a pure function returning the server's environment minus those names, without mutating the original (the console keeps running after a round and reads the same object again).
- **`env: claudeEnv(env)`** at the spawn.

Subtraction by name, not a minimal environment, per behaviour 2: the round still needs `PATH` for `node`/`git`/`xgd`/`1c`, `HOME` for the CLI's own login, and `REPRO_CONSOLE_AI[_MODEL]` as operator overrides read from that same place. The argv, permission mode, both tool lists and resume are untouched.

## One judgement call worth flagging

Acceptance said "asserted from a pure function, with no process spawned." Three of the four UATs are exactly that — but a pure-function assertion alone would still pass if the spawn never called `claudeEnv`, which is precisely the bug's shape (`claudeCommand` was pure and asserted; the environment beside it was neither). So I added a fourth UAT that observes what a real child actually received, spawning a **local stub** through the existing `REPRO_CONSOLE_AI` seam — never a billed model, the same substitution the sibling suites make for `claude`, `1c` and `git`. I verified it fails without the fix and passes with it. I appended a section to the ticket body motivating this and two acceptance lines covering it, so reconciliation doesn't have to discover it.

## Verification

- 59 tests pass across the four suites that touch this seam (`grep` confirms those are the only tests importing `claudeCommand`/`spawnAiRunner`/`AI_COMMAND_ENV`, so the change is well contained).
- `tsc --noEmit` clean on `tools/repro-console`.
- Two failures I hit in `test_UAT_FC_REQ-254_reproduction_console.test.ts` are **pre-existing** — I confirmed them on a stashed clean tree. They're in the `1c` step runner (`spawnStepRunner` capture), unrelated to `ai.ts`.

`README.md` documents the guarantee beside the two operator variables it already listed. Version bumped `0.2.388 → 0.2.389`; commit `8719be2971`; branch merged and cleaned. The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->