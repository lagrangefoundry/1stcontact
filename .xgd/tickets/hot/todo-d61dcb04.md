---
uid: todo-d61dcb04
id: TODO-6
type: todo
title: '1stc.site housekeeping: PSL, reserved labels, allocation, registration hygiene'
created_by: CHAT-48
created_at: '2026-09-12T20:37:19.939899+00:00'
updated_at: '2026-09-12T20:37:19.939899+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: user_task
  auto_merge_back: true
---

**Mixed operator task and product decisions.** [[DOC-45]] §9 left *"which apex,
and whether the product sells domains"* as open decision #2. Buying `1stc.site`
closes both halves: the interim apex is `1stc.site`, and the product sells
domains. This ticket is the housekeeping that follows from owning it, and it is
mostly cheap **now** and awkward **later**, which is the only reason it is being
written before the surfaces that use it.

Items are marked **[op]** (do it in a dashboard, today), **[decide]** (record an
answer, no code) or **[code]** (becomes a request under the settings/subdomain
epic).

## 1. Public Suffix List submission — [op], and the one with a lead time

Every customer label is a sibling of every other under one registrable domain.
Without a PSL entry, a browser treats `1stc.site` as the cookie-setting boundary,
so `alice.1stc.site` can set a cookie scoped to `.1stc.site` that `bob.1stc.site`
then sends. That is not a hypothetical — it is the reason `pages.dev`,
`github.io`, `vercel.app` and `herokuapp.com` are all on the list.

Submit `1stc.site` to the PRIVATE section of the list via pull request against
`publicsuffix.org/list/public_suffix_list.dat` on GitHub.

**Do it now rather than when it bites.** Acceptance takes weeks, and browser
adoption lags acceptance by a further release cycle or two — Chrome and Firefox
ship the list baked into the binary. The cost today is one PR. The cost after we
have customers is one PR plus a wait we cannot shorten, during which the
isolation property simply does not hold.

The submission wants a working contact address on the domain and a short
description of what the namespace is for. Both are trivial; neither can be
skipped.

## 2. Reserved and blocked labels — [code]

[[DOC-45]] §7 says in one sentence that impersonating labels are reserved
(`www`, `app`, `api`, `mail`, `admin`, "and the rest of that family"). That
sentence needs to become a list in code, because the family is larger than it
looks and the failure is not symmetric — a label wrongly refused is a mild
annoyance, a label wrongly granted is unrecoverable once someone is using it as
their business address.

Four distinct groups, worth keeping separate because they change for different
reasons:

- **Infrastructure** — `www`, `app`, `api`, `mail`, `smtp`, `imap`, `mx`, `ns`,
  `ns1`, `ns2`, `cdn`, `static`, `assets`, `admin`, `dashboard`, `status`,
  `staging`, `dev`, `test`, `localhost`. Several of these we will want for
  ourselves; the rest are phishing surface.
- **Protocol and validation** — `_acme-challenge` and the `_`-prefixed family,
  `autodiscover`, `autoconfig`, `_dmarc`, `_domainkey`. If a customer holds
  these, certificate issuance and mail validation for the apex can be
  interfered with.
- **Platform identity** — `1stcontact`, `1stc`, `firstcontact`, `support`,
  `help`, `billing`, `account`, `accounts`, `login`, `signin`, `secure`,
  `verify`, `payment`. A customer site at `billing.1stc.site` is a
  ready-made credential-harvesting page wearing our name.
- **Impersonation and abuse** — well-known brands, and profanity. This one
  cannot be a static list that stays correct, so it wants a screening step at
  allocation plus the ability to revoke a label after the fact.

**Revocation must exist from day one.** Whatever the list says, something will
get through it, and the only alternative to revocation is leaving it up.

## 3. Label allocation and uniqueness — [code]

[[DOC-45]] §7 settles the shape: assigned at provision from the slugified
business name, short discriminator on collision, freely changeable afterwards.
What is not settled and needs to be:

- **Uniqueness is global across the apex** ([[DOC-45]] §2 form C) — so
  allocation needs a real uniqueness constraint in the database, not an
  application-level check. Two concurrent provisions of "Alice's Plumbing" must
  not both win.
- **Changing a label leaves the old one behind.** A customer who has put
  `alice.1stc.site` on a van and then renames wants the old label to keep
  working. Recommendation: old labels are retained as redirects to the current
  one and are **never re-issued to anyone else**, because re-issuing means
  inheriting whatever reputation and inbound links the previous holder built.
- **Squatting.** Labels are free and unlimited signup makes them free at scale.
  Some rate limit or verification gate on allocation, even a weak one.
- **[[DOC-45]] §11 item 4** — per site or per business — is still open and this
  work needs the answer. §3 of that document says a host names a site, which
  implies per site.

## 4. What happens to the label once a custom domain lands — [decide]

[[DOC-45]] §4 says a site has exactly one address, on its own host. Taken
straight, that means form C **301s to form D** the moment D is live, and the
label persists forever as a stable fallback rather than as a second live address.

Recommend adopting exactly that, for three reasons:

- serving identical bytes on two hosts is duplicate content and splits whatever
  search authority the customer accumulates, on the front door of their business;
- the label is the address that was on the van before they bought the domain, so
  it cannot simply stop resolving;
- and a permanent redirect is the only form that is both honest about which
  address is canonical and safe to have printed on something physical.

The falsifier is a site reachable on both C and D with 200s on each.

## 5. Registration hygiene — [op]

- Registrar lock on, auto-renew on, and **not** on a card that expires soon.
  This domain is the address of every customer site until they buy their own;
  losing it is not a recoverable event.
- WHOIS privacy on.
- Registered to the company, not to a personal account, with recovery that does
  not depend on one person's mailbox.
- Wildcard `A`/`AAAA` and wildcard certificate for `*.1stc.site` — one record
  and one cert, per [[DOC-45]] §9. Note a wildcard cert covers exactly one
  label depth, so `a.b.1stc.site` is not covered; worth knowing before someone
  proposes nested labels.
- CAA record on the apex restricting issuance.

## 6. The `.site` reputation tax is now ours — [decide], then monitor

[[DOC-45]] §9 recorded that `.site` sits on higher-abuse-rate TLD lists that
some spam filters and reputation services weight against, and called it "a small
but real tax" on a business whose site is their front door. That call is made
and this ticket does not reopen it — but it has a consequence worth stating:
the tax is now **shared across every customer on the apex**, so one abusive
label degrades everybody.

Two things follow, both for the monitoring epic rather than here:

- reputation of `1stc.site` is a thing to watch, not assume;
- and it is a further argument for the abuse revocation in §2, because the
  damage is not contained to the offender.

## Done when

- `1stc.site` is submitted to the PSL private section and the PR is linked here
- registrar lock, auto-renew, WHOIS privacy and company ownership are confirmed
- wildcard DNS, wildcard certificate and a CAA record are in place
- the reserved-label groups in §2 exist as a list in code, with a revocation path
- label allocation has a database-level uniqueness constraint
- §4's redirect behaviour is recorded as a decision, and [[DOC-45]] §11 items 2
  and 4 are closed or restated
