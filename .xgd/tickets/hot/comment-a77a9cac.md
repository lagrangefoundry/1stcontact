---
uid: comment-a77a9cac
id: COMMENT-2185
type: comment
title: Comment on request REQ-180
created_by: xgd
created_at: '2026-09-03T21:50:39.000461+00:00'
updated_at: '2026-09-05T00:15:35.772979+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3df2d0e7
  kind: chat_transcript
---

<!-- xgd-turn id="ce3ddbdb-82e0-41cf-addb-487eb23594e9-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:50:10.691269+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ce3ddbdb-82e0-41cf-addb-487eb23594e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T21:53:39.671039+00:00" -->
#### Claude
I've read the ticket, `identity.ts`, `scope.ts`, `router.ts`'s `/api/businesses`, the REQ-179 switcher/account dialog, and the REQ-178/179 UATs. Here's where things actually stand, then the questions.

**Already landed (REQ-178/179):** `Admission` carries the set; `GET /api/businesses` exists, returns `{account, businesses[{id,name,selectable}]}`, is admission-sourced, lists lapsed members marked, and is not an oracle; `scope.ts` gives one refusal for all three reasons. The switcher and a deliberately thin avatar dialog exist and its doc comment defers plan/invoices/details to this ticket.

**So what's genuinely left here:** the lapse *reason* on the endpoint (item 1's only unlanded clause), the vocabulary rule + a guard (item 3), and item 2 — the decision.

---

### 1. Confirm the portal reading? (the decision the ticket exists to force)

I think **yes**, and it's cheap to confirm now: DOC-40 §2.1 rule 1 names the bespoke admin billing page as *the* failure mode, and nothing about our account's plan/invoices/details differs in shape from what a customer's own customers will see.

But confirming it is not the same as building it. `apps/public-site` today is four files — no identity, no Access, no session. A portal rendered through the site pipeline against the platform business needs portal login on that worker plus a behaviour-module surface for plan/invoices — and there are no invoices to show (no `subscriptions` table, one plan, payments deferred by DOC-40 §5). That is a ticket, not a section.

**Proposal:** confirm the reading, record it, and follow the ticket's own *Splitting* clause — this ticket keeps 1 and 3; item 2 becomes its own ticket. **Do you want me to create that ticket?** (I won't without you saying so.)

### 2. Does "add a business" land now?

Your Acceptance list has *"Adding a business from the account surface goes through `provisionBusiness`"*, which is buildable today and doesn't wait on the portal — the durable half is the endpoint (`POST /api/businesses` → `provisionBusiness`), and the portal would call the same one. The interim caller would be the existing avatar dialog, explicitly labelled as chrome that later links out rather than owns the surface.

Do you want that in this ticket, or held with item 2 so nothing account-shaped gets built in the builder at all?

### 3. If yes to add-a-business: what stops a customer minting free grants?

`provisionBusiness` writes a live `admin_grant` / `pro` entitlement. Reached from an invite that's fine; reached self-serve it's an unbounded free-plan mint — DOC-40 §9 item 4 in miniature. My inclination: `source: 'self_serve'` (so billing can tell them apart later without a backfill) and no cap for an invite-only alpha. Happy to add a cap if you'd rather.

### 4. Where does the "no user-visible 'tenant'" rule stop?

Three strings say "tenant" outside code comments: the boot guard's `TENANT_ID`/`no tenant` hints, `TenantNotConfiguredError`, `IdentityNotConfiguredError`. All three are addressed to whoever edits `wrangler.toml`, and two name the config var itself.

I'd draw the line at **product copy** — builder client strings, the account surface, wire-facing messages a customer can see — and exempt deployment/configuration diagnostics, then enforce it with a guard test in the `naming.test.ts` idiom so a fourth one can't appear quietly. Object if you'd rather the guard be absolute (which would mean renaming the var).

Answer 1–4 and I'll cut the branch and implement.

<!-- xgd-turn id="890505f2-c2d6-4c10-905c-23bd54f25d81-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T00:01:51.418064+00:00" -->
#### You
1. ok
   2. The key toi the model is business == tenant - do we have add tenant? they must go together.
   3. We are pre-billing and pre-proper access control - there should be no self-serve "add a business" button - I (admin) will add businesses - it needs to be possible but it could be completely manual. Ideally what I want is when I create an account I can also provision a business for that account
   4. users see the web app/site only

