---
uid: comment-d394036b
id: COMMENT-2139
type: comment
title: Comment on request REQ-168
created_by: xgd
created_at: '2026-09-02T20:24:25.288422+00:00'
updated_at: '2026-09-03T03:16:21.681183+00:00'
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

<!-- xgd-turn id="c10ce70a-d78a-4ae5-9003-5e8e2a34599a-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:31:49.392613+00:00" -->
#### You
REQ-178 has landed
2. I don;'t understand 
3. ?
4. I don;t know please read the code

<!-- xgd-turn id="c10ce70a-d78a-4ae5-9003-5e8e2a34599a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:33:52.341257+00:00" -->
#### Claude
Confirmed — `b1cafc80b7 feat(identity): an account operates several businesses, not one [FREE-CODED]` is in the tree. `Admission` is now `{ ok: true; user; businesses: AdmittedBusiness[] }` with no singular `accountId`, and `provisionBusiness` exists. `index.ts:123` still discards the whole admission, and silently — it never read `accountId`, so REQ-178's deliberate "deleting it turns every call site into a compile error" caught nothing here. That's the gap REQ-168 fills.

Now your three questions, from the code.

---

## 2. The transport — what the problem actually is

The switcher has to tell the server which business each request is for. The obvious carrier is an HTTP header, and for most of the surface that's one line: every JSON call goes through `builder/api.js`, ~12 functions, all taking a `fetchImpl` seam. One wrapper covers them all.

It doesn't work for three functions **in that same module**, because they don't fetch anything — they return a URL string the *browser* loads:

| `api.js` | consumer | element |
|---|---|---|
| `previewUrl()` :15 | `app.js:105,111` | `<iframe src>` — the preview pane |
| `assetUrl()` :51 | `image-picker.js:136` | `<img src>` — picker thumbnails |
| `materialFileUrl()` | `library.js:246` | `<img src>` / `<a href>` — Library files |

A browser will not attach a custom header to an `<iframe src>` or an `<img src>`, and there is no JS hook to make it. So with a header, those three arrive with no target and hit the fallback — and you get a preview of one business rendered inside a chrome showing another. Silent, plausible, wrong.

Three ways out:

- **(a) A cookie.** The browser sends it on iframe and img loads too, so `api.js` doesn't change at all. Costs: it's per-origin, not per-tab, so two builder tabs on two businesses overwrite each other; and it's ambient, which is the shape this codebase repeatedly argues against.
- **(b) Header for fetches, query param for those three.** Two mechanisms for one fact — the exact failure `router.ts`'s `NO_STORE` comment names: *"a per-HOST restatement is as forgettable as a per-route one."*
- **(c) A query parameter everywhere.** One line in a fetch wrapper, one line in each of the three URL builders. One mechanism, works in both shapes, per-tab not per-origin, and a deep link carries its own business — which is the case REQ-168's revision explicitly names.

I'd take **(c)**. It's the only one where "which business is this request for" has a single form.

---

## 3. Where the last selection is stored

The two tickets currently specify different systems, and they can't both hold:

- **REQ-168 revision:** a no-target request "resolves to the operator's last selection if it is still admissible."
- **REQ-179:** the selection "belongs with the existing `STORAGE_KEYS` namespacing" — `config.js:67`, browser localStorage.

A request with no target is *by definition* one where localStorage didn't reach the server. REQ-168's own three examples make that concrete: first load (the chrome document is fetched before any JS has run to read localStorage), a bookmarked deep link, an API caller. The server simply doesn't have the fact.

Two ways to close it:

- **(a) Record it server-side.** `users.fields` is an untyped JSON bag `0004_identity.sql` put there for precisely this — *"a per-user fact that is not worth a column and not worth a migration has somewhere to go."* Selection writes it; localStorage stays the client-side fast path. Costs REQ-168 a write it doesn't currently claim.
- **(b) Drop "last selection" from the fallback.** No-target → first admissible business. The visible cost is a flash of the wrong business on a cold load, only for accounts with more than one, and only until the chrome reads localStorage and re-scopes.

