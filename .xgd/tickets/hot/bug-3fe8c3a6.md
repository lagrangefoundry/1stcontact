---
uid: bug-3fe8c3a6
id: BUG-97
type: bug
title: A gated download link names a hardcoded host and the wrong channel, not the
  site's own address
created_by: EPIC-10
created_at: '2026-09-16T00:46:18.723054+00:00'
updated_at: '2026-09-20T18:30:54.058701+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  severity: high
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cf953dae
  story_points: 5
  commits:
  - working_sha: 20ecdde8c70368747afd9d869e8c8125b4ac09e5
    reconcile_sha: null
    main_sha: null
  - working_sha: c93127a969d996989f46d1893e3ddd19d5e79092
    reconcile_sha: null
    main_sha: null
  version: 0.2.214
---

## Symptom

The whitepapers email arrives and its download button points at

    https://1stcontact.io/site/site_bca807fc7cdd0bf418b15e255f8c45c6/api/download/gate_…

which is the wrong host for this site, exposes the site's internal key to the recipient, and
cannot be followed at all in development.

## Root cause

`publicSiteUrl` composes every link from one hardcoded constant:

    export const PUBLIC_SITE_ORIGIN = 'https://1stcontact.io'
    return `${PUBLIC_SITE_ORIGIN}/site/${encodeURIComponent(siteKey)}${tail}`

**The reasoning behind that constant is still correct, and it does not cover this caller.**
It reads: *"a var would invite a per-environment override whose only reachable effect would be
to send an operator's 'view published' click somewhere else."* That was written when the
builder's own view-published link was the only consumer. There are three now, and they do not
share an audience:

| caller | audience | the rationale |
|---|---|---|
| `router.ts:3114` view-published | operator, inside the builder | holds |
| `router.ts:3961` preview redirect | operator, inside the builder | holds |
| `lead.ts:1344` gated download | **a stranger, by email** | does not hold |

**The product already knows each site's real address.** `site_domains` (`0008`) holds
`site_id`, `host`, `kind` and `status`; `PLATFORM_APEX` is `1stc.site`; [[REQ-238]] makes an
address **required before publishing**; and `kind: 'custom'` is declared-but-unimplemented,
waiting on [[EPIC-6]]. So for any published site a hostname always exists, and the one thing
the mail must not do is name a different one.

Sending a recipient to a domain other than the one they just signed up on is the signal the
`invite` seed's own comment is careful about — *"an anonymous From is most of what makes an
invitation from a domain with no reputation look like phishing."* The same argument applies to
the link as to the sender.

**The channel is wrong as well as the host.** `gateUrl` calls `publicSiteUrl` whatever channel
the submission came from, so a **draft** submission — the operator pressing the button on
their own preview, which [[BUG-78]] deliberately made work — mints a link into the *published*
site. On a site that has never been published that link cannot resolve, and `lead.ts` already
carries a `LeadChannel` that knows which case it is in.

## Fix

**The link is built from the address the site actually has, not from a constant** — the
`site_domains` row for that site, whichever `kind` it is. This is not the per-environment var
the comment warns against: nothing is overridden per deployment, and the value is read from
the store the product already keeps it in. The two operator-facing callers are unchanged.

**A draft submission's link points at the draft**, so a form tested in the preview delivers
something the operator can actually open. Which channel the submission arrived on is already
known at the call site.

A site with no address is a state publishing forbids; if one is somehow reached, the delivery
is refused and says so rather than composing a link into a domain nobody owns.

### What moves is the authority, and the path grammar is untouched

`public-site` resolves a site from `/site/<key>/…` and from `APEX_SITE_KEY`; **there is no
host→site resolution at all**, and the production routes name `1stcontact.io` and
`*.1stcontact.io` and nothing else. So a link at `https://alice.1stc.site/api/download/<token>`
— the key gone entirely — would be correct by construction and **resolve nowhere**, which is a
worse link than the wrong one it replaces. [[DOC-45]] §4 already owns that work and gates it on
[[TODO-6]] §§1 and 5.

So the mail names the site's own host and keeps the path every other published byte goes
through: `https://<the site's host>/site/<key>/api/download/<token>`. The recipient is no longer
sent to a domain other than the one they signed up on — which is the fault the phishing argument
above is about — and the link resolves the moment that host points at `public-site`, with no
resolution work and no ordering dependency on an operator task. Deleting `/site/<key>/` from the
grammar, and with it the key from the path, stays [[DOC-45]] §4's.

### A site holding more than one address

The custom one wins, and `platform` is the fallback. A business that has gone to the trouble of
pointing its own domain at us has told us which address it wants to be seen at, and a mail is
the surface where being seen at the other one is most expensive. Asked over `kind`, so
[[EPIC-6]] lands unchanged.

### The draft link, and what has to exist for it to open

`/preview/<siteKey>/draft/…` is served by `control-app`, and **nothing there answers
`api/download`** — `servePreview` would 404 it, so a draft link with no route is a link the
operator still cannot open. The preview channel therefore answers the gate: the page that lists
the artifacts, and the artifacts themselves, served out of the draft through the same
`servePreview` that serves every other draft byte.

`openGate` and `takeAsset` take the channel for `formDefinitionOf`'s reason, and it is the same
reason [[BUG-78]] gave: the operator pressed the button on the draft, so the draft is the served
snapshot. A site that has never been published has no live revision for a published read to
resolve against, and that is the case this whole half exists for.

