---
uid: comment-4689d93b
id: COMMENT-5825
type: comment
title: Comment on request REQ-484
created_by: xgd
created_at: '2026-10-28T22:29:09.826773+00:00'
updated_at: '2026-10-29T20:23:38.845077+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3582d1da
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9cee61d9-392a-4ff2-8a8b-956b8389c4a8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T22:29:04Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T22:29:04Z" -->
#### You
Explain the versioning: I expected draft edited, approved, Publish copies draft to a new version. Why approve an upgrade?

<!-- xgd-chat role="assistant" ts="2026-10-28T22:29:04Z" -->
#### Claude
Two kinds of version: site revisions (your model) and component settings versions. BUG-299 v2 to v3 upgrade runs in memory on render but is never saved, and the editor refuses outdated instances; an upgrade should be saved with the next edit without approval.

<!-- xgd-chat role="user" ts="2026-10-28T22:29:04Z" -->
#### You
Yes, with a caveat - upgrades should be done with care. If an upgrade breaks the look the consultant needs to know, fix it and explain what and why. If it cannot fix it, revert and file a bug (not possible today from prod).

<!-- xgd-turn id="600d5544-fea6-4e98-a017-a2b3992bcc75-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T18:36:41.379490+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="600d5544-fea6-4e98-a017-a2b3992bcc75-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T18:45:15.964370+00:00" -->
#### Claude
Reading the ticket and the existing upgrade machinery (`upgrade.ts`, the v2→v3 step) before mapping out where pages get written and where outdated instances are refused.

Found the render-time upgrade (`assembleSite`) and the `1c module upgrade` repair. Now locating where the builder/editor refuses outdated instances.

Found the refusal: `editModuleConfigure` in `tools/generate/src/cli/edit.ts` looks up the instance's stored version, which fails for an outdated pin. Reading it and the page-write path next.

I haven't written any code. Two things in the ticket can't be built as written, and it asks you to choose the defect destination, so I need three decisions first.

**1. What "before" means for the visual check.** The ticket says to render the page with the stored (pre-upgrade) settings. That can't be done: only the current version of each component's code ships, and the v3 code can't render v2 settings. Since BUG-299 deployed, every draft preview has already shown the v3 look. The v2 look survives only in what was last published. Two workable baselines:
- **(a) A browser comparison against the published page.** Use production's browser to load the live published page and the draft with the upgrade. Compare only the component, at computer and phone widths, in each state (signed-out, signed-in, operates-a-business). It also catches look changes made in the component's code, not just its settings. But it needs a published version to compare against. It's the slowest and most complex option, and the draft's own unpublished edits show up in it.
- **(b) A settings comparison.** For each state, compare the stored and upgraded settings: text, colours, sizes, links, controls, and anything that disappears. It's deterministic and needs no browser. It misses changes made by the component's code, which the developer reviews when bumping the version.

I recommend (b) now, with (a) as a later addition. Each upgrade step would declare its intended changes, for example "the `portal` control becomes the avatar" or "the builder link joins the signed-in row". Those count as expected, not breakage.

**2. What "revert" can do.** Preview and publish both upgrade in memory, so putting the stored v2 back doesn't change what visitors see. The next publish ships the v3 look anyway. So "can't fix it" has to stop the upgraded look going live. My proposal: the consultant marks the upgrade as held. That restores the pre-upgrade stored instance and the hold is recorded on it. While it's held, edits leave that instance alone, and Publish is refused with a plain message naming the component and the defect. The edit that needed the upgrade is held and explained. Is blocking Publish right, or would you rather Publish carry on with the current look and the issue just be flagged?

**3. Where the defect goes in production.** ReportBug only works where a local `1c filing` service is listening, and production has none. I recommend a **platform issue recorded in production's store**: a ticket holding the component, the versions, the site, the comparison and what was tried. It would be listed for you in the platform console, with ReportBug offered wherever that store exists. A filing address for production would instead mean exposing a developer-machine service to production, which seems wrong. If you'd rather it reach you through the contact history (the way REQ-479 beta feedback does), say so.

