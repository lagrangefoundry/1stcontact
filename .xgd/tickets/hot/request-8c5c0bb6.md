---
uid: request-8c5c0bb6
id: REQ-168
type: request
title: The tenant comes from the identity, not from the configuration
created_by: xgd
created_at: '2026-09-01T00:51:05.648749+00:00'
updated_at: '2026-09-03T02:41:48.729905+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d394036b
---

# The tenant comes from the identity, not from the configuration

## The gap

`TENANT_ID` is a deployment variable. Every logged-in person is served the same
tenant, which means two onboarded users would edit each other's sites.

`store.ts` already names this ticket in its own header:

> Deriving the tenant from the verified Access claims is where this ends up —
> the gate already proves who the caller is (`access.ts`) — but that mapping is a
> piece of account modelling with no second account to model against yet. A var
> is the honest interim. Cross-tenant admin arrives with the ticket that needs
> it.

[[REQ-167]] supplies the second account and the mapping. This is that ticket.

**This is the critical path for onboarding.** Nothing else on the list is
load-bearing for isolation; without this, invites hand several people the same
tenant.

## The six reads — an earlier draft of this ticket counted four

`env.TENANT_ID` has seven mentions in `apps/control-app/src`. Six are reads and
four of those move behind the resolver. An earlier draft named four sites and
missed the one that matters most.

| Site | What it scopes | Disposition |
| --- | --- | --- |
| `store.ts:86` | the site store handle | moves to the scope |
| `tickets.ts:422` | **the whole ticket store** | **moves to the scope** |
| `knowledge.ts:632` | the project KB's R2 index prefixes | moves to the scope |
| `router.ts:121` | the `tenantId` handed to `workerHost` | moves to the scope |
| `identity.ts:388` | `requirePlatformTenant` — the *platform's own* business | **stays**; this is the legitimate meaning |
| `ai.ts:134` | declared on `WorkerAiEnv` and never read | vestigial; **delete the declaration** |
| `boot-guard.ts:85` | matches the string in an error body | not a reader |

`tickets.ts` is the omission that matters. Since [[REQ-160]] / [[REQ-162]] the
ticket store is where chat transcripts, uploaded material and the project corpus
live, so leaving it on `TENANT_ID` is exactly the "one site left behind" failure
this ticket's UAT is written against — quietly serving the platform business's
data into a customer's session.

A UAT asserts `env.TENANT_ID` has no remaining reader outside the resolver and
`identity.ts`.

The claim that "the plumbing beneath each already takes a `tenantId` parameter"
holds for `ai.ts` (`workerHost(env, store, tenantId, …)`) and `knowledge.ts`
(`indexPrefix(tenantId, …)`) but **not** for `store.ts` / `tickets.ts`, which read
the env *inside* the opener and are reached through the `RouterDeps.store` /
`.tickets` seams. So this is a signature change on four openers plus `route()`
itself: roughly thirteen direct `route(...)` call sites in tests, plus
`builder.ts:352`.

## The scope is one business, always — resolution takes a target

```ts
type Scope = { businessId: string }

resolveScope(env, identity, requestedBusinessId?): Promise<Scope>
```

There is **no platform-wide scope variant**, and an earlier draft of this ticket
was wrong to reserve one. [[DOC-40]] §7 now settles the parked operations
assistant as a *tenant-switching* design rather than a wide-scope one: it holds
one ordinary scoped handle at a time and changes which tenant that is. Nothing
in the system ever needs a handle that spans tenants, so declaring the variant
would reserve a shape that is not going to be built.

**No discriminant, and the field is named.** A previous draft wrote
`{ kind: 'tenant'; id: string }`. A single-variant discriminated union guards
against a second variant the paragraph above argues will never exist, while
leaving unguarded the mix-up that can actually happen now that [[DOC-40]] §2 has
split the account from the business: an account id and a business id are both
opaque strings, and `memberships.account_id` holds a *business*. Naming the field
`businessId` puts the type system where the live confusion is. For the same
reason the third parameter is `requestedBusinessId`, not `requestedAccountId`.

