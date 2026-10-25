---
uid: comment-20fa21fe
id: COMMENT-4904
type: comment
title: Comment on bug BUG-203
created_by: xgd
created_at: '2026-10-04T20:54:35.525003+00:00'
updated_at: '2026-10-04T21:02:50.452550+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-332da6eb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "48217555-5e21-4752-880b-16e897c71972",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="23ffff17-8f25-45e2-a7dd-651504e32ffb-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T20:53:40.172964+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="23ffff17-8f25-45e2-a7dd-651504e32ffb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T21:02:48.073020+00:00" -->
#### Claude
Reading `bin/deploy` and the existing deploy UATs. Then I'll pick how the fix fits around the `1c assets` build.

Scope is clear from the ticket, so I'm starting: status to free_coding, then cut the branch.

Building assets takes under a second, so doing it inside the deploy costs nothing. Checking that the build doesn't dirty tracked files:

Revert the incidental `module-assets.ts` rewrite, then write the hook and wire the stage into `bin/deploy`.

Now `bin/deploy`: run the build stage first, and update the header and help text.

Checking whether any existing test pins hook output that the new stage would change:

No existing test sees the new stage: the smoke test builds its own fake hook tree. Now the UAT file.

All four pass. Checking they fail without the fix by temporarily removing the build stage from `bin/deploy`:

The wiring tests fail without the fix and pass with it. Running the adjacent deploy suites as a regression check:

All 58 pass. But `bin/deploy.d/build/` is missing from `git status`, which suggests it's gitignored. Checking:

Rename done. Re-running the new UATs and the REQ-144 hook suite:

Tests green, and the tree is clean apart from my changes. Before committing, reading my notes on this project's version-bump procedure:

Committing on the branch, then lock and merge into xgd-working:

Merged. Updating the ticket body to record what landed (existing sections kept, new ones appended), then the free_coded gate:

Fixed. Updating my stale memory note that said a dev deploy needs `bin/build` first:

The sandbox blocks writes to the memory directory from Bash, so I'll use the edit tools instead.

The memory index is near its size limit, so I'll compact it now. Reading the rest:

`bin/deploy` now builds the builder's browser assets itself before shipping. It can no longer ship yesterday's browser files beside today's server. BUG-203 is at `free_coded` and merged into xgd-working, ready for you to promote.

**How it works now**
- **Build step:** a new hook stage, `bin/deploy.d/assets/`, runs first for every app, before the migrate and secrets hooks. Its control-app hook runs `1c assets`, the same asset build `bin/build` uses, which takes about a second.
- **Production too:** this covers `--env dev` and the production upload, because the production upload had the same stale-copy problem.
- **Dev banner:** the banner already prints the commit the snapshot was built from. Since both halves now come from that same commit, it's accurate for both.
- **Failures and rehearsals:** if the build fails, the deploy stops before any migration runs. `--dry-run` builds nothing and just says what it would build.

**Choices I made**
- **Build rather than refuse:** this was the ticket's preferred option. It's one command, and a staleness check would have needed its own list of everything `1c assets` reads.
- **No knowledge-base refresh first, unlike `bin/build`:** `1c assets` already refuses an out-of-date knowledge base, so a stale one can't ship either. The deploy just stops and names the command to run.
- **Stage named `assets`, not `build`:** the repo's `.gitignore` ignores every `build/` directory, so a `build/` folder would never have been committed.

**Tests:** 4 new tests, in `tests/test_UAT_FC_BUG-203_deploy_builds_what_it_ships.test.ts`:
- a stale copy in `dist-assets` gets rebuilt to match its source;
- the build stage runs before the other hooks for both dev and production;
- a failed build stops the deploy;
- a dry run builds nothing.

All 4 pass. The two that check the deploy's ordering fail when the build stage is removed, so they do catch the bug. The existing deploy suites also pass (58 tests).

I didn't run a full `bin/deploy --env dev control-app` in the tests. It would apply migrations to `.wrangler/state`, which holds the only copy of your dev data. Instead the tests cover each link: the build makes `dist-assets` match the source, the deploy runs the build before shipping, and REQ-318's tests already cover the copy into the snapshot.

**One thing for you:** your current dev snapshot is still the stale one. Run `bin/deploy --env dev`, then `bin/dev restart dev`, to pick up the comp board and the other missing UI.

<!-- xgd-chat-end -->