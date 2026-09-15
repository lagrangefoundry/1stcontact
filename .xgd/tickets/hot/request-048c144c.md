---
uid: request-048c144c
id: REQ-247
type: request
title: An email a form sends is a page of the site
created_by: EPIC-10
created_at: '2026-09-14T21:31:04.642575+00:00'
updated_at: '2026-09-15T00:39:36.930914+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5b9685d2
  depends_on:
  - request-10200dc8
  commits:
  - working_sha: 4c87210002cc0013854876c73b392ae210cf87f1
    reconcile_sha: null
    main_sha: null
  - working_sha: 8cef26848147e7043a8bc99541e30bec3677e243
    reconcile_sha: null
    main_sha: null
  - working_sha: 3d7f305963309a55f673cf958a7cac2f5240f187
    reconcile_sha: null
    main_sha: null
  version: 0.2.202
  story_points: 13
---

# An email a form sends is a page of the site

The copy a capture form mails becomes an ordinary page of the site that sends it — listed,
styled and edited where every other page is, and reached by the assistant through the tools
it already holds.

## 1. What is true today

**A form names a template and nothing can show you what it says.** `config.template` names a
key; absence means send nothing ([[REQ-243]]). The copy lives in a business-scoped ticket that
`templateFor` seeds *at send time*, so the first recipient of a new message is the first
person to read it.

**No surface reaches a template at all.** The consultant holds `l1` and `fidelity`, plus a
ticket grant that is read-only — `READ_GROUP = 'ReadTickets'` (get, query, comments,
backlinks, history). `WRITE_GROUP = 'WriteTickets'` exists and is not granted. So the
assistant cannot author copy, cannot show an operator what a message says, and cannot act on
a `no_template` outcome.

**That gap has already cost a real delivery.** The XGD whitepapers form was configured with
two assets, their keys, names and URLs, and consent wording — and no `template`. It captured
contacts and mailed nobody. The assistant set every field `list_behaviors` describes to it
and omitted the one whose meaning exists only in a source comment. Nothing in the product
could have told it otherwise, and nothing could have shown the operator the message that
was not being sent.

## 2. The change: the message is part of the site

An email a form sends is a page. It is site-scoped because the form that sends it is — a
page and the form naming it belong to one site, and the addressing vocabulary is already
page ids.

**It appears in the page list and is edited with L1.** No new tab, no new role, no new AI
surface, and no ticket-write grant: `list_pages`, `add_page`, `get_l1` and `set_l1` reach it
because they reach pages. The capability gap in §1 closes as a consequence rather than as a
work item.

**It is materialised when a form is configured to send it, not when it first sends.** The
copy exists before any visitor submits, so it can be read and changed before anybody
receives it. A message nobody has reviewed is not a thing this product should be able to
send.

**It is never served.** An email page has no public address, appears in no sitemap, and is
not routable in a published revision. It is part of the site's content, not of its surface.

**It publishes like a page.** Copy goes live when the site is published. That is compatible
with [[REQ-197]]'s *"editable without a deploy"* — the sense there is *without shipping code*,
and publishing a site is a content operation. What is gained is review before live, which
template editing does not have today.

## 3. One L1, two render targets

The authoring model does not fork. L1 gains an **email render target** beside the web one:
tables rather than flex, styles inlined rather than in a stylesheet, palette references
resolved to literal colour, and real font fallback stacks because a web font will not load in
a mail client.

**The reduced axis set is DECLARED DATA, NOT PROSE.** An email page offers the axes the email
target can actually emit, and that subset is a declaration — so the tool manual projects it,
`set_l1` refuses what cannot be emitted, and the assistant cannot put a `box-shadow` in an
email and find out from a recipient. Documentation would drift from the renderer; a
declaration cannot. This is the same rule `invariantPresentation` exists to enforce one field
over, and the same failure `BehaviorConfigSpec` carrying no descriptions has already caused.

**Expanding it later is adding entries to that declaration**, not writing code — which is the
whole reason the subset is declared rather than hardcoded in the renderer.

## 4. A form names a page, and naming one that does not exist is refused

`config.template` names an email page of the same site. Configuring a form to name one that
does not exist is refused **at the moment of the act**, and the refusal says what exists and
how to make a new one — `add_page` with the email kind, which the caller already holds.

This keeps what [[REQ-243]] protects. A typo is still a refusal at authoring time rather than a
send that finds nothing while somebody waits for mail; what changes is that it is refused
when the form is configured rather than at publish. The publish-time check stays, because a
draft is never publish-validated and the builder's own preview submits against one.

**A credential message cannot be named, structurally.** `invite` and `signin` are not pages,
so a form cannot name one — the refusal stops being a check that could be forgotten.