**Resolution takes an optional target.** Supplied, it authorises the caller
against that business and resolves it. Omitted, it falls back (see below). A UAT
asserts an unauthorised target is refused rather than silently falling back to
something the caller *can* reach, because a fallback turns an authorisation
failure into a confusing success in someone else's business.

**`forTenant` is not modified.** The tenant barrier stays structural: the site
store's root can still do exactly one thing, and the ticket store's scoped handle
stays terminal. The switch design's whole merit is that it reuses this check
instead of adding a second read path beside it — including its refusal of an
inactive tenant, which a new path would have had to re-implement.

## An account has several businesses ([[DOC-40]] §2)

[[DOC-40]] §2 splits the account from the business — one account, several
tenants — after this ticket was drafted. Three things change, and none of them
change the shape above.

**The optional target is the normal path.** The target was drafted as an
administrator's override ([[REQ-170]]) with the ordinary case being "the account
the membership names". With several businesses there is no such thing as *the*
account: the target is supplied on ordinary requests, by the switcher
([[REQ-179]]). The signature was already right; what changed is that the argument
is routinely present and the no-target branch is a fallback rather than the main
line.

**Resolution authorises against a set, and never through `accountFor`.**
`accountFor` (`identity.ts:342`) returns the first membership by `granted_at`
with `LIMIT 1`. That is deterministic today because provisioning creates exactly
one, and its own comment says a nondeterministic answer to "whose builder am I
in" is the worst possible way to discover otherwise. It stops being safe the
moment either [[REQ-178]]'s set or [[REQ-170]]'s time-boxed support grants exist,
so this resolver authorises against [[REQ-178]]'s admission list and must not be
built on `accountFor`'s singular answer. A target the account holds no live
membership for is refused; a target whose entitlement has lapsed is refused
*separately*, because those are different things to tell someone.

**The no-target fallback needs a stated rule.** A request arriving without a
target — first load, a bookmarked deep link, an API caller — resolves to the
operator's last selection if it is still admissible, and otherwise to the first
admissible business. Never to `env.TENANT_ID`. (The one place `TENANT_ID` *is*
the answer is the dev-open branch below, which is not this branch: it has no
identity to resolve from at all.)

**Who carries the target.** [[REQ-168]] defines the wire form and reads it,
because it is the consumer; [[REQ-179]] sends it from the switcher and
[[REQ-180]] supplies the endpoint that populates one. The fallback above is what
lets this ticket land and be correct before either of those ships.

## What `TENANT_ID` becomes

It names the **platform's own business** — where `users` rows for builder users
live, and where the admin console operates. It stops being the answer to "whose
site am I editing". It keeps failing loud when unset, for the reason `store.ts`
records: a defaulted tenant id is a misconfigured Worker with write access to
whichever account happens to carry that name.

## Threading: an explicit `Scope`, not a rewritten env

`index.ts:123` already runs `admit(env, gate.email)` on every request and gets
back the membership-resolved, entitlement-checked account — and line 127 calls
`route(request, env)` and discards it. [[REQ-167]] did the hard work; the gap is
one value that never leaves the `fetch` handler.

That makes a three-line diff tempting: rewrite `{ ...env, TENANT_ID: resolved }`
once in `fetch` and change nothing downstream. It is rejected on three counts. It
keeps "one tenant per deployment" alive in the type system. It silently breaks
`identity.ts`'s platform lookup if identity is ever consulted inside a route,
because `requirePlatformTenant` would then read a customer's id. And it makes
this ticket's own UAT unenforceable, since every reader still reads — the
assertion above is unwritable under it.

So: thread an explicit `Scope`, and **delete `TENANT_ID` from `StoreEnv`,
`TicketStoreEnv`, `ProjectKnowledgeEnv` and `WorkerAiEnv`**, leaving it declared
only on `IdentityEnv`. The wider diff is the point: it makes the mistake
unrepresentable rather than merely absent.

## The chat host is per isolate, and that is the live leak

