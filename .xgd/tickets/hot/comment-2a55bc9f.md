---
uid: comment-2a55bc9f
id: COMMENT-3948
type: comment
title: Comment on bug BUG-147
created_by: xgd
created_at: '2026-09-25T22:55:00.733668+00:00'
updated_at: '2026-09-25T23:18:35.118250+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5a27a6ee
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2022e34d-4f73-4174-98ea-32effece61da",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="896cf1e2-6fff-4060-bb2c-b4d00f82a29a-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T22:54:03.423175+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="896cf1e2-6fff-4060-bb2c-b4d00f82a29a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T23:18:33.594122+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Design is clear and the ticket leaves the mechanism to me. No blocking questions — starting.

Now cutting the branch:

Let me verify the existing test suite runs in this worktree before changing anything (baseline).

Now implementing. First `ps.ts` — resolving who actually holds a port:

Now `dev.ts` — the core of the fix:

Now `devUp` — resolve the listener once the port answers:

Now `devDown` — signal the group, not the pid:

Now `devRestart`, added after `formatDown`:

Clean. Now the CLI wiring:

Now the workerd gate for `dev restart`, and `bin/dev`'s header:

No regression. Now the UATs for this fix:

Port-band race between the two suites running in parallel. Moving mine to a disjoint range:

Verifying the central UAT actually pins the defect — temporarily reverting to the old pid-only signal:

Pre-existing in this worktree, unrelated to my change. Restoring:

Now updating the ticket body with what was actually built, then committing:

Now merging back to `xgd-working` under the lock:

Done. BUG-147 is at `free_coded` on `xgd-working`.

## What changed

**The pidfile now names the process that holds the port.** `DevPidfile` gains `listenerPid` beside `pid`. `up` still writes the pidfile the moment the child exists — so a service that never answers still leaves the spawned pid for `reap` — and rewrites it once the port answers, which is the only moment the listener can be asked for and one `up` was already waiting for. The new `listenerPidsOnPort` lives in `ps.ts` with every other `lsof` call and reuses that module's existing parsers.

**`down` signals the process group** (`kill(-pid)`), which reaches the grandchild `kill(pid)` never did. A group id *is* its leader's pid, so a negative pid can only find the group led by that process or nothing — it can't land on an unrelated group from a stale pidfile. If the group call throws, each live recorded pid is signalled individually, and the recorded listener gets its own SIGTERM when it isn't the leader. Port verification is unchanged and is still what proves it worked.

**`ps` reads `bin/dev`** — `devTable` passes every pid a pidfile names, not just the spawned one.

**`bin/dev up|down|restart [<service>…]`** — the operator's actual need. `restart` composes the two verbs and owns no mechanism of its own; it deploys nothing, and starts nothing when `down` left a port answering (otherwise `up` would report the stale process as "already answering, left alone" — the exact carry-over that hid this). `down <service>` verifies that port whether or not a pidfile claims it, since `down` already removes the pidfile of what it couldn't stop. An unknown name is a `NOT_FOUND` failure rather than a successful no-op. `dev restart` joins `dev up` in the workerd gate.

## Evidence

11 UATs in `tests/test_UAT_FC_BUG-147_dev_stops_the_listener.test.ts`. The wrapper→grandchild shape is built for real — a detached wrapper spawns a child holding a real port that doesn't die with its parent, with `lsof` reading the pids back. Nothing about that relationship is stubbed, since the defect *was* a wrong assumption about it.

Adversarially confirmed: reverting the group signal to the pre-fix pid signal fails 3 legs; reverting `managedPids` to `.map(r => r.pid)` fails the `ps` leg.

Regression: REQ-319 (16, unchanged), REQ-316, REQ-290, req89, req177, REQ-254, REQ-292 all pass. **REQ-318 has 2 failures that reproduce on a clean tree in that worktree** — unrelated to this change, and I confirmed it by parking the diff and re-running.

One thing to flag: the worktree needed `apps/control-app/src/generated/` copied from the main checkout before any suite would run — the usual fresh-worktree artifact, not something this change introduced.

<!-- xgd-chat-end -->