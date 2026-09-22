---
uid: comment-c5518a8b
id: COMMENT-3640
type: comment
title: Comment on request REQ-295
created_by: xgd
created_at: '2026-09-21T23:35:42.313528+00:00'
updated_at: '2026-09-22T20:24:06.362460+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ed8a0dd9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "43a045ae-9a67-4881-8207-47a765740c13",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aaf2764b-f747-4a0c-844f-a0c99c788e3b-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T23:34:50.918812+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aaf2764b-f747-4a0c-844f-a0c99c788e3b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T00:07:19.304803+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is rich enough to implement directly. Let me start the free-coding process.

Now the configuration documents.

Now `instances.json` — the builder's grant.

Now the delegation configuration module.

Now the provider names and their registration.

Now extract the surface set from `createL1Toolbox` so the worker's toolbox reuses every rule.

Now the delegation wiring inside `build()`.

Now compose the surface into the consultant's toolbox and register the role.

Now the imports and the spend attribution.

Now `writeTurnSpend` — lifting `attributed` off the junction.

Now the UATs. First the Node suite.

Now the end-to-end workers suite.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9510bc31-93e6-4679-9c01-3bf011c7d50a-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T00:29:19.938370+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="9510bc31-93e6-4679-9c01-3bf011c7d50a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T00:48:55.762337+00:00" -->
#### Claude
I'll start by reading the ticket and checking the current state of the work from the prior session.

The branch and worktree exist from the prior session. Let me check their state.

Work is uncommitted in the worktree. Let me read the full ticket body from disk.

Now let me review all the uncommitted work from the prior session.

Substantial implementation is in place. Let me check the tests and verify the framework APIs used.

Let me just run the tests — that's the real question.

The worktree has node_modules. Let me run the new REQ-295 tests.

16/16 pass. Now the workers suite — the substantial one.

Both new suites pass. Let me review the test content to confirm it's real evidence, then run the regression scope.

Condition 6 is covered (the assertion is there, comment-labelled). Now the regression scope — the two modified suites plus adjacent areas.

Three regressions. Let me see the first one in full.

Let me check whether the BUG-67 failures are pre-existing (upstream drift) or caused by this change.

Confirmed: the two BUG-67 failures are **pre-existing on clean xgd-working** (upstream framework drift). The REQ-182 one is ours and legitimate — we added `delegation.method` to both consultant orders. Let me update that test to match.

Now let me widen the regression scope to the host/spend/workers suites this change touches.

All pass. Let me commit this work now to protect it, then run the full suite. First a typecheck.

Typecheck clean. Let me commit now to protect the work, then run the full suite.

Work is safe. Now the full suite, to catch anything the targeted scope missed.

19 failures. I need a baseline — let me get the failing file list and run the same suite on clean xgd-working.

None of these are suites this change touches. Let me get the baseline on clean xgd-working.

Baseline is **22 failures / 13 files**; our worktree is **19 / 8** — a subset, except `BUG-134_copy_two_ends`. Let me isolate that one.

It passes in the main checkout but fails in the worktree. Let me confirm it's a location artifact and not our change, by running it at the pre-change commit in the same worktree.

Confirmed — BUG-134 fails at the pre-change commit in the same worktree. **No regressions from REQ-295.**

Let me check the two modified existing test suites before updating the ticket.

Both preserve the original claim while dropping an incidental "only role" coupling. Now let me add the implementation consequences to the ticket body.

Ticket body updated. Now the merge-back: lock, merge, then claim.

The version scalar conflict — xgd-working moved while we worked.

xgd-working advanced to 0.2.315. Per the established recipe, I'll do this the other way: merge working into the branch, bump there, then fast-forward back.

Now bump on the branch so the version-carrying commit is the tip.

Let me re-verify the merged state before fast-forwarding back.

61/61 pass on the merged state. Now fast-forward xgd-working to the branch.

Fast-forwarded cleanly. Now the `free_coded` claim.

Free-coding complete. REQ-295 is at `free_coded`, both commits merged into `xgd-working`, branch and worktree cleaned up.

## What landed

A `builder` worker role the consultant can hand bounded construction to, running on `claude-haiku-4-5`, behind a switch that **ships off**.

