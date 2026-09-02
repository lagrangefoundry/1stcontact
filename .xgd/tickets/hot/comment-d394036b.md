---
uid: comment-d394036b
id: COMMENT-2139
type: comment
title: Comment on request REQ-168
created_by: xgd
created_at: '2026-09-02T20:24:25.288422+00:00'
updated_at: '2026-09-02T23:33:08.188713+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8c5c0bb6
  kind: chat_transcript
---

<!-- xgd-turn id="b7ff9821-01f7-4122-bd90-4c2094bc503b-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:24:10.157986+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="b7ff9821-01f7-4122-bd90-4c2094bc503b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T20:29:53.087916+00:00" -->
#### Claude
## Findings — REQ-168

I read the four named files plus everything else that touches the tenant. Summary: the ticket is right about the shape of the change, understates the reader count by two, and misses the one place where this is a live cross-tenant leak rather than a refactor.

### 1. The resolved account already exists and is thrown away

`index.ts:123` runs `admit(env, gate.email)` on **every** request and gets back `admission.accountId` — the membership-resolved, entitlement-checked account. Line 127 then calls `route(request, env)` and discards it. REQ-167 did all the hard work; the gap is one value that never leaves the `fetch` handler.

### 2. Six readers, not four — and the missing one is the big one

| File:line | What it scopes | Verdict |
|---|---|---|
| `store.ts:86` | site store handle | move to scope |
| `tickets.ts:422` | **the whole ticket store** | **move — missing from the ticket** |
| `knowledge.ts:632` | project KB R2 index prefixes | move to scope |
| `router.ts:121` | `tenantId` → `workerHost` audit prefix | move to scope |
| `identity.ts:388` | the *platform* tenant (`requirePlatformTenant`) | **stays — this is the legitimate meaning** |
| `boot-guard.ts:85` | matches the string in an error body | not a reader |
| `ai.ts:134` | declared on `WorkerAiEnv`, **never read** | vestigial; delete |

`tickets.ts` is the omission that matters: since REQ-160/REQ-162 the ticket store is where chat transcripts, uploaded material and the project corpus live. Leaving it on `TENANT_ID` is precisely the "one site left behind" failure the ticket's UAT is written against.

The ticket's claim that "the plumbing beneath each already takes a `tenantId` parameter" holds for `ai.ts` (`workerHost(env, store, tenantId, …)`) and `knowledge.ts` (`indexPrefix(tenantId, …)`), but not for `store.ts`/`tickets.ts` — those read the env *inside* the opener, and the openers are reached through the `RouterDeps.store`/`.tickets` seams. So it's a signature change on four functions plus `route()` itself: ~13 direct `route(...)` call sites in tests, plus `builder.ts:352`.

### 3. The real hazard the ticket doesn't name: the chat host is per *isolate*

`router.ts:112` — `let CHAT: Promise<WorkerHost> | null` — is a module-level singleton. It holds a site store, a ticket store and an opened project KB, all bound to whichever tenant made the **first** chat request in that isolate. Today that's harmless (one tenant). The moment scope comes from identity, two customers sharing an isolate share that host: user B's `/api/ai/prompt` runs against user A's store, A's transcripts, A's KB vectors.

The comment above it explains why it can't just become per-request: the manager cache in `host-core.ts` is keyed by store *object identity*, so a fresh store per request means a fresh conversation per request, and `KnowledgeRuntime.open` decodes the whole index. The fix is to key the cache by scope id (`Map<string, Promise<WorkerHost>>`), which keeps the per-isolate reuse within a tenant and partitions across them. `resetChatHost()` becomes a map clear. Nothing upstream changes — `managerKey` already keys off the store object, so it partitions for free once the store does.

### 4. "Authorisation re-checked on resume" is mostly already true

The ticket asks for a session to record its account and for resume to re-run the check. Two of the three legs already exist:

- `admit` runs on every request, including `/api/ai/prompt`, so an expired membership is refused on the next turn today.
- `slugForSession` resolves a session id through `deps.store.hasDraft(slug)` — tenant-scoped, so an id naming another tenant's site resolves to null.

What's actually missing is only §3: the turn runs against a cached store rather than this request's admission. Fix §3 and the resume requirement is met. The session doesn't need to record its account — since REQ-160 the chat ticket lives in the tenant's own ticket store, so the account *is* where the transcript is.

