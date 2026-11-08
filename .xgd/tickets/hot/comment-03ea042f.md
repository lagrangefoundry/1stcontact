---
uid: comment-03ea042f
id: COMMENT-7925
type: comment
title: Comment on request REQ-660
created_by: xgd
created_at: '2026-11-07T19:20:40.811233+00:00'
updated_at: '2026-11-07T20:28:28.462392+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6971c788
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "13bd88a2-e717-452a-89f0-ba2ecd42c63e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="257ba73a-d975-431c-8a96-ca8dc320a9c8-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:20:21.014534+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="257ba73a-d975-431c-8a96-ca8dc320a9c8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T19:22:20.774908+00:00" -->
#### Claude
Not a duplicate — REQ-660 is the first child of EPIC-30. Now surveying the four copy homes and the send path before scoping.

I've read the ticket, the epic and the code it replaces. **It isn't a duplicate**: REQ-660 is EPIC-30's first child, and none of its siblings (REQ-626, 659, 661, 662, 663) cover it. I haven't written any code, cut a branch or changed the ticket's status yet. Six questions first, because the answers change the design. Each one comes with what I'd do if you agree.

**1. How REQ-247 form messages fit the model (the biggest open point).** Today a form message isn't a business record. It's a **page of a site** (`kind: 'email'`):
- painted with that site's palette;
- frozen into the published revision;
- written by the site consultant with `add_page kind:'email'` / `set_l1`;
- checked at publish (`publish.ts`, `edit.ts`);
- named by a free-text key in the form's `config.template`, not by a fixed trigger.

What I'd do:
- Add one trigger, `form_reply` (audience: the contact), which can hold **many messages, one per form**, keyed `form_reply:<page id>`.
- Retire email pages as a page kind. The publish check becomes "the form's message exists in the business."
- Form messages become live on save like every other message, not published with the site.

**2. Splitting a customised page.** Words and styling sit together in one L1 tree. I'd split it mechanically:
- the text runs, in order, become the message's markdown;
- the rest of the tree, with one slot where the text was, becomes that business's own template;
- palette colours are fixed to hex at migration. Later palette edits won't restyle that mail; editing the template will.

A page that is still the stock L2 email page just uses the default template.

**3. Who writes a new form's message before REQ-662 lands?** Once `add_page kind:'email'` is gone, the site consultant can't author one. I'd have the form-configuring operation seed a `form_reply` message from default copy, which the client can edit later. Is that gap acceptable?

**4. When the migration runs.** I'd do it lazily, like `templateFor` does today: the first read of a business's messages seeds every trigger from today's wording, and migrates form pages from its latest published revision, all at once. There would be no separate migration script.

**5. Recording job_done in the 1st Contact business.** Today the dedupe key, hourly cap and unsubscribe token are all read from emails in *Alice's* store. Moving the record moves those reads into the platform store, filtered by a `business_id` field. Two things to confirm:
- Does Alice reliably have a contact in the 1st Contact business, or should a send create one?
- Is moving the cap and opt-out lookups with the record what you want?

**6. Sender and look.**
- **Sender:** invite and delegate go out today from `1st Contact <invite@1stcontact.io>`, not `no-reply@`. Item 9 says "one sender per business". I'd keep each trigger's current address as its seeded sender until REQ-663 formalises senders.
- **Default template:** I'd seed it from today's L2 email page (`l2/email-page.ts`) with a content slot.
- **Buttons:** the `link` block placeholder would render as a button plus the pasteable-URL fallback, keeping REQ-197's three parts.

**Size.** I estimate this at about 25–30 points, not 13. The form-message move alone reaches into `tools/generate` (page tools, the publish check, preview), and about 15 existing UAT files pin the old homes and would need rewriting. It still fits as one cutover (≤20 is the free-coding guideline, so this is over it). I can keep it as one ticket, as you prefer, or split the form-message move out. Which do you want?

Once you've answered, I'll update the ticket body, set it to `free_coding`, cut `free-REQ-660` and start.

<!-- xgd-turn id="a39c44f2-b03a-4930-a5e3-73068be01c4f-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T19:29:54.046389+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="a39c44f2-b03a-4930-a5e3-73068be01c4f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T20:28:27.405464+00:00" -->
#### Claude
I'm ready. One gap remained, and the ticket's own rule settles it ("a business that changes nothing sends what it sends today"). I'll record that and the numbers left open in the ticket, then start.

Branch `free-REQ-660` is cut and the worktree is set up; checking the test rig runs before I start the code.

Mapping the remaining callers (sign-in, delegate, form capture, publish gate) before writing the core module.

