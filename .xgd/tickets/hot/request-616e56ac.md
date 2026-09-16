---
uid: request-616e56ac
id: REQ-257
type: request
title: 'The DNS layer: zones, the Cloudflare client, the external resolver, and the
  operator backfill'
created_by: EPIC-5
created_at: '2026-09-16T03:35:39.898551+00:00'
updated_at: '2026-09-16T04:18:35.369678+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2e7edd79
  commits:
  - working_sha: 73cf72607a274b879624b6da14495763c688bc3e
    reconcile_sha: null
    main_sha: null
  - working_sha: d2fce8effb33aa5341f9799b8abdfee1fdbe54a2
    reconcile_sha: null
    main_sha: null
  version: 0.2.217
---

## What this is

**The DNS layer, and nothing that uses it.** A `zones` table, a Cloudflare API
client, a resolver that reads live DNS from outside, and the operator backfill
that attributes the zones already in the platform account.

No customer sees anything this ticket builds. It is the floor the other three
stand on, and it is separated out because all three need it and none of them
needs the others.

## What exists today

**Nothing, and that is verified rather than assumed.** There is no Cloudflare API
client anywhere in the repo — `api.cloudflare.com` appears only in
`tools/generate/src/cli/kb.ts`, which is Workers AI for the knowledge base and
shares no credential, no client and no concern with zone management. There is no
zone concept, no record model, and no external resolver.

What does exist and is not to be rebuilt:

- `newId` (`tools/generate/src/store/ids.ts:38`) — 128 bits from a CSPRNG behind
  a type prefix, per [[REQ-190]]. `zones.id` is `zon_…` from this and never a
  Cloudflare id.
- The migration discipline in `db/migrations/0008_site_domains.sql` — a new file
  rather than an edit, because `wrangler d1 migrations apply` records what it has
  run and an edit reaches neither database. Next number is `0010`.

## `zones`

```
zones(
  id,               -- `zon` prefix, per [[REQ-190]]
  account_id,       -- NULL means unattributed, which means selectable by nobody
  apex,             -- UNIQUE
  cf_zone_id,       -- Cloudflare's, for API calls
  assigned_ns,      -- the pair we showed them
  origin,           -- 'registered' | 'nameserver' | 'operator' | 'platform'
  status,           -- 'pending' | 'active' | 'released' | 'revoked'
  claimed_at, activated_at
)
```

**Account-scoped and not business-scoped.** `entitlements` is account-scoped
because payment is an account concern, and a domain is a thing somebody paid for.
A business is where sites live; an account is where money and assets live. The
pool is the account's; the assignment lands in a business.

**`origin` is written once, at the moment the zone arrives, and is never derived.**
Cloudflare cannot tell us who a zone belongs to — in its model every zone in the
account is equally ours, which is the whole point of the arrangement. The
association is a fact we record and the only reliable source is how the zone got
there. A zone whose origin was inferred by reading anything back from Cloudflare
is a falsifier below.

**`status` mirrors Cloudflare's rather than inventing a parallel one.** Cloudflare
already runs the state machine — `pending` until the nameservers point at the
assigned pair, `active` once it observes that they do. A second, independently
computed notion of activeness is a second thing that can be wrong, and the one
that would be wrong is ours.

**`apex` is UNIQUE and that index is the authority**, on the same reasoning
`0008`'s unique index on `host` is: Cloudflare allows one zone per apex per
account, so a second claimant meets a refusal that came from the database rather
than from a check that raced.

## The Cloudflare client — the write half

One module, one token, and the operations are enumerated rather than a generic
passthrough:

- list zones in the account
- read a zone (id, status, assigned nameservers)
- create a zone, delete a zone
- list, create, update, delete DNS records within a zone
- create and delete a Worker route

**The token is a secret binding and is scoped to exactly those.** `Zone:DNS:Edit`
and `Workers Routes:Edit` on the account, and nothing else. It is never in
`wrangler.toml` — see that file's own rule for `TURNSTILE_SECRET`.

**Absent binding means refuse, not degrade.** The same fail-closed rule
`lead.ts` and `gate.ts` already follow: a deployment with no Cloudflare token
manages no zones; it does not manage them optimistically and reconcile later.

## The resolver — the read half, and it is the half three other tickets want

Reading live DNS **from outside**, against a domain's *current* authoritative
nameservers rather than against our own zone. This is what answers *"is there a
live business on this domain today"* — the question the epic identifies as the
one that actually decides the work.

- resolve `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS` for a name
- **probe DKIM selectors by name, because they are not enumerable over DNS.**
  `google`; `selector1`/`selector2` for Microsoft 365; `k1` for Mailchimp;
  `s1`/`s2` for SendGrid; `resend` for ours. A missed selector breaks signing
  silently and the symptom arrives weeks later as *"our email goes to spam"*.