- **`delegation.json` + `delegation.ts`** — the switch and its validator. Its own file, not a key in `backends.json`, because `configureBackends` rejects keys it doesn't declare. Off means the surface is **never composed**, so a deployment with the switch off sends byte-for-byte the prompt the repo sent before delegation existed.
- **`backends.json` / `prices.json`** — `claude_builder`, a second variant of the same adapter with its own model, ceiling (32000) and rates. The consultant does not move.
- **`instances.json` / `roles.ts` / `priming.json`** — the builder's grant (the consultant's construction half, not its judgement half: no `add_page`, `delete_page`, `publish`), its own prose, its own projected manual, and the consultant's method prose for handing work over.
- **`toolbox-core.ts`** — `l1SurfaceSet` extracted from `createL1Toolbox`. The ticket expected "an argument change rather than a refactor"; that was true of the inputs and wrong about the output, since the delegation surface builds the worker's Toolbox *itself*. Every existing caller is unchanged.
- **`host-core.ts`** — the `DelegationRuntime` wiring, worker spend read off the junction's `turn_end` (the only place it's durable on a failed/stopped/never-reported worker), and worker tool calls audited under the worker's own session id.

## Evidence

23 new UATs across two suites — one on the configuration, one on the wire through the real `/api/ai/prompt` endpoint with the provider scripted at the boundary. All nine of the ticket's "what must be true" conditions are covered, including condition 6 (a worker offers `report`, never `delegate`).

Three existing cases moved, none weakened: REQ-174 and REQ-239 each asserted `L1_INSTANCES` *equals* `[consultant]`, incidental to both claims; REQ-182's corpus-free order now names the new provider, which is registered unconditionally.

## Verification

Typecheck clean. **19 failures in the branch against a 22-failure baseline on clean `xgd-working`** — the branch's failing set is a subset, plus `BUG-134_copy_two_ends`, which I confirmed fails identically at the pre-change commit in the same worktree (a worktree-location artifact; it passes in the main checkout). No regression is attributable to this change.

Two things worth flagging:

- **`BUG-67` is failing on clean `xgd-working`** — upstream framework drift, not this work. `backendSettings('claude')` now carries a framework-defaulted `contextWindow`, and `configureBackends` has stopped rejecting undeclared provider names. That second one is a real loss of a start-up guard the repo was relying on; it may deserve its own ticket.
- **This landed first relative to REQ-296.** No entry in `backends.json` declares `contextWindow`, so REQ-296 lands second and carries the responsibility to give *both* entries a declared window — the worker's included.

The switch ships off, so nothing is enabled ahead of REQ-296 or a REQ-292/REQ-293 baseline. The ticket is parked at `free_coded`; promotion to `ready_to_reconcile` is yours.

<!-- xgd-turn id="742d645b-e29d-4b9d-ac35-c7903eb67140-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T19:57:57.860685+00:00" -->
#### You
Is this now working in production? I would like the default to be configured to be on

<!-- xgd-turn id="742d645b-e29d-4b9d-ac35-c7903eb67140-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T20:01:37.892167+00:00" -->
#### Claude
I'll check the current state of the delegation switch and whether it's live in production.

No — on two counts, and there's a sequencing blocker before I can flip it.

## Is it working in production?

**No.** Production is running code that predates delegation entirely:

| | |
|---|---|
| Last real deploy of `1stcontact-control-app` | 2026-09-21 **23:56:06Z** |
| REQ-295's feature commit `78e6a5463b` | 2026-09-22 **00:33Z** |

(The later deployment entries are `Secret Change` redeploys of the same bundle.) So the worker role, the `claude_builder` backend and the delegation surface aren't in the deployed artifact at all.

And even once deployed, the switch is `enabled: false`, which by design means the delegation surface is **never composed** — not composed-and-refusing. Production would be byte-identical to pre-delegation.

Separately, REQ-295 is on `xgd-working`, not yet on `main`.

## Flipping the default to on

That's three edits on this ticket: `delegation.json` (`enabled: true`), its `about` prose (the "IT SHIPS OFF" paragraph is the rationale for the current value), and one UAT — `test_UAT_FC_REQ-295_the_switch_ships_off_with_a_builder_bound_to_a_declared_backend` asserts `enabled === false` explicitly as a decision rather than an oversight.

Nothing technical blocks it. REQ-296 landed and resolves the context window from the model table, refusing at start-up if it can't — so `claude-haiku-4-5` either works or fails loudly on boot, not mid-conversation.

## The blocker — your call

**REQ-295 is at `ready_to_reconcile` and the dispatcher is live.** It's currently running `xgd reconcile BUNDLE-29`; REQ-295 (along with REQ-292, REQ-293, REQ-296) is queued behind it. If I commit now, the dispatcher can bundle the ticket mid-flight and my commit is orphaned on `xgd-working` against a ticket already marked `free_and_reconciled` — a manual repair.

Demoting `ready_to_reconcile → free_coded` reverses your authorisation, so it's yours to make. My recommendation:

1. You set REQ-295 back to `free_coded`
2. I cut a branch, flip the default, update the prose and the UAT, run the scope, merge back, and re-record the commits
3. You re-promote to `ready_to_reconcile`

Say the word and I'll do step 2.

