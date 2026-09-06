---
uid: comment-5165b19e
id: COMMENT-2291
type: comment
title: Comment on request REQ-193
created_by: xgd
created_at: '2026-09-06T18:10:30.394776+00:00'
updated_at: '2026-09-06T19:03:35.580065+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bce2b6f9
  kind: chat_transcript
---

<!-- xgd-turn id="0111e3d6-a5e4-453b-80d7-222cded4f6fe-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:10:01.868265+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0111e3d6-a5e4-453b-80d7-222cded4f6fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:40:57.308389+00:00" -->
#### Claude
Now let me look at the builder UI for people (the Users tab) and the identity read of `display_name`.

Ticket is clear and prescriptive. Let me start the free-coding flow.

Now the schema. Editing REQ-190's baseline in place, as its header instructs.

Now the shared name vocabulary module — one definition reachable from both sides of the seam.

Now `people.ts` — the read path through the name table.

Now `setPersonRecord` — the curation surface.

Now the browser panel.

Now the detail pane: the name section plus the explicit name-change dialog.

Now the name-change dialog — the deliberate act.

Now the transport layer.

Now CSS for the new elements.

Now the BUG-54 panel and workers tests, which still assume the flat shape.

Now the workers-side tests that read `users.display_name` directly.

Now the new UATs for REQ-193 — first the model, in workerd against real D1.

Now the REQ-193 workers UAT.

All 23 pass. Now the browser-side UAT for the tab.

REQ-191 landed on `xgd-working` while I was working and touches the same files. Let me commit and merge it in now, while I have full context.

Now the remaining conflicted files.

<!-- xgd-turn id="4387d205-f3fd-4290-acc2-3cd39b77aa98-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:41:03.389197+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="4387d205-f3fd-4290-acc2-3cd39b77aa98-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:03:34.857646+00:00" -->
#### Claude
Now the broader regression scope — the suites that touch the same read paths.

A pre-existing typecheck break on `xgd-working` (from BUG-55, not this ticket) blocks the build. One-line repair so I can verify my own work:

Typecheck clean. Now the full suite:

All 5 failing files fail identically without my change — pre-existing KB/knowledge-surface drift on `xgd-working`, unrelated to names. Now reviewing the implementation before commit:

Now updating the ticket body to cover behaviour the UATs pin that the original body didn't name, then committing.

Now the version bump and commit:

Now lock, merge back into `xgd-working`:

`xgd-working` advanced to 0.2.89. Merging the other way so the version-carrying commit is the tip:

REQ-192's seed still writes the dropped column. Fixing it to the name table:

Now the REQ-192 seed tests, plus a UAT that the seed exercises the name shapes:

Now adding UATs pinning the seed's name shapes:

All 8 pass. Typecheck and the full REQ-193 + adjacent scope:

Now bump the version on the branch tip and commit:

Fast-forwarded cleanly. Verifying the landed state on `xgd-working`:

Now moving the ticket to `free_coded`:

Another session took the merge lock, so `branch clean` won't release it. The branch tip *is* `xgd-working`'s tip, so tearing down manually is safe:

REQ-193 is landed and at `free_coded`.

## What's in it

**Schema** — `user_names` in REQ-190's baseline: `display_name NOT NULL` plus six optional parts, `superseded_at`/`superseded_reason`, and `CREATE UNIQUE INDEX … ON user_names (user_id) WHERE superseded_at IS NULL`. `users.display_name` is dropped.

**One resolver** (`names.ts`) — `currentNameOf`, `formerNamesOf`/`formerNamesIn`, `writeName`, `redactNames`. `superseded_at IS NULL` is never a predicate at a call site. `writeName` supersedes rather than updates, treats an absent part as carry-forward, and writes no history for a no-op commit. `corrected` is the default; only `changed` former names cross to the client.

**Surfaces** — a name section per part in the detail pane with the live greeting (`known_as` → `given_name` → `display_name`), a separate prefilled dialog for the deliberate *this is a name change* act, `formerly …` in the list, and the account switcher reading the name table.

**Dev fixture** — REQ-192's seed still wrote the dropped column, so it moved to `user_names` and now carries four shapes: Alice (title, `known_as`, a real former name beside a corrected typo), Bob (Robert-called-Bob, null-reason supersession), Carol (mononym), Dave (parts, no `known_as`).

37 + 8 new UATs; 141 pass across the regression scope; `pnpm build` clean.

## Three things to know

- **One incidental repair.** `system-knowledge.ts` didn't re-export `SHIPPED_SOURCE` that its own consumer imports — a typecheck break inherited from BUG-55 that made `pnpm build` fail on `xgd-working` before this ticket. One line, fixed here so the work was verifiable, and named in the ticket body so reconciliation doesn't attribute it to names.
- **Five test files fail and failed identically before this branch** — `bug32-webui-scope-rebrand`, `reconciliation-assistant-conversation-knowledge`, `REQ-123_session_knowledge`, `REQ-158_system_kb`, `REQ-160_two_kb_session`. All knowledge-surface drift from other in-flight work; I confirmed by reverting my one line and re-running.
- **The branch worktree is still on disk.** `xgd branch clean REQ-193` refuses because REQ-196 now holds the merge lock, and manual removal hits the sandbox protection on git worktree metadata. The merge is landed and all four SHAs are ancestors of `xgd-working`, so this is cleanup only — re-run `xgd branch clean REQ-193` once REQ-196 releases.

Ticket is at `free_coded` with `story_points: 5`, version `0.2.93`. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->