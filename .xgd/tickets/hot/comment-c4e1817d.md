---
uid: comment-c4e1817d
id: COMMENT-2184
type: comment
title: Comment on request REQ-179
created_by: xgd
created_at: '2026-09-03T20:19:44.390119+00:00'
updated_at: '2026-09-05T00:50:52.970568+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b813aa4a
  kind: chat_transcript
---

<!-- xgd-turn id="e106e6a0-cffc-40cd-8d57-1640729b1752-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T20:17:34.915540+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ba1f1485-d6c4-4bdd-8cee-12a673d2c4d2-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:06:19.329151+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ba1f1485-d6c4-4bdd-8cee-12a673d2c4d2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T21:36:32.044022+00:00" -->
#### Claude
Now let me look at scope.ts and index.ts to understand how the server picks the business/site today.

Now let me record the technical scope on the ticket and mark it in progress.

Now cutting the branch.

Now the server-side changes:

Good. Now `index.ts` passes the admission through:

Now I'll add the scope prefix to `api.js`:

Now `config.js` additions and the new `business.js` module:

Now the main rewire in `app.js`:

Now rewire the `panel.getSite()` consumers and the destroy/return handle:

Now `main.js`:

Now CSS for the new chrome:

Now let's run the existing builder suites to see what breaks.

Now the toolbar-lifetime and workspace-chrome suites:

Now let me run the whole node suite to find other breakage.

Now the workers project (router / index changes):

Now let me write the endpoint UAT:

Now the chrome UAT:

All 11 pass. Now let's run the full suite again to confirm no regressions.

While that runs, let me review the final `app.js` for coherence.

<!-- xgd-turn id="b17cdc6d-d27f-4e0b-ba22-d7f1a39bd350-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:38:04.479815+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="b17cdc6d-d27f-4e0b-ba22-d7f1a39bd350-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T21:43:59.561389+00:00" -->
#### Claude
Baseline confirms: all 30 failures are pre-existing (KB index not built in this environment), identical on `xgd-working`. My changes introduce none. Let me review the diff before committing.

Implementation is complete and coherent. Verifying the new UATs and the touched suites:

Now lock and merge back into `xgd-working`:

Free-coding of REQ-179 is complete.

**Landed** — `6d25bf25ba`, merged into `xgd-working`, version `0.2.61`, ticket at `free_coded`.

**What the commit does**

The site selector was an action in the site tab's toolbar, so it scoped one tab and every other tab reached sideways for it through `panel.getSite()`. It now lives in the shell's header as a business switcher, with the account behind an avatar on the right and a tab strip that stays uniformly business-scoped.

- **`GET /api/businesses`** (`router.ts`) answers the account and its admissible businesses in one call, built from the `Admission` that `index.ts` already computed and now injects as a router dep rather than recomputing. Lapsed businesses are returned and marked unselectable. The no-admission dev path reports the resolved scope as one selectable business.
- **`api.js`** carries a module-scoped `/b/<id>` prefix applied to every URL it builds — fetches and the three URL-returning functions (`previewUrl`, `assetUrl`, `materialFileUrl`) — so a switch moves the *requests*, not just the chrome. `/api/status` and `/api/businesses` are deliberately unprefixed.
- **`business.js`** (new) is the switcher and account surface: a `<select>` above one business, a plain name at one, nothing at zero; `resolveBusiness` is pure and exported so the stored-id-no-longer-admissible fallback is provable without a DOM.
- **`selectBusiness`** in `app.js` is the single place a scope moves — prefix, stored selection, pane site + `panel.refresh()`, assistant session, Library list.
- **`siteSelectorAction`** and both `site-selector` entries are deleted; no module outside the display panel reads `panel.getSite()` any more (one bootstrap read, commented).

**Tests** — two new UAT files (11 tests: endpoint shape/lapsed marking/no-admission path, and chrome placement, switch propagation, persistence, fallback, avatar-not-a-tab). Seven existing suites updated for the moved selector. Full suite: 2413 passed, 30 failed — all 30 are pre-existing knowledge-base index and webui-scope failures, verified identical on `xgd-working` before the change.

The ticket body already carries an "Implementation scope" section written at design time covering the endpoint, the URL prefixing, the toolbar deletion, the `.shell-bar` reach and its upstream gap, and the acceptance criteria — so every UAT is motivated by ticket language. Story points raised 2 → 3.

<!-- xgd-turn id="83d3049d-477b-4f4c-aa1f-06a0122e2486-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T00:34:15.998091+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="83d3049d-477b-4f4c-aa1f-06a0122e2486-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T00:50:52.894666+00:00" -->
#### Claude
Now the message constant:

Now `business.js` — `resolveBusiness` doc and the switcher's nothing-selectable rendering:

Now the `businesses` option doc and the CSS:

Now the UATs:

Now the ticket body delta:

The reopen amendment is landed. REQ-179 is back at `free_coded`.

**Commit** — `5bace72f8a`, merged into `xgd-working`, version `0.2.69`. Both SHAs are now on the ticket (the original `6d25bf25ba` stands; this is the delta on top).

## What was outstanding

The ticket was moved back to `draft` on 2026-09-04 to take [[DOC-42]] §10.1's amendment. REQ-178 and REQ-180 had already landed their halves — `admit` no longer refuses `no_entitlement`, `resolveScope` returns null rather than throwing, `NoBusinessError` 403s the business-scoped routes, and `/api/businesses` answers for a wholly-lapsed account. What was missing was REQ-179's own half: **what the chrome does when nothing is selectable**, which it had no answer to because before the amendment that person never got in.

## What landed

**The block lands on the tab strip and the panels, never on the shell.** The existing `blockEverything` (REQ-173) makes the whole shell `inert` — here that would take the avatar with it, and the avatar is the entire remedy. A second, narrower `blockTabs` marks `.shell-tabs` and `.shell-panels` inert and leaves the header alone. The wider block still wins when both apply.

**A banner names the state where the product would be** — inside `.shell-content`, above the panels, outside the inert subtree so its text can be selected and pasted. It points at the avatar; *why* each business lapsed stays per-business on the account surface (REQ-180 §1), since an account with two businesses lapsed for different reasons would force one sentence to be wrong about one of them.

**The switcher renders and is disabled**, `data-none-selectable` on the wrapper, every option marked and disabled, naming the first business rather than showing blank — a blank box reads as still loading.

**No business in scope asks the origin for nothing.** The default site load calls the business-scoped `/api/sites`; unprefixed it resolves at the origin's fallback, so the request not made is one whose answer would be another business's sites under an account that may open none.

**`resolveBusiness` returning null** is now the stated fallback behaviour for "admitted, nothing selectable", not only for "no identity behind this host".

## Tests

Three new UATs in the existing chrome suite (14 total, was 11): the switcher's rendering and disabled state, the inert boundary plus a live avatar that still opens the account surface with each lapse reason, and the no-scope-no-fetch case with a non-vacuity check that the same default *does* fetch when a business is in scope.

Full suite: **12 failed files / 31 failed tests / 2491 passed**. Baseline on the same worktree before the change: **12 / 31 / 2488** — identical failures (knowledge-base index not built in this environment, plus an unrelated `bug32-webui-scope-rebrand` guardrail), and exactly the three new tests added.

The ticket body carries an "Implementation delta" section written before the commit, so every new UAT is motivated by ticket language rather than left for reconciliation to discover. Story points raised 3 → 4.

<!-- xgd-chat-end -->