Related: the ticket's `chat/<tenant>/<sessionId>.md` is stale. REQ-160 moved transcripts into the ticket store; the only remaining tenant-keyed R2 path is `audit/<tenant>/<session>/…` in `ai.ts`.

### 5. `admit` doesn't check the tenant's status

It checks user status, membership and entitlement. Account deactivation is enforced by `forTenant`, which an ordinary request hits — but a cached chat host wouldn't. Either the resolver checks `tenants.status`, or the cache in §3 has to be short-lived. Worth a decision.

### 6. Dev-open needs a defined scope

~15 workers suites and `1c builder`'s Node transport (`builder.ts:130`, `TENANT_ID: 'local'`) never call `admit` — `isUnconfiguredLocalDev` skips the gate entirely. They need a scope from somewhere. Cheapest honest rule: **when the gate is bypassed, the scope is `TENANT_ID`** — the platform tenant is the only account a loopback dev server has, and `ACCESS_DEV_OPEN` already carries the two-independent-mistakes guard. That keeps every existing suite green untouched, and it means `TENANT_ID` retains exactly one reader outside `identity.ts`: the resolver, which is where the ticket's UAT wants it.

Test blast radius turns out small. The two suites that pass Access for real (`req115-builder-shell`, `reconciliation-builder-workspace-origin`) already `seedIdentity` and push their fixtures in over `/api/import`, so they follow the resolved scope self-consistently.

### 7. Migration hazard the ticket doesn't mention

Every site today lives in tenant `1stcontact`. The moment scope comes from identity, you log in and resolve to your own `acct_…` — an empty builder. `provisionInvite` always mints a fresh `newId('acct')` and has **no way to invite someone into an existing account**. Something has to bind your user row to a membership on `1stcontact`: either a seeded row, or an `accountId` option on `Invite`. Without it, landing this ticket makes the live builder look empty.

### 8. Undecided: how a target account reaches the Worker

`resolveScope(env, identity, requestedAccountId?)` needs a transport for the target, and nothing in the codebase carries one. REQ-170's "Not in scope" explicitly excludes operating a customer's builder, so it isn't waiting downstream either.

Recommendation: **land the authorisation logic without a transport.** `resolveScope` takes the optional target, refuses an unauthorised one (never falling back), honours `platform_admin` over the membership check only — and the target is reachable only from code until REQ-170 or the parked switch tool decides on a header/cookie/path. That makes the ticket's UAT provable without inventing a URL grammar someone else may not want.

### 9. Shape recommendation

Thread an explicit `Scope` and **delete `TENANT_ID` from `StoreEnv`, `TicketStoreEnv`, `ProjectKnowledgeEnv` and `WorkerAiEnv`**, leaving it only on `IdentityEnv`.

The tempting alternative is a three-line diff — rewrite `{...env, TENANT_ID: admission.accountId}` once in `fetch` and change nothing downstream. It's wrong on three counts: it keeps "one tenant per deployment" alive in the type system; it silently breaks `identity.ts`'s platform lookup if identity is ever consulted inside a route; and it makes the ticket's own UAT unenforceable, because every reader still reads. The explicit parameter is a wider diff that makes the mistake unrepresentable.

---

Decisions I'd like before writing anything:

1. Explicit `Scope` parameter (§9) — or do you want the cheap env-rewrite despite the above?
2. Chat host cache keyed by scope (§3) — and does the resolver check `tenants.status` (§5)?
3. Dev-open falls back to `TENANT_ID` (§6)?
4. `requestedAccountId` with no transport in this ticket (§8)?
5. How do you want your own account bound to the existing `1stcontact` tenant (§7) — invite option, or a seeded membership?

<!-- xgd-turn id="49246999-9223-4661-9380-2ec44a60a1ca-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:31:26.297281+00:00" -->
#### You
PLease note the ticket changes

<!-- xgd-turn id="49246999-9223-4661-9380-2ec44a60a1ca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:33:07.584112+00:00" -->
#### Claude
Read it. The appended **Revision** section changes the dependency graph and invalidates two of my five open questions. Here's the delta against what I reported.

## What the revision changes

**REQ-168 now depends on REQ-178, which is `draft`.** The revision authorises against "[[REQ-178]]'s admission list", but `admit()` today returns a singular `accountId` (`identity.ts:246`) — and REQ-178's own acceptance criteria call that "the only place the one-business-per-account assumption is baked into shipped code." REQ-168 cannot read a set that nothing produces. Either REQ-178 lands first, or REQ-168 absorbs the `Admission`-returns-a-list change. That's the sequencing question the ticket doesn't state; everything else follows from it.

