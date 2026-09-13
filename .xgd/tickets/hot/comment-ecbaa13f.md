---
uid: comment-ecbaa13f
id: COMMENT-2921
type: comment
title: Comment on request REQ-243
created_by: xgd
created_at: '2026-09-13T23:00:39.181953+00:00'
updated_at: '2026-09-13T23:52:44.468362+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a0910456
  kind: chat_transcript
---

<!-- xgd-turn id="9adb8171-c391-413e-8733-c8900e1f8b6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T23:00:16.866501+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9adb8171-c391-413e-8733-c8900e1f8b6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:30:44.119134+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at the test harness for workers tests.

Working tree is clean and REQ-242 has already merged. Let me set up the branch.

Now I'll implement. Starting with the framework module.

Now the meta and migration:

Now the migration step:

Now open the template vocabulary in `control-app/src/templates.ts`:

Now add the store-contents check and the reserved-key policy to `templates.ts`:

Now the send path in `lead.ts`:

Now update `captureLead` and the reporting:

Now wire the publish check into the router:

Now update the test fixture and typecheck:

Clean. Now let's run the existing regression scope:

Now the node-side tests and the new UAT file:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="97946827-4aca-4ae5-b486-74468c51e151-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T23:36:22.476385+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="97946827-4aca-4ae5-b486-74468c51e151-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:52:44.228272+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state first.

The branch exists. Let me read the full ticket body and check the branch state.

Prior session left uncommitted work in the branch. Let me read the full ticket body and then review what was done.

Now let me review the uncommitted work on the branch.

Now let me check the test state — the UAT file appears to be missing.

Implementation looks complete; the UAT file is missing. Let me verify the build first.

Let me read the REQ-242 precedent files — they're the closest analogue.

Let me verify the build compiles, then run the existing affected tests.

Typecheck is clean (the `tools/generate` errors are pre-existing `allowJs` config noise in `apps/control-app` paths). Now let me study the test infrastructure for publish and templates.

I moved out of the branch worktree partway through — let me re-verify the typecheck in the correct location.

Build is clean. Now let me run the existing affected tests before writing the new UAT.

All existing tests pass. Let me look at how publish is exercised in tests, for AC-4.

Now let me check the message record shape for assertions.

Now I'll extend the fixture to support two forms on one page (needed for AC-1).

Let me fix a doc reference and check the legacy-v5 path still delivers.

Let me check how the lead HTTP route handles a render refusal, so AC-5 asserts the real outcome.

Now let me write the send-path UAT file.

8/8 pass. Now the publish gate (AC-4), driven through the real route.

The starter page has no L1 slot for a module to mount into. Let me see how a real page declares one.

Now let me fix the publish-gate fixture to mount each form into a real L1 slot.

All 6 pass. Now the migration UAT (node side).

All 20 new cases pass. Let me run the full suite to check for regressions.

2 failures, both in files I haven't touched. Let me confirm they're pre-existing by running them on the base branch.

Both fail identically on the base branch — pre-existing, unrelated to this work. Now let me add the ticket-body language for behaviour my UATs assert.

Now let me bump the version and commit on the branch.

Let me fix a misleading parameter name in `lead.ts` before committing.

Now let me commit.

Now the merge back into `xgd-working`.

Merged cleanly. Now the gated transition to `free_coded`.

Free-coding of REQ-243 is complete. The prior session had left the implementation uncommitted with no tests; I reviewed it, verified it, wrote the UATs, and landed it.

**What shipped** — a `contact-form` names the message it sends in `config.template`:

- **The vocabulary opened, the check moved.** `TEMPLATE_KEYS` was closed to stop a send finding nothing; that argument is conceded rather than overturned. `templateKeysOf` reads what the business actually holds, and `publishSite` refuses a form naming anything else — still a refusal at authoring time, now sourced from the store instead of a literal. Seeded system keys stay available because template lookup is seed-if-absent.
- **Absence means no mail**, which is what a mailing-list form should do.
- **`invite`/`signin` refused outright**, at publish and again at the send (a draft is never publish-validated and the builder's preview submits against one).
- **v6 → v7 migration** names `asset` for instances that promise artifacts, so no existing gated download goes quiet.
- **The at-most-once cap keys on the template** when there's no artifact to key it on — otherwise the cap silently ceased to exist for exactly the forms a stranger can post to.

**Tests** — 20 new cases across three files, all passing: the send path through real `captureLead` against D1/R2 in workerd; the publish refusal through the real `/api/publish` route (not a hand-supplied predicate, so the Worker's wiring is what's under test); and the migration plus the page reader the gate uses.

**Full suite: 3944 passed, 2 failed.** Both failures (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`) are in files this work doesn't touch, and I confirmed they fail identically on `xgd-working` without these changes — pre-existing, not introduced here.

Two things worth flagging:

1. **I extended the ticket body** with a §6/§7 covering behaviour the UATs assert that the original body didn't state — the migration, the template-keyed cap, the send-time re-check reporting rather than throwing, and the outcome/reporting shape. These are consequences of §2–§4, but they'd have looked like drift to reconciliation.
2. **A gap the ticket accepts but you may not want to.** AC-5 keeps "refused at render, as it is today" — so a business that authors a welcome declaring `{{cta_url}}` publishes fine (publish checks the key exists, not that its placeholders are satisfiable) and then every submission 400s. I implemented what the ticket specifies and tested it, but if you'd rather publish caught that too, it's a separate change.

Ticket is at `free_coded`, commit `7665f4edba` merged into `xgd-working`, version `0.2.188`, 5 story points, branch cleaned up. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->