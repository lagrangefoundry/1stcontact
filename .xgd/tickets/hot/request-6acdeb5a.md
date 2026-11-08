---
uid: request-6acdeb5a
id: REQ-663
type: request
title: 'Paperwork: Senders — choose the address a business sends from'
created_by: EPIC-30
created_at: '2026-11-07T18:57:46.597030+00:00'
updated_at: '2026-11-07T21:21:27.181890+00:00'
completed_at: null
last_field_updated: body
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-087800af
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1c3002b9
  commits:
  - working_sha: bcd7417b9b7c269cd99d62597c0c087bd4fc058e
    reconcile_sha: null
    main_sha: null
  - working_sha: f1b6795bd4654f4685bcbb283ae3313a0b80ff97
    reconcile_sha: null
    main_sha: null
  - working_sha: 273453ee5a2b0d8c24e51fcc96a1ca47456d5f9b
    reconcile_sha: null
    main_sha: null
  version: 0.2.812
---

## What this is for

EPIC-30. Today every email a business sends comes from `no-reply@` its verified sending domain (`SENDING_LOCAL_PART`), or the platform address. Operator, 2026-11-07: "What I am expecting is that the emails will come from the domain the site is published on and the owner can configure a set of predefined send from emails. These can be used arbitrarily to be the sender for different emails. Sender configuration probably belongs in the Paperwork tab."

## Behaviour

1. **Senders live in the Paperwork tab** (Email mode, REQ-661): a list per business — add, edit display name, remove.

2. **The domain is the one the site is published on.** A sender is a **local part** (free) at a **fixed domain**: a domain one of the business's sites is published on, once sending from it is verified (`sending.ts`, REQ-259). A business with several such domains picks the domain per sender from those. The domain is never typed (spoofing / deliverability). For the 1st Contact business, its own domain.

3. **Any sender can be used for any message.** Each message (REQ-660's records) gains a **sender** chosen from this list; the same sender may be used by many messages. The business marks one sender as its **default**, used by every message that does not name one.

4. The UI **recommends against** local parts that tend to route to spam (e.g. `no-reply`, `noreply`, `admin`, `info` on a new domain) — a warning, not a refusal — and points out that **replies go to that address**, so it should be a real mailbox, or the sender should carry a **reply-to**.

5. Removing a sender that messages use is refused, naming those messages.

6. Until a business has a sender of its own, emails keep today's From (the platform address under the business's name), and that is shown as its only sender.

7. The Email assistant (REQ-662) reads the list through `list_senders` and may set a message's sender; managing the list itself is the client's.

8. **A site published only on its 1st Contact address** (`<name>.1stc.site`) sends from the platform address under the business's name, as today; that is its only sender (operator, 2026-11-07: "OK"). No `1stc.site` subdomain is set up for sending.

9. **Attaching a custom domain turns sending on automatically** (operator, 2026-11-07: "Yes"). When a site's custom domain is attached, REQ-259's records are applied with it — `send.` SPF and MX, the `resend` DKIM key, and `_dmarc` only when absent and only at `p=none` — and Resend verification starts. The separate "send as your domain" toggle is removed (one path, not two). Until verification completes, mail keeps the platform address; once verified, the domain is offered for senders. Releasing the domain removes the records as today (`_dmarc` only if we wrote it). Existing test businesses with a custom domain attached but sending off are switched on by the same path.

## Constraints

- No free-text domain: the domain part is never typed (spoofing / deliverability).

## Why free-coded

Small, self-contained once REQ-660's records exist.

## Test plan

UATs named `test_UAT_FC_REQ-663_*`:

- Adding `hello@` on the domain a site is published on (sending verified) makes it selectable on a message; the next send of that message is from it.

- Two messages can use the same sender; a message with no sender uses the default.

- A domain cannot be typed; a local part is validated.

- A spam-prone local part shows the warning but saves.

- Removing a sender in use is refused, naming the messages.

- A business with no verified domain has only the platform sender, and sends exactly as today.

- A site on `<name>.1stc.site` only: the platform sender is the only one offered.