(a) if you want the property to be real; (b) if you want REQ-168 to stay 3 points. Either way one of the two bodies needs correcting so they stop specifying different mechanisms.

---

## 4. Dev-open — read from the code

`index.ts:118`, `isUnconfiguredLocalDev(env)`, skips **both** `guardAccess` and `admit`. On that path there is no token, no verified email, no `users` row consulted — so no `Admission` and no business list. There is nothing for a resolver to resolve *from*.

Who takes it:

- **10 whole-Worker suites** set `ACCESS_DEV_OPEN: '1'` with both Access vars empty — REQ-145, REQ-146, REQ-148, REQ-149, REQ-158, REQ-160, BUG-36, BUG-37, BUG-38, BUG-43. Each sets its own `TENANT_ID` (`'req145'`, `'req148'`, …) and asserts against data in that tenant.
- **4 more suites** call `route()` directly and never enter `index.ts` at all — REQ-161, REQ-163, BUG-41, the two-KB suite.
- **`1c builder`'s Node transport** — `builder.ts:130` sets `TENANT_ID: 'local'` and injects a filesystem store. `envFor` returns a `Proxy` that throws on any D1 access, so `admit` couldn't run there even if it were called.

So the revision's "never to `env.TENANT_ID`" cannot govern this branch — that rule is about the *no-target fallback inside resolution*, where there is a real identity and real memberships and just no target named. Here there's no identity at all.

**My answer: yes, dev-open reads `TENANT_ID`, and it does so inside `resolveScope`.** That keeps the last reader outside `identity.ts` in exactly the place the ticket's UAT permits one — *"no remaining reader outside the resolver."* Nothing changes for the deployed Worker: `isUnconfiguredLocalDev` requires both Access vars empty, and `wrangler.toml:91-92` sets them, so production never reaches that branch — the same two-independent-mistakes guard REQ-147 already put on `ACCESS_DEV_OPEN`.

The thing to watch: a UAT written to the letter of "never" would fail this. The ticket body needs a sentence naming dev-open as the one exception and why it can't open a deployed Worker.

---

## Where that leaves the plan

Settled: REQ-178 has landed, so `admit` produces the set; dev-open reads `TENANT_ID` inside the resolver.

Still yours to call:
- **(2)** query param everywhere — or cookie?
- **(3)** last selection in `users.fields`, or first-admissible and drop it?

Once you've picked, I'll update the REQ-168 body — correcting the read table (`tickets.ts` is a fifth read and missing; `ai.ts` reads nothing), adding language for the transport, the dev-open exception, the fallback rule, and the per-scope chat host — and then cut the branch.

<!-- xgd-turn id="f5cfd118-ef2b-42f0-8258-95e38061987b-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:39:43.386118+00:00" -->
#### You
What are the implications ?

<!-- xgd-turn id="f5cfd118-ef2b-42f0-8258-95e38061987b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:41:24.911241+00:00" -->
#### Claude
Two things worth saying first: **the decisions interact** — choosing the transport largely dissolves the last-selection question — and one option I offered turns out to be quietly broken. Here's what I found checking each against the code.

## Q2 implications

**The query param breaks the preview subtree.** `router.ts:1021` matches `/preview/<slug>/<channel>/<rest>` and serves the page's *own asset bytes* from the same route family. `api.js:51`'s comment records how the render emits those references: *"document-relative (`relativizeUrl` drops the leading slash, REQ-109) against the channel root."* So an `<img src="assets/hero.png">` inside a document at `/preview/alpha/draft/?business=acct_x` resolves to `/preview/alpha/draft/assets/hero.png` — **the query string is dropped**. Every image inside every rendered preview would arrive unscoped and fall back. That's the option I recommended last turn; withdraw it.

**The cookie works but is per-origin.** The browser attaches it to relative sub-resource loads inside the iframe, so the preview problem disappears. Two consequences: two builder tabs on two businesses overwrite each other's scope, and the scope becomes ambient. The security worry is smaller than it looks, though — see the note on the target not being a credential below.