- classify what it finds into *whose* it is — the provider names a customer can
  recognise, which is what makes *"your email is with Microsoft"* sayable.

**It is built here and consumed in three places**, and that is a deliberate
departure from [[EPIC-5]]'s claim that the propagation suppression window is the
only thing crossing an epic boundary: ticket C's pre-attach check, ticket E's
assistant tools, and [[EPIC-7]]'s check engine all need exactly this and must not
each grow their own. The epic body is amended accordingly.

## The backfill, and why it is not a flow

The operator's own domains are already in the platform Cloudflare account and are
already active. **So the trap case does not apply to them** — no deletion, no
re-add, no reassigned nameserver pair, no downtime window. Their association with
an account is a backfill: an operator names the account, the row is written
`origin = 'operator'`, `status` mirrors Cloudflare's. A human decision, recorded.

## Two guards, both default-closed and both in code

**`1stc.site` and `1stcontact.io` must be permanently unattributable.** They live
in the same account and appear in any naive zone listing. `1stc.site` in
particular carries *every* customer's platform hostname, so attributing it to one
account would hand that account the whole namespace. This is an explicit refusal
against `origin = 'platform'` — not a convention an operator is trusted to
observe, and not a list an operator maintains.

**A zone with no `account_id` is selectable by nobody.** Default closed, which
also buys the drift check below.

## The drift check

List Cloudflare's zones, diff against this table. Anything present there and
absent here is either a platform zone or a mistake. **Somebody adding a zone by
hand in the dashboard is a thing that will happen**, and the alternative to
noticing is a zone nobody can offboard because nothing recorded how it arrived.

Operator-facing output. No automatic reconciliation — the whole point is that
`origin` is a human decision and the drift check is how a human is asked to make
one.

## Not in scope

- **The claim flow** — creating a zone on a customer's say-so, the assigned pair,
  the 14-day expiry of a `pending` claim. That is the nameserver on-ramp, parked
  with ticket D.
- **Serving anything on a zone** → ticket B.
- **Any customer-facing surface** → ticket C.
- **Record templates, SPF merging, `_dmarc` rules** → ticket E. This ticket can
  write a record; it holds no opinion about which records are safe.
- **Buying, transferring, renewing** → [[EPIC-6]].
- **Whether records are still correct tomorrow** → [[EPIC-7]].

## Falsifiers

- A zone attributed to an account by reading anything back from Cloudflare rather
  than from the provenance recorded when it arrived.
- Any path that can attribute an `origin = 'platform'` zone to an account.
- A zone with `account_id` NULL returned by any selection query.
- A second, independently computed notion of whether a zone is active.
- A generic Cloudflare passthrough — a method that takes a path and a body.
- The API token present in `wrangler.toml` rather than as a secret.
- A deployment with no token that writes zone state anyway.
- A DKIM check that enumerates rather than probing known selector names.
- A second external-DNS reader in ticket C, ticket E or [[EPIC-7]].
- `zones.apex` without a unique index.


---

## Implementation decisions, 2026-09-15

Taken in the free-coding session. Nothing above is withdrawn; what follows is
where the ticket's shape met the code, and the places the answer was not obvious
from the ticket alone.

### Two new deployment keys, and they are deliberately NOT the embedder's pair

`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` already exist in this
deployment: `embedder.ts` reads them as the REST transport for Workers AI
([[BUG-73]]), `.dev.vars` carries the account id commented out, and that pair is
BOTH-OR-NEITHER — half of it is a `PartialAiCredentialError` at boot. Reusing
either name for zone management would be wrong twice over. It would put a
Workers-AI token where a `Zone:DNS:Edit` token is needed, and declaring the
account id in `wrangler.toml` so production could see it would hand
`transportFor` half a credential and break the project knowledge base on a
deployment that had never asked for REST.

So the DNS layer carries its own credential, under its own name:

- **`CLOUDFLARE_DNS_TOKEN`** — a `wrangler secret`, pushed by
  `bin/deploy.d/secrets/40-cloudflare-dns-token`, scoped to `Zone:DNS:Edit` and
  `Workers Routes:Edit` and nothing else. Never in `wrangler.toml`; the existing
  credential scan fails the build if it ever is.

**And there is no second key**, because the account id is not configuration. A
zone object carries its own `account.id`, so the client reads it from the zones
the token can already see and memoises it. That is one fewer value to get wrong,
it cannot drift from the account the token actually reaches, and it keeps this
ticket's *"one module, one token"* literally true. An account with no zones at
all cannot have one created into it; that is named as its own refusal rather than
left to a confusing API error, and it is unreachable for this deployment, which
has at least the two platform zones.

### The resolver reads over DNS-over-HTTPS, because there is no other way out