`router.ts:112` — `let CHAT: Promise<WorkerHost> | null` — is a module-level
singleton holding a site store, a ticket store and an opened project KB, all
bound to whichever tenant made the **first** chat request in that isolate. Today
that is harmless, because there is one tenant. The moment scope comes from
identity it is a cross-tenant leak: a second caller sharing that isolate runs
`/api/ai/prompt` against the first caller's store, transcripts and KB vectors.

Under [[DOC-40]] §2 this is worse than it first looks. It no longer takes two
customers to trip it — one person switching between two of their own businesses
straddles the same isolate, so the leak is reachable by a single user in ordinary
use, not only under co-tenancy.

The comment above `CHAT` explains why it cannot simply become per-request: the
manager cache in `host-core.ts` is keyed by store *object identity*, so a fresh
store per request is a fresh conversation per request, and `KnowledgeRuntime.open`
decodes the whole index. The fix keeps that property and partitions it — key the
cache by scope, `Map<string, Promise<WorkerHost>>`, so reuse stays per-isolate
*within* a business and cannot cross one. `resetChatHost()` becomes a map clear.
Nothing upstream changes: `managerKey` already keys off the store object, so it
partitions for free once the store does. Unbounded growth is not a concern —
isolates are short-lived and the map dies with them.

A UAT drives two chat turns for two different scopes through one isolate and
asserts the second does not see the first's store, transcript or corpus.

## The resolver checks `tenants.status`

`admit` checks the person (`users.status`), the membership and the entitlement.
It does **not** check the business's own status. Today that is covered because
every ordinary request reaches `forTenant`, which refuses a deactivated tenant —
but a cached chat host does not, and the map above deliberately keeps caching.

So the check moves into the resolver, where it runs per request whatever is
cached: a join onto `tenants` in a query `admit` already makes. The alternative —
bounding the cache's life — buys a weaker guarantee at a higher cost and turns
the exposure window into a tuning parameter nobody can reason about.

## The dev-open branch: the scope is `TENANT_ID`

Roughly fifteen workers suites and `1c builder`'s Node transport
(`builder.ts:130`, `TENANT_ID: 'local'`) never call `admit` at all —
`isUnconfiguredLocalDev` skips the gate. They need a scope from somewhere, and
the honest rule is that **when the gate is bypassed, the scope is `TENANT_ID`**:
the platform business is the only account a loopback dev server has, and
`ACCESS_DEV_OPEN` already carries the two-independent-mistakes guard.

Two constraints make this safe. The fallback lives **inside the resolver**, so
the "no reader outside the resolver" UAT holds unchanged. And it is gated on the
*same* `isUnconfiguredLocalDev` predicate that skips the gate — not a second
condition that happens to agree today. Two predicates that can drift is how a
deployment ends up resolving a dev scope while enforcing a production gate, or
the reverse.

Test blast radius is small. The two suites that pass Access for real
(`req115-builder-shell`, `reconciliation-builder-workspace-origin`) already
`seedIdentity` and push fixtures in over `/api/import`, so they follow the
resolved scope self-consistently.

## Authorisation is re-checked on resume — mostly already true

An earlier draft of this section asked for a session to record its account and
for the resume path to re-run the membership and entitlement check. Two of the
three legs already exist:

- `admit` runs on **every** request, `/api/ai/prompt` included, so a membership
  that expired on Sunday is refused on Monday's next turn today.
- `slugForSession` resolves a session id through `deps.store.hasDraft(slug)`,
  which is tenant-scoped, so an id naming another business's site resolves to
  null.

What is actually missing is only the cached host above: the turn runs against a
store bound at isolate-warm time rather than against this request's admission.
Fix that and the resume requirement is met. The session does **not** need to
record its account — since [[REQ-160]] the chat ticket lives in the business's own
ticket store, so the account *is* where the transcript is.

That draft also described transcripts at `chat/<tenant>/<sessionId>.md`. That is
stale: [[REQ-160]] moved them into the ticket store, and the only remaining
tenant-keyed R2 path is `audit/<tenant>/<session>/…` in `ai.ts`.