- Attaching a custom domain applies the sending records and starts verification with no toggle; until verified the domain is not offered and mail keeps the platform address; once verified it is offered. An existing `_dmarc` is left untouched; none present → `p=none` is written. Releasing the domain removes what we wrote.

## Order and dependencies

- **After REQ-660** (it adds `sender` to REQ-660's message records; REQ-660 leaves today's From unchanged).

- **In parallel with REQ-661 and REQ-662.** The Senders list sits in REQ-661's Email mode: whichever lands second places it there.

## As implemented (REQ-663 session, 2026-11-07)

What landed, and the decisions taken while building it. Where this differs from an item above, this section describes the code as it now stands.

**Senders** (`senders.ts`, migration `0057_senders.sql`)

- A `senders` D1 table per business: local part, domain, display name, optional reply-to, and one default (a partial unique index allows at most one).

- The domains a sender may use are the business's `sending_domains` rows with status `verified`. A sender whose domain is no longer verified (the domain was released) is kept and listed as unavailable, but never used. Its mail falls back to the default, then to today's From. Re-attaching the domain makes it available again.

- Local part: lower-cased; letters, numbers and `. _ + -`, not at the start or end, no `..`, at most 64 characters. An `@` in it is refused ("type only the part before the @"). A domain that is not one of the business's verified domains is refused, naming the ones it may use, or saying it has none yet. Display name: one line, no angle brackets, at most 100 characters. Reply-to: an email address, or none.

- The first sender becomes the default. The address of a sender is fixed: only its display name and reply-to can be edited (remove and add to change the address).

- Spam-prone local parts (`no-reply`, `noreply`, `donotreply`, `do-not-reply`, `admin`, `administrator`, `info`, `postmaster`, `webmaster`, `root`, `mailer-daemon`) carry a warning but save. Every sender is shown with the note "Replies go to this address, so it should be a mailbox somebody reads — or give the sender a reply-to address."

- Removing a sender is refused while any message's current version names it, and the refusal names those messages (a form's reply by its form). Removing the default is refused while other senders remain ("make another sender the default first"). Removing the last sender returns the business to the platform address.

**Messages and From** (`message-records.ts`, `message-send.ts`, `message-triggers.ts`)

- A message version has a `sender` field: a sender id, or none, meaning the default. It is set with `PUT /api/messages/<key> {sender}`: an id of one of the business's own senders (anything else is refused), or `null`/`"platform"` to clear it. Message JSON now carries `sender`.

- From at send time: the sender the message names, if available; otherwise the business's default, if available; otherwise today's per-trigger From. That is `invite@` for invite and delegate, `MAIL_FROM` for sign-in, lapsed, notify triggers and form replies, and the platform address under the business's name for order emails. A sender's From is `Display name <local@domain>`, using the business's name when the display name is empty.