**The draft path asks for no address, and must not.** [[REQ-238]] requires an address before
*publishing*, so a site being built in preview has none — the origin for a draft link is the
builder that served the preview and took the submission, which is a fact about the request
rather than configuration. The `no_site_address` refusal is reachable from the published channel
only.

The page is one page and both surfaces render it, so `public-site` stops declaring its own copy.

### Seeing the message, which is what makes testing before publishing real

A preview submission now writes the contact, records the press, mints the grant, renders the
message and **records** it — a development deployment holds no mail credential, so by
[[REQ-196]]'s design nothing leaves the building. The rendered body is stored and
`/api/people/messages` already returns it. Three surfaces could show it and none does: the
capturing mailer's console line carries `to=` and `subject=`, the Messages list in the contact
pane drops the `body` it is handed, and [[BUG-94]]'s email-page preview shows the template with
`{{cta_url}}` still a placeholder. So the link this ticket fixes would be correct, followable,
and **invisible** — and the operator's only way to read the mail they are about to send a
stranger would be to publish and send it to themselves.

A message in that list opens to show **what was sent**: the stored body, rendered, with the link
live in it. No new data and no new endpoint — the pane is handed the body already. That is what
turns a preview submission into a whole rehearsal: press the button, open the contact, read the
mail, follow the link, take the paper, with nothing published and no mail provider.

**And it says when nothing was sent.** The record is written `sent` with a `local_` provider id
by the adapter that cannot send, so the pane reports a delivery that never happened — at the one
surface an operator consults to find out whether it did.

## Test plan

`tests/test_UAT_FC_BUG-97_download_host.workers.test.ts`:

- A published site with a platform hostname mails a link on **that** host, and the site key
  does not appear in the URL's authority.
- A site with a `custom` address mails a link on the custom host — asserted through the `kind`
  rather than by matching `1stc.site`, so [[EPIC-6]] lands unchanged.
- A site holding both kinds mails the custom one.
- A **draft**-channel submission mails a link that resolves against the draft, and a published
  one against the published revision. The two are different URLs from the same form, and the
  draft one names the business, so a mail read days later cannot resolve against whichever
  business a session had selected.
- A site with **no address at all** refuses the delivery and reports why; no mail goes out
  carrying a composed-from-nothing link, and no grant is minted for a link nobody can be given.
- A site with no address still delivers a message its form promises no artifact for, because
  that message carries no link to compose.
- The two operator-facing callers still produce what they produce today — the constant, and the
  preview channel's redirect through the real route. Asserted directly, so the fix cannot
  quietly move the view-published click, which is the failure the constant's comment exists to
  prevent.
- A submission from a **development** origin mails a link on that origin, and the origin is
  taken from the request rather than supplied by the test — asserted by submitting through the
  real preview route and reading the host back out of the mail.

`tests/test_UAT_FC_BUG-97_draft_gate.workers.test.ts` — the link is taken out of the mail and
then **followed**, through the builder's own `route()`:

- A site that has **never been published** takes a preview submission and the link it mails
  opens: the page lists exactly what the draft's form promises, and the artifact it links
  arrives as its bytes, out of the draft's own assets.
- The arrival and the download are recorded by the same statement the published gate records
  them with, so *"they opened it"* means one thing whichever channel they opened it on.
- A gated page and a gated artifact are never stored by any cache, and are not indexed.
- The draft gate reads the **draft's** definition, so an artifact added to the form since the
  last publish is on the page.
- A token minted against one site reaches nothing under another site's key on the draft channel;
  an unknown token is the ordinary refusal; a site key this business does not hold is refused;
  and the **edit** channel answers no gate at all.
- The published gate is unchanged, asserted through `public-site`'s own entry point — the page,
  the artifact, and its bytes.

`tests/test_UAT_FC_BUG-97_message_body.test.ts`, through the real contact pane:

- A message opens to show the body **that was sent**, and the gate link the recipient was given
  is readable in it — which for a per-contact link is the only place it exists.
- It is framed and sandboxed: no same-origin access, no scripts, and no top-level navigation, so
  a message cannot restyle the builder or take its tab. `allow-popups` is granted, because a
  link that cannot be pressed is a link that cannot be tested.
- It is built on first open and only once, and a record kept without a body says so rather than
  framing nothing.
- A message the deployment could not send is reported as not sent and **names the missing mail
  provider**, while the record's own status is still shown beside it; one that really was sent
  carries no such note.

### Two fixture corrections this needed, recorded so they are not read as drift

`seedFormSite` seeded a `site.json` carrying no `id`, no `theme` and no `nav`, so **the draft it
produced never validated**. Nothing noticed, because every suite using it read the definition out
of the store and none of them rendered it — and the draft gate serves an artifact by rendering.
It seeds `starterSiteJson` now, which is what `1c new` seeds, making the fixture's own claim
(*"a site this returns is a site the serving Worker could serve"*) true.

And a published fixture site now **holds a public address**, because [[REQ-238]] requires one
before publishing and this helper writes the revision directly rather than going through
`POST /api/publish`. Without it every delivery UAT in the suite would assert the refusal above —
which is silence, and silence is the symptom.

`giveSiteAnAddress` writes the row rather than claiming through `claimHostname`, for two reasons
worth stating: a `custom` address has no shipped operation at all ([[EPIC-6]]), and the claim path
is scoped to the business and deliberately refuses a second platform label — while the schema's
own rule (`idx_site_domains_site_platform`) is per **site**. Two existing UATs that pinned
`https://1stcontact.io/site/<key>/api/download/…` are updated to assert the site's own host:
they were pinning the defect.