**The path prefix is cheaper than I implied.** `routeUncached` does `const p = url.pathname` once and every route matches on `p`. Stripping `/b/<id>` from `p` at the top of `route()` leaves the entire route table untouched — a few lines, not a rewrite. And relative sub-resources inherit a path prefix by construction, so the preview subtree is correct for free. It also makes a deep link carry its own business, which is the case REQ-168's revision names.

Implications of taking it: `api.js`'s URL builders and fetch wrapper gain the prefix; `/builder/*` and `/webui/*` stay unprefixed (they're build artifacts, tenant-independent, and `wrangler.toml`'s `run_worker_first` ordering is unaffected); the `chromeHtml()` document is served at bare `/` and stays static.

## Q3 implications

Checking the "first load" case: `chrome.ts:51` — `chromeHtml()` takes no arguments, and `router.ts` answers `/` at the very top of the route table, *above* `openStore`. The lazy-store comment says so explicitly. So the chrome document is served before any scope is needed, and the first request that actually resolves one is an API call the chrome makes *after* reading localStorage.

**"First load" is not a no-target case.** And if you take the path prefix, "bookmarked deep link" isn't one either — the URL carries it. What's left is a bare API caller, and there is no such caller today.

So:

- **`users.fields`** costs REQ-168 a write path it doesn't currently claim, and there's no selection endpoint to hang it on (REQ-180 owns the listing). The tidy shape — resolution records what it resolved — puts a conditional D1 write on the request path to buy a property that, per the above, nothing currently exercises.
- **First-admissible** is `businesses.find(b => b.selectable)`. Zero new writes, and the returning-operator property is still delivered — by localStorage, in the browser, which is where REQ-179 already put it.

**Recommendation: path prefix + first-admissible.** Together they're coherent, and Q3 stops being a real question. REQ-168's revision then needs one correction: the fallback is first-admissible, and the "last selection" property belongs to REQ-179's localStorage, not to server-side resolution.

## Implications that hold whichever you choose

**A deactivated business will list as selectable and then 503.** `businessesFor` (`identity.ts:520`) joins `tenants` with no `status` predicate, so a deactivated tenant comes back with `selectable: true` if its grant is live. `storeFor` rethrows `UnknownTenantError` when `reason !== 'unknown'`, so picking it throws to `index.ts`'s catch and answers 503. Today that's invisible — one tenant, always active. REQ-168 makes it a switcher entry that fails when clicked. Either the resolver checks `tenants.status`, or `businessesFor` gains the predicate. The ticket's "`forTenant` is not modified" stays true either way.

**`admit` is N+1 on the request path.** `businessesFor` runs one `bestActiveGrant` query per business. With one business that's 3 D1 queries per request, as today. An agency with twenty businesses pays twenty-one, on every request. That's REQ-178's cost, but REQ-168 is what makes it load-bearing.

**The target is not a credential**, and this is worth stating in the ticket. Access authenticates; the resolver authorises the named target against the admission list on every request. A forged or guessed business id resolves to a refusal, not to someone else's data. That's what makes it safe to put in a URL or a cookie, and it's what the ticket's "an unauthorised target is refused rather than silently falling back" UAT actually proves.

**The chat host singleton becomes the sharpest edge.** `router.ts:112`'s `let CHAT` is per *isolate*. With a switcher it's now stale for the same person, not just across people — switch business, and the next turn runs against the previous business's store, transcripts and KB. Keying it by scope id is the fix; `resetChatHost()` becomes a map clear.

**`TENANT_ID`'s documentation goes stale in three places** — `wrangler.toml:60-63` ("names the account this deployment serves"), `boot-guard.ts:86`, and `store.ts:9-27`'s header, which is the comment the ticket quotes as its own justification. Those are the record of the decision being reversed, so they get rewritten rather than deleted.

**Migration.** Every site today lives in `1stcontact`. Your user row needs a membership onto that business or the builder resolves empty. REQ-178 landed `provisionBusiness`, so this is one call or one seeded row — but it has to happen in the same change, or the live builder goes blank on deploy.

