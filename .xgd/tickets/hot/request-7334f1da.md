---
uid: request-7334f1da
id: REQ-259
type: request
title: 'The domain configuration surface: the selector, the sending toggle, and release'
created_by: EPIC-5
created_at: '2026-09-16T03:35:54.284753+00:00'
updated_at: '2026-09-20T18:41:14.345414+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 5
  depends_on:
  - request-616e56ac
  - request-a6540f61
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-69b4ba23
  commits:
  - working_sha: be55a1ab1458d114a580d18f6303f1b974179acf
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 7e182033b035d146f5c6fdc6e28f63c2e67a6681
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2e2448765ad6eb5fd3d8c0e10c8157a186df45a0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 5ec02790532eb1b6514ed9ffd0161a1878a3ed11
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 5be548983ba3a6b3a8d9661b8e28bc4296666a31
    reconcile_sha: null
    main_sha: null
  - working_sha: a7f3f69b2251b6da66d9806b5c5a24f8b74bc704
    reconcile_sha: null
    main_sha: null
  version: 0.2.226
---

## What this is

**The whole customer-facing configuration for a domain we already hold: three
controls, and no records.**

| Control | Default | Why it is exposed at all |
| --- | --- | --- |
| **which domain** — a selector over the account's pool | none | the only genuine choice |
| **send email from this domain** — one toggle | on | it changes what recipients see, and it has a real failure mode |
| **release** — take it off this site | — | it is what makes the relationship reversible |

**Everything else is machinery and must never surface as a field**: `A`/`AAAA`
versus `CNAME`, the `www` redirect, the certificate, the SPF, DKIM and DMARC
values, the propagation wait, the Cloudflare zone id. **If a customer is being
shown a record type, we have failed.** That is *"notify in their language, do not
ask in ours"* applied to the happy path rather than to the dangerous one.

## Where it goes

The Settings pane, as a section — [[REQ-239]] wrote it as *"a list of settings
sections so that one is an addition rather than a rewrite"*, and this is another
addition, beside [[REQ-249]]'s `Your free web address`.

**And the nouns have to agree with that section.** [[REQ-249]] deliberately
refuses the word *domain* for a `1stc.site` hostname, on the grounds that
[[EPIC-6]] is going to sell the customer a real one and teaching them "domain"
there means unteaching it here. **This is where the word is finally correct**, and
the two sections read as one sentence about the same subject or they read as two
products.

## The selector

Its query is *zones for this account, `status = 'active'`, minus hosts already
claimed by another site.* One join, and **no new exclusivity logic**, because the
unique index on `site_domains.host` already decides it — the authority
`0008_site_domains.sql` describes, doing the job it was built for.

**Authorisation is the thing the selector hides.** The pool is the account's and
the assignment happens inside a business, so a business member who is not the
account holder does not get to spend an account asset: they see *"ask the account
owner to attach a domain"*. Otherwise a member of one business can consume a
domain belonging to a sibling business.

## The check before the attach, and it is not optional for the operator's own domains

**The assumption that the operator's existing zones are green field is false, and
`MAIL.md` is the counter-example.** `1stcontact.io` carries a live Resend record
set today — an apex SPF, an SPF and a `feedback-smtp` MX on `send.`, a
`resend._domainkey` selector and a `_dmarc` at `p=none` (`MAIL.md:96-101`). A
domain that has been owned for years is exactly as likely to be carrying live mail
as one that just arrived.

So the epic's real gate — ***is there a live business on this domain today?*** —
fires on this path too, and the cheapest form of it is a prerequisite of
attaching anything:

- read the zone's existing `MX`, SPF, `_dmarc` and known DKIM selectors, using
  ticket A's resolver and **not a second implementation**;
- if the zone is clean, attach and say nothing — a warning about a risk that does
  not exist is how customers learn to dismiss warnings;
- if it is not, say what is there **in their language**: *"Your email is with
  Microsoft — I'll keep that working."* A sentence they can contradict is the only
  useful signal they can actually give.

**It notifies; it does not ask.** The epic is decisive about why, and the reason
is the client's own: *"our users are not going to be in a position to confirm
anything here."* A confirmation a furniture restorer cannot perform launders our
error into their approval.

## The email toggle

On, and what it writes is the `MAIL.md` set applied to the customer's domain. The
important property is **where those records sit**:

| Name | Type | Collides with existing mail? |
| --- | --- | --- |
| `send.<domain>` | TXT (SPF) | **no** — Resend's own subdomain |
| `send.<domain>` | MX (`feedback-smtp…`) | **no** — Resend's own subdomain |
| `resend._domainkey.<domain>` | TXT (DKIM) | **no** — a selector nobody else uses |
| `_dmarc.<domain>` | TXT | **yes** |

**Resend puts its return-path on `send.`, so enabling sending need not touch their
apex SPF or their MX at all.** Three records under names nothing else occupies.
That is a materially smaller blast radius than the general case implies, and it is
why sending ships alongside the web records rather than as a later, more careful
epic.

