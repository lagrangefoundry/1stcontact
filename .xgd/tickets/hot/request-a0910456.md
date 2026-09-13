---
uid: request-a0910456
id: REQ-243
type: request
title: A capture form chooses the email it sends
created_by: EPIC-10
created_at: '2026-09-13T22:02:21.394972+00:00'
updated_at: '2026-09-13T23:51:05.015963+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  depends_on:
  - request-41a9dc90
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ecbaa13f
---


# A capture form chooses the email it sends

A form says which message goes out when somebody submits it — a delivery, a welcome, or
nothing — instead of the one message the one hardcoded template happens to be.

## 1. What is true today

**One template, and it fires only on an asset.** `captureLead` renders `ASSET_TEMPLATE`
(`'asset'`) and does so only when the form declared both an asset key and an asset URL.
A form with no asset sends nothing at all — which is why the 1st Contact beta form, whose
whole deliverable is a place on a list, mails nobody.

**The key set is deliberately closed.** `TEMPLATE_KEYS = ['invite', 'signin', 'lapsed',
'asset']`, and `templates.ts` gives the reason: *"an open vocabulary would let a template
be authored under `sign-in` while the sender asks for `signin`, and the two would never
meet. The failure of a closed set is a refusal at authoring time; the failure of an open
one is a send that finds nothing at the moment somebody is waiting for mail."*

That reasoning is right and the constraint is wrong for this case: two forms on one site
plainly want different mail, and a closed set cannot express per-form copy.

## 2. The change: the set opens, and the check moves to publish

A form names the template it sends. The vocabulary stops being a fixed list and becomes
whatever templates the business has authored — and `templates.ts`'s failure mode is
answered by **validating at publish** that every template a form names exists in that
business's store.

That keeps the property the closed set was protecting. A typo is still a refusal at
authoring time rather than a send that finds nothing; what changes is that the refusal
comes from the store's actual contents instead of from a literal in the source. The system
keys keep their meaning — `invite` and `signin` remain what the identity flows send — and
are simply no longer the only ones.

**A form may also name no template**, which is capture with no mail, and is what a form
that only joins a mailing list should do.

## 3. Which tokens a capture template may use

`renderCopy` already refuses a template whose declared placeholders are not all satisfied,
and that refusal is the thing keeping a dead button out of a mail. A capture template's
tokens are the ones the capture path can supply: the gated page's link, and what the form
calls the artifacts it promised.

**`{{cta_url}}` for a capture form is the gated page** — the per-contact link from
[[REQ-244]] — and not an artifact URL. With a set of assets there is no single file to
link to, and the page is the thing that lists them.

## 4. What this does not touch

**Sign-up and sign-in keep their own templates and their own flows.** They are distinct
flows with distinct constraints, not configurations of a capture form; `invite` and
`signin` are already theirs. Nothing here gives a public capture form a way to send either.

## 5. Acceptance criteria

1. Two forms on one site, naming different templates, send different mail from the same
   submission path.
2. A form naming no template captures the contact, records its acceptances, and sends
   nothing.
3. A form with no assets can still send a welcome message — the case that mails nobody
   today.
4. Publishing a site whose form names a template that does not exist in that business's
   store is refused, and the refusal names the form and the missing key.
5. A template whose declared placeholders cannot be satisfied by the capture path is
   refused at render, as it is today.
6. A capture form cannot name a template in a way that sends a redeemable sign-up or
   sign-in link. Asserted by attempting it.
7. The business's own templates are read from its own store; two businesses may hold
   different copy under the same key with no platform-only branch.
## 6. What follows technically

These are consequences of §2–§4 rather than separate intentions, recorded because each
one is behaviour that is now asserted and would otherwise look like drift.

**Existing gated downloads must not go quiet.** Absence means *send nothing*, and every
`contact-form` already in the stores predates the key and therefore carries none. Read
under the new rule those forms name nothing, so every whitepaper delivery this product
has ever made would silently stop — the exact failure `renderCopy`'s refusals exist to
prevent, arriving through the door nobody is watching. A version step names `asset` for
an instance that promises artifacts, which is the template it was already sending, and
leaves an instance that promised nothing naming nothing, which is what it was already
doing. It does not invent copy for a form that sent none, and it does not overwrite a
template an author has already chosen.

**The at-most-once cap needs a handle for a form with no artifact.** [[REQ-223]] §5
bounds a victim's exposure to one message per address per artifact, because a public
form takes an address the sender does not own. A form whose whole deliverable is a place
on a list has nothing to key that on, so the ledger handle becomes the **template**: this
address has had this business's welcome, and will not have it twice. Two forms naming one
welcome therefore send it once between them, which is what a welcome means. Suppression —
a bounced or complaining address — applies to a message just as it applies to an asset,
because the rule is about the mailbox.

**The send checks as well as the publish, and reports rather than throws.** A draft is
never publish-validated and the builder's own preview submits against one, so the two
refusals of §2 and §4 are reachable there. Reaching them captures the lead, sends nothing,
and says why — as a reported outcome and a log line an operator can read while wondering
where a mail went, not as a failed submission. A key the business does not hold is never
seeded on the way past: nothing here knows what a business's own welcome should say, and
inventing copy would put words in their mouth at the moment a stranger is receiving them.

**The submission's outcome says what became of the message.** An asset outcome answers
*did they get this artifact*; a form promising no artifact needs an answer to *did the
welcome go out*, and folding that into the asset list would need a fake key. The two
refusals above join the existing vocabulary of reasons a delivery did not happen.

**The seeded system keys count as available.** Template lookup is seed-if-absent, so a
business that has never been asked for its `asset` template is given one the first time a
download is delivered; reporting it missing would refuse a publish that is about to work
perfectly. What the publish check asks is therefore *the platform's own keys, plus
whatever this business has written* — and the template type's key stops being an
enumeration so a business can write one at all.

## 7. Further acceptance criteria

8. A `contact-form` already stored with assets still sends its delivery after the version
   step; one stored promising nothing still sends nothing, and one whose template was
   already chosen keeps it.
9. A form with no assets sends its message at most once to an address, and two forms
   naming one template send it once between them.
10. On a draft, a form naming a template the business does not hold, or naming a
    credential message, captures the lead, sends nothing, reports why, and seeds no copy
    under the missing key.
11. A site with two forms both naming refused templates is told about both in one
    publish, each error pointing at that form's own template key.
12. Publishing a form that names a seeded system key, or names no template at all, is not
    refused.