A UAT opens a session, expires the membership, and asserts the resume is refused
rather than answered from the warm host.

## The platform admin bypass

A user with `platform_admin` set resolves a scope for any business without a
membership row. This is [[DOC-40]] §6 — ambient by design, so it works before any
membership exists and cannot lock its holder out.

The bypass is over the *membership* check only. It does not skip entitlement
(an admin operating an expired account should see what the customer sees), it
does not skip the `tenants.status` check above, and it does not grant platform
scope.

## Migration: bind the operator to the existing `1stcontact` business

Every site today lives in tenant `1stcontact`. The moment scope comes from
identity, logging in resolves to a freshly minted `acct_…` and the builder looks
empty — this ticket breaks the live deployment unless it also repairs it.
`provisionInvite` (`identity.ts:204`) always mints `newId('acct')` and has no way
to attach a user to an existing business.

The repair is an **idempotent seed in this ticket's own migration**: the
operator's `users` row plus a membership on `1stcontact`, written
`WHERE NOT EXISTS` so it is safe to re-run and applies to preview and production
alike. It belongs here because it is this ticket that breaks the thing.

It is deliberately **not** an `accountId` option on `Invite`. That is the seat
capability — a second person joining an existing business — which [[DOC-40]] §9
leaves undefined and [[REQ-170]] owns. Adding it here would be an unreachable
code path carrying no refusal, which is the same objection that would apply to
inventing a target transport before [[REQ-179]] needs one.

## Interaction with the knowledge-base work

`knowledge.ts` is being actively edited by [[REQ-158]] / [[REQ-159]] / [[REQ-160]].
The collision is textual, not conceptual: the KMS work is about *what the
assistant knows*, this is about *whose data it is*. The project KB is already
tenant-scoped by prefix ([[REQ-159]]), so per-business tenants need no change
there — each new business simply starts with an empty project KB and the shared
system KB, which [[DOC-40]] §2.3 records as the intended behaviour rather than a
cold-start defect.

Sequence this after the in-flight KMS tickets reconcile, or expect a small merge
in one file.

## Open

**Where the last selection is persisted.** The no-target fallback above resolves
to "the operator's last selection if still admissible". Nothing stores that
today. It is a one-column decision ([[REQ-178]]'s user row, or a cookie the
switcher sets) and it is [[REQ-179]]'s to make; this ticket reads whatever it
lands on and falls through to the first admissible business until it exists.


---

## Revision: the decisions this ticket had left open

Four things were unresolved when the revision above was written — how a target
reaches the Worker, where the no-target fallback gets its answer, what happens on
the path that has no identity at all, and what the vocabulary is. They are
settled here, against the code as [[REQ-178]] left it.

### The read table was wrong in two places

`env.TENANT_ID` is read in **five** places, not four, and one of the four listed
is not a reader at all:

| Site | What it scopes |
| --- | --- |
| `apps/control-app/src/store.ts` | the site store handle |
| `apps/control-app/src/tickets.ts` | **the ticket store** — transcripts, material, the project corpus |
| `apps/control-app/src/knowledge.ts` | the project KB's R2 index prefixes |
| `apps/control-app/src/router.ts` | the tenant handed to `workerHost`, which becomes the audit prefix |
| `apps/control-app/src/identity.ts` | **the platform tenant — this one stays** |

`ai.ts` was listed and reads nothing: `TENANT_ID` on `WorkerAiEnv` is vestigial
and is deleted, because `workerHost` already takes `tenantId` as a parameter. The
transcript archive named there moved into the ticket store with [[REQ-160]]; the
only surviving tenant-keyed R2 path is `audit/<tenant>/<session>/`.

`tickets.ts` is the omission that matters. Since [[REQ-160]] and [[REQ-162]] the
ticket store is where chat transcripts, uploaded material and the project corpus
live, so leaving it reading a var is exactly the one-site-left-behind failure the
UAT below exists to catch.