I have the full picture. Writing the core now: the closed trigger list with placeholders, samples and seeded copy (today's wording, as markdown).

Now the records module: storage and versioning, save-time refusals, and the single render path. Checking `validateL1`'s signature first.

Core records module is written. Next: the send helper every caller will go through, then the cutover of each caller.

Now `messages.ts` gains the message version uid on the sent record.

Ticket types registered. Now cutting over the callers, starting with sign-in, invite and delegate.

Wiring the per-send override into the send helper, then rewriting the invite, sign-in and delegate senders.

Avoiding a per-contact store read (Architecture Policy 35): the invite loop will resolve the copy and sender once.

Now the router's invite routes, then sign-in and delegate.

Writing migration 0056 (the indexed sends table for dedupe, the hourly cap and unsubscribe tokens) and registering it in the test factory.

Now adding the opt-out preference keys to the acceptance registry, then rewriting `notifications.ts`.

Rewriting `notify()`: same API, copy from the sending business's message, guards on D1, opt-out in the registry.

`notify()` is rewritten and typechecks. Now the five buyer emails in `order-emails.ts`.

Now carrying the Shop "email the buyer when it ships" switch into the `order_shipped` message's on/off.

Notifications and order mail are checkpointed. Now the form replies in `lead.ts`: email pages out, `form_reply:<site>:<template>` messages in.

Rewriting the form-reply delivery in `lead.ts`.

Replacing `deliverForm` with the one-reply-per-submission version.

`templates.ts` is deleted and the four control-app copy homes are cut over; the control app typechecks. Checkpointing, then retiring email pages on the site-builder side.

Email pages reach into the site schema, renderer, consultant tools, publish gate and builder toolbar. Working through them, starting with the schema.

Removing the now-dead email-page token helpers from the site schema.

Publish's form check moves from "an email page exists" to "the form's reply message exists": the Worker passes publish a hook that ensures each form's `form_reply` message.

Now the Worker's publish call passes the hook.

Fixing a per-form store read in that loop (Architecture Policy 35): adding a batched `ensureFormReplies`.

The compiler now lists every email-page reference. Working through them.

Fixing a stray brace left by the schema edit, then carrying on through the remaining email-page references.

The remaining `edit.ts` work is the consultant-side surgery. First checking how a consultant operation reaches the business's store (needed for the "tailored reply at creation" in answer 3).

Removing email pages from the consultant's edit operations.

Rewriting the `edit.ts` email-page branches.

Still removing email pages: now the consultant's toolbox, the page-subject route and the font-serving guard.

Removing the builder's subject-line control, which only existed for email pages.

Control app typechecks. Now `tools/generate`'s own typecheck, for the files the control app doesn't import.

Cleaning up the digest, roles and eval-builder references, then the consultant's priming text that mentions email pages.

Adding the "tailored reply at creation" path: a host port the form-configuring operations call, bound in the Worker to `ensureFormReply`.

Wiring the reply port from the toolbox through host deps to the Worker.

Both packages typecheck. Now the consultant's tool declaration (`l1-surface.json`): drop email pages, describe form replies, add the two reply params.

Tidying the stale comments that still describe email pages (one is in the contact-form field the consultant reads).

All four packages typecheck. Checkpointing the email-page retirement.

Next is item 8: the routes the Paperwork pane and the assistant will both call. Checking the admission shape first, for "Send to me".

Writing the routes module.

Wiring the routes into the router, behind the owner-or-delegate gate.

Routes mounted and typechecking. Now answer 6's palette seeding for the default template.

The default template takes its accent from the business's site palette, resolved alongside the sender so every send path seeds it the same way.

Checkpointing, then turning to tests: first finding every existing suite that pins the old homes.

Running that set to see what actually fails, workers and node suites separately.

Some of these may be pre-existing. Reading the failure messages of the ones not obviously mine.

Several publish calls now answer 500, which is mine. Running one alone to see the error.

The publish hook opens the ticket store even for a site with no forms. Only opening it when there are forms:

That suite fails identically on the base (pre-existing). The rest are the cutover's expected breakages. Starting with `tests/support/lead-site.ts`, which several lead suites share.

Rewriting the lead fixture so a seeded form's custom reply becomes a `form_reply` message in the business, not an email page.

Fixture rewritten. Now adapting the suites whose behaviour still holds, starting with REQ-205's text-part suite (it fed the old seed bodies through the mail adapter).

Retiring suites that pin only removed behaviour (email pages, the subject control, the old template renderer). Their ACs are superseded by REQ-660 and reconcile will retire them.

Running the lead, invite, notify and shop suites against the new code.

Working through each failure. First the migration suite (the ref now carries `downloads`) and REQ-659's renamed template keys.

Now REQ-626's notification suite. Reading how it finds the sent mail (the record moved to the 1st Contact business for `job_done`).

Those five pass. Next the asset suites (REQ-241, BUG-98), where the per-download mode is gone.

Now the invite, sending-address and form-template suites, which imported `templates.ts`.

Still adapting old suites. Rewriting REQ-243's credential case for the new model and retiring the two email-page-only cases.

The adapted lead, invite and notification suites pass. Checkpointing, then writing the REQ-660 UATs.

Writing `tests/test_UAT_FC_REQ-660_messages.workers.test.ts`, through the real routes and send paths.

All 8 REQ-660 UATs pass. Adding one more for the form-reply line of the test plan (a form's reply is its `form_reply` message, in the default template).

All 9 pass. Checkpointing, then running the wider node-side regression (schema, renderer, consultant tools, builder).

Most of these look environmental. Checking them against the base, and fixing the toolbar's leftover `subject` action meanwhile.

REQ-313 and REQ-349 fail the same on base. The REQ-300 email-page case and the REQ-644 Shop-settings case are mine.

Now suites my first grep could miss: anything reading the tool declaration, priming, or builder API.

293 more suites. Running them in foreground batches, then baselining only the failures against main.

Many look pre-existing. Baselining just the failing files of this batch against the main checkout.

Batch 1: every failure also fails on base. Running batches 2–4 the same way.

One difference left (REQ-358, a knowledge-base map case). That is likely the known worktree KB artifact; re-copying the generated KB and rerunning it alone.

That passes with a fresh KB (worktree artifact). Checking the suites that pin the acceptance registry, since I added three preference keys.

This one pins the registry's closed list, which REQ-660 deliberately extends. Updating it:

Regression is clean against base apart from worktree artifacts. Reading my notes on promotion before the final commit and merge.

Before merging, syncing the ticket body. Checking whether it changed since my last edit.

The operator re-scoped the ticket while I was building: senders are out of this ticket. Reading the new wording exactly.

Now removing `sender` from the message record, the save path and the routes.

Typechecks. Updating the two test files that referenced the dropped field.

Rerunning the messaging suites after the sender change.

All 95 pass. Checking the sending-domain suites, which assert From on form mail.

These pin the deleted per-download mode (the paper's name in the body, one mail per paper). Adapting them to the one-reply shape.

Those pass. Committing, then writing the "as implemented" section of the ticket.

Ticket synced. Now the merge-back: lock, bring xgd-working into the branch, bump the version, then fast-forward.

Clean merge (only ticket files changed on xgd-working). Bumping the version on the branch.

Fast-forwarding xgd-working onto the branch in the main checkout.

Merged; nothing to rematerialize. Rechecking, in the main checkout, the two suites I put down to worktree artifacts.

Same as base (pre-existing), so those were artifacts. Moving the ticket to `free_coded` with the full SHAs of this ticket's non-merge commits.

REQ-660 is implemented, merged into xgd-working as version 0.2.810, and the ticket is at `free_coded` with all 9 commits recorded. I haven't promoted it to `ready_to_reconcile`; that's yours.

**What changed**
- **One home for wording.** Each business has `message` records (one per trigger, one per form) and `email_template` records (L1 email documents with one `{{content}}` slot). Saving writes a new version and takes effect on the next send. Today's wording is the seeded copy, now inside a default template whose button colour comes from the business's site palette.
- **One render path.** Markdown → safe HTML → the template's slot → `renderL1Email`. A save is refused, with the reason, if it removes a required placeholder, uses one the trigger doesn't offer, contains raw HTML, or makes the SMS text longer than 320 characters.
- **The cutover.** `templates.ts`, `NOTIFY_KINDS`, the buyer-email copy and the email page kind are deleted. Sign-in, invite, delegate, `notify()`, the five order emails and form replies all go through the new path.
- **The sent record** keeps the full email and now names both the message version and the template version.
- **`notify()`** keeps its API. Dedupe and the hourly cap now read an indexed D1 table (migration 0056). "Stop these emails" is recorded in the acceptance registry. The `job_done` email is recorded in the 1st Contact business, on the person's contact there.
- **Routes** for the Paperwork tab and the Email assistant: messages, templates, triggers, preview, revert, set default, and "Send to me". "Send to me" goes only to the signed-in person's verified address, uses fake values, puts `[Test]` in the subject, is recorded on no contact, and is limited to 5 per hour.
- **Shop setting.** "Email the buyer when an order ships" is now the Order shipped message's on/off; the old value carries over.

**Decisions you may want to check** (all written into the ticket's new "As implemented" section):
- **Senders:** you re-scoped them out while I was building, so From addresses are fixed per trigger, exactly as before. I removed the `sender` field I had added.
- **Opt-out scope:** the registry holds one row per person per key, so turning a notification off applies to that person across every business they help run, not just the one the email was about.
- **Publish:** instead of refusing a site whose form has no reply, publish creates the default reply for it.
- **Form replies:** one reply per submission; the mode that sent one email per download is gone.

**One thing you need to do:** test sites that still contain an email page will no longer pass validation, because the kind is gone and there's no compatibility path (your answer 2). Those pages need deleting from the test sites. I didn't run anything against stored sites.

**Tests**
- 9 new UATs in `tests/test_UAT_FC_REQ-660_messages.workers.test.ts` pass.
- I adapted about 17 existing suites to the new model and deleted about 9 that only tested removed behaviour (old templates, email pages, the subject-line control); the full list is in the ticket.
- I ran about 500 of the 1,416 test files, every suite that touches the changed code. Every remaining failure also fails, unchanged, on the code before this ticket, or was a worktree-only artifact I re-checked after merging (still failing only where it already failed). The rest of the suite was not run.
- Not covered by a test: the consultant's `reply_subject` / `reply_markdown` at form creation.

<!-- xgd-chat-end -->