## 5. What this does not touch

**The credential templates stay business-scoped tickets.** `invite`, `signin` and `lapsed` are
sent by the *business*, not by a site: a business with two sites has one sign-in email, not
two. Only the templates a form names move.

**Past sends are history and are not migrated.** `template_uid` on a message record is written
and never resolved back to fetch a live template, so a record of what was sent stays accurate
about what was sent.

**`material.ts`'s own MIME map and [[REQ-246]]'s work are separate** and unchanged here.

## 6. Acceptance criteria

1. An email page appears in the site's page list, is opened and edited like a page, and is
   styled with L1.
2. The assistant creates, reads and edits an email page using only the operations it already
   holds. No new surface, no new role, and no ticket-write grant is required.
3. An email page has no public address: it is not routable in a published revision, is absent
   from the sitemap, and cannot be fetched by guessing a path.
4. Configuring a form to send an email materialises the page, with readable default copy,
   before any submission occurs.
5. An operator can change that copy and the next send uses the changed copy.
6. Publishing the site makes changed copy live; an unpublished change does not reach a
   recipient.
7. Naming a template that does not exist is refused when the form is configured, and the
   refusal names the email pages that do exist and the operation that creates one.
8. Publishing a site whose form names a missing email page is still refused.
9. A form cannot name a credential message.
10. An axis the email target cannot emit is refused by `set_l1` on an email page, and the
    allowed set the assistant is told about is projected from the declaration rather than
    written by hand.
11. An email rendered from a page arrives legibly in a mail client that supports no flexbox,
    no custom properties and no web fonts.
12. A placeholder a template declares survives editing: copy that would drop `{{cta_url}}`
    from a message whose delivery depends on it is refused rather than sent broken. A token
    that appears only in a link's target is copy for this purpose — the ordinary way to write
    a call to action is a button whose words say one thing and whose destination is the token,
    and a check that read only the visible words would pass the message whose button is the
    broken part.

## 7. What follows technically

These are consequences of §2–§4 rather than separate intentions.

**The at-most-once ledger is keyed by vocabulary that is changing, and one path is exposed.**
`deliveryState` remembers a gated delivery by its *asset* key, so a form promising assets is
unaffected. The welcome path is different: it matches `message.asset === null &&
message.templateKey === templateKey`. If the identity a message is remembered by changes from
a template key to a page id, a form that has already sent a welcome would not recognise its
own history and could send a second one to somebody who already received it.

**A message carries what an email needs beyond its copy.** A page renders a body; an email
also needs a subject line, the placeholders its delivery depends on, and the address it goes
out from. Those sit on the email page beside its L1, are set when the page is made or
changed, and are projected by the same read that maps any other page. Changing one does not
clear the others — the same merge-not-replace rule the search-and-share wording already
takes, because an author editing a subject line cannot see a placeholder declaration from
where they are standing.

**A form naming a page makes that page undeletable while the form names it.** The site is
validated whole on every write and a change that would leave it not holding together is
refused; an email page enters that check as a consequence of being a page, so removing a
message a form sends is refused and the refusal names the form that sends it. This is the
same protection as §4 read from the other end: there, a form is stopped from naming a
message that does not exist; here, a message a form names is stopped from ceasing to.

**A message is reached by the form that sends it, never by a link.** [[REQ-248]] marks a page
nothing links to, because such a page cannot be opened at all and the mark is the only signal
that it is either deliberate or forgotten. A message is a page nothing may *ever* link to, so
read in that vocabulary every message a site holds is stranded — and a mark that fires on
correct work is one an author learns to scroll past, which costs the genuinely stranded page
the only signal it had. The question is therefore asked in the right vocabulary: what reaches
a message is the form whose `template` names it, and what strands one is no form naming it,
which is a true and useful thing to be told because a message nothing sends is copy nobody
will ever receive. The wording follows the vocabulary — telling an author that nothing
*links* to a page nobody can visit would send them looking for a link they must never add.

## 8. Further acceptance criteria

13. A form that has already sent a message does not send it again after this change. The
    identity a delivery is remembered by is stable across the move, for the welcome path as
    well as the gated one.
14. A business with two sites has one `signin` template and two independently editable sets
    of form emails.
15. An email page is carried by a site export and restored by an import, with its copy and
    its association to the form that sends it intact.
16. An email page carries its subject line, its declared placeholders and the address it
    sends from beside its copy, and they are read back by the same operation that maps any
    other page. Changing one of them leaves the others intact.
17. Removing an email page while a form still names it is refused, and the refusal names the
    form that sends it.
18. A message a form names is not reported as unreachable, and a message no form names is —
    with wording that names the form that is missing rather than a link.