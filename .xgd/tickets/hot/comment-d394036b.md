---
uid: comment-d394036b
id: COMMENT-2139
type: comment
title: Comment on request REQ-168
created_by: xgd
created_at: '2026-09-02T20:24:25.288422+00:00'
updated_at: '2026-09-02T23:31:27.002400+00:00'
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

<!-- xgd-chat-end -->