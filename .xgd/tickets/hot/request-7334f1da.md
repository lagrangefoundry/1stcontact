---
uid: request-7334f1da
id: REQ-259
type: request
title: 'The domain configuration surface: the selector, the sending toggle, and release'
created_by: EPIC-5
created_at: '2026-09-16T03:35:54.284753+00:00'
updated_at: '2026-09-16T03:35:54.284753+00:00'
completed_at: null
last_field_updated: created_at
status: draft
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