`fetch-guard.ts` already records the constraint this runs into: *"workerd cannot
resolve a name before fetching it."* There is no UDP from a Worker and no
resolver API on the platform, so reading live DNS means an HTTPS query to a
public recursive resolver — Cloudflare's `cloudflare-dns.com/dns-query`, over the
`application/dns-json` interface.

**That is still reading from outside, which is the property this ticket asks
for.** A recursive resolver follows the domain's delegation to its *current*
authoritative nameservers; nothing about the zone being in our own Cloudflare
account short-circuits it, and nothing here reads the zone back through the
Cloudflare API. What it costs is cache latency — a recursive resolver answers
with what it last saw, within TTL — and that is the correct answer anyway, since
what a snapshot wants to record is what the world currently resolves.

**The transport is injected, not configured.** `resendMailer(apiKey, fetchImpl)`
is the shape already used for an external HTTP dependency, and it is what lets a
UAT drive real DKIM probing and real provider classification against a scripted
resolver rather than against whatever `example.com` happened to publish today.

### The operator surface is three admin routes, not a CLI command

The backfill and the drift check both need the D1 binding and the Cloudflare
secret, and both live inside the Worker. `/api/admin/businesses` is the existing
precedent for an operator action with no self-serve counterpart, down to the
refusal: `ownsPlatformBusiness`, and a 404 rather than a 403, because an
unprivileged caller asking whether an administrative surface exists is owed
nothing.

- **`GET /api/admin/zones`** — every recorded zone, plus the drift report: what
  Cloudflare has that this table does not, what this table has that Cloudflare
  does not, where the two disagree about status, and which rows are unattributed.
  It writes nothing. An unrecorded zone is tagged as a platform apex or not,
  which is the *"either a platform zone or a mistake"* distinction made legible
  rather than left to the reader.
- **`POST /api/admin/zones`** — the backfill. The operator names the apex and an
  account by email; the row is written `origin = 'operator'`, `status` read from
  Cloudflare, `assigned_ns` read from Cloudflare. The **account** comes from the
  operator and never from Cloudflare, which is what the falsifier is about.
- **`GET /api/admin/dns?domain=…`** — the resolver, as a real entry point. It
  answers *"is there a live business on this domain today"* for an operator, and
  it is what makes the resolver provable end to end rather than only as a
  function.

### `released` and `revoked` are declared and not implemented

Exactly as `AddressKind`'s `custom` is in `hostname.ts`. Release is ticket C's
control and a `pending` claim's 14-day expiry is ticket D's; both write a status
this column already admits. What this ticket owes them is that the column is
there and that every question is asked over the status rather than over a
boolean, so neither lands as a migration.

### What the resolver classifies, and why the lists are tables rather than logic

`snapshot(domain)` resolves `A`, `AAAA`, `CNAME`, `MX`, `TXT` and `NS` on the
apex, `A` and `CNAME` on `www`, and probes the DKIM selectors by name. It then
names, in words a customer would recognise, who their **mail** is with (from MX),
who their **web** is with (from the apex or `www` answer), and who else **sends**
as them (from SPF `include:` tokens) — plus every DKIM selector that answered,
with the provider whose selector it is.

Each of those is a declared table of `{ pattern, provider }`, not a chain of
conditionals, because the failure mode is a provider nobody added rather than a
rule nobody got right — and a table says plainly what is known and therefore what
is not. An unrecognised host is reported as the host, never as `null` dressed up
as an absence: *"your mail is at `mx.example.net` and I do not recognise it"* is
usable and *"you have no mail"* is dangerous.

`live` is the summary the epic's gate wants — mail or web answering — and it is
computed here and gated elsewhere, which is the surface/capability split the
epic's sibling table states.

### Two things this ticket touches that it did not name

- **`db/migrations/0010_zones.sql` is added to the test fixture's migration
  list.** `tests/support/d1-site-factory.ts` applies the real migration files
  rather than restating a schema, so a file absent from that list is a schema the
  suite cannot see.
- **`RouterEnv` gains the token and `RouterDeps` gains two seams** — the
  Cloudflare client and the resolver — for the reason every other external
  dependency in that interface is injectable: a UAT asserting what the backfill
  wrote should not have to reach a metered API to find out.

### Falsifiers, extended

- The zone client exposing any method that takes a path.
- `CLOUDFLARE_DNS_TOKEN` in `wrangler.toml`, in either environment.
- `CLOUDFLARE_ACCOUNT_ID` or `CLOUDFLARE_API_TOKEN` read by anything in the DNS
  layer — they are the embedder's, and sharing them re-creates the both-or-neither
  trap in a module that has no opinion about Workers AI.
- A DKIM answer reported without the provider whose selector it is.
- An unrecognised mail or web host reported as an absence rather than as a host.