`TENANT_ID` is removed from `StoreEnv`, `TicketStoreEnv`, `ProjectKnowledgeEnv`
and `WorkerAiEnv`, and survives only on `IdentityEnv`. Rewriting the env in place
(`{...env, TENANT_ID: scope.id}`) would be a smaller diff and is rejected: it
keeps one-tenant-per-deployment alive in the type system, it makes `identity.ts`'s
platform lookup read the operated business if identity is ever consulted inside a
route, and it leaves every reader still reading, so the UAT below could not be
written.

### The target travels as a path prefix

The switcher sends a business on ordinary requests ([[REQ-179]]), so the Worker
needs a wire shape for it. It is a **path prefix**, `/b/<businessId>/…`, stripped
once at the top of `route()` before any route matches.

A header cannot work, and the reason is specific rather than aesthetic. Three of
`builder/api.js`'s functions do not fetch anything — they return a URL the
*browser* loads: `previewUrl` into an `<iframe src>`, `assetUrl` into the image
picker's `<img src>`, `materialFileUrl` into the Library's `<img>`/`<a>`. A
browser attaches no custom header to those, and there is no hook to make it.

A query parameter fails for a narrower reason that is worse. `/preview/<slug>/<channel>/`
serves the rendered page AND the page's own asset bytes, and the render emits
those references document-relative (`relativizeUrl`, [[REQ-109]]). A relative
sub-resource **drops the query string**, so every image inside every preview
would arrive unscoped and fall back — a preview of one business rendered inside a
chrome showing another. A path prefix is inherited by relative sub-resources by
construction, which is the whole reason it is the answer.

It is also cheap: `routeUncached` takes `url.pathname` once into `p` and every
route matches on `p`, so stripping the prefix there leaves the route table
untouched. `/builder/*` and `/webui/*` stay unprefixed — they are build artifacts
with no tenant, and the assets fall-through must not acquire one.

**The target is not a credential, and the ticket says so out loud.** Access
authenticates; resolution authorises the named business against the admission
list on every request. A forged or guessed id resolves to a refusal, never to
another account's data. That is what makes it safe in a URL, and it is precisely
what the unauthorised-target UAT proves.

### The no-target fallback is the first admissible business

The revision above said "the operator's last selection". That cannot be served:
[[REQ-179]] keeps the selection in `STORAGE_KEYS`, which is browser storage, and a
request with no target is by definition one where browser storage did not reach
the Worker.

Nor is it needed. `/` is answered at the top of the route table, above the store,
from a static `chromeHtml()` that takes no arguments — so the first load needs no
scope at all, and the first request that does need one is an API call the chrome
makes after reading its own storage. With the prefix above, a bookmarked deep
link carries its business too. What is left is a bare API caller.

So: **no target resolves to the first admissible business**, and the
returning-operator property stays where [[REQ-179]] put it, in the browser. Never
to `env.TENANT_ID` — with one stated exception below.

### The one path with no identity: unconfigured local dev

`index.ts` skips both the Access gate and `admit` when
`isUnconfiguredLocalDev(env)` holds. On that path there is no token, no verified
email and no `Admission`, so there is no admissible set for a fallback to choose
from. Ten whole-Worker suites take it, four more call `route()` directly and never
enter `index.ts`, and `1c builder`'s Node transport cannot call `admit` at all —
its `D1Database` is a `Proxy` that throws on every access.

So resolution takes an admission **or nothing**, and answers from `TENANT_ID` when
there is nothing. This is the last reader of that var outside `identity.ts`, and
it is inside the resolver, which is where the UAT permits it. It cannot open a
deployed Worker: `isUnconfiguredLocalDev` requires both Access vars empty and
`wrangler.toml` sets them, which is the same two-independent-mistakes guard
[[REQ-147]] put on `ACCESS_DEV_OPEN`.

### The chat host is scoped, and that is a leak fix

