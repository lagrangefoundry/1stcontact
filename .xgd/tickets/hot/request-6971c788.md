---
uid: request-6971c788
id: REQ-660
type: request
title: 'Paperwork: messages and templates as records, one render path, one cutover'
created_by: EPIC-30
created_at: '2026-11-07T18:57:41.037219+00:00'
updated_at: '2026-11-07T20:43:43.776499+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-087800af
  story_points: 20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-03ea042f
  commits:
  - working_sha: 3d9668e16bbdd6e6d3320966ba94d809cef4bd0e
    reconcile_sha: null
    main_sha: null
  - working_sha: a1f2fdf411891d303f3d03149b855eb5b8c0982f
    reconcile_sha: null
    main_sha: null
  - working_sha: 963cbcee64a771f444b7ea024693c83a5f039fe8
    reconcile_sha: null
    main_sha: null
  - working_sha: 75cddf2819633aecb31d4732286b4d0bf5327cc9
    reconcile_sha: null
    main_sha: null
  - working_sha: ebe18967d2e800e3a25a4566cb660518f0fd7149
    reconcile_sha: null
    main_sha: null
  - working_sha: 083f540f9aadea43b69a9199ea8a954b8045c66b
    reconcile_sha: null
    main_sha: null
  - working_sha: 37aa1c4505bb36e60f4099fde0060450ad48d3e5
    reconcile_sha: null
    main_sha: null
  - working_sha: 418431810d067f5d46baf294a6606c9eddb1c9f5
    reconcile_sha: null
    main_sha: null
  - working_sha: 6cc9721ca126ebb567a260a1a57f22676896c218
    reconcile_sha: null
    main_sha: null
  version: 0.2.810
---

## What this is for

EPIC-30 (Paperwork). Today a business's outgoing wording lives in four places — `templates.ts` (invite, signin, lapsed, delegate), `NOTIFY_KINDS` in `notifications.ts` (job_done, new_order, cancellation_requested), `copyFor` in `order-emails.ts` (the five buyer emails from REQ-644), and REQ-247's form messages (each a whole L1 page mixing words and styling). Bodies are hand-assembled HTML with no look. This ticket replaces all four with **one model and one render path, in one cutover**. It has no UI of its own; the Paperwork tab (REQ-661) and the Email assistant (REQ-662) sit on the routes it adds.

## Behaviour