---

## What the build settled, and why each of these is in the evidence

Written after the code and the UATs, because each of these is a behaviour the
tests pin and the sections above did not yet motivate. Several are technical
consequences of what this ticket asked for rather than things asked for
directly; they are recorded here so the matrix has language for them.

### The zone token is scrubbed out of everything the Worker says

`router.ts`'s `secretsOf` is the list [[REQ-146]] AC4 redacts from every message
this Worker emits, and `CLOUDFLARE_DNS_TOKEN` joins it from the day it exists.
It is the most damaging of the four to leak — it can rewrite the DNS of every
domain this deployment manages, including the MX records that carry a customer's
mail — and it travels exactly the path that class of leak arrives by: the client
repeats **Cloudflare's own words** in its refusals, and the zone routes return
them, so a message a person is shown is composed from a reply to a request that
carried the token.

Every new error path out of the router goes through `scrub`, including the ones
with nothing in them to scrub, on the reasoning that file already records: a path
that scrubs beside a path that does not is an invitation to add a third that does
not.

### A web host that names its provider wins over one that does not

The resolver reads the apex first, because the apex is the address the business
is known by. But the commonest live shape in this product's market is an apex `A`
record pointing at a builder's anycast address with the `CNAME` that *names* that
builder sitting on `www` — so reading the apex and stopping answers
*"198.185.159.144, provider unknown"* for a site that is unmistakably on
Squarespace, and the sentence the customer needs to hear is the one that names
it. **The host reported is always the one the provider was read from**, so the
pair never disagrees with itself.

### A partial zone listing is a refusal, not a first page

`listZones` does not paginate, and a full page is an error naming what it could
not see. A silent first page is worse than either answer: the drift check's whole
value is the diff, and a diff against a truncated upstream list reports every
zone past the cut as unrecorded. Fifty zones is a deployment well past the point
where an operator report is the right surface anyway.

### Not-there and not-allowed arrive differently

A 404 on a zone read is an **answer** — `null`. Every other refusal, a 403
included, propagates. The two lead to opposite actions: the backfill would
otherwise report *"not in the account"* for a permissions problem, and an
operator would go and add a zone that is already there.

### Records are replaced, never merged, and carry no TTL this deployment invented

`updateRecord` is a `PUT`. A record is replaced wholesale, so what is written is
exactly what the caller described — a `PATCH` would leave whatever it did not
mention in place, and [[REQ-260]]'s job is to write a known record set rather
than to merge with one it did not read. The default TTL is Cloudflare's
`automatic`, because a number this deployment picked would be one nobody chose
deliberately.

### A `_domainkey` name carrying something else is not a DKIM key

The name may hold other `TXT`. Reporting one as a key would tell a customer their
signing is set up when it is not, which is the same silent, delayed failure the
selector probing exists to prevent — so a probe only counts as a key when the
record actually carries one (`p=`, or `v=DKIM1`).

Likewise **only a `v=spf1` record contributes senders.** A domain's `TXT` set is
a junk drawer of verification tokens and ownership proofs, and an `include:` in
one of those is not an SPF include.

### `activated_at` is written once and never cleared

It records that this zone **has** served, which stays true after a later status
change. A zone that goes `active` and is then revoked still has, and that is what
an offboarding path and a support conversation both want to know.

### The unique index on `apex` is not partial on status

Unlike `0008`'s partial index on `site_domains`. A `released` zone is one
Cloudflare no longer holds, so the apex genuinely is available again — but the
row stays, and a re-claim meets this index. That is the correct refusal for now:
re-claiming an apex this deployment released is a support path with an operator
behind it, and the alternative would make `zoneByApex` return two rows and have
to pick one.

### An apex is normalised the way an operator actually types it

A pasted address is a likely input and not a refusal worth making: an operator
doing a backfill has almost certainly just been looking at the site, so
`https://alicesplumbing.com/` means the domain they mean. Scheme, path and
trailing dot are stripped; case is folded. **The platform-apex guard is applied
to the normalised value**, so it cannot be walked past by pasting a URL.

### The route's refusals keep their own status codes

They are four different things an operator does four different things about: a
platform apex is a rule they cannot argue with (403), an apex already recorded is
a decision somebody already made (409), an apex Cloudflare does not hold is a
step not yet taken (404), an API refusal is somebody else's problem (502), and a
deployment with no token is a configuration gap (503).

### The fixture's head marker moves with the list

`tests/support/d1-site-factory.ts` skips the whole migration list when the
database already holds what the **last** file leaves behind. Appending `0010`
without moving that marker would have left a database at `0009` answering *"at
head"* and silently skipping the new migration — which is the exact hole the
marker's own comment records having been opened once before. It now asks for the
`zones` table.