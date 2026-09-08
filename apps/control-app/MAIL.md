# Sending mail — Resend, and the DNS that makes it arrive

[[REQ-196]]. The code is `src/mail.ts` and takes about a minute to read. **This file is
the other half, and it is the half with waiting in it**: three DNS records on
`1stcontact.io` that decide whether what we send is delivered or binned. It is an
operator task rather than a coding one, which is exactly why it is written down beside
the Worker instead of being discovered on the day the beta was supposed to start.

## Why a provider at all

Two facts, and neither is negotiable from inside a Worker:

- **Workers have no SMTP.** There is no outbound port 25, so sending is always an HTTPS
  call to somebody else's service.
- **Cloudflare's own `send_email` binding cannot do it.** It delivers only to addresses
  already verified in the account, which is precisely the set an invitee is not in. It is
  the obvious-looking answer — free, already in the platform — and it does not work for
  the one case we need.

**Resend** is the provider: the least work inside a Worker, and a free tier that covers
the beta. It is behind a port (`SendEmail`) so that stays a reversible decision —
deliverability reputation is the kind of thing that becomes a reason to move to Postmark,
and when it does the change should be one adapter and no call sites.

## The two adapters

| | selected when | sends | returns |
|---|---|---|---|
| Resend | `RESEND_API_KEY` is set | yes | the provider's message id |
| local | it is not | **no** — records in memory, logs a line | `local_<random>` |

**The credential is the switch, and nothing else is.** No mode var, no `NODE_ENV`, no
"is this a test" predicate — every one of those is a thing that can be set wrongly, and
the cost of setting one wrongly is a fixture mailing a real person on the beta list. A
laptop and a test runner do not hold a Resend key; a deployment does.

Both adapters return a `providerId`, and that is not symmetry for its own sake: it is the
join key a delivery or bounce webhook comes back on ([[REQ-198]]), so the record path has
the same shape in a test as in production.

## Setting it up

### 1. The credential

```bash
export RESEND_API_KEY='re_...'   # from your password manager
bin/deploy
```

`bin/deploy.d/secrets/20-resend-api-key` pushes it into `wrangler secret`, where it is
write-only — the dashboard shows the name and never the value. It is never in
`wrangler.toml`, never in this repository, and a UAT asserts both.

Once it is in place nothing needs exporting: a later deploy reads the name back off the
Worker and leaves the value alone. Supplying a value again is how a **rotation** is
expressed.

Until it is in place the deploy **warns and continues**, and says what the deployment
will do instead (record, and deliver nothing). It warns rather than aborts because
nothing sends yet and the DNS below has waiting in it; that stops being the right answer
the moment a route can send ([[REQ-197]]).

### 2. The sending domain — the long pole

`1st Contact <no-reply@1stcontact.io>` is the FALLBACK From address (`MAIL_FROM` in
`wrangler.toml`, declared on both sides because a named environment inherits no vars). A
message template may name its own address and the invite does — see §3 below
([[REQ-205]]). Both are on `1stcontact.io`, so the DNS below covers them together.

The display name is part of the value, in RFC 5322 `Name <address>` form: an anonymous
From is most of what makes a message from a domain with no reputation look like phishing
to a filter.

For mail from these addresses to be **accepted rather than binned**, three DNS records
must exist on `1stcontact.io`:

| Record | What it says | Without it |
|---|---|---|
| **SPF** | a TXT record naming who may send as this domain | receivers have no reason to believe Resend may |
| **DKIM** | a public key in DNS, whose private half signs each message | a recipient cannot prove the message was not forged |
| **DMARC** | what a receiver should do when the first two fail, and where to report | the first two are advisory |

In practice:

1. Add `1stcontact.io` as a domain in the Resend dashboard.
2. Paste the records it gives back into Cloudflare DNS for the zone.
3. Press verify, and wait for propagation.

None of this is code and all of it is blocking, which is why it decides when the beta can
start rather than when the ticket is finished.

### 3. Replies, and the per-template address

Replies to `no-reply@` go nowhere, by design — and that is now a statement about THAT
address rather than about every message ([[REQ-205]]).

The sending address belongs to the **template**, with `MAIL_FROM` as what a template
naming none means. `MAIL_FROM` was deployment-wide, so there was exactly one address for
the invite, the sign-in link and the lapse notice alike; setting it to `invite@` would
have sent sign-in links from `invite@` too.

| Template | Sends from |
|---|---|
| `invite` | `1st Contact <invite@1stcontact.io>` — a mailbox somebody reads |
| `signin` | `MAIL_FROM` |
| `lapsed` | `MAIL_FROM` |

The invite is repliable because a reply is one of the strongest positive engagement
signals a recipient can produce, and somebody *will* reply to an invitation. That makes
one thing **operator work rather than code, and blocking**:

> **`invite@1stcontact.io` must receive.** A Cloudflare Email Routing rule to a real
> mailbox. A repliable address that bounces is worse than `no-reply@`.

It is a field on the template ticket, so changing which address a message comes from is
an edit rather than a deploy. It is **not operator-editable per send**: the invite modal
displays the address and refuses to take an edit, and the route does not read a `from`
off the POST — an operator-set sender fails DKIM and lands in spam.

### 4. What a message looks like to a filter

Authentication is not reputation. SPF, DKIM and DMARC prove a message was not forged;
they say nothing about whether it is wanted, and a filter with no history for a domain
falls back to what the message looks like. A real invite from here passed all three and
went to spam.

So every message carries **both an HTML part and a plain-text part** ([[REQ-205]]).
HTML-only is among the most commonly weighted heuristics. The text part is **derived from
the HTML rather than authored** — one body is still written — and every URL in an `href`
survives into it, because a text alternative that has lost the only link is worse than
none.

Two things remain deliberately out of scope:

- **`List-Unsubscribe`.** Required by Gmail's bulk-sender rules, incoherent on a sign-in
  link the recipient asked for thirty seconds ago. It becomes right if this platform ever
  sends marketing mail, which belongs on a separate subdomain with separate reputation.
- **Moving to Postmark.** The port exists so this is one adapter and no call sites, and it
  stays the answer if the changes above do not move placement. It is not a first move.

## Local development

`wrangler dev` has no `RESEND_API_KEY`, so it runs the local adapter and prints a line per
message:

```
[mail] not sent (no provider configured): to=someone@example.com subject=…
```

That line is the point. A development builder that silently swallowed every message would
reproduce locally the exact failure this whole ticket exists to remove — a feature an
operator assumes exists and does not check.
