---
uid: comment-a77a9cac
id: COMMENT-2185
type: comment
title: Comment on request REQ-180
created_by: xgd
created_at: '2026-09-03T21:50:39.000461+00:00'
updated_at: '2026-09-04T01:39:55.638293+00:00'
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

<!-- xgd-chat-end -->