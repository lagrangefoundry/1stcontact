---
uid: comment-7abc093a
id: COMMENT-3289
type: comment
title: Comment on bug BUG-124
created_by: xgd
created_at: '2026-09-20T19:05:04.613475+00:00'
updated_at: '2026-09-20T19:24:25.363354+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7070acbb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fd0f500a-5af8-4134-b601-56773347a553",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="376c6e01-1445-435c-b092-107027b61b79-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T19:04:06.801008+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="376c6e01-1445-435c-b092-107027b61b79-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T19:24:24.920014+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is thorough. Let me survey the actual code before asking anything.

Design is clear and the ticket is unusually complete — I have no blocking questions. Let me record the decisions on the ticket and start.

Now implementing. First the env-file layering gains a reader and the full launch-argv composition:

Now the `builder` case body and the new `filing` command:

Now the standalone `1c filing` command:

Now the wider regression scope:

Now version bump and commit, in the branch worktree:

Now merge back under the lock:

Done. BUG-124 is at `free_coded` — commit `d5ace65` merged into `xgd-working`, version `0.2.289`, 39 tests green.

**I had no blocking questions** — the ticket named the fix precisely, so I implemented it and made the open decisions myself:

**The fix.** `filingVars()` and the `--var` handoff are gone. `wranglerDevArgs` carries no `--var` at all, so every var the Worker reads comes from files a bare `wrangler dev` reads too. The default port is **8790** (one step from the builder's 8788; deliberately *not* beside repro-console's 8710 — 8711/8712 turned out to be routinely occupied on your machine, which is precisely the collision a fixed port must avoid by choosing well).

**Three decisions worth flagging:**

1. **The CLI writes the token.** `.dev.vars` is gitignored, so no clone has those lines until something puts them there — and a setup step nobody performs is this same silence one remove. So the first `1c filing`/`1c builder` mints the bearer, appends both lines, and says so; a second run keeps what the first minted. Where there's no `.dev.vars` at all it prints the lines rather than conjuring a file.
2. **`--no-filing` changed meaning** — it starts no listener, but cannot un-configure an address it doesn't own. The tool is still offered and reports the project unreachable; the banner says the same.
3. **One honest test substitution.** "A `ReportBug` call creates a ticket in this project's store" is tested through a real `Toolbox` call → real composed surface → real loopback socket → real listener → a recording project handle. The last rung is upstream's `XgdProject` spawning `xgd`, which a suite must not run.

**Legibility (item 3)** is a value, not a banner: `filingStatus()` answers `unconfigured`/`unreachable`/`answering`, backed by a credential-free GET probe the listener now answers by name (`service: "filing"`) — so the banner reports *what is actually answering* rather than what the running process did, and the UATs assert the state directly.

Two things for you:

- **A stray filing service is listening on 127.0.0.1:8795** from my verification run. `kill` and `kill -9` are both no-ops under the sandbox, so I can't stop it — it needs your shell. It's harmless (loopback, in a now-deleted worktree).
- **Your main checkout isn't provisioned yet.** `./bin/1c filing &` writes the two lines into `apps/control-app/.dev.vars` and starts the listener; after that `bin/access-sim &` plus any launch path gives you identity and filing together.

One pre-existing failure I confirmed is not mine: `tests/bug32-webui-scope-rebrand.test.ts` fails identically on clean `HEAD`.

<!-- xgd-chat-end -->