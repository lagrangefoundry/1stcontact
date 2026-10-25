---
uid: comment-dec7ed9a
id: COMMENT-2901
type: comment
title: Comment on request REQ-241
created_by: xgd
created_at: '2026-09-13T22:10:59.322235+00:00'
updated_at: '2026-09-13T22:35:10.402727+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-41a9dc90
  kind: chat_transcript
---

<!-- xgd-turn id="b78c9f61-e5c5-41d0-b497-e80e5beb1b43-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:10:25.816427+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b78c9f61-e5c5-41d0-b497-e80e5beb1b43-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:35:10.021487+00:00" -->
#### Claude
Now the version bump and migration declaration in `meta.ts`:

Now `lead.ts` — the receiver:

Now the delivery loop:

Now update the existing REQ-223 / BUG-87 tests to the new shape:

Now the two reconciliation tests that enumerate config keys:

Now upgrade the stored file-backed fixtures with the real migration tool:

Now write the REQ-241 UATs. Let me check the migration test conventions first:

All six pass. Now the migration UATs:

Now the regression scope — the existing asset/lead suites plus module/behaviour guardrails:

Now a full sweep to catch anything else pinned to v5:

Now the two explicit `getModule('contact-form', 5)` pins:

Now lock, merge back, and record:

Done. REQ-241 is at `free_coded` with the work merged into `xgd-working`.

## What landed

**The contract** — `contact-form` v5 → v6. `config.asset`/`assetName`/`assetUrl` become `config.assets`, a list (max 8) whose items carry `key`, `name`, `url`. Nothing in an item is `required`: the both-or-neither rule is a *reading*, not a refusal, so one half-finished line must not fail validation and kill the page.

**The migration** — `contactFormV5ToV6` is real work, not an identity: the triple becomes a one-item list verbatim (the key is what the at-most-once ledger remembers deliveries by), and an instance promising nothing becomes an empty list. The old keys are left for `upgradeInstance` to drop *and report*, rather than deleted silently here.

**The receiver** — `formDefinitionOf` reads the list per-item; `deliverAssets` asks the at-most-once question once per item and sends **one message per asset**, each with its own name and link. A single mail listing the set would key the ledger on one asset again, which is exactly the shape the ticket exists to widen. Suppression stays whole-set — the rule is about the mailbox.

**Consequential decisions** (all now written into the ticket body, §6–§8):
- `LeadOutcome.assetSent`/`assetSkipped` → `assets: [{key, sent, skipped?}]`; `not_offered` retired.
- The skip log and the `form.submitted` provenance both name the assets.
- Suppression/history read once per submission, not per item.
- The four repo fixtures carried to v6 with the real `1c module upgrade --write`.

**One consequence worth your attention**: a *frozen published revision* carrying the old triple still resolves and still captures, but no longer delivers — reading both shapes would be the legacy-alias mode `CLAUDE.md` forbids. Blast radius is nil today (no published instance in either store carries an asset), and the remedy is upgrade-the-draft-and-republish. **The cloud store still needs `1c module upgrade <slug> --write` run against it** — that's your step, not something I can do from here.

**Tests**: 10 new UATs (6 through real `captureLead` in workerd against real D1/R2, 4 over `upgradeInstance`). Full sweep: 3890 passed, 2 failed — `bug32-webui-scope-rebrand` and `test_UAT_FC_BUG-67_backend_settings`, both pre-existing on `xgd-working` and neither importing anything this change touches.

I did not configure the XGD whitepapers form with its two assets — the artifacts don't exist and the gated page is the next ticket's work. Flagged as out of scope in §8.

<!-- xgd-chat-end -->