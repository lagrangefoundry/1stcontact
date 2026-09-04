---
uid: comment-a77a9cac
id: COMMENT-2185
type: comment
title: Comment on request REQ-180
created_by: xgd
created_at: '2026-09-03T21:50:39.000461+00:00'
updated_at: '2026-09-04T00:01:51.467140+00:00'
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

<!-- xgd-chat-end -->