<!-- xgd-turn id="890505f2-c2d6-4c10-905c-23bd54f25d81-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T00:23:38.002075+00:00" -->
#### Claude
Good — that changes item 2 materially. Let me verify the "business == tenant" invariant you're asking about before I scope.

Clear picture now. Two things confirmed for you:

- **`createTenant` has exactly two callers**: `provisionBusiness` (which writes the tenant, membership, grant and starter site as one operation) and `storeFor`'s self-heal. So business and tenant *do* already go together — the self-heal is the one place a tenant can appear without a business, and it's only reachable on the `TENANT_ID` dev path, because an admission-derived scope always came through `JOIN tenants`. That's a provable invariant and I'll lock it with a UAT.
- **No user-visible string says "tenant" today** — every hit in the builder client and the public site is a comment or SQL. So item 3's work is the guard, not a cleanup.

Let me scope the ticket.

Ticket scoped. Cutting the branch.

Now the identity layer — the lapse reason.

Now the wire payload and the admin route.

Now the router: payload lapse + admin route.

Now the admin route.

Now the route handler itself, next to `/api/businesses`.

Now the client: config labels, the account surface reason line, and api.js passthrough.

Now the CSS for the lapse line, and the boot-guard vocabulary fix.

Now the boot-guard vocabulary fix (the one user-visible "tenant" that isn't config vocabulary).

All nine pass. Now the admin-route UAT.

Good — no webui dependency. Now the account surface UAT.

Now the vocabulary guard.

All 11 pre-existing failures reproduce identically on the main checkout; the 12th passes in isolation in both. No regressions from this change. Reviewing the diff.

Done — merged back to `xgd-working`, promoted to `free_coded` at 0.2.63, worktree cleaned. 44 tests green on the merged tree.

## What landed

**§1 — the lapse reason.** `AdmittedBusiness` now carries `lapse: {reason, endedAt} | null`, present exactly when `selectable` is false because both derive from one `bestActiveGrant` answer. Four reasons — `expired` (with the date, latest wins when a grant was renewed), `revoked`, `not_yet`, `never_granted` — recovered by asking the entitlements table *without* the filters that collapsed them into one `null`, so nothing has to be kept in step. `admissibleBusiness` and `businessesFor` both route through one function, so an admin on a support call sees exactly what the owner sees. It crosses the wire on `/api/businesses` and the account surface states it in words beside the business it belongs to; the switcher keeps the suffix, since an `<option>` can't carry a sentence.

**D2 — no self-serve add-a-business.** `POST /api/admin/businesses` behind `platform_admin`, calling `provisionBusiness` and nothing else. It 404s rather than 403s for everyone else — a 403 answers "does an admin surface exist" with *yes*. The dev-open loopback is refused too: no admission means no administrator. Driven by hand from your own logged-in session; REQ-170's console calls this rather than reimplementing it.

**D3 — business == tenant.** Asserted as one operation: `tenants` row, `owner` membership, live grant with you as `granted_by`, and a starter site — checked through `admit`, not by reading tables back, so a business written-but-unreachable fails. And account creation still provisions its first business, so you never do it twice.

**§3 — the vocabulary guard.** The audit passed (every "tenant" in the two apps was a comment or SQL), so the deliverable is the guard: no string literal in the builder client or public-site says "tenant", with four exemptions expressed as rules, not a list — SQL, `TENANT_ID`/`wrangler.toml`, regex matchers, and bare identifiers. It has a self-check that shows it two violations it must catch and each exemption it must excuse. Two strings did need fixing: the boot guard's "the store has no tenant yet" and a knowledge-index error message. `tenant_id` untouched in the schema, asserted.

## Two things for you

**The portal ticket isn't filed.** Your "ok" covered confirming the reading; I didn't want to read it as authorisation to create a ticket. Say the word and I'll file it — the scope is portal login on `apps/public-site` plus the plan/invoices/details surface through the site pipeline.

**Test-suite state, unchanged by this work:** 11 files fail on `xgd-working` (knowledge-index and webui resolution). I baselined them on the main checkout before and after — same 11, same 30 failures. A 12th, `reconciliation-l1-navigation`, failed once in a full run and passes in isolation in both trees; it's a flake, not a regression.

<!-- xgd-turn id="9e55d362-0d2a-437f-b9ad-bcbb9c8d50fe-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:39:55.590555+00:00" -->
#### You
Please file a portal ticket

<!-- xgd-turn id="9e55d362-0d2a-437f-b9ad-bcbb9c8d50fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:42:19.010226+00:00" -->
#### Claude
Everything I need. Filing it.

Filed as **REQ-183** — *The customer portal: the account's own surface, rendered by the site pipeline* (draft, 8 points). REQ-180 now carries a D1 addendum pointing at it.

**What it says**

It opens by naming the thing being avoided — DOC-40 §2.1 rule 1's bespoke admin billing page — and makes that the test for every decision in the ticket: not "does this work for 1st Contact" but "is this the thing a customer's customer will use".

The architectural claim is that the portal is **a site page + a behaviour module + an authenticated API** — the shape `contact-form` already has (REQ-93, DOC-25/26). That's what makes "rendered through the site pipeline" buildable rather than aspirational: pages authored in the platform business's site, edited in the builder, rendered by the shared renderer. If the ticket finds itself adding a rendering path, the reading has been abandoned and that needs recording against DOC-40 §2.1.

**The decision it opens with is the origin**, because the two candidates have opposite properties: `app.1stcontact.io` has Access-verified identity, full methods and `no-store`; `apps/public-site` is 448 lines whose every property is public, cacheable, GET-only — and one cached copy of a portal page is everybody's answer. I recommended `app.1stcontact.io` with the pages still coming from the site pipeline, on the grounds that DOC-40 §3 already says the credential layer is the rented half — `users`/`memberships`/`entitlements` don't change when the magic link replaces Access, so a portal built against `admit` moves origins without being rewritten. That's exactly the "no second implementation" property REQ-180 owed it. I also flagged that if that's taken, it has to be written down that *the origin is provisional and the pages are not*, or the next hand reads it as "the portal is a builder feature after all".

It draws the line against REQ-170 on three axes (scope, authority, population), carries REQ-180's prohibitions forward as constraints, and states the three properties that must hold for the level-2 portal to be this one with a different credential layer.

**Three open questions** are recorded rather than guessed: the origin; whether the charges surface lands at all in v1 given there's nothing to put in it (no `subscriptions` table, payments deferred by DOC-40 §5); and whether the 1st Contact marketing site is a prerequisite, since `public-site` still serves a placeholder at the apex.

One note: the ticket store's `git push` failed — the sandbox blocks network access. The ticket is committed locally and will go up with your next push.

<!-- xgd-turn id="b662dc18-587a-4a0f-af27-eacfb4c7b7c5-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:48:43.359547+00:00" -->
#### You
It should start with one thing a "delete account" button.

We have had design discussions on this. implementing the button is outside of the scope of the ticket - but it can show one

<!-- xgd-turn id="b662dc18-587a-4a0f-af27-eacfb4c7b7c5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:51:05.138185+00:00" -->
#### Claude
Let me check what the prior discussion recorded, so I reference it rather than reinvent it.

DOC-37 is the discussion — *Data Deletion & Retention — erasure as identity severance*. That changes the ticket's shape rather than adding to it, so I'm rewriting the body (preserving the sections that still hold verbatim).

REQ-183 is rewritten. §1–3, §6 and §7 are preserved verbatim; §4 onward is new.

**What changed**

v1 is now **one page with one button**. The argument for that ordering: everything else an account surface shows is a convenience whose absence is an inconvenience — this one's absence is a compliance gap, and it's the only capability with a deadline that isn't ours to set. It's also the only one buildable now (charges need the `subscriptions` table DOC-40 §5 defers; deletion needs no new data, because the account already exists), and it's the smallest slice that proves the pipeline reading end-to-end — so if §3's origin decision is wrong, it fails cheaply, before a surface exists that would have to be rebuilt.

I found the design discussion you meant: **DOC-37, *Data Deletion & Retention — erasure as identity severance***. Two things in it bear directly on "show the button but don't implement it":

**DOC-37 §6.2 turns out to be a constraint on this ticket rather than a later one.** It says *"delete all my data" is not a promise we can keep, and offering it is worse than offering the accurate thing*. A **Delete account** button that doesn't delete is exactly that inaccurate promise — it converts a missing feature into a lie, on the one subject where being caught in one is unrecoverable. So I've made the button's *shape* an explicit decision with three candidates and a recommendation: present and live, opening DOC-37 §6.1's explanation and ending in "get in touch". The control then does exactly what it says, what it says is true today, and the explanation is copy the built version uses unchanged. The acceptance holds whichever you pick: no copy on the surface claims anything the system doesn't do — plus a UAT asserting the account still exists afterwards, so a later hand can't read the button as evidence the machinery is there.

**DOC-37 §8 makes your ordering argument from the other end** — *registry at limb one*. The surface arriving before the mechanism means the mechanism has somewhere to land instead of a retrofit across five limbs.

**One question the docs don't answer**, now open question 3: does "delete account" mean the account or its businesses? DOC-40 §2 separates them and an account may hold several; DOC-37 §4 is written about *tenant* deletion, which is the business — but the portal control sits on the **account**, which is the payer. An account holding three businesses pressing one button is undefined, and the copy can't be written until it is.

Dropped to 5 points. The origin decision and the pipeline work are now the bulk; the payload is one control.

<!-- xgd-turn id="52df7865-caf1-412e-b118-02af50de2525-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T00:01:33.463515+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="52df7865-caf1-412e-b118-02af50de2525-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T00:15:34.668367+00:00" -->
#### Claude
Done — merged into `xgd-working`, promoted to `free_coded` at 0.2.67, branch cleaned. All targeted suites green on the merged tree (11 node-side guard tests, 57 workers-side identity/scope/businesses tests).

## What the reopen actually asked for, and what landed

I read the three DOC-42 amendments as one small delta, not a rebuild — and the ticket says so itself: *"the commits above stand and no endpoint changes shape."* No endpoint changed shape.

**A2 landed no code, deliberately.** It says `REQ-178`'s reopen is the fix, and REQ-178's own reopened section says *"what a session with nothing selectable may reach is not settled here"* — it's REQ-183's. What this ticket owed A2 was that the account surface already states a lapse **per business** rather than as one banner, so the all-lapsed case needs no second rendering path when that admission change arrives. It does; nothing to build.

**A1 and A3 land the same instrument twice**, and it's the one D5 already chose: a guard, not an audit. I checked both audits first and both pass today — `platform_admin` has exactly the two readers it should, and nothing anywhere asks whether a business is the platform's own. So the deliverable is the assertion that the next one can't appear quietly.

- **A1 — `platform_admin` has two readers and they mean different things.** `scope.ts` enters a business without a membership (special because 1st Contact *hosts* the others, §8); `router.ts` gates product fulfilment (provisioning is filling an order, §7). A third read is how DOC-42 §10.3's two separable capabilities fuse into the generic privileged surface DOC-40 §2.1 rule 1 names as its failure mode — so the count is the assertion, plus a check that no `isAdmin`/`requireAdmin`-shaped predicate exists at all, which is §7's own falsifier. A *read* is a property access or a destructure; the column's declaration and the SQL that writes it are not, expressed as a rule rather than a list of exempt files.

- **A3 — the rule extends from the word to the concept.** D5 keeps *tenant* off a screen; this keeps *the platform's tenant* out of the model. Outside REQ-168's two readers nothing may name the concept (`platformTenant`), ask it (`isPlatform`), or ask it by comparing a business id against the deployment's own slug — the last being the shape that survives a rename and that a guard over identifiers alone would miss. It extends the D5 file rather than starting a second guard, because it's the same rule one level down.

Both guards were proved against the real tree by injecting a violation into `store.ts` and confirming each failure, then reverting — a guard with four exemptions and a hand-rolled scanner between it and the source is worth showing a violation before trusting.

**The stated reasons are corrected in place.** `POST /api/admin/businesses` stops giving the flag as its reason and gives DOC-42 §7's two conditions — you own this business, and this business's product is businesses — which select exactly the set the flag selects today. `scope.ts` records that its bypass rests on hosting rather than on level.

## Two things worth knowing

**The version race is real and I hit it.** REQ-184 was merging concurrently; we both bumped to 0.2.66, the merge driver took the max, and `move-to-free-coded` refused because REQ-184 had already claimed that version. Resolved by re-bumping on the branch and merging again — hence the fourth commit, `89fae47616`, which is only a version bump.

**I raised story points 5 → 6**, since the reopen added two guards on top of what the original five covered.

I did not touch `identity.ts`'s "the platform's own tenant" prose — REQ-178's reopened section explicitly claims that vocabulary correction, and A3's rule exempts identity.ts as one of the two places the question is legitimately asked.

<!-- xgd-chat-end -->