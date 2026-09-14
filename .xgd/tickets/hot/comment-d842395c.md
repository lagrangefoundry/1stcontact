---
uid: comment-d842395c
id: COMMENT-2965
type: comment
title: Comment on request REQ-238
created_by: xgd
created_at: '2026-09-14T03:05:51.392464+00:00'
updated_at: '2026-09-14T04:40:02.543041+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2ac88003
  kind: chat_transcript
---

<!-- xgd-turn id="3d0437ba-9f2d-4d5e-9634-8e27b29815a0-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:05:06.044996+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3d0437ba-9f2d-4d5e-9634-8e27b29815a0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T03:10:47.162545+00:00" -->
#### Claude
I've read the ticket, [[DOC-45]] §§3–7, [[TODO-6]], and the code it lands in (`business.ts` / `settings-core.ts` / `settings-surface.json` from REQ-237, `publish.ts`'s `templateRefusal` seam, `0007_business_name_unique.sql`, `routes.ts`). The shape is clear and I'm ready to build. Four questions where different readings would produce materially different work — each with what I'll do if you just say "your call".

**1. Is serving-by-host in scope, or only the record?**

[[DOC-45]]'s order of work says §4 (deleting the `/site/<key>/` grammar) is *"an acceptance criterion of (2), not a separate ticket"* — and (2) is this ticket. But REQ-238's own Behaviour list doesn't mention it, `public-site` has no D1 binding, and wildcard DNS + the `*.1stc.site` certificate are still open operator items in [[TODO-6]] §5.

**Recommendation: out of scope here.** This ticket ships the mapping table, `check`/`claim`, and the publish gate. Host→site resolution and the deletion of the path grammar become their own ticket, blocked on TODO-6's DNS/cert items — otherwise we'd delete the only address that resolves and replace it with one that doesn't.

**The consequence to be aware of either way:** the publish gate lands now, so from that commit a site cannot be published until a hostname is claimed, and a claimed hostname won't resolve until the DNS work lands. That's what the ticket asks for and nothing is published today, but it is a real "publish stops working" moment and I'd rather name it than have you find it.

**2. Revocation — day one, or not yet?**

[[TODO-6]] §2 says *"Revocation must exist from day one"*; REQ-238 says a hostname we want gone *"can only be revoked by us — an operator action, not self-service"*, and §5's table carries `status`. Finality is exactly what creates the need.

**Recommendation: include it, minimally** — the `status` column, every read filtered to `active`, and a platform-operator-only route that flips one row to `revoked`. It is not an update to `host` (the falsifier), it's the safety valve the finality rule makes necessary, and a revoked host is never re-issued. If you'd rather keep this ticket to what its Behaviour section literally lists, I'll ship the column and the filter and leave the flip unbuilt.

**3. The row names the site; the "one at a time" rule is per business — confirming.**

§3 says a host names a site, §7 says a business holds at most one `1stc.site` label at a time. Today those coincide (one site per business). I'll implement §5 literally — `site_domains.site_id` — and enforce "one platform label" by refusing a second `platform`-kind claim anywhere in the business. The publish gate then asks *does the site being published have at least one active address*, over `kind`, so the day custom domains land the check needs no edit. No answer needed unless you disagree.

**4. No UI in this ticket — confirming.**

The Settings pane is REQ-239's. So this ticket ships: the record module, two HTTP routes (`check` and `claim`, owners-only, business-scoped like `/api/business/name`) so the falsifier *"a route to claiming a hostname that exists only inside a conversation"* is closed without waiting on the pane, and the two operations plus their refusals in `settings-surface.json` — where the "this is the whole host `alice.1stc.site`, and it cannot be changed" prose lives as the declaration's own words. The pane renders it in REQ-239.