**Test blast radius, now measurable.** 10 whole-Worker suites take the dev-open path and stay green untouched if dev-open reads `TENANT_ID` inside the resolver. 4 suites call `route()` directly and need the new argument. The 2 real-Access suites already `seedIdentity` and import their fixtures over `/api/import`, so they follow the resolved scope self-consistently — `seedIdentity` even creates the `tenants` row already.

---

Say the word on **path prefix + first-admissible** (or tell me you want the cookie) and I'll write the ticket body — read table corrected, transport, dev-open exception, fallback rule, per-scope chat host, tenant-status check — then cut the branch.

<!-- xgd-turn id="6318a597-524f-4220-a78a-e6b62e0a025a-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:34:11.571342+00:00" -->
#### You
Lets go with your recommendations

<!-- xgd-turn id="6318a597-524f-4220-a78a-e6b62e0a025a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T02:34:50.349266+00:00" -->
#### Claude
Recommendations it is. Scoping the ticket first.

<!-- xgd-turn id="5159b37d-a115-4c3f-be3d-1865f2cd1562-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:36:17.246521+00:00" -->
#### You
But before you implement I want to check that you are completely onboard with 
site <-> business <-> tenant

Account <-* tenants (multiple tenants per account)

In the future (potentially multiple sites per business).

<!-- xgd-turn id="5159b37d-a115-4c3f-be3d-1865f2cd1562-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T02:37:27.933918+00:00" -->
#### Claude
Good — worth nailing down before code. Let me check my model against the schema rather than assert it.

Checked it against the schema. Yes — I'm onboard, and your model is the one the code implements. Two places the *naming* lies about it, both of which land exactly where REQ-168 works.

## The model, confirmed

**business = tenant.** Same row (`tenants`, `0001_site_store.sql:16`), two vocabularies. `tenant` is internal — schema columns, R2 keys, store handles; *Business* is what a person reads. REQ-180 §3 already settles this and explicitly keeps `tenant_id` in the schema.

**site lives inside a business.** `sites` is `PRIMARY KEY (tenant_id, slug)`, and `0001`'s header states the barrier: *"a site is an object inside a tenant, selected by slug, and is not a tenant of its own."* So **multiple sites per business is already representable** — several rows sharing a `tenant_id`. It's not a migration, it's a UI question, and REQ-179 has already sequenced it: a site selector belongs *inside* the site tab, subordinate to the business switcher, at which point `panel.getSite()` becomes meaningful again one level down. Nothing in REQ-168 should assume 1:1; the resolver yields a business, and the slug stays a separate axis exactly as it is today.

**account →\* businesses**, via `memberships`. `businessesFor(user.id)` is the admissible set.

## Where the code doesn't match the clean picture

**1. The account is not a row.** There is no `accounts` table — the tables are `tenants`, `sites`, `site_pages`, `site_assets`, `site_changes`, `site_revisions`, `published_sites`, `tickets`, `counters`, `users`, `memberships`, `entitlements`. The account handle is the **user id**: `provisionBusiness(env, { accountUserId, name })` (`identity.ts:365`). So today *account = person*, which is why `platform_admin` sits on `users` and why `provisionInvite` reads "the account is the person and the person already existed."

For REQ-168 this is fine — resolution needs the admissible set, and `businessesFor(user.id)` is exactly that. What it doesn't support is two logins on one account, or billing rollup to a payer (DOC-40's *"invoicing rolls up by payer and the payer is the account"*). That's REQ-180 item 2's decision, not this ticket's, and REQ-168 shouldn't pretend to an account identity that isn't there.

**2. `account_id` holds a business id.** In both `memberships` and `entitlements`. REQ-178's own body says it: *"`account_id` has always held a tenant id."* `provisionBusiness:380` does `const accountId = newId('acct')` and hands it straight to `createTenant({ id: accountId })`. So `AdmittedBusiness.accountId` is a **business** id, and business ids literally read `acct_…`.

That inversion sits precisely on REQ-168's new surface: the ticket's `resolveScope(env, identity, requestedAccountId?)` takes something that is not an account id, and `Scope = { kind: 'tenant'; id }` is correct about the value while the parameter name is wrong about it.