**`_dmarc` is the one dangerous record**, and it is dangerous in a direction the
apex-SPF worry misses: publishing a policy on a domain that already sends from
Mailchimp, Microsoft 365 or a booking system can start binning *their* mail, not
ours. So — **write `_dmarc` only when absent, only at `p=none`, and never tighten
a policy on a domain we did not start from zero.** Same silent, delayed,
lands-on-their-business harm as a lost DKIM selector, so it sits under the same
acceptance bar.

The constraint itself is ticket E's to implement and is stated here because this
ticket is its first caller.

**A third wait.** Resend domain verification takes minutes after the records are
written, and is separate from the route and certificate waits in ticket B. It
needs its own state or it reads as broken.

## Release, and the rule that must not be inherited

**Finality is a `platform` rule and must not be applied to `custom`.**
[[REQ-238]]'s *"chosen once and does not change"* exists because `1stc.site` is
scarce, public and first-come. A customer's own domain is none of those: they must
be able to move it between sites, take it off a site, and take it away entirely.

Same table, opposite rules. **This is written down because the finality rule is
the one already implemented**, and will otherwise be applied uniformly by whoever
reaches this code first — which fails closed in the worst possible way, by telling
a customer that the domain they bought is now permanently welded to a site.

Release takes the host off the site: the row goes `revoked`, the Worker route and
the records we added come down, the zone stays in the account and stays in the
pool. **Taking the zone out of our account entirely is offboarding** and is
[[EPIC-5]]'s, not this ticket's.

**Exclusivity is per host, not per domain.** The unique index already gives one
site per host. A per-*domain* rule would additionally forbid
`alicesplumbing.com` reaching one site while `shop.alicesplumbing.com` reaches
another — which [[DOC-45]] §2.3 already commits to eventually, and which is the
natural way to trial a new site on a domain whose apex still runs the old one.

## An open question this ticket assumes an answer to

**Do we want to send as the customer's domain at all?** Sending lead
notifications from `alicesplumbing.com` is better for trust and for
deliverability. It also entangles our sending reputation with theirs in both
directions, and it configures their domain for sending by a party they cannot
see. The alternative — sending from ours with their name in the display name — is
safer and slightly worse.

**The toggle above assumes the answer is yes, defaulting on.** If the answer is
no, the toggle and its record set come out of this ticket and the rest stands
unchanged.

## What landed

The three controls, on the Settings pane, beside `Your free web address`. What
follows is what the implementation added beyond the shape above, and why each
piece is a consequence of it rather than a new decision.

### The pieces

- **`domains.ts`** — the capability. It composes and implements almost nothing:
  the pool is [[REQ-257]]'s `zonesForAccount`, exclusivity is read back off
  `site_domains`' unique index rather than re-decided, attaching is
  [[REQ-258]]'s `serveHostOnSite` entire, and the pre-attach reading is
  [[REQ-257]]'s resolver. What is genuinely new is the authorisation rule, the
  sentence a live domain is described with, and the ordering of a release.
- **`builder/domain.js` + `/api/domain`, `/api/domain/email`** — the surface and
  its two routes. `GET` draws the whole section in one answer, because a surface
  assembling four calls would show a pool before it knew whether the caller may
  spend it. `GET` is also the verification poll: Resend's wait has no webhook
  here, and a state that only moved when somebody pressed something would read
  as broken.
- **`sending.ts` and `resend.ts`** — the toggle's half. A Resend client exists
  because **the DKIM public key is minted by Resend per domain and cannot be
  known any other way**; `MAIL.md`'s "paste the records it gives back" is a
  dashboard step, and asking a furniture restorer to paste a 400-character key
  would put the machinery on the screen this ticket exists to keep off it.
- **`0012_sending_domains.sql`** — the toggle's state, including `dmarc_ours`:
  the flag that decides whether release may take a `_dmarc` down. Deleting a
  policy the customer's other provider depends on is the same silent, delayed
  harm as publishing one.
- **`records.ts`** — *read the zone once, create what is missing, replace what
  is wrong, leave what is already right, undo in reverse*, extracted from
  [[REQ-258]] now that the sending toggle is its second caller. Behaviour and
  call order unchanged; [[REQ-260]] is the third caller and should reuse it.

### Authorisation: the account, not the role

The gate is *are you the holder of this business's account* —
`tenants.owner_account_id` against the caller's own — and not *do you own this
business*. A `support` member may own the business they are helping without
being the person whose account paid for its domains, and what is being spent is
an account asset.

It is enforced in **two** places, because there are two ways to reach a domain.
The selector filters the pool to the account, and the attach **re-checks the
named domain against the account** — without that, a holder could type a domain
belonging to somebody else's account entirely and have it attached, which is the
same failure as the first, arrived at by typing rather than by choosing.

### Sending changes what recipients see, and only once it is verified

The toggle's stated reason for existing is that *it changes what recipients
see*, so it does: once Resend reports the domain verified, mail this product
sends on that business's behalf goes out as
`<Business name> <no-reply@theirdomain>` instead of from ours. It loses to a
message template's own `from`, which keeps the precedence that was already
there.