**My §8 is answered, and answered the other way.** I recommended landing `resolveScope` with no transport, on the grounds that REQ-170 explicitly excluded cross-account operation. Wrong now: REQ-179 says the switcher persists a selection client-side in `STORAGE_KEYS` and "sends it rather than deciding it — the server-side half, resolution accepting the target and authorising it, is [[REQ-168]]." So REQ-168 owns the wire contract, and the target is on ordinary requests, not an admin override. That needs deciding here: header vs query param vs cookie. A header is the only one that survives on `/preview/<slug>/…`, `/builder/*` and the SSE stream without rewriting every URL the chrome builds — but it also means the assets fall-through and the preview iframe have to carry it, which the iframe currently cannot.

**My §5 (tenant status) is partly settled and partly sharpened.** The revision requires refusing a lapsed entitlement *separately* from a missing membership — "those are different things to tell someone." That cuts against `DENIED_MESSAGE`'s one-message rule from REQ-167, but REQ-178 reconciles it: person-level refusals stay uniform, per-business ones are marked in the list. So the resolver's refusal of a *target* is a third category, and it needs its own answer shape.

## One contradiction worth resolving before any code

REQ-168's fallback rule and REQ-179's persistence model disagree about where the last selection lives.

- REQ-168: a request with no target "resolves to the operator's last selection if it is still admissible."
- REQ-179: the selection is client-side, per account, in `STORAGE_KEYS`.

A request arriving with no target — the ticket's own examples: first load, a bookmarked deep link, an API caller — is by definition one where localStorage didn't reach the server. The server cannot know the last selection unless it records one. `users.fields` is an untyped JSON bag that exists for exactly this (`0004_identity.sql`), so the natural fix is a server-side write on selection, with localStorage as the client-side fast path. But that's a write on the switcher path that nothing currently specifies, and it's REQ-168's to add if we take that reading. The alternative is to drop "last selection" from the fallback and go straight to "first admissible business," which costs the returning-operator property REQ-179 promises.

## The one place the revision's absolute rule collides with the code

> Never to `env.TENANT_ID`

That holds for the identity path. It cannot hold for the ~15 workers suites and the Node transport (`builder.ts:130`), which never call `admit` at all — `isUnconfiguredLocalDev` skips the gate, so there is no identity to resolve from and no membership list to fall back through. That's a distinct branch from the no-target fallback the rule is written about, so I read the rule as compatible: the dev-open scope comes from `TENANT_ID` *inside the resolver*, which is exactly where the UAT permits the last reader to live. Worth you confirming, because the ticket's wording is absolute and a UAT written to the letter would fail that branch.

## What stands unchanged from my earlier report

The revision explicitly says "the four reads and the UAT covering them are unaffected" — so these still need correcting in the body, since a UAT has to trace to ticket language:

- **`tickets.ts:422` is a fifth read and is missing from the table.** It scopes the ticket store: chat transcripts, uploaded material, the project corpus. Leaving it behind is the exact "one site left behind" failure the UAT is written against.
- **`ai.ts` is in the table but reads nothing** — `TENANT_ID` on `WorkerAiEnv:134` is vestigial, `workerHost` already takes `tenantId`. The actual read is `router.ts:121`, which the table also lists. And the transcript archive named there moved to the ticket store in REQ-160; only `audit/<tenant>/…` is still an R2 tenant path.
- **The isolate-level chat host (`router.ts:112`)** is still the sharpest edge, and the revision makes it worse rather than better: with a switcher, one operator changes business mid-isolate, so the cached host is stale for the *same person*, not just across people.
- **The migration hazard** (§7) is now REQ-178's `provisionBusiness` — an existing account needs a membership onto the existing `1stcontact` business, or the live builder resolves empty.

## Questions

1. Does REQ-178 land first, or does REQ-168 absorb the `Admission`-returns-a-set change? This decides whether the ticket is 3 points or considerably more.
2. Wire shape for the target — header, and if so how do the preview iframe and the assets fall-through carry it?
3. Last selection: server-side in `users.fields`, or drop it from the fallback in favour of first-admissible?
4. Confirm the dev-open branch may read `TENANT_ID` inside the resolver.

Once those are settled I'll update the ticket body — correcting the read table and adding language for the transport, the fallback rule and the chat-host scoping — before cutting the branch.

<!-- xgd-chat-end -->