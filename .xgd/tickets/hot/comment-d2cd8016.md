---
uid: comment-d2cd8016
id: COMMENT-5616
type: comment
title: Comment on bug BUG-273
created_by: xgd
created_at: '2026-10-25T00:47:29.116956+00:00'
updated_at: '2026-10-25T01:01:26.881409+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-319241c3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "196e6335-8d70-4666-b004-7405b0eefc7f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="82ae18b1-6414-4bd5-a789-689ed0ce3dde-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T00:46:47.172101+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="82ae18b1-6414-4bd5-a789-689ed0ce3dde-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:01:23.977253+00:00" -->
#### Claude
Reading the spend code to find where `attributed` entries are written and read; no edits yet.

Still surveying: the write point is `writeTurnSpend` in host-core, the read point is `attributedSpend`. Checking for other stored-record readers that resolve models from config.

Plan is settling: write-time stamp in host-core, strict read in spend-core, and a D1 SQL migration (0032) for history. Checking how migrations are applied and tested.

Checking the local dev store to confirm which backends appear in `attributed` and where the cutover falls.

Designing the UAT: I'll extend the existing BUG-145 end-to-end harness (real route, real D1) and need to know how the host loads `backends.json` so a test can change the builder model mid-run.

`activeBuilderConfiguration()` (REQ-452) already lets the builder's backend be overridden at runtime, so a test can run a delegation on Haiku 4.5 and then switch to 5.5. Checking its setter.

Design is set. Before editing, checking for UI/consumers of the "no model configured" label, then cutting the branch.

Branch `free-BUG-273` cut and worktree prepared. Now editing: first the read side in `spend-core.ts`.

Now the edits to `spend-core.ts`: a write-side stamp helper, a strict read, and the comment updated.

Now `modelOfBackend`'s doc in `backends.ts`: its only remaining caller is the live `SpendMeter`, so the doc should say it's for live requests only.

Now the write side in `host-core.ts` `writeTurnSpend`.

Now the console label in `apps/control-app/src/spend.ts`.

Now the history migration `db/migrations/0032_attributed_models.sql`. Drafting the SQL and trying it on a copy of the dev store first.

Works on the dev copy (324 builder entries → Haiku 4.5, 5 critic → Opus 5.5) and re-running changes nothing. Checking order and contents are otherwise preserved.

Registering the migration in the test harness and manifest.

Now the UATs. Checking the workers pool's storage isolation and what `setBuilderConfiguration` does, to decide the file layout.

Code changes are in; writing the two UAT files now (end-to-end delegation + migration).

All 4 pass. Confirming they fail against the old code (swap the two source files back temporarily, then restore).

They fail on the old code and pass on the new. Now the regression scope: every suite that touches spend or `attributed`.

Too many paths for one vitest filter (known quirk). Narrowing to the spend suites.

Expected: planted fixtures without a model now read "not recorded". REQ-416 is a known pre-existing red. Checking the REQ-295 failures specifically, since those use the real host.

Those REQ-295 failures are about delegation check verdicts, nothing to do with spend. Confirming they're red on clean `xgd-working` too.

Pre-existing on clean `xgd-working`. The other 6 failures are fixtures that plant `attributed` entries with no model. Updating them to carry the model the entry ran on.

Workers side green (bar the pre-existing three). Now the node-project suites that touch `spend-core`.

Two BUG-242 cases call `attributedSpend` on entries with no model; giving them the stored model.

Typecheck clean on touched files; migration-manifest suites (REQ-291/REQ-253) pass. Checking this project's version-bump convention before committing.

Now recording what landed on the ticket (appending; the existing body stays as is).

Committing the work on the branch.

Now the merge-back: lock, bring `xgd-working` into the branch, bump the version, fast-forward.

Fast-forward landed (`xgd-working` tip = the bump), and rematerialize had nothing to hide. Moving the ticket to `free_coded`.

`free_coded` with both SHAs, version 0.2.628 and 3 points. Tearing down the branch.

Applying 0032 to the local dev store, as the ticket asks.

BUG-273 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (commits `2fd4b537`, `5f66c8d4`; version 0.2.628; 3 points). Past builder spend now shows, and is priced, as the model it actually ran on. Nothing is labelled or priced from today's config any more.

**What changed**
- **When a turn is saved:** `writeTurnSpend` in `host-core.ts` records on each builder entry the model its backend is bound to as the turn closes. It uses the same lookup as the builder's own per-request rows, so the two always agree. An entry that already names a model keeps it.
- **When spend is read:** `attributedSpend()` uses only the stored model. The `modelOfBackend` fallback is removed from this path. An entry with no stored model is unpriced and shows in the console as `claude_builder (model not recorded)`.
- **Old records:** a new migration, `0032_attributed_models.sql`, fills in the model on existing entries:
  - **Builder:** Haiku 4.5 for turns that started before the first Haiku 5.5 builder request in that database's own `request_spend`, Haiku 5.5 after.
  - **Coordinator:** Haiku 4.5 throughout.
  - **Critic:** Opus 5.5 throughout. The ticket didn't mention it, but critic entries were in the store and its model has never changed.
  - Entries that already name a model are left alone. Running it twice changes nothing.
- **Other readers (step 4):** `modelOfBackend` is now used only by the live per-message spend ceiling, which prices a request as it happens, so current config is right there. Every other reader takes the model stored on the row. `spend-report-core.ts` never reads `attributed`, so the ticket was wrong that it inherited the bug. The commit message lists all of this.

**Tests**
- Two new UAT files, all passing:
  - **End to end:** a builder runs on Haiku 4.5, then config moves to 5.5, and the entry still reports Haiku 4.5 at 8,000 micros.
  - **New delegations:** record Haiku 5.5, priced by its card.
  - **Unrecorded entries:** reported as "model not recorded" and unpriced.
  - **The migration itself:** checked against planted rows.
- The new UATs fail on the old code.
- Fixtures in REQ-297, REQ-320, BUG-166 and BUG-242 planted entries with no model. REQ-451 had already changed their expectations to Haiku 5.5, which is this bug written into the tests. They now carry the model, and all spend suites pass.
- Two REQ-295 cases and one REQ-416 case fail, but they fail the same way on a clean `xgd-working` and have nothing to do with spend.

**Stores**
- **Local dev store:** migration applied. 324 builder entries now read Haiku 4.5 and 5 critic entries read Opus 5.5. Nothing else changed in a before/after comparison.
- **Remote:** I did not apply it by hand. It goes out with the next `bin/deploy` to each environment. Until then the deployed dev server still runs the old code, so the console there will show the old labels.

<!-- xgd-chat-end -->