`router.ts` holds `CHAT` as one host **per isolate** — a site store, a ticket
store and an opened project KB, all bound to whichever business made the first
chat request. That is correct today with one tenant and becomes a cross-business
data leak the moment scope comes from identity: two customers sharing an isolate
share the conversation, the transcripts and the corpus. With a switcher it is
worse still — it goes stale for the *same person*, who switches business and
takes the next turn against the previous one's store.

It becomes one host **per business**, keyed by scope id. The per-isolate reuse
that the existing comment argues for is kept within a business and only there;
`resetChatHost()` clears the map. Nothing upstream changes, because
`host-core.ts` already keys its `SessionManager` cache by the store's object
identity, so it partitions as soon as the store does.

This is also the whole of the resume requirement. `admit` already runs on every
request including `/api/ai/prompt`, so an expired membership is refused on the
next turn today, and `slugForSession` resolves an id through the tenant-scoped
store so a session id cannot name another business's site. The session does not
need to record which business it operates on: since [[REQ-160]] the transcript is
a ticket in that business's own store, so the business *is* where the transcript
is. What was missing is only that the turn ran against a cached store rather than
this request's admission, which scoping the host fixes.

### A deactivated business must not be offered

`businessesFor` joins `tenants` with no `status` predicate, so a deactivated
business comes back `selectable: true` if its grant is live — and then `forTenant`
refuses it, `storeFor` rethrows, and the caller gets a 503. Invisible today with
one always-active tenant; with a switcher it is an entry that fails when clicked.
The predicate is added, so an inactive business is excluded from the admissible
set. `forTenant` is still not modified: it remains the structural check, and this
stops the list from offering something it will refuse.

### Account, business, tenant

**A business is a tenant** — one row, two vocabularies. `tenant` is internal and
never reaches a screen; *Business* is what a person reads ([[REQ-180]] §3). **A
site lives inside a business**: `sites` is keyed `(tenant_id, slug)`, so several
sites per business is already representable and is a later UI question
([[REQ-179]]), not a migration. Nothing here may assume one site per business.
**An account holds several businesses**, through `memberships`.

Two things the naming gets wrong, and new code does not repeat them:

- **There is no `accounts` table.** The account handle is the user id —
  `provisionBusiness(env, { accountUserId, … })` — so an account is a person
  today. Resolution needs no account row: it needs `businessesFor(user.id)`,
  which exists. Billing rollup to a payer is [[REQ-180]]'s question.
- **`account_id` holds a business id**, in `memberships` and in `entitlements`
  alike, and business ids read `acct_…`. So the drafted parameter name
  `requestedAccountId` names something that is not an account id.

New code therefore says **business**: `resolveScope(env, admission,
requestedBusinessId?)`, and `AdmittedBusiness.accountId` is renamed `businessId`
— a TypeScript rename with no migration behind it. **The SQL columns and the
`acct_` prefix are left alone**, on [[REQ-180]] §3's own argument: renaming a
column to match a word buys a migration for nothing, and ids are opaque,
permanent and present in R2 keys.

`Scope` is unchanged and stays `{ kind: 'tenant'; id: string }` — the value it
carries has always been a tenant id, and §7's argument against a platform-wide
variant is untouched.

### Acceptance

- No file outside the resolver and `identity.ts` reads `env.TENANT_ID`; a UAT
  asserts it over the source so a fifth reader cannot reappear unnoticed.
- Two businesses held by one person resolve to two different stores: a request
  under `/b/<A>/` reads A's sites and never B's, and the reverse.
- A target the caller holds no live membership for is **refused**, not silently
  resolved to one they do hold.
- A `platform_admin` resolves a scope for a business with no membership row, and
  is still refused a business whose entitlement has lapsed.
- A request with no target resolves to the first admissible business, and to
  `env.TENANT_ID` only when there is no identity at all (unconfigured local dev).
- An asset requested from inside a rendered preview is served from the same
  business as the page that referenced it.
- Two businesses driven through one isolate get two chat hosts: a turn taken in
  one appears in neither the other's transcript nor its corpus.
- A deactivated business is absent from the admissible set rather than present
  and 503-ing when it is chosen.
