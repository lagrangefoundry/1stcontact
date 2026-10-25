---
uid: comment-15a16a38
id: COMMENT-3003
type: comment
title: Comment on bug BUG-93
created_by: xgd
created_at: '2026-09-15T19:43:50.637964+00:00'
updated_at: '2026-09-15T20:00:31.861986+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-679cb887
  kind: chat_transcript
---

<!-- xgd-turn id="adb5b249-352f-42fe-b83b-095fa516f1b1-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T19:43:31.488824+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="adb5b249-352f-42fe-b83b-095fa516f1b1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T20:00:31.288769+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is thoroughly specified. Let me examine the code.

Now let me find where the renderer invokes behaviors and whether it knows the page id.

Now let me see the control-app side (preview channel) and the gate/grants which store `instance_id`.

Let me look at the existing workers test for the lead endpoint, which is the closest model for the new UAT.

Now the gate:

The ticket is clear and I have no blocking questions. Let me start the free-coding flow.

Now let me write the handle grammar into the contact-form vocabulary module.

Good — the edit landed in the worktree. Now `BehaviorProps`:

Now the renderer must hand the page id down:

Now the receiver. Let me update `formDefinitionOf` and the `LeadSubmission` shape:

Now grants.ts and the migration:

Now the migration:

Now gate.ts and public-site:

No errors in the changed files. Now let me check the remaining callers — router.ts and the templates module:

Clean. Now let's find the existing tests that need updating:

Now let me write the new UAT and then run the affected suites.

Now let me write the new UAT file:

Now I'll write the UAT:

Now update the existing tests that pass bare instance ids:

Now let's typecheck the tests and run the workers suite:

Now the node suite:

Now let me update the ticket body, then bump and commit.

Now merge back into `xgd-working`:

The merge landed cleanly. Now record the commit and clean up:

Done. BUG-93 is at `free_coded`, commit `3ebad1bd58` on `xgd-working`, version `0.2.204`.

## What changed

**The handle names the page.** `packages/framework/src/modules/contact-form/fields.ts` gains `formHandle(pageId, instanceId)` / `parseFormHandle(value)` beside `FORM_INSTANCE_FIELD` — one grammar, in the module that already owns the wire vocabulary for exactly this reason. Separator is `:`; the *first* one is the boundary, because a page id can't contain a colon (`isValidPageName`) and a component id has no such rule.

**The renderer supplies the page.** `BehaviorProps.pageId`, handed down by `renderModuleInstances` from `page.id`. On the props rather than in config, because a module's own configuration can't state where it sits.

**Resolution reads a page, then an instance on it.** `formDefinitionOf` matches `stored.page.id` — the same name `findPageFile` addresses a page by and the store key `<id>.json` is built from — then looks on that page alone. No scan, no fallback: an unparseable handle, an absent page, or an absent instance all give `null`.

**One thing beyond the ticket's text, which I've added to the body.** `asset_grants.instance_id` → `form_handle`, via `db/migrations/0009` (a plain `RENAME COLUMN`; the baseline always creates the old name, so it's correct once against fresh and deployed alike, and SQLite carries it into the index). This isn't cosmetic — the live-grant unique index is `(contact_id, site_id, instance_id)`, so under the old key a grant for the whitepapers `signup` and one for home's were **the same row**, and whichever was minted first would open the other form's artifacts. Old rows aren't backfilled: which page each bare id meant is the unanswerable question this ticket is about.

**Evidence.** `tests/test_UAT_FC_BUG-93_form_handle.workers.test.ts` — 10 UATs against real D1/R2 in workerd through the shipped `captureLead`: the symptom asserted directly (whitepapers form delivers both papers, home's waitlist still sends nothing), the CRM event naming the right page/label/assets, the grant filed under the handle, a bare id refused, an unknown page refused, a cross-site handle refused, order independence across three same-named forms, a single-page site unaffected, the at-most-once ledger unshifted, and the rendered form actually carrying both halves.

`tests/support/lead-site.ts` grows `alsoPages` — two forms on two pages is a different fixture from two forms on one page, and neither that nor two sites can stand in for it.

**Suite status.** Full node + workers run: 2 failures fixed as part of this (both were forms rendering without a page), everything else green. Three node failures remain and are pre-existing — `bug32-webui-scope-rebrand` and `BUG-67_backend_settings` fail identically on `xgd-working` with none of these changes, and `reconciliation-builder-workspace-origin` is a 60s timeout under full-suite load that passes in isolation.

One thing for you: the dev D1 database needs `wrangler d1 migrations apply` for 0009 before the download gate works there again.

<!-- xgd-chat-end -->