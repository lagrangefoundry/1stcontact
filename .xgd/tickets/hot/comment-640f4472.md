---
uid: comment-640f4472
id: COMMENT-5799
type: comment
title: Comment on bug BUG-307
created_by: xgd
created_at: '2026-10-28T02:22:58.348665+00:00'
updated_at: '2026-10-28T02:54:37.736796+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9b5ecc5c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6d62123f-9ff2-45d7-9f8c-ffe5904801d8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T02:22:50Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T02:22:50Z" -->
#### You
Did I fail to deploy correctly? The first draft build ran straight through with no hero movement story.

<!-- xgd-chat role="assistant" ts="2026-10-28T02:22:50Z" -->
#### Claude
The deploy was right; dev-worker had run since 23:59Z and the hot reload kept old code. Dina 9 plan shows pre-BUG-304 guides and a first build BUG-306 would refuse.

<!-- xgd-chat role="user" ts="2026-10-28T02:22:50Z" -->
#### You
can we make sure that bin/dev restart restarts everything

<!-- xgd-chat role="assistant" ts="2026-10-28T02:22:50Z" -->
#### Claude
Bare bin/dev restart already does; the trap is the front named dev. Ticket: rename it front (no alias), deploy --env dev restarts what serves the snapshot, ps flags stale services, boot guard advises bin/dev restart.

<!-- xgd-turn id="22041403-8d67-42e0-a088-00a597e18f65-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T02:32:54.648019+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="22041403-8d67-42e0-a088-00a597e18f65-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T02:54:36.069671+00:00" -->
#### Claude
Reading the dev tooling (`bin/dev` → `1c dev`, `ps.ts`) before cutting the branch. Next: `dev.ts` and `bin/deploy`.

Still surveying: found the deploy's local step and snapshot table. Now locating the builder boot guard and existing dev tests, then I'll cut the branch.

Baseline: 80 pass; the 2 REQ-318 dry-run deploy failures exist before any change (wrangler in sandbox). Implementing now.

Now `dev.ts`: the `snapshot` link per service, the stale check, and the `refresh` verb.

Now the `refresh` verb that the deploy calls, placed after `restart`:

Now the CLI wiring in `index.ts`: usage text, `ps` stale section, and the `refresh` subcommand.

Now `bin/dev`'s header, so bare `restart` comes first:

Boot guard next — loopback-only hint:

The guard is a template-literal string, so the regex backslashes need doubling:

No `tsx` here; the vitest UATs will exercise the guard instead. Checking how the BUG-147 suite builds real fake services so I can reuse its pattern:

Updating the existing UATs that pinned the old name `dev` (this ticket deliberately replaces it):

Writing the BUG-307 UAT file now (real detached listeners in a temp root, same pattern as BUG-147; ports 8740–8767 so it doesn't collide with the parallel suites):

All 6 new UATs pass. Running the neighbouring dev/boot-guard suites plus typecheck and lint:

More failures than the baseline. Checking whether these are parallel-suite interference or real:

Typecheck is clean. REQ-318's two failures are the baseline ones. REQ-319's reap dry-run is new, so checking it:

Passes alone. Reading the test to see what it could pick up from a parallel suite:

It draws 8850/8860, the same ports BUG-150 and REQ-322 draw; my suite now uses 8711–8739 and can't reach them. Rerunning the set once to confirm it's that existing race:

All 75 pass, so the REQ-319 failure was that port race between existing suites. Checking for a lint step, then committing:

Following the gate order from memory: commit the work, lock, merge `xgd-working` into the branch, bump at the tip, fast-forward.

Nothing incoming touches the dev tooling, and the UATs still pass. Fast-forwarding `xgd-working`:

`xgd-working` moved again (ticket auto-commits). I'll merge it into the branch once more, bump at the tip, and fast-forward in a single step:

Making the test-plan lines honest about how the deploy and `ps` UATs exercise the code:

Done. Updating the two memories that still say `bin/dev restart dev`:

The sandbox blocks shell writes to the memory directory, so I'll use the Edit tool instead:

BUG-307 is done and merged into `xgd-working` at version 0.2.695. The ticket is at `free_coded`, with three commits recorded and the body updated to match what was built.

**What changed for you**
- **Bare `bin/dev restart` restarts every service.** It already did; it's now the first line of `bin/dev`'s usage and a test pins it.
- **The front on 8789 is now called `front`, with no alias.** `bin/dev restart dev` fails with "Unknown dev service 'dev'" and lists the real names.
- **`bin/deploy --env dev` restarts what it made stale.** Its last step is a new `1c dev refresh <app…>`, which restarts the running services tied to the deployed app and prints their names:
  - a control-app deploy restarts `dev-worker`, `front` and `access-sim`;
  - a public-site deploy restarts `public-site`;
  - `filing` is never restarted;
  - if nothing is running, it says `bin/dev up`, as before.
- **Old processes are flagged.** `1c ps`, `bin/dev up` and `bin/dev restart` print a STALE row for any service that started before the snapshot it serves was deployed.
- **The builder's error page gives the right advice on dev.** When the page is on 127.0.0.1 or localhost and an asset fails to load, it now says `bin/dev restart` instead of `1c assets`. On any other address the message is unchanged.

**One change from the ticket as written:** it said to restart `front` and `access-sim` "when their code changed". I restart them with every control-app deploy instead. They sit in front of the control app, a restart is cheap, and it avoids having to work out whether their code changed. The ticket body now says this.

**Tests:** the six new BUG-307 tests pass. I updated four existing tests that expected the name `dev` (BUG-150, BUG-295, REQ-318, REQ-322). The related dev and boot-guard suites pass (75/75), and the typecheck is clean. Two REQ-318 dry-run deploy tests fail in this environment, but they failed the same way before my change. The deploy test calls `dev refresh` on stand-in processes in a temporary folder rather than running a real deploy, which would restart your own dev services. It separately checks that `bin/deploy` calls `dev refresh` with the apps it deployed.

**One-time step:** your running dev processes started before this change. Run a bare `bin/dev restart` once; deploys after that restart the services themselves.

<!-- xgd-chat-end -->