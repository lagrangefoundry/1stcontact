---
uid: comment-e410b03e
id: COMMENT-2955
type: comment
title: Comment on request REQ-244
created_by: xgd
created_at: '2026-09-14T01:47:49.661320+00:00'
updated_at: '2026-09-14T02:22:03.463711+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7c513b4a
  kind: chat_transcript
---

<!-- xgd-turn id="1078f108-78b2-45c4-92fe-39715f95dbb0-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T00:56:39.284565+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1078f108-78b2-45c4-92fe-39715f95dbb0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T01:02:50.764107+00:00" -->
#### Claude
I'll start by reading the ticket.

Ticket is well-specified. Let me understand the dependencies and current code.

I've read the ticket and traced the code: `public-site` (`index.ts`/`routes.ts`/`lead.ts`), the `LeadIntake` service-binding seam (`worker.ts`), `control-app/lead.ts` (`formDefinitionOf`, `deliverForm`, the per-asset ledger from REQ-241, the template choice from REQ-243), `contact_events`, `site_assets`/R2 published layout, and `publicSiteUrl`.

**The shape I intend to build**

- **New table, `0006_asset_grants.sql`** — `id` (a `newId('gate')` 128-bit opaque token), `contact_id`, `business_id`, `site_id`, `instance_id`, `created_at`, `revoked_at`; unique per live `(contact_id, site_id, instance_id)` so a second submission reuses the same link. `ON DELETE CASCADE` from `users`, like `contact_events`. Deliberately *not* built on `login_tokens` — §2's opposite rules.
- **`control-app/src/grants.ts`** (the table: mint / resolve / revoke) and **`control-app/src/gate.ts`** (`openGate` records `page.accessed` and answers with the form's promised set; `takeAsset` records `asset.downloaded` and answers with that asset's name and authored URL). Two files so `lead.ts → grants.ts` stays acyclic while `gate.ts` may read `formDefinitionOf`.
- **`deliverForm` mints the grant once** when the form promises artifacts, and `{{cta_url}}` becomes `publicSiteUrl(siteKey, '/api/download/<token>')` — REQ-243 §3's contract. REQ-241's one-message-per-asset ledger is untouched, so each mail still names its own paper via `{{asset_name}}` and all of them link at the one page listing the set. A form promising nothing mints nothing and still supplies no `cta_url`.
- **`public-site/src/gate.ts`** — `GET api/download/<token>` (the page) and `GET api/download/<token>/<assetKey>` (the paper), matched through `parseRoute` exactly as `leadTarget` does, so the site key stays non-caller-controlled and the apex works. `private, no-store`, `noindex`. Unknown / malformed / revoked are one byte-identical 404. Nothing is added to the POST branch, so AC8 holds by construction.
- **Two new kinds in `contact-events.js`**, `page.accessed` and `asset.downloaded`, with labels.
- **UATs** in `tests/test_UAT_FC_REQ-244_gated_page.workers.test.ts`, in workerd against real D1/R2 and real published revisions, covering all eight ACs.

**Three questions before I cut the branch**

1. **`xgd-working` has 152 files of uncommitted, staged REQ-236 work** (retire `sites.slug`) — including `apps/control-app/src/lead.ts` and a new `db/migrations/0005_retire_site_slug.sql`. A branch cut from the committed tip won't have it, so I'd write against `formDefinitionOf(env, businessId, slug, …)` and resolve a site through `businessOfSite().slug`, which is exactly the call REQ-236 is deleting — and the merge back will conflict there and on the migration number. Do you want me to (a) cut from the tip as normal and take the small merge, (b) hold until REQ-236 lands, or (c) something else?

2. **Revocation has no operator trigger today** — there is no contact-erasure or "cut this link off" path anywhere in `control-app`. AC5 requires a revoked token to be refused, so the column and the refusal are needed. Is the column plus an exported `revokeGrant` (enforced at the gate, tested, called by no surface yet) what you want, or should I put it on a surface?

3. **The bytes.** `assets[].url` is still a free URL an author types. My plan: resolve it against the site's own published output; if it lands inside that site, stream the object from R2 through the store `public-site` already uses; if it points anywhere else, `302` to it — recording `asset.downloaded` either way, before serving. That honours §5 ("the bytes are site assets") without breaking the external URLs that exist today. Confirm, or should an off-site URL be refused instead?

One decision I'm making rather than asking, flagged because it is visible to a recipient: a form promising two papers sends **two mails carrying the same link**, because REQ-241 settled that the ledger is the message record and a message carries one asset key. I'll record that in the ticket body before committing.

<!-- xgd-turn id="8e8afa03-9b9e-4cbb-abe3-d303f3800c29-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T01:49:47.501807+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8e8afa03-9b9e-4cbb-abe3-d303f3800c29-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T02:20:27.380095+00:00" -->
#### Claude
I'll re-check the current state first — the tree looks different from the prior session.

REQ-236 has landed — the slug is gone and the tree is clean. Let me get the full ticket body and re-read the code.

Design settled. Updating the ticket first, then cutting the branch.

Now the control-app grant store:

Now the control-app gate:

Now wire it into `index.ts` and add the `AssetGate` entrypoint:

Now the wrangler binding, and the test-fixture migration list:

All 10 pass first time — let me verify the controls actually bite by mutating them.

The revoked check bites; the site check doesn't — my cross-business case is caught by the business comparison. Adding the case that actually exercises it:

Three remaining failures name files outside my diff (`tools/generate/src/cli/assets.ts`, backend-settings install, and the unbuilt KB). Confirming the final state with a full run:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="dded9efe-945b-49c0-baa7-1cbb365af12d-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T02:22:01.166419+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->