1. **Messages are records.** Per business, one `message` record per trigger: subject, email text (markdown), SMS/push text (plain, length-capped, optional), template, audience (the business's own people, or the contact the event is about), on/off. Saving writes a new version; the newest for a trigger wins; old versions are never edited. **Live on save** — the next real send uses it (operator, 2026-11-07: "Keep it simple - live on save").
2. **Templates are records.** Per business, L1 email documents (validated by `validateL1` with the email allow-list, `site-schema/src/l1/email.ts`) with one **content slot**. Every business is seeded one **default** template; more may be added. Versioned like messages.
3. **Triggers are a closed list** the platform emits, each declaring its **placeholders**: text placeholders and **block** placeholders (platform-rendered structured blocks such as `order_summary`, `facts`, `shipping_address`, `link`), which ones are **required** (e.g. the sign-in link, the unsubscribe line), and a plainly **fake sample value** for each ("Sam Sample", `@example.com`). System triggers (sign-in, invite, lapsed, delegate) cannot be re-assigned. A save that removes a required placeholder, uses one the trigger does not offer, carries raw HTML, or overruns the SMS cap is refused with the reason.
4. **One render path:** markdown → safe HTML (raw HTML never passes) → the template's slot → `renderL1Email`. The styled HTML is derived at send time, never stored per message. A template change restyles every message using it.
5. **The cutover.** All four homes move at once and the code copy is deleted: the four `templates.ts` keys, the three `NOTIFY_KINDS`, the five buyer emails, and REQ-247 form messages (email pages are dropped; every form gets a `form_reply` message in the default template — see answers 1, 2 and 4). Today's wording becomes the seeded copy, so a business that changes nothing sends what it sends today, now in the default template. `notify()` keeps its API; its `kind` is the trigger and its copy comes from the business's message.
6. **Settings → Shop's "Email the buyer when an order ships"** becomes that message's on/off (the switch is removed from Shop settings; the current value carries over).
7. **The sent record** (`sendRecordedEmail`'s `email` ticket) keeps the full rendered email as now, and additionally names the **message version uid** and **template version uid** that produced it. Shop mail is recorded on the buyer's contact (REQ-659 provides the contact). The job_done email is recorded in the **1st Contact business**'s store on Alice's contact, not in Alice's own business.
8. **Routes** the pane and the assistant both call (one API, two callers): list/read/update messages, list/read/create/update templates, set default, revert to a version, list triggers and their placeholders, render a preview with fake values, and `send_test` — "Send to me": through the real path, only to the signed-in person's verified address, all placeholders fake, no real sign-in token or unsubscribe record minted, subject marked as a test, recorded as a test (on no contact), outside the business's hourly cap, under its own small rate limit.
9. **Senders are not in this ticket** (REQ-663). This ticket does not change who an email is from: every send keeps today's From and reply-to exactly as computed today (`sendingFrom` / `mailFrom`, `invite@` for invite and delegate). REQ-663 adds the business's sender list and a sender on each message.

## Constraints

- No per-item store query in a loop (Architecture Policy 35): resolving the message for a trigger is one read of the business's messages.
- No private customer data in any message body or preview sent to an AI provider (DOC-5 rule 26); fake values only in previews and tests.
- Structured-only (Security Policy): templates are L1; message text is markdown through the safe sink.

## Why free-coded

Cohesive platform change with clear behaviour; one cutover rather than a phased migration.

## Test plan

UATs named `test_UAT_FC_REQ-660_*`, mail asserted on the recorded outgoing message, Resend mocked at its boundary:
- Each migrated trigger (invite, sign-in, lapsed, delegate, job_done, new_order, cancellation_requested, the five buyer emails, a form message) sends the seeded copy inside the default template.
- Editing a message changes the next send; the old version is still readable; the sent record names both version uids.
- Changing the default template restyles two different messages' next sends.
- Refusals: required placeholder removed, unknown placeholder, raw HTML, SMS over the cap.
- After the cutover no email page remains on any site; every form's reply is its `form_reply` message in the default template.
- "Send to me" reaches only the signed-in address, has `[Test]` in the subject, fake values, no live token, no contact record, does not count to the hourly cap, and hits its own limit.
- The shipped email's on/off carries over from the old Shop setting.
- job_done is recorded in the 1st Contact business.

## Order and dependencies

- **First in EPIC-30**; REQ-661, REQ-662 and REQ-663 build on its routes.
- **Overlaps REQ-659** (EPIC-9: buyer becomes a contact) in `order-emails.ts` and the sent record. Shop mail is recorded on the buyer's contact only once REQ-659 has landed; whichever of the two merges second adapts to the other.

## Answers to the implementation questions (EPIC-30 session, 2026-11-07)

Answers to the six questions asked in this ticket's chat. Where an answer changes an item above, this section governs.

**1. Form messages (REQ-247) fit as one trigger with many messages — agreed, keyed by the form, not a page.**
- One trigger, **`form_reply`** (audience: the contact who submitted), holding **one message per form**.
- Key it by what forms already carry: **`form_reply:<site key>:<form's config.template value>`**. The form's configuration keeps its shape; the value no longer names a page. The site key is in the key because two sites of one business may use the same template name.
- **Email pages are retired as a page kind.** The publish check becomes "every form's `form_reply` message exists in the business".
- Form messages are **live on save** like every other message — not published with the site. This is the different lifecycle the operator accepted ("live on save — as we discussed this gives messages a different lifecycle than the rest of the site").

**2. Splitting a customised page — not needed.** There are no live sites, only test sites (operator, 2026-11-07: "keep this simple we have no live sites only test sites"). Existing email pages are **not converted**: they are deleted, and every existing form gets a seeded `form_reply` message in the business's default template. No look is carried over, no old revision has to keep loading, and there is no compatibility path for email pages.

**3. A new form's message before REQ-662 — the gap is acceptable, with one improvement.**
- The site consultant loses `add_page kind:'email'` (and its priming must stop mentioning email pages in the same change — it must not offer a capability it no longer has).
- The **form-configuring operation seeds the form's `form_reply` message** when the form is created. It takes an **optional reply subject and markdown**, so the site consultant can still write a tailored reply at creation, through the same records routes (one API, two callers). With none given, the seed is a plain default ("Thanks for getting in touch with {{business}} — we've got your message and will reply soon.").
- After creation the wording is edited in the Paperwork tab (REQ-661) and by the Email assistant (REQ-662), not by the site consultant.

**4. When seeding runs — lazily, and nothing to migrate.** Today's wording for the fixed triggers, and a default `form_reply` for each existing form, are seeded on the first read of a business's messages, exactly as `templateFor` seeds today. Idempotent: two concurrent first reads must not leave two current versions of one trigger. There is **no migration job** (answer 2): email pages are removed from the code and from the test sites, and the old-format reader is deleted in this ticket.

**5. job_done recorded in the 1st Contact business — yes, and the guards move off ticket scans.**
- **Alice reliably has a contact in the 1st Contact business.** Every builder user signs in through the platform tenant (`signInTenant` → `requirePlatformTenant`), so a builder user — owner or delegate — is a `users` row there by construction. No send creates one; a missing row is a refused send, logged.
- **Yes, the cap, dedupe and opt-out move with the record — but not as scans of the platform store.** That store will hold every business's notifications to its owners, and scanning it per `notify()` is unbounded (Architecture Policy 35). Instead, for every `notify()` trigger, wherever it is recorded:
  - **dedupe and hourly cap** read an indexed D1 table of sends (business id, trigger, dedupe key, sent at) — one bounded query;
  - **opt-out** ("Stop these emails") is a **preference in the acceptance registry** (`user_acceptances`, REQ-240) on the person's contact in the sending business, keyed per trigger.
- Messages to a business's **own people** about its own activity (`new_order`, `cancellation_requested`) are messages of **that business** (EPIC-30's model: a business writing to its own people). They stay recorded in its store as today; they appear on no contact page, because its owner and delegates are not its contacts.

**6. Look — agreed; sender — not in this ticket.**
- **Sender:** out of scope here — see item 9 and REQ-663 (operator, 2026-11-07: "we did not talk about sender configuration"). Today's From addresses are left exactly as they are.
- **Default template:** seeded from today's L2 email page (`l2/email-page.ts`) with a content slot, its colours taken from the business's site palette at seeding (hex; the 1st Contact business uses its own).
- **Buttons:** the `link` block placeholder renders as a button plus the pasteable-URL fallback — REQ-197's three parts.

**Size: one ticket, about 20 points** (smaller now that nothing is migrated). The operator decided the form messages move in this cutover ("REQ-247's form messages move in child 1 — Yes"); splitting them out would leave two homes for form wording between the two landings, which is the phase-in this ticket exists to avoid. It is over the 20-point free-coding guideline knowingly. If it has to be split, the only clean seam is answer 5 (guards to D1 and the opt-out preference, plus job_done's record move), which does not touch the copy cutover.


## Settled at the start of implementation (REQ-660 session, 2026-11-07)

Details the answers above leave open, settled by the rule "a business that changes nothing sends what it sends today":

- **Gated-download forms keep their link.** `form_reply` offers a `downloads` link block (the gated page listing what the form promised). It is **required on the message of a form that promises downloads**, and that form's seeded reply carries it, so a download form still sends its link after the cutover. A form that promises none gets the plain default reply, with no link.
- **One reply per submission.** The per-download mode (one email per download, chosen when an email page declared `{{asset_name}}`) existed only for customised email pages. With email pages gone it is deleted: a form that promises downloads sends one reply carrying the link to the whole set (BUG-98's shape). The at-most-once rule per address and download is unchanged.
- **Numbers:** SMS/push text is capped at **320 characters** (two SMS segments). "Send to me" is limited to **5 per person per business per hour**.
- **Opt-out wording.** Answer 5's per-trigger opt-out is a revocable preference with key `notify:<trigger>`, whose recorded wording is the sentence the unsubscribe page shows.
- **Who may call the routes:** the business's owner and live delegates, the same as the Settings routes.


## As implemented (REQ-660 session, 2026-11-07)

What landed, and the decisions taken while building it. Where this differs from an item above, this section describes the code as it now stands.

**Records and render path** (`message-records.ts`, `message-triggers.ts`, `message-send.ts`)
- Two ticket types per business: `message` (key, trigger, subject, markdown body, SMS text, template, audience, on/off, version) and `email_template` (key, name, L1 document, accent colour, default flag, version). Saving writes a new version; the highest version for a key wins; reverting writes an old version's content as a new version. There is no `sender` field on a message (item 9).
- Every fixed trigger's message is seeded with today's wording on the first read of the business's messages. A form's `form_reply:<site>:<template>` message is seeded the first time it is needed (the form is configured, the site is published, or a visitor submits). Seeding and every lookup read the business's messages, and its templates, once each (Architecture Policy 35).
- The content slot is a text node of the template whose whole text is `{{content}}`; a template may hold no other placeholder. A template save must be valid L1 for the email target and hold the slot exactly once.
- In markdown, a link placeholder is written `[label]({{name}})` on its own line and renders as a button plus the pasteable-URL fallback. Other block placeholders stand as a paragraph of their own; an empty optional block (a note, a refund line) leaves no paragraph. Text values are HTML-escaped. Raw HTML in the subject, text or SMS is refused at save; the markdown sink (`legal-markdown.ts`) escapes everything regardless.
- The sent record (`email` ticket) keeps the full rendered email and adds `message_uid` (the message version) and `template_uid` (the template version). Its `template_key` is now the message key (`invite`, `order_confirmation`, `form_reply:<site>:<template>`).
- From and reply-to are computed exactly as before the cutover, fixed per trigger in code: invite and delegate from `invite@`; sign-in, lapsed and the notify triggers from `MAIL_FROM`; order emails from the verified domain, else the platform address under the business's name; form replies from the verified domain, else `MAIL_FROM`.
- The default template is today's L2 email page with its copy replaced by the slot. Its button colour comes from the business's first site's palette (the entry named accent/primary/brand, else the first entry) when it is seeded.

**The cutover**
- Deleted: `templates.ts`, `NOTIFY_KINDS`, `copyFor` in `order-emails.ts`, the framework's email-page reader and L2 email page, the `email` page kind (schema, validation, renderer, `add_page`/`update_page` email fields, the CLI's email flags, page digest), the builder's subject-line control and `POST /api/pages/subject`.
- Sign-in, invite, delegate, `notify()`, the five buyer emails and form replies all send through `sendMessage`.
- The invite modal still lets the operator change the subject and text for one send. The text is now markdown, held to the invite message's refusals (it cannot drop the link), and the message itself is not changed.
- Form replies: one reply per submission. A form that promises downloads gets one reply carrying the link to the whole set; its message must keep `{{downloads}}`. The per-download mode is deleted. The at-most-once rule per address and download is unchanged.
- Publish makes sure every form on the site has its reply message, seeding the default for any that has none (the `1c` CLI, which has no business store, skips this).
- The site consultant's `add_component` / `configure_component` take optional `reply_subject` and `reply_markdown`, used only when the form's reply is first created; its tool declaration no longer mentions email pages.
- Settings → Shop no longer shows "Email the buyer when an order ships". The `order_shipped` message is seeded with that switch's stored value (on when never set); after that, the message's on/off decides.

**Notifications** (`notifications.ts`, migration `0056_notification_sends.sql`)
- `notify()` keeps its API. The copy is the sending business's message for the trigger: `job_done` is the 1st Contact business's message, recorded in its store on the person's contact there (with `notify_business_id` naming the business the notice is about). `new_order` and `cancellation_requested` are the business's own, recorded in its store.
- Dedupe and the hourly cap read the indexed `notification_sends` table, one row per recipient. The unsubscribe link carries a random token whose SHA-256 is stored there. The link is now `/notifications/unsubscribe/<token>`.
- "Stop these emails" records a revocable preference in the acceptance registry: `notify_job_done`, `notify_new_order`, `notify_cancellation_requested`. Because the registry holds one row per person per key, an opt-out applies to that trigger for that person across every business they help run, not only the one the email was about.

**Routes** (`message-routes.ts`; the business's owner and live delegates only)
- `GET /api/messages`, `GET /api/messages/triggers`, `GET|PUT /api/messages/<key>`, `POST /api/messages/<key>/revert`, `POST /api/messages/<key>/preview` (fake values; unsaved copy may be previewed, held to the same refusals), `POST /api/messages/<key>/send_test`.
- `GET|POST /api/message-templates`, `GET|PUT /api/message-templates/<key>`, `POST /api/message-templates/<key>/default`, `POST /api/message-templates/<key>/revert`.
- "Send to me" goes only to the signed-in person's verified address (whatever the request says), uses the trigger's fake values (no sign-in token or unsubscribe record is minted), prefixes `[Test] `, is recorded with `test: true` on no contact, is not counted toward the hourly notification cap, and is limited to 5 per person per business per hour (`message_test_sends`). It sends even when the message is off.

**Tests**
- New: `tests/test_UAT_FC_REQ-660_messages.workers.test.ts` — every trigger previews its seeded copy in the default template; editing changes the next send, keeps the old version and can be reverted, and the record names both version uids; a default-template change restyles two messages and a real send; the four refusals plus a dropped unsubscribe; no email page kind; a form's reply is its `form_reply` message in the default template; Send to me; the shipped on/off carries over; `job_done` is recorded in the 1st Contact business.
- Adapted to the new model: REQ-199, REQ-205 (text part, sending address), REQ-223, REQ-241, REQ-243 (form template, migration), REQ-240 (registry keys), REQ-300, REQ-626, REQ-644, REQ-659, BUG-93, BUG-95, BUG-98, and `tests/support/lead-site.ts` (a seeded form's custom reply is now a `form_reply` message).
- Retired, because they pin removed behaviour: REQ-197 (render, templates), REQ-243 publish gate, REQ-247 (email delivery, email page), REQ-252 (email subject, page control, subject route), BUG-94 (email preview), and the per-download cases in BUG-98, REQ-243 and REQ-205.

**Operator follow-up:** a stored test site that still holds an email page no longer validates (the kind is gone, with no compatibility path, per answer 2), so those pages must be deleted from the test sites.