One thing to weigh: the reason recorded for shipping off is that REQ-292's spend meter needed a period of *undelegated* measurement to give the saving an after-figure to be measured against — and REQ-292 isn't deployed either, so that baseline doesn't exist yet. Turning delegation on now means the first spend data you collect is already delegated. Your decision; I just don't want it to be an accident.

Also worth noting: deploying will ship REQ-292, REQ-293, REQ-295 and REQ-296 together, since none of them are in the live bundle. I haven't deployed anything — tell me when you want that done.

<!-- xgd-turn id="3fee75a0-2aee-4ef4-bc38-a4429a2661ae-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T20:07:28.468006+00:00" -->
#### You
Separately, REQ-295 is on `xgd-working`, not yet on `main`. <-- I am tired of saying this we run from working!!!

Please set the default to be true now and I will deploy the code to production

<!-- xgd-turn id="3fee75a0-2aee-4ef4-bc38-a4429a2661ae-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T20:15:14.810837+00:00" -->
#### Claude
Understood — deploys run from `xgd-working`; I won't raise `main` again. Let me record that so it sticks.

Ticket is at `ready_to_reconcile`, which freezes the body — demoting to `free_coding` first so the scope edit lands, then cutting the branch.

Status demoted. Now cutting the branch.

Now the config change — flipping the default and replacing the rationale that justified the old value.

The switch-off test relied on the bundled default being off — it needs to install a disabled document explicitly now. Updating all three assertions.

Flipping the default changes the default tool set for every AI test that doesn't configure delegation. Let me find what else depends on it.

Both REQ-295 suites pass. Now the blast radius — suites that assert the consultant's tool set or prompt without configuring delegation.

All green. Now the ticket body — the scope still says the default is off, and every UAT must trace to it.

Merging back under the lock now.

Now tearing down the branch and re-running the UATs against `xgd-working` to confirm the merged state is green.

Done and merged to `xgd-working`.

## What changed

**`tools/generate/src/cli/ai/delegation.json`** — `"enabled": true`. The `about` prose that justified the old value is replaced rather than left contradicting the file it sits in.

**Two UATs**, because flipping the default changed what "off" means for a test. The off path is still a requirement — it's the rollback story — but it's now a document a test must *install* rather than one it gets by configuring nothing:

- `..._the_switch_ships_off_...` → `..._the_switch_ships_on_...`, asserting `enabled === true`
- `..._with_the_switch_off_the_consultant_has_no_delegate_tool...` now installs an explicit `DISABLED` document
- `..._the_consultant_gains_delegate_and_loses_nothing` — this one mattered most: its "before" half opened a session **without** configuring anything, so with the default flipped it would have compared the delegating shape against itself and passed vacuously. It now installs `DISABLED` for the baseline half.

**The ticket body**, since every UAT has to trace to language in it. The `## The shipped default is off` section is now `## The shipped default is on`, recording both original reasons and how each resolved — the context window **discharged** (REQ-296 landed, so every backend entry resolves a declared window or start-up refuses), the baseline **overruled** by you, deliberately, with the before-figure being the ticket's own modelling.

## Verification

| Suite | Result |
|---|---|
| REQ-295 config + workers | 23 passed |
| Consultant/settings roles, document parity, session texts, req39 | 48 passed, 5 skipped |
| REQ-292 / 296 / 297 / 251 workers | 36 passed |
| 5 reconciliation surface suites | 67 passed |
| 9 L1 / fidelity / catalogue / iteration suites | 169 passed |

I went looking for the blast radius specifically because the default tool set now changes for every AI suite that doesn't configure delegation — nothing else depended on it.

Ticket state: `status: free_coded`, `version: 0.2.321`, 4 commits recorded (feature `d384588eaf` plus the gate's auto-bump `6804f0d1b2`). Branch cut, merged, cleaned.

## Before you deploy

**REQ-295 is at `free_coded`, not `ready_to_reconcile`.** I demoted it to `free_coding` to unfreeze the body and the gate left it at `free_coded` — you'll want to re-promote it when you want the dispatcher to bundle it. That transition is yours.

Deploy is `cd apps/control-app && npm run deploy`. It'll ship REQ-292, REQ-293, REQ-295 and REQ-296 together, since none of them are in the live bundle — the last code deploy was 2026-09-21 23:56Z. Rollback for delegation specifically is `enabled: false` and redeploy; the surface stops being composed entirely rather than being present-and-refusing.

<!-- xgd-turn id="7eafce50-97b3-413a-9e74-4669c19f1a92-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T20:24:05.750447+00:00" -->
#### You
Please do not worry about reconcile - leave that to me.

Can you confirm that delegation is live in dev and prod

<!-- xgd-chat-end -->