One thing I'll do without asking, flagging because it's a technical consequence rather than a request: the gate goes in `publishSite` itself via an injected seam (exactly `templateRefusal`'s shape — absent means unchecked, so `1c publish` against a directory is untouched), and I'll thread it to the assistant's own `publish` tool as well. Gating only the `/api/publish` route would leave the assistant able to publish a site with no address, which is the falsifier.

<!-- xgd-turn id="04af978c-e7a9-4ce9-baf5-8e5829a8f57a-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:44:45.897492+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="04af978c-e7a9-4ce9-baf5-8e5829a8f57a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T04:14:50.271517+00:00" -->
#### Claude
Good — I have what I need. Cutting the branch.

Now the migration.

Now the publish gate itself.

Now `host-core.ts` and `ai.ts`.

Now the router: chatHost wiring, the publish route gate, and the three hostname routes.

Now the path constants and the routes.

Good placement. Now the publish route gate.

Now the settings surface: declaration + deps + operations.

Now `settings-core.ts` — deps, operations, grant.

Now the operations themselves in `settings-core.ts`.

Now wire `businessSettings` in `business.ts` to supply the three new deps.

Now the REQ-194 role-literal scan.

Now the workers suite.

Now the REQ-238 UATs themselves.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="225d3c18-8555-4a2a-88c6-b67310cb34f5-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T04:26:42.238446+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="225d3c18-8555-4a2a-88c6-b67310cb34f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T04:40:00.725996+00:00" -->
#### Claude
Now I'll write the REQ-238 UATs.

All 27 pass. Now the publish-gate UAT and the node-side surface UAT.

Now the node-side surface UAT.

Now a full suite run to confirm nothing else broke.

All suites green (the two node failures are pre-existing — I baselined them against a clean tree before touching anything). Now the ticket body, so every UAT traces to it.

Now the version bump and commit.

Yes — the ticket's answers settled all four questions, and REQ-238 is now implemented, committed, merged into `xgd-working`, and parked at `free_coded`.

## What landed

**The record** — `db/migrations/0008_site_domains.sql`, DOC-45 §5 literally. `host` carries a unique index that is *the authority* rather than a backstop: it decides the race, and the code reports what it decided. A partial unique index on `(site_id) WHERE kind='platform' AND status='active'` is the weaker integrity statement beneath the per-business rule, partial on `active` precisely so a revocation leaves the business able to claim again.

**`apps/control-app/src/hostname.ts`** — `check`, `claim`, `revoke`, the syntactic rule, and TODO-6 §2's three groups kept separate in code. `check` deliberately sees revoked rows, because a revoked host is never re-issued and a check that ignored them would disagree with the claim.

**The publish gate** — an `addresses` seam on `publishSite` in exactly `templateRefusal`'s shape, inside rule 1's promise so a refused publish writes nothing. It passes the *list*, never a boolean. Threaded to the assistant's `publish` tool too, since `Publish` being outside the consultant's grant is a line of config rather than a guarantee. The Node builder transport opts out — a publish through it is `1c publish`.

**Four routes and three surface operations**, both calling the same rules, which closes the "exists only inside a conversation" falsifier.

## Three decisions worth your eye

**Revocation is gated on `ownsPlatformBusiness`, not `isPlatformAdminSeed`.** The answer named the latter; I used the former and recorded why in both the code and the ticket. `isPlatformAdminSeed` answers *does this deployment name this address* — break-glass config and a BUG-62 diagnostic, not an authorisation. `ownsPlatformBusiness` asks DOC-42 §7's two questions and is the gate `/api/businesses/provision` already carries. Still one route, still no new auth surface. Say the word if you want it swapped.

**`normaliseLabel` accepts the whole host.** A consequence of the ticket's own "show `alice.1stc.site` as it will be" requirement: that is the string a careful person pastes back, and refusing them the one we just printed would be perverse.

**Three sibling suites needed repair, and one of them is a real narrowing.** REQ-149/222/243's publish fixtures now claim an address through the shipped operation (REQ-222 also moved to one business per case, as REQ-149 already was). REQ-194's role-literal scan now requires a file to name *both* the role vocabulary and the word `role` — `hostname.ts` reserves `support` and `admin` as DNS labels, which has nothing to do with `memberships.role`.

## Tests

Workers: 933 passed, 102 files. Node: 3166 passed, 2 failed — `bug32-webui-scope-rebrand` and `BUG-67 backend_settings`, both of which I baselined as failing on a clean tree before touching anything. 50 new UATs across three `test_UAT_FC_REQ-238_*` files.

Commits `4b10b9d` and `bc8748a`, version `0.2.198`, 13 story points. Not promoted to `ready_to_reconcile` — that's yours.

One thing to be aware of rather than act on: from this commit, publishing requires a claimed hostname, and that hostname will not resolve until TODO-6 §§1 and 5 land. The ticket says that friction is intended and `/site/<key>/` still serves meanwhile.

<!-- xgd-chat-end -->