**Until `verified` it changes nothing.** Mail from a domain whose DKIM key is
not yet published is unsigned, which is binned, which is indistinguishable from
mail that was never sent — so the fallback stays the address this product has
always sent from.

### A deployment with no sending credential

`RESEND_API_KEY` absent is an ordinary state and not a refusal: the domain still
attaches, the website still serves, and the toggle reports `off`. What does not
happen is a record set written for a registration that does not exist.

### And a deployment with no zone credential cannot ship at all

**The opposite ruling to the one above, and the contrast is the point.**
[[REQ-257]] minted `CLOUDFLARE_DNS_TOKEN` and made its deploy hook *warn* rather
than fail, on a condition it stated plainly: it was the DNS layer and nothing
that used it, so a deployment without the token answered 503 to an operator and
customers noticed nothing. It wrote down what would end that — ***"the moment
serving a custom domain depends on it"*** — and this ticket is that moment.

`Your domain` is a customer surface and every control in it goes through that
credential: the selector reads the account's zones, the attach writes the
records and the route, the toggle writes three more, and release takes them all
down. Without the token the section draws a pool it cannot spend and an attach
button that cannot work — **worse than the 503 it replaces, because the 503 was
only ever read by an operator who could act on it.** So the hook's
absent-everywhere row now **fails the deploy**, and its message names the
section rather than the capability.

**`RESEND_API_KEY` deliberately does not move with it.** This ticket is a caller
of that key too and the subsection above rules that case ordinary. A missing
sending credential costs a feature; a missing zone credential costs the whole
section — and `bin/deploy.d/secrets/README.md` already states the test the two
now differ under: *the outcome must match what a deployment without the value
actually does.*

**What the flip must not cost** is the directory's standing rotation contract: a
token that has been on the Worker for weeks still deploys without being
re-supplied, supplying one is still how a rotation is expressed, a rehearsal
still only reports, and the value is still never echoed — on the row that now
aborts as much as on the rows that do not.

### Subdomains

The selector offers apexes, and the attach accepts any host inside a zone the
account holds — `shop.alicesplumbing.com` while the apex runs the old site,
which is the natural way to trial one and is what *"exclusivity is per host, not
per domain"* means in practice.

### Five smaller consequences, each of one of the three controls

- **An empty pool is a sentence, not a disabled control.** An account that holds
  no domains yet is told so and shown no selector and no attach button. A
  disabled control is an invitation to work out what would enable it; on a
  surface whose whole point is that the machinery stays off it, the answer is a
  sentence.
- **The toggle and the address are separately reversible.** Turning sending off
  leaves the website address attached and serving, and releasing the domain is
  the only thing that takes the address down. They are two controls in the table
  above because they are two decisions.
- **Release is behind a dialog, and the dialog answers the fear.** Not a
  confirmation of records — the falsifier above still holds — but an answer to
  *"will I lose my website"*: the free `1stc.site` address takes over again, and
  the domain stays theirs and stays in the pool. **Cancel takes focus**, so a
  Return press aimed at something else cannot take a customer's address down.
- **Releasing nothing is not an error.** A customer who pressed it twice, or
  whose browser never heard the first answer, gets the same answer both times
  rather than a failure for a state they already wanted.
- **A `_dmarc` in either reading is enough to stop us.** The rule is *write only
  when absent*, and absent means absent from the zone **and** from the world — a
  domain whose delegation is still moving to us has a live policy that our own
  zone cannot yet see. A record visible in either reading is a record somebody is
  relying on.

## Not in scope

- **Serving** — records, route, resolution → ticket B. This ticket calls it.
- **Assistant tools, proposed changes, undo** → ticket E.
- **Getting a zone into the account** — the claim flow, the nameserver paste →
  parked with ticket D.
- **Offboarding** — the zone leaving our account. [[EPIC-5]]'s, unticketed.
- **Buying a domain** → [[EPIC-6]].

## Depends on

Ticket A (the resolver, for the pre-attach check; `zones`, for the pool) and
ticket B (serving, so that attaching produces an address rather than a row).

## Falsifiers

- A customer-facing surface that shows a DNS record type, a record value, or a
  Cloudflare zone id.
- A zone with `account_id` NULL, or `origin = 'platform'`, appearing in the
  selector.
- A business member who is not the account holder attaching a domain.
- A second implementation of external DNS reading, rather than ticket A's.
- Attaching a domain that already carries mail without saying so.
- A confirmation dialog asking the customer to approve DNS records.
- `_dmarc` written on a domain that already has one, or written at anything other
  than `p=none`.
- Any refusal to move or remove a `custom`-kind host.
- A per-domain exclusivity rule.
- The word *domain* used for a `1stc.site` hostname, or avoided for a real one.
- Resend verification presented with no state of its own.
- A deploy that succeeds with no `CLOUDFLARE_DNS_TOKEN` in the environment and
  none on the Worker, or that starts failing without `RESEND_API_KEY`.