Once you answer, I'll update the ticket body and build it all as one change on this ticket. Saving upgrades with the next edit on its own would make upgrades silent before the check exists, so I'd rather not ship that part first.

The search came back and doesn't change my three questions. A few facts bear on your answers:

- **Option (b) has to be built.** Nothing in the code compares two sets of component settings without a browser. Each state is rendered into the same page and hidden by CSS, so (b) means writing that comparison per state.
- **Option (a) could reuse existing parts.** Production already has a browser, and the values-diff comparison is already used by the fidelity and layout checks. The baseline would still have to be the published page, because only the current component code is kept.
- **The finding can ride on the edit's own reply.** The tool results for `set_l1` and `configure_component` already carry a message line, so the consultant would see the finding in the same tool call that saved the upgrade. No new channel is needed.
- **Production has nowhere to record a defect.** Its ticket store has no defect or issue type, and admin turn-health tracks turns, not defects. Question 3 needs a new record either way: a platform-issue ticket type in production's store (what I recommend), or a contact-history event like REQ-479 feedback.
- **The consultant's prompt is already over its size limit.** REQ-473's test fails at 206,800 characters against 205,000. The new rule ("a component upgrade is not a decision to put to the client") adds to that, so I'll either replace a line or fold it into rule 11.

I'm still waiting on your answers to questions 1–3 before I write any code.

<!-- xgd-cli-session ts="2026-10-29T19:43:28Z" model="claude-opus-5-5" continued_from="cli" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-29T19:43:28Z" -->
#### You
(via EPIC-19) Please answer the questions in REQ-484.

<!-- xgd-chat role="assistant" ts="2026-10-29T19:43:28Z" -->
#### Claude
Answers recorded in the ticket body: 1) (a) browser comparison of the affected component region against the published page, plus each upgrade step declared intent; skip when nothing is published; reuse fidelity values-diff; finding rides on the saving tool result. 2) Hold the upgrade and refuse Publish for that site until fixed or cleared. 3) Platform-issue ticket in the production store, listed in the console; ReportBug falls back to it where no filing address exists. Fold the new prompt rule into an existing one.

<!-- xgd-turn id="74146c1f-1878-4caf-afa8-d18f8d1d297a-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:51:34.863263+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="74146c1f-1878-4caf-afa8-d18f8d1d297a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T20:23:35.589467+00:00" -->
#### Claude
Next, the first UAT. I'm looking for an existing test that edits a component through a memory store, to reuse its setup.

Writing the first UAT now: a v2 sign-in control on a page in a memory store gets a label change.

Writing the declarations into the framework now: the states a module can show, and each upgrade step's intended visible changes.

Now the pure filter that drops declared changes. It goes in the framework's `upgrade.ts`, beside the migration chain, so the test can drive it without a browser.

Next, UATs 2 and 3. They need a real browser and a preview served from a memory store, so I'm reading how `PreviewRenderer` answers requests.

Writing UATs 2 and 3 against a real Chromium. A local server answers the live site from the published fixture and the draft from `PreviewRenderer` over the memory store.

UAT 2 passes, but it could be passing vacuously, for example if a capture comes back empty and there's nothing to compare. UAT 3 found nothing. Probing what the captures actually contain.

The captures come back empty, so UAT 2 was vacuous. Testing whether the hide-everything-else style is what empties them.

Captures now hold the component's elements: "Sign in", the dialog, and "Your account" / "My businesses" when signed in. Rerunning the UATs.

Committed. Now the defect destination: a platform-issue ticket type in production's store. I'm reading how an existing product ticket type is declared, and which tenant the platform console uses.

Now the Publish refusal. Held instances will be reported as an invalid definition, so the toolbar and the publish tool show the refusal through the path they already use.

The hold edit and the Publish refusal are in place. Next, exposing `hold_upgrade` as a tool. I'm finding where `configure_component` is declared and granted, so the new op follows the same path.

The op is declared and wired. Now the production wiring: the host has to pass `upgradeCheck` into the edit options wherever it has a browser. Finding where those options are built.

The production host now passes the live page address and its browser into the check. Next is the platform-issue type and ReportBug's fallback, starting with how the router opens a ticket store.

