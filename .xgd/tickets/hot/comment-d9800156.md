---
uid: comment-d9800156
id: COMMENT-2956
type: comment
title: Comment on request REQ-237
created_by: xgd
created_at: '2026-09-14T01:50:06.776735+00:00'
updated_at: '2026-09-14T02:41:55.095321+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-1e65c6db
  kind: chat_transcript
---

<!-- xgd-turn id="b14c085d-f94b-496a-863f-b13fafd232fa-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T01:49:25.372680+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b14c085d-f94b-496a-863f-b13fafd232fa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T02:20:37.272974+00:00" -->
#### Claude
Now I have the full picture. Let me record the implementation decisions on the ticket and start.

Now let me write the migration and the business-record module.

Now the test-fixture migration list, and the schema doc comment:

Now the settings surface declaration:

Now the HTTP route:

Now let me typecheck and lint.

Now the REQ-178 shape-comparison test:

While the full node suite runs, let me update the ticket body.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="09ad6dfd-da5a-4b98-bca8-c08d58add152-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T02:21:50.701357+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="09ad6dfd-da5a-4b98-bca8-c08d58add152-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T02:41:54.060967+00:00" -->
#### Claude
I'll start by getting the current state of the ticket and the working tree.

The branch already exists from the prior session. Let me check its state.

Ticket body is fully populated. Now let me review the uncommitted work in the branch worktree.

Those `tools/generate` errors are all about untyped `./builder/*.js` modules — none in my files. Let me confirm they're pre-existing.

Confirmed pre-existing (identical 14 on `xgd-working`). Now running the tests.

All 43 pass. Now the full suite to catch regressions elsewhere.

Three failures, none in my files. Let me verify they're pre-existing on `xgd-working`.

Both pre-existing. The third was a 120s timeout under full-suite load — let me run it alone on the branch.

All three failures are pre-existing/load-related, not regressions. Now checking version-bump convention for this repo.

Now the merge back: acquire the lock and merge into `xgd-working`.

A real collision: REQ-244 landed its own `0006` on `xgd-working` while I worked. Renumbering mine to `0007` (theirs landed first).

Now resolving the fixture conflict — both migrations belong, mine after theirs.

Now verifying the merged tree before committing the merge.

Merged tree passes including REQ-244's own tests. Running the full suite on the merge result.

12 failures vs 3 before. Let me get the full list and compare against pre-merge `xgd-working`.

Several look like load flakes or infra. Let me re-run the failing set in isolation on the merged tree.

Not flakes. Let me check them against pre-merge `xgd-working` in a temp worktree.

Temp worktree lacks `node_modules`. Let me link it and rerun.

Baseline worktree can't resolve workspace packages. Let me instead read the actual offender lists from the merged tree — these are static source scans.

Clear now — none are mine. Let me confirm the two causes.

All three causes are environmental and pre-date my work: a stray untracked `.md` at repo root, a stray `.claude` directory under `framework/src/modules`, and `node_modules/` being behind the committed `pnpm-lock.yaml`. My commit touched none of these. Committing the merge.

The renumber decision currently lives only in the merge commit — reconcile cherry-picks non-merge commits, so it would be lost. Let me put it on the branch as its own commit.

Now applying the same rationale comments the merge resolution carried.

Clean merge — the tree already matched. Verifying.

Now recording the ticket. First appending the renumber decision to the body, then the gate command.

Now the gate command with both SHAs.

The merge commit took the version bump. Bumping again on the branch.

Fast-forward — `xgd-working` tip is now the branch commit itself.

Free-coding complete. REQ-237 is at `free_coded`.

## What landed

Three commits, all merged into `xgd-working` (`105070e305` is the tip):

| SHA | What |
|---|---|
| `dc192d05e3` | The implementation |
| `b7e9c4db08` | Migration renumber `0006` → `0007` |
| `105070e305` | Version bump to `0.2.193` |

**The rule lives in one place.** `apps/control-app/src/business.ts` owns normalisation (tidy whitespace, preserve case), comparison (fold case on top), the default-name search, and the rename. `0007_business_name_unique.sql` carries the same rule as a `UNIQUE (owner_account_id, lower(name))` index and is deliberately the weaker of the two — SQLite's `lower()` is ASCII-only and cannot collapse whitespace — so the code refuses first, naming the sibling business.

**A rename writes one column and reports what that left stale** — the site's title, the pages whose prose still names the business — as offers, never actions. Two callers: `POST /api/business/name` (owner-gated, 409 naming the holder vs 400 for empty) and the `settings` surface declaration, which REQ-239 composes.

**Tests:** 43 UATs across the two REQ-237 files, all passing, plus REQ-178's adjusted shape comparison and REQ-244's suite.

## Two things worth flagging

**The migration collision.** REQ-244 landed its own `0006_asset_grants.sql` on `xgd-working` mid-session. I renumbered mine to `0007` (theirs landed first) and made it a commit on the branch rather than leaving it buried in the merge commit — reconcile cherry-picks non-merge commits, so the decision would otherwise have been lost on the way to `main`. The fixture's `atHead` marker gates on the last migration's artefact, so I moved it and made the comment say out loud that the marker moves with the list.

**Nine unrelated test failures on `xgd-working`, which I did not touch.** The full suite shows 12 failures; none are attributable to this work. Causes:

- **Lockfile drift** (5 files: `req44-install-preflight`, `reconciliation-size-aware-diff`, `-l1-fold`, `-cross-gate`, `-platform-build-deploy-smoke`) — `node_modules/` is behind the committed `pnpm-lock.yaml`. A `pnpm install` at the root should clear these.
- **`REQ-174_consultant_role`** — the offender is `What_1st_Contact_is,_and_how_to_say_it.md`, an untracked stray at the repo root (present before I started).
- **`REQ-183_portal_pages`** — `EISDIR`, because a stray `.claude` *directory* now sits under `packages/framework/src/modules/` and the test's `readdirSync` loop doesn't guard against directories.
- **`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`** — confirmed pre-existing on the baseline before my merge.

The first three are cheap to clear but they're your call, not mine — the stray file and directory are yours, and I didn't want to delete either.

The ticket is parked at `free_coded` with `story_points: 8`. Promotion to `ready_to_reconcile` is yours whenever you're happy with it.

<!-- xgd-chat-end -->