- When a business's own sender is used, replies go to that sender: its reply-to if set, else no reply-to header. The caller's reply-to (the owner's address on order emails) applies only when the platform address is used.

- The `no-reply@<verified domain>` From is removed (`sendingFrom`, `SENDING_LOCAL_PART`). A verified domain no longer changes From by itself; a sender must be added.

- Every send path (sign-in, invite, the invite modal's From line, delegate, notify, order emails, form replies, Send to me) resolves From the same way. The business's senders are read once per sender context.

**Routes** (in `message-routes.ts`; owner and live delegates only, the same as the message routes)

- `GET /api/senders` returns `senders` (each with from, warning and available), `domains` (the verified domains on offer), `platform` (the platform sender `{id:'platform', from, isDefault:true}` while the business has no available sender of its own, else null), `spamProne` and `repliesNote`.

- `POST /api/senders {localPart, domain, displayName?, replyTo?}`, `PUT /api/senders/<id> {displayName?, replyTo?}`, `DELETE /api/senders/<id>`, `POST /api/senders/<id>/default`. A refusal is a 400 with the reason; an unknown id is a 404.

**Domains: attaching turns sending on** (`domains.ts`, `router.ts`, `sending.ts`)

- `POST /api/domain` takes no `email` flag: attaching always applies REQ-259's sending records (where the deployment can manage sending domains) and starts Resend verification. `POST /api/domain/email` and `setDomainEmail` are removed.

- A domain already attached with sending off is switched on through the same `enableSending` path when the account holder next opens the domain section (`GET /api/domain`).

- Sending is per zone: an attached subdomain sends as its apex. When another business already sends from that apex (one site uses the apex and another a subdomain), the attach succeeds as a website and leaves mail as it is. The section then reports email as off.

- Releasing removes the sending of the released domain only, not the business's first sending domain, so a business may send from several domains. `_dmarc` handling is unchanged: written only when absent and only at `p=none`, and removed on release only if we wrote it.

**Builder** (`builder/senders.js`, `builder/domain.js`, `builder/settings.js`, `builder/api.js`)

- A Senders section lists the platform sender (when it is the only one) or the business's senders with Default/unavailable marks, warnings, name and reply-to edits, Make default and Remove. Adding a sender takes the part before the @ plus a domain chosen from a select; the spam warning shows while typing.

- **Placement:** REQ-661 landed first, so this ticket placed the list in the Paperwork tab's Email mode. A **Senders** group follows Messages and Templates; its row shows the default sender (or the platform sender), and its Detail is the Senders section. A change there re-reads the email lists. Settings has no Senders section.

- **A message's Sender** (REQ-661's field in the message Detail) lists "Default sender ()" and every available sender. Save sends `sender` (an id, or null for the default). With no sender of its own, the field shows the platform sender, disabled, and Save sends no `sender`.

- The domain section has no sending checkbox. Its mail line now reads: pending — "…Until then, email comes from 1st Contact."; verified — "Your email can come from . Choose the addresses it is sent from in Paperwork, under Senders."; failed — "…so it still comes from 1st Contact. Ask us and we will look."

**Not in this ticket:** the Email assistant's `list_senders` tool and its setting of a message's sender (item 7) are REQ-662's. That assistant calls `GET /api/senders` and `PUT /api/messages/<key> {sender}`, which this ticket provides.

**Tests**

- New: `tests/test_UAT_FC_REQ-663_senders.workers.test.ts`:

- a sender on the published, verified domain is selectable on a message, and the next send is from it;

- two messages share a sender, a message with none uses the default, and changing the default moves it; reply-to is honoured;

- a typed domain or an `@` in the local part is refused, local parts are validated, and a message cannot name a foreign sender;

- a spam-prone local part warns but saves;

- removing a sender in use is refused naming the messages, and so is removing the default while others remain;

- with no verified domain, the platform sender is the only one and mail is sent exactly as today;

- a site on its 1st Contact address only offers only the platform sender;

- attaching applies the records with no toggle; the domain is not offered and mail keeps the platform address until verified, then it is offered and used; release removes what we wrote and the sender is kept but unused;

- an existing `_dmarc` is left untouched;

- a domain attached with sending off is switched on by the same path.

- New: `tests/test_UAT_FC_REQ-663_senders_section.test.ts` (jsdom):

- the section: only the platform sender without a domain; the domain is chosen from a select and a spam-prone part warns while typing but still adds; a refused removal is shown with the messages it names;

- in Paperwork: a message chooses any sender or the default and Save sends it; without senders the platform sender is shown fixed and Save omits `sender`; the Senders list lives in Email mode.

- Adapted, because they pinned the removed toggle: REQ-259 domain surface (the `separately_reversible` case is retired; `mail_goes_out…_only_once_verified` now asserts the domain is offered for senders only once verified; the non-holder case no longer calls the removed route), REQ-259 domain section (no toggle; the verified line; the Settings pane-order case checks the domain sections' order instead of an exhaustive list, which was already failing on xgd-working), REQ-264 sending-unavailable (the two toggle-route cases are retired) and REQ-264 toggle-not-offered (the attach-asks-for-no-email case is retired).

- Pre-existing failures, identical on clean xgd-working: `reconciliation-identity-invite-provision-admission` (27, `users.email` column) and `reconciliation-identity-invite-control` (1). `BUG-58_invite_modal_fits` fails in the worktree with the builder files reverted too (a location artifact) and passes in the main checkout.