Writing `platform-issues.ts`: the ticket type, the ReportBug project adapter, and the console listing.

Adding the console section, following turn-health's pattern, with its copy in `config.js`.

Section registered. Now folding the consultant's instruction into rule 11, as a short splice in `priming.json` (no new line).

Rule 11 updated in place. Adding the `bc`-mode instruction to the finding text, then typechecking.

All four packages typecheck clean. Now UAT 4 (unfixable upgrade reverts and reports). Checking whether node tests have an in-memory ticket store for the platform-issue half.

That's the known zsh trap: an unsplit `$VAR` hands vitest one long filter, and it finds no files. Rerunning with the list split.

Those pass. Now the workers suites around filing, priming budget, publish gates and upgrades. This is the part most likely to be affected by production now having ReportBug.

Typecheck is clean. Rerunning the REQ-484 UATs and the BUG-85 upgrade suites.

All green: 32 node tests and 4 workers tests. Committing parts 3 and 4, then updating the ticket body before merging back.

Ticket body updated. Now merging back, in the order my notes give: lock, merge `xgd-working` into the branch, bump the version on the branch, fast-forward `xgd-working`, then the gate.

The rematerialize script isn't at the path the lock printed. Running the equivalent `xgd ticket-store rematerialize` from the free-coding doc.

REQ-484 is built, merged into `xgd-working` and at `free_coded`. It has four commits (version 0.2.703, 13 story points), and the ticket body now describes what was built.

**The check found a real problem on 1st Contact's own site.** With the v3 code, the signed-out "Sign in" control sits 90px further left at computer width than on the page published before BUG-299 (x=1087 → x=997). No upgrade step declares that move, so the consultant will be told about it on the next edit to that page. I haven't fixed it or traced whether it comes from BUG-299 or a later layout change.

**What happens now when a page is edited:**

- **The upgrade is saved with the edit, without asking.** Any outdated component on the page is written at its current version in the same save. The edit's reply and the change record each get a line saying what was upgraded. Rule 11 of the consultant's instructions now says a component upgrade is ours, never the client's to approve. That's a short clause, not a new line.
- **The upgrade is checked against the published page.** After the save, the host loads the live published page and the draft in its browser and compares only that component. It checks at 1280px and 390px, in signed-out, signed-in and operates-a-business. Changes the upgrade step declares (for v2→v3: the account link becomes the badge, the businesses link joins it in one row, the targets are derived) are ignored. Anything else comes back on the same tool reply as "UNEXPECTED VISUAL CHANGE", naming the state, width, element and property, and tells the consultant to restore the look and explain it to the client (with details for the operator in `bc`). If there's nothing published, there's no check.
- **An unfixable upgrade is held.** There's a new `hold_upgrade` tool. It puts the component back exactly as the published site has it and records the hold. While the hold stands, edits to that component are refused with an explanation, and Publish is refused naming the component, the problem and the issue. The hold lifts itself when a newer component version ships; you can also lift it with `1c module upgrade <site> --write`.
- **Defects reach production.** Where there's no filing address, ReportBug now records a `platform_issue` ticket in the platform's own store. You'll find them in a new "Issues filed" section of the platform console, per business.

**Design changes made during the build:**

- **The baseline is the live published page.** The preview's `rev-<id>` channel re-renders a published revision with today's code, upgrade included, so it would have compared every upgrade with itself.
- **BUG-299's "no ReportBug in production" is superseded.** I updated the production half of that test, and the ticket body records the supersession.
- **`hold_upgrade` was added to the closed set of write operations** pinned by two existing tests.

**Tests:** all four REQ-484 UATs pass. Two of them run in a real Chromium against the v2 page as the pre-BUG-299 code actually published it, now committed as a test fixture. The upgrade, publish, tool-surface and filing suites nearby pass. Two failures remain, neither caused by this change:

- **REQ-473's prompt-size test** fails on clean `xgd-working` too (209,624 characters against 205,000). This change adds about 54 characters (the rule 11 clause). I left the budget alone as you asked.
- **BUG-124's port test** fails here because a filing service is already listening on 8790 on this machine.

The ticket is parked at `free_coded`. Promoting it to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->