Since the resolver's signature is what REQ-179 and REQ-180 will code against, I'd rather fix the vocabulary now than ship a third ticket's worth of call sites saying "account" when they mean "business":

- **New code says business** — `resolveScope(env, admission, requestedBusinessId?)`.
- **Rename `AdmittedBusiness.accountId` → `businessId`.** TypeScript-only, no migration, and REQ-178 is one commit old so the blast radius is a handful of lines.
- **SQL columns stay** — `memberships.account_id`, `entitlements.account_id`, `tenant_id` everywhere. REQ-180 §3 already ruled that renaming a column to match a word buys a migration for nothing, and the same argument covers these.
- **The `acct_` id prefix stays.** Ids are opaque and permanent and appear in R2 keys; a second prefix for one concept would be worse than one misleading prefix.

Flag me if you'd rather leave `AdmittedBusiness` alone and just be careful in new code — it's the one item here that touches REQ-178's landed surface.

## One coupling worth knowing before I start

`published_sites` is keyed by **slug alone, globally** (`0002_revisions.sql:70`) — deliberately, per DOC-12 §7, because `/site/<slug>/` is the public URL grammar and carries no tenant. So published slugs are the one namespace shared across all businesses, and `provisionBusiness` dodges collisions by using the business id as the starter slug. Multiple sites per business, later, will meet that constraint head-on; per-business hostnames (DOC-12 §9) are the stated answer and stay additive. Nothing for REQ-168 to do, but it's the one place the isolation barrier is deliberately not total.

Say go and I'll write the ticket body — the corrected read table, the path-prefix transport, the dev-open exception, first-admissible fallback, per-scope chat host, the `tenants.status` check, and the business/account vocabulary — then cut the branch.

<!-- xgd-turn id="df6e2630-0665-4af8-a0e4-64019c7eec16-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:40:32.319940+00:00" -->
#### You
go

<!-- xgd-turn id="df6e2630-0665-4af8-a0e4-64019c7eec16-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T03:11:08.854032+00:00" -->
#### Claude
Writing the ticket body first.

The body changed underneath me — it had been rewritten to fold in the earlier findings. Let me read what's actually there now before my append duplicates it.

The body had been rewritten to fold in the earlier findings — better than my append in most places, and it already renamed `Scope` to `{ businessId }`. My append duplicated most of it. Let me reconstruct: keep everything substantive, drop my duplicate, and add only what's genuinely new.

Ticket scoped. Now the branch.

Now the code. Starting with `identity.ts` — the vocabulary fix and the `tenants.status` predicate.

Now the platform-admin lookup that `resolveScope` needs — a business reachable without a membership row.

Now the resolver itself.

Now thread the scope through the four openers.

Now `knowledge.ts` and `session-knowledge.ts`.

Now `ai.ts` (delete the vestigial declaration) and `router.ts` (the big one).

Now `index.ts` — where the scope is actually resolved.

The worktree is cut from a newer main than my reference checkout — BUG-46 has since added `ctx` threading. Let me check what actually applied.

Now `index.ts`, against the current (BUG-46) shape.

Now typecheck to find everything I've broken.

Confirmed pre-existing. Now the Node transport and the remaining callers.

Now the migration that keeps the live builder working.

Now update `wrangler.toml`'s stale claim, then write the UATs.

Now the UATs. Let me check the existing test harness shape first.

Now the REQ-168 UATs.

Now add the rejection eviction to the chat host cache, then write the UATs.

Now the source-level UAT that keeps `TENANT_ID` from reappearing.

Now the workers suite.

All 13 pass. Now the wider suite — the callers I changed.

Many call sites to migrate. Let me look at the helper shapes so I can transform them consistently.

Now the remaining suites — same mechanical transform, scripted.

I removed `TENANT_ID` too broadly — the whole-Worker suites still need it for the dev-open branch. Let me check and restore.

Now the multi-line `route(...)` calls, which the regex pass didn't cover.

Zero regressions in the workers project. Now the node project.

<!-- xgd-turn id="618ecbcd-95c9-4dac-9fac-46d1ba780080-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T03:16